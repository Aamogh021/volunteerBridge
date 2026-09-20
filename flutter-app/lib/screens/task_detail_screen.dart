/// Task detail screen — full spec layout with urgency bar, accept flow, and navigation.

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../services/connectivity_service.dart';
import '../services/firestore_service.dart';
import '../services/offline_sync_queue.dart';
import '../utils/constants.dart';
import '../widgets/urgency_badge.dart';
import '../widgets/skill_tag.dart';

class TaskDetailScreen extends ConsumerStatefulWidget {
  final String needId;

  const TaskDetailScreen({super.key, required this.needId});

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  bool _accepting = false;

  Future<void> _acceptTask() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Accept This Task?'),
        content: const Text(
          'You will be assigned to this crisis task. '
          'The coordinator will be notified and your location will be shared.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: accentTeal),
            child: const Text('Accept'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _accepting = true);

    final connectivity = ref.read(connectivityServiceProvider);
    final isOnline = connectivity.currentlyOnline;

    if (isOnline) {
      // --- ONLINE: standard flow ---
      try {
        final apiService = ref.read(apiServiceProvider);
        final success = await apiService.acceptTask(
          widget.needId,
          user.uid,
          defaultOrgId,
        );

        if (mounted) {
          if (success) {
            context.go('/briefing', extra: {
              'needId': widget.needId,
              'volunteerId': user.uid,
            });
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Failed to accept task. Please try again.'),
                backgroundColor: urgencyHighColor,
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
              backgroundColor: urgencyHighColor,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _accepting = false);
      }
    } else {
      // --- OFFLINE: queue and navigate with fallback ---
      final syncQueue = ref.read(offlineSyncQueueProvider);
      await syncQueue.enqueue(PendingAction(
        type: 'accept_task',
        payload: {
          'need_id': widget.needId,
          'volunteer_id': user.uid,
          'org_id': defaultOrgId,
        },
      ));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Task queued — will confirm when back online'),
            backgroundColor: Color(0xFFD97706),
          ),
        );
        context.go('/briefing', extra: {
          'needId': widget.needId,
          'volunteerId': user.uid,
        });
        setState(() => _accepting = false);
      }
    }
  }

  Future<void> _openMaps(double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = ref.read(firestoreServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/tasks'),
        ),
      ),
      body: FutureBuilder(
        future: firestoreService.getNeed(widget.needId, defaultOrgId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: brandPrimary),
            );
          }

          if (snapshot.hasError || snapshot.data == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.search_off, size: 48, color: Color(0xFF9CA3AF)),
                    const SizedBox(height: 16),
                    Text(
                      'Task Not Found',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'This task may have been assigned or removed.',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => context.go('/tasks'),
                      child: const Text('Back to Tasks'),
                    ),
                  ],
                ),
              ),
            );
          }

          final need = snapshot.data!;
          final isAssigned = need.status != 'unassigned';
          final lat = (need.location['lat'] as num?)?.toDouble() ?? 0.0;
          final lng = (need.location['lng'] as num?)?.toDouble() ?? 0.0;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Urgency header card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              need.urgencyColor.withValues(alpha: 0.1),
                              need.urgencyColor.withValues(alpha: 0.03),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: need.urgencyColor.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                UrgencyBadge(urgencyScore: need.urgencyScore),
                                const Spacer(),
                                Text(
                                  _timeAgo(need.createdAt),
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: const Color(0xFF9CA3AF),
                                      ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              need.needType,
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 12),
                            // Urgency bar (10 segments)
                            _buildUrgencyBar(need.urgencyScore),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Details section
                      Text(
                        'Details',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 12),

                      _buildDetailTile(
                        Icons.location_on_outlined,
                        'Zone',
                        need.zone,
                      ),
                      _buildDetailTile(
                        Icons.schedule_outlined,
                        'Estimated Duration',
                        '${need.volunteerHoursNeeded}h',
                      ),
                      _buildDetailTile(
                        Icons.info_outline,
                        'Status',
                        need.status.toUpperCase().replaceAll('_', ' '),
                      ),
                      if (need.confidenceScore != null)
                        _buildDetailTile(
                          Icons.psychology_outlined,
                          'AI Confidence',
                          '${(need.confidenceScore! * 100).round()}%',
                        ),

                      const SizedBox(height: 20),

                      // Skills section
                      Text(
                        'Required Skills',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: need.requiredSkills
                            .map((skill) => SkillTag(skill: skill))
                            .toList(),
                      ),

                      // Navigate button (shown if location exists)
                      if (lat != 0.0 && lng != 0.0) ...[
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => _openMaps(lat, lng),
                            icon: const Icon(Icons.directions),
                            label: const Text('Open in Google Maps'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: brandPrimary),
                            ),
                          ),
                        ),
                      ],

                      if (isAssigned) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: brandPrimary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: brandPrimary.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle,
                                  color: brandPrimary, size: 24),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'This task has been assigned.',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: brandPrimary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Accept button
              if (!isAssigned)
                SafeArea(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _accepting ? null : _acceptTask,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: accentTeal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _accepting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Accept Task',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildUrgencyBar(int score) {
    return Row(
      children: List.generate(10, (index) {
        final filled = index < score;
        Color color;
        if (index < 4) {
          color = urgencyLowColor;
        } else if (index < 7) {
          color = urgencyMediumColor;
        } else {
          color = urgencyHighColor;
        }

        return Expanded(
          child: Container(
            height: 6,
            margin: EdgeInsets.only(right: index < 9 ? 3 : 0),
            decoration: BoxDecoration(
              color: filled ? color : const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildDetailTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: const Color(0xFF6B7280)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF9CA3AF),
                      ),
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime? date) {
    if (date == null) return 'Just posted';
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'Just posted';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
