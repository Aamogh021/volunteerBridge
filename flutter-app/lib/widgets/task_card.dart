/// TaskCard widget displaying a community need in the feed.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/community_need.dart';
import 'urgency_badge.dart';
import 'skill_tag.dart';

class TaskCard extends StatelessWidget {
  final CommunityNeed need;

  const TaskCard({super.key, required this.need});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 30.0, end: 0.0),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, value),
          child: Opacity(
            opacity: (30.0 - value) / 30.0,
            child: child,
          ),
        );
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            if (need.id != null) {
              context.push('/tasks/${need.id}');
            }
          },
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(
                  color: need.urgencyColor,
                  width: 4,
                ),
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    UrgencyBadge(urgencyScore: need.urgencyScore),
                    Text(
                      _timeAgo(need.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF9CA3AF),
                          ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Title
                Text(
                  need.needType,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),

                const SizedBox(height: 6),

                // Zone + hours
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 14,
                      color: const Color(0xFF9CA3AF),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      need.zone,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.schedule_outlined,
                      size: 14,
                      color: const Color(0xFF9CA3AF),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${need.volunteerHoursNeeded}h',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Skills
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: need.requiredSkills
                      .take(4)
                      .map((skill) => SkillTag(skill: skill))
                      .toList(),
                ),

                const SizedBox(height: 12),

                // View details
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    'View Details →',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: const Color(0xFF185FA5),
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _timeAgo(DateTime? date) {
    if (date == null) return 'Just now';
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
