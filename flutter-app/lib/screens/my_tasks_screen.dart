/// My tasks screen — assigned tasks with full status flow.

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/connectivity_service.dart';
import '../services/firestore_service.dart';
import '../services/location_service.dart';
import '../services/offline_sync_queue.dart';
import '../models/community_need.dart';
import '../utils/constants.dart';

class MyTasksScreen extends ConsumerStatefulWidget {
  const MyTasksScreen({super.key});

  @override
  ConsumerState<MyTasksScreen> createState() => _MyTasksScreenState();
}

class _MyTasksScreenState extends ConsumerState<MyTasksScreen> {
  final Map<String, CommunityNeed?> _needsCache = {};
  final Set<String> _loadingNeeds = {};

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'assigned':
        return brandPrimary;
      case 'on_site':
        return urgencyMediumColor;
      case 'complete':
        return accentTeal;
      default:
        return const Color(0xFF9CA3AF);
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'assigned':
        return Icons.assignment_outlined;
      case 'on_site':
        return Icons.location_on;
      case 'complete':
        return Icons.check_circle;
      default:
        return Icons.circle_outlined;
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'Assigned';
      case 'on_site':
        return 'On Site';
      case 'complete':
        return 'Completed';
      default:
        return status;
    }
  }

  Future<CommunityNeed?> _fetchNeed(String needId) async {
    if (_needsCache.containsKey(needId)) return _needsCache[needId];
    if (_loadingNeeds.contains(needId)) return null;

    _loadingNeeds.add(needId);
    try {
      final firestoreService = ref.read(firestoreServiceProvider);
      final need = await firestoreService.getNeed(needId, defaultOrgId);
      _needsCache[needId] = need;
      return need;
    } finally {
      _loadingNeeds.remove(needId);
    }
  }

  Future<void> _markOnSite(
    String assignmentId,
    String needId,
    String volunteerId,
  ) async {
    final connectivity = ref.read(connectivityServiceProvider);

    if (connectivity.currentlyOnline) {
      // --- ONLINE ---
      try {
        final firestoreService = ref.read(firestoreServiceProvider);
        await firestoreService.markOnSite(assignmentId, needId, defaultOrgId);

        // Start location tracking
        final locationService = ref.read(locationServiceProvider);
        locationService.startTracking(
          volunteerId: volunteerId,
          orgId: defaultOrgId,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Status updated: On Site'),
              backgroundColor: urgencyMediumColor,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to update: $e'),
              backgroundColor: urgencyHighColor,
            ),
          );
        }
      }
    } else {
      // --- OFFLINE: queue ---
      final syncQueue = ref.read(offlineSyncQueueProvider);
      await syncQueue.enqueue(PendingAction(
        type: 'mark_on_site',
        payload: {
          'assignment_id': assignmentId,
          'need_id': needId,
          'org_id': defaultOrgId,
        },
      ));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Queued — will sync when back online'),
            backgroundColor: Color(0xFFD97706),
          ),
        );
      }
    }
  }

  Future<void> _markComplete(
    String assignmentId,
    String needId,
    String volunteerId,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Complete Task?'),
        content: const Text(
          'Confirm that you have finished this task. '
          'The coordinator will be notified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: accentTeal),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final connectivity = ref.read(connectivityServiceProvider);

    if (connectivity.currentlyOnline) {
      // --- ONLINE ---
      try {
        final firestoreService = ref.read(firestoreServiceProvider);
        await firestoreService.completeTask(
          assignmentId: assignmentId,
          needId: needId,
          volunteerId: volunteerId,
          orgId: defaultOrgId,
        );

        // Stop location tracking
        final locationService = ref.read(locationServiceProvider);
        locationService.stopTracking();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Task completed! Great work. 🎉'),
              backgroundColor: accentTeal,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to complete: $e'),
              backgroundColor: urgencyHighColor,
            ),
          );
        }
      }
    } else {
      // --- OFFLINE: queue ---
      final syncQueue = ref.read(offlineSyncQueueProvider);
      await syncQueue.enqueue(PendingAction(
        type: 'complete_task',
        payload: {
          'assignment_id': assignmentId,
          'need_id': needId,
          'volunteer_id': volunteerId,
          'org_id': defaultOrgId,
        },
      ));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Completion queued — will sync when back online'),
            backgroundColor: Color(0xFFD97706),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Not signed in')),
      );
    }

    final firestoreService = ref.read(firestoreServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tasks'),
      ),
      body: StreamBuilder(
        stream: firestoreService.myAssignmentsStream(user.uid, defaultOrgId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: brandPrimary),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_off, size: 48, color: urgencyMediumColor),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load your tasks',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            );
          }

          final assignments = snapshot.data ?? [];

          if (assignments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: brandPrimary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.assignment_outlined,
                        size: 40, color: brandPrimary),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'No Assigned Tasks',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Accept a task from the feed\nto see it here.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF9CA3AF),
                        ),
                  ),
                ],
              ),
            );
          }

          // Separate active and completed
          final active = assignments
              .where((a) => (a['status'] as String?) != 'complete')
              .toList();
          final completed = assignments
              .where((a) => (a['status'] as String?) == 'complete')
              .toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (active.isNotEmpty) ...[
                Text(
                  'Active (${active.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 12),
                ...active.map((a) => _buildAssignmentCard(a, user.uid)),
              ],
              if (completed.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(
                  'Completed (${completed.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF9CA3AF),
                      ),
                ),
                const SizedBox(height: 12),
                ...completed.map((a) => _buildAssignmentCard(a, user.uid)),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildAssignmentCard(Map<String, dynamic> assignment, String userId) {
    final status = assignment['status'] as String? ?? 'assigned';
    final needId = assignment['need_id'] as String? ?? '';
    final assignedAt = assignment['assigned_at'] as String? ?? '';
    final assignmentId = assignment['id'] as String? ?? '';
    final isComplete = status == 'complete';
    final color = _statusColor(status);

    return FutureBuilder<CommunityNeed?>(
      future: _fetchNeed(needId),
      builder: (context, needSnapshot) {
        final need = needSnapshot.data;
        final needType = need?.needType ?? 'Loading...';
        final zone = need?.zone ?? '';
        final urgency = need?.urgencyScore ?? 5;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: color, width: 4),
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Icon(_statusIcon(status), color: color, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        needType,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: color.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        _statusLabel(status),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                    ),
                  ],
                ),

                if (zone.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 14, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 4),
                      Text(zone,
                          style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(width: 12),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: Color(0xFFD1D5DB),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Urgency: $urgency/10',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: getUrgencyColor(urgency),
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                ],

                if (assignedAt.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Assigned: ${_formatDate(assignedAt)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFFD1D5DB),
                        ),
                  ),
                ],

                // Action buttons
                if (!isComplete) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      if (status == 'assigned')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () =>
                                _markOnSite(assignmentId, needId, userId),
                            icon: const Icon(Icons.location_on, size: 18),
                            label: const Text("I'm On Site"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: urgencyMediumColor,
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      if (status == 'assigned') const SizedBox(width: 10),
                      if (status == 'on_site')
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () =>
                                _markComplete(assignmentId, needId, userId),
                            icon: const Icon(Icons.check_circle_outline,
                                size: 18),
                            label: const Text('Mark Complete'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: accentTeal,
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return isoString;
    }
  }
}
