/// Firestore service providing real-time data streams.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/community_need.dart';
import '../models/volunteer.dart';

/// Provider for the Firestore service.
final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

/// Firestore service for real-time data access.
class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Stream of community needs ordered by urgency score descending.
  Stream<List<CommunityNeed>> needsStream(String orgId) {
    return _db
        .collection('organizations')
        .doc(orgId)
        .collection('needs')
        .orderBy('urgency_score', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return CommunityNeed.fromJson(data);
      }).toList();
    });
  }

  /// Stream of assignments for a specific volunteer.
  Stream<List<Map<String, dynamic>>> myAssignmentsStream(
    String userId,
    String orgId,
  ) {
    return _db
        .collection('organizations')
        .doc(orgId)
        .collection('assignments')
        .where('volunteer_id', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    });
  }

  /// Stream of a single volunteer document.
  Stream<Volunteer?> volunteerStream(String userId, String orgId) {
    return _db
        .collection('organizations')
        .doc(orgId)
        .collection('volunteers')
        .doc(userId)
        .snapshots()
        .map((doc) {
      if (!doc.exists) return null;
      final data = doc.data()!;
      data['id'] = doc.id;
      return Volunteer.fromJson(data);
    });
  }

  /// Fetch a single need by ID.
  Future<CommunityNeed?> getNeed(String needId, String orgId) async {
    final doc = await _db
        .collection('organizations')
        .doc(orgId)
        .collection('needs')
        .doc(needId)
        .get();

    if (!doc.exists) return null;
    final data = doc.data()!;
    data['id'] = doc.id;
    return CommunityNeed.fromJson(data);
  }

  /// Create or update a volunteer document.
  Future<void> setVolunteer(
    String userId,
    String orgId,
    Map<String, dynamic> data,
  ) async {
    await _db
        .collection('organizations')
        .doc(orgId)
        .collection('volunteers')
        .doc(userId)
        .set(data, SetOptions(merge: true));
  }

  /// Update assignment status only.
  Future<void> updateAssignmentStatus(
    String assignmentId,
    String orgId,
    String status,
  ) async {
    await _db
        .collection('organizations')
        .doc(orgId)
        .collection('assignments')
        .doc(assignmentId)
        .update({'status': status});
  }

  /// Transition assignment to "on_site" — updates assignment and need status.
  Future<void> markOnSite(
    String assignmentId,
    String needId,
    String orgId,
  ) async {
    final batch = _db.batch();

    final assignmentRef = _db
        .collection('organizations')
        .doc(orgId)
        .collection('assignments')
        .doc(assignmentId);

    final needRef = _db
        .collection('organizations')
        .doc(orgId)
        .collection('needs')
        .doc(needId);

    batch.update(assignmentRef, {'status': 'on_site'});
    batch.update(needRef, {'status': 'in_progress'});

    await batch.commit();
  }

  /// Complete a task — atomically updates assignment, need, and volunteer stats.
  Future<void> completeTask({
    required String assignmentId,
    required String needId,
    required String volunteerId,
    required String orgId,
  }) async {
    final batch = _db.batch();

    // Update assignment status
    final assignmentRef = _db
        .collection('organizations')
        .doc(orgId)
        .collection('assignments')
        .doc(assignmentId);
    batch.update(assignmentRef, {
      'status': 'complete',
      'completed_at': DateTime.now().toUtc().toIso8601String(),
    });

    // Update need status
    final needRef = _db
        .collection('organizations')
        .doc(orgId)
        .collection('needs')
        .doc(needId);
    batch.update(needRef, {'status': 'completed'});

    // Increment volunteer's tasks_completed and update completion_rate
    final volRef = _db
        .collection('organizations')
        .doc(orgId)
        .collection('volunteers')
        .doc(volunteerId);
    batch.update(volRef, {
      'tasks_completed': FieldValue.increment(1),
      'availability': true, // Make available again
    });

    await batch.commit();

    // Update completion_rate based on new count (separate read-then-write)
    try {
      final volDoc = await volRef.get();
      if (volDoc.exists) {
        final data = volDoc.data()!;
        final completed = data['tasks_completed'] as int? ?? 1;
        // Simple rate: completed / (completed + 1 hypothetical failure)
        // For now just keep it at tasks_completed / (tasks_completed + missed)
        // We'll calculate this properly when we track missed assignments
        final rate = completed / (completed + 1);
        await volRef.update({'completion_rate': rate > 0.95 ? 0.95 + (completed * 0.001) : rate});
      }
    } catch (_) {
      // Non-critical — the batch already committed
    }
  }

  /// Check if a volunteer document exists.
  Future<bool> volunteerExists(String userId, String orgId) async {
    final doc = await _db
        .collection('organizations')
        .doc(orgId)
        .collection('volunteers')
        .doc(userId)
        .get();
    return doc.exists;
  }
}
