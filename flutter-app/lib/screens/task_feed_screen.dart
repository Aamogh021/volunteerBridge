/// Task feed screen showing available community needs with stats header.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import '../services/auth_service.dart';
import '../services/connectivity_service.dart';
import '../services/firestore_service.dart';
import '../utils/constants.dart';
import '../widgets/task_card.dart';

class TaskFeedScreen extends ConsumerStatefulWidget {
  const TaskFeedScreen({super.key});

  @override
  ConsumerState<TaskFeedScreen> createState() => _TaskFeedScreenState();
}

class _TaskFeedScreenState extends ConsumerState<TaskFeedScreen> {
  bool _isAvailable = true;

  void _toggleAvailability() async {
    final authService = ref.read(authServiceProvider);
    final firestoreService = ref.read(firestoreServiceProvider);
    final user = authService.user;
    if (user == null) return;

    setState(() => _isAvailable = !_isAvailable);

    try {
      await firestoreService.setVolunteer(
        user.uid,
        defaultOrgId,
        {'availability': _isAvailable},
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isAvailable = !_isAvailable);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update availability: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = ref.read(firestoreServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('VolunteerBridge'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Row(
              children: [
                Text(
                  _isAvailable ? 'Online' : 'Offline',
                  style: TextStyle(
                    fontSize: 13,
                    color: _isAvailable ? accentTeal : const Color(0xFF9CA3AF),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Switch(
                  value: _isAvailable,
                  onChanged: (_) => _toggleAvailability(),
                  activeColor: accentTeal,
                ),
              ],
            ),
          ),
        ],
      ),
      body: StreamBuilder(
        stream: firestoreService.needsStream(defaultOrgId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildShimmerLoading();
          }

          if (snapshot.hasError) {
            final connectivity = ref.read(connectivityServiceProvider);
            final isOffline = !connectivity.currentlyOnline;

            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isOffline ? Icons.wifi_off_rounded : Icons.cloud_off,
                      size: 48,
                      color: isOffline ? const Color(0xFFD97706) : urgencyMediumColor,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isOffline ? 'You\'re Offline' : 'Connection Error',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isOffline
                          ? 'Showing cached data.\nNew tasks will load when connected.'
                          : 'Unable to connect to the server.\nCheck your internet connection.',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          final needs = snapshot.data ?? [];
          final availableNeeds =
              needs.where((n) => n.status == 'unassigned').toList();

          final criticalCount =
              availableNeeds.where((n) => n.urgencyScore >= 8).length;
          final moderateCount =
              availableNeeds.where((n) => n.urgencyScore >= 5 && n.urgencyScore < 8).length;
          final lowCount =
              availableNeeds.where((n) => n.urgencyScore < 5).length;

          if (availableNeeds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: accentTeal.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle_outline,
                        size: 40, color: accentTeal),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'All Clear',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No tasks need attention right now.\nWe\'ll notify you when help is needed.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFF9CA3AF),
                        ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: brandPrimary,
            onRefresh: () async {
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: CustomScrollView(
              slivers: [
                // Stats header
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          brandPrimary,
                          brandPrimary.withValues(alpha: 0.85),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${availableNeeds.length} Tasks Available',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  _buildStatPill(
                                      '$criticalCount', 'Critical', urgencyHighColor),
                                  const SizedBox(width: 6),
                                  _buildStatPill(
                                      '$moderateCount', 'Moderate', urgencyMediumColor),
                                  const SizedBox(width: 6),
                                  _buildStatPill(
                                      '$lowCount', 'Low', urgencyLowColor),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.notifications_active_outlined,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Task list
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return TaskCard(need: availableNeeds[index]);
                      },
                      childCount: availableNeeds.length,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatPill(String count, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
          Text(
            '$count $label',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[200]!,
          highlightColor: Colors.grey[100]!,
          child: Card(
            child: Container(
              height: 140,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 80,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 200,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(7),
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: List.generate(
                      3,
                      (_) => Container(
                        width: 60,
                        height: 24,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
