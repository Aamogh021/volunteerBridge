/// Offline sync queue — persists failed/deferred API operations and replays
/// them when connectivity returns.
///
/// Uses shared_preferences for disk persistence so queued actions survive
/// app restarts.

import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../utils/constants.dart';

const _queueKey = 'offline_sync_queue';
const _maxRetries = 5;
const _uuid = Uuid();

/// Riverpod provider for the sync queue singleton.
final offlineSyncQueueProvider = Provider<OfflineSyncQueue>((ref) {
  return OfflineSyncQueue();
});

/// A single deferred action waiting to be synced.
class PendingAction {
  final String id;
  final String type; // accept_task | mark_on_site | complete_task | update_location | set_availability
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  int retryCount;

  PendingAction({
    String? id,
    required this.type,
    required this.payload,
    DateTime? createdAt,
    this.retryCount = 0,
  })  : id = id ?? _uuid.v4(),
        createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'payload': payload,
        'created_at': createdAt.toIso8601String(),
        'retry_count': retryCount,
      };

  factory PendingAction.fromJson(Map<String, dynamic> json) => PendingAction(
        id: json['id'] as String,
        type: json['type'] as String,
        payload: Map<String, dynamic>.from(json['payload'] as Map),
        createdAt: DateTime.parse(json['created_at'] as String),
        retryCount: json['retry_count'] as int? ?? 0,
      );
}

class OfflineSyncQueue {
  List<PendingAction> _queue = [];
  bool _flushing = false;

  /// Number of pending actions.
  int get pendingCount => _queue.length;

  /// Whether there are pending actions.
  bool get hasPending => _queue.isNotEmpty;

  /// Read-only view of the queue.
  List<PendingAction> get pending => List.unmodifiable(_queue);

  /// Check if a specific action type + key is already queued.
  bool isQueued(String type, String key) {
    return _queue.any((a) => a.type == type && a.payload['key'] == key);
  }

  /// Load persisted queue from disk.
  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_queueKey);
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> list = json.decode(raw) as List;
        _queue = list
            .map((e) => PendingAction.fromJson(e as Map<String, dynamic>))
            .toList();
        debugPrint('[SyncQueue] Loaded ${_queue.length} pending actions');
      }
    } catch (e) {
      debugPrint('[SyncQueue] Failed to load: $e');
    }
  }

  /// Persist current queue to disk.
  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = json.encode(_queue.map((a) => a.toJson()).toList());
      await prefs.setString(_queueKey, raw);
    } catch (e) {
      debugPrint('[SyncQueue] Failed to persist: $e');
    }
  }

  /// Add an action to the queue and persist.
  Future<void> enqueue(PendingAction action) async {
    _queue.add(action);
    await _persist();
    debugPrint('[SyncQueue] Enqueued: ${action.type} (${_queue.length} total)');
  }

  /// Remove a specific action by ID.
  Future<void> _remove(String id) async {
    _queue.removeWhere((a) => a.id == id);
    await _persist();
  }

  /// Attempt to flush (replay) all queued actions.
  /// Called when connectivity is restored.
  Future<int> flush() async {
    if (_flushing || _queue.isEmpty) return 0;
    _flushing = true;
    int synced = 0;

    debugPrint('[SyncQueue] Flushing ${_queue.length} actions...');

    // Work on a copy so we can modify the original
    final snapshot = List<PendingAction>.from(_queue);

    for (final action in snapshot) {
      try {
        final success = await _executeAction(action);
        if (success) {
          await _remove(action.id);
          synced++;
          debugPrint('[SyncQueue] Synced: ${action.type}');
        } else {
          action.retryCount++;
          if (action.retryCount >= _maxRetries) {
            await _remove(action.id);
            debugPrint('[SyncQueue] Dropped after $_maxRetries retries: ${action.type}');
          } else {
            await _persist();
          }
        }
      } catch (e) {
        debugPrint('[SyncQueue] Error replaying ${action.type}: $e');
        action.retryCount++;
        if (action.retryCount >= _maxRetries) {
          await _remove(action.id);
        } else {
          await _persist();
        }
      }
    }

    _flushing = false;
    debugPrint('[SyncQueue] Flush complete: $synced synced, ${_queue.length} remaining');
    return synced;
  }

  /// Execute a single queued action.
  Future<bool> _executeAction(PendingAction action) async {
    final db = FirebaseFirestore.instance;

    switch (action.type) {
      case 'accept_task':
        final response = await http.Client()
            .post(
              Uri.parse('$apiBaseUrl/assign'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode(action.payload),
            )
            .timeout(const Duration(seconds: 15));
        if (response.statusCode == 200) {
          final data = json.decode(response.body) as Map<String, dynamic>;
          return data['success'] as bool? ?? false;
        }
        return false;

      case 'mark_on_site':
        final orgId = action.payload['org_id'] as String? ?? defaultOrgId;
        final assignmentId = action.payload['assignment_id'] as String;
        final needId = action.payload['need_id'] as String;
        final batch = db.batch();
        batch.update(
          db.collection('organizations').doc(orgId).collection('assignments').doc(assignmentId),
          {'status': 'on_site'},
        );
        batch.update(
          db.collection('organizations').doc(orgId).collection('needs').doc(needId),
          {'status': 'in_progress'},
        );
        await batch.commit();
        return true;

      case 'complete_task':
        final orgId = action.payload['org_id'] as String? ?? defaultOrgId;
        final assignmentId = action.payload['assignment_id'] as String;
        final needId = action.payload['need_id'] as String;
        final volunteerId = action.payload['volunteer_id'] as String;
        final batch = db.batch();
        batch.update(
          db.collection('organizations').doc(orgId).collection('assignments').doc(assignmentId),
          {'status': 'complete', 'completed_at': DateTime.now().toUtc().toIso8601String()},
        );
        batch.update(
          db.collection('organizations').doc(orgId).collection('needs').doc(needId),
          {'status': 'completed'},
        );
        batch.update(
          db.collection('organizations').doc(orgId).collection('volunteers').doc(volunteerId),
          {'tasks_completed': FieldValue.increment(1), 'availability': true},
        );
        await batch.commit();
        return true;

      case 'update_location':
        final orgId = action.payload['org_id'] as String? ?? defaultOrgId;
        final volunteerId = action.payload['volunteer_id'] as String;
        await db
            .collection('organizations')
            .doc(orgId)
            .collection('volunteers')
            .doc(volunteerId)
            .update({'location': action.payload['location']});
        return true;

      case 'set_availability':
        final orgId = action.payload['org_id'] as String? ?? defaultOrgId;
        final userId = action.payload['user_id'] as String;
        final avail = action.payload['availability'] as bool;
        await db
            .collection('organizations')
            .doc(orgId)
            .collection('volunteers')
            .doc(userId)
            .set({'availability': avail}, SetOptions(merge: true));
        return true;

      default:
        debugPrint('[SyncQueue] Unknown action type: ${action.type}');
        return false;
    }
  }
}
