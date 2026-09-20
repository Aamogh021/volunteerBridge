/// Profile screen — volunteer details, skills, availability toggle, and sign out.

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/volunteer.dart';
import '../services/auth_service.dart';
import '../services/connectivity_service.dart';
import '../services/firestore_service.dart';
import '../services/offline_sync_queue.dart';
import '../utils/constants.dart';
import '../widgets/skill_tag.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _updatingAvailability = false;

  void _toggleAvailability(Volunteer vol) async {
    if (_updatingAvailability) return;
    setState(() => _updatingAvailability = true);

    final newVal = !vol.availability;
    final connectivity = ref.read(connectivityServiceProvider);
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() => _updatingAvailability = false);
      return;
    }

    if (connectivity.currentlyOnline) {
      try {
        final firestoreService = ref.read(firestoreServiceProvider);
        await firestoreService.setVolunteer(
          user.uid,
          defaultOrgId,
          {'availability': newVal},
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(newVal ? 'You are now available for tasks' : 'You are now unavailable'),
              backgroundColor: newVal ? accentTeal : const Color(0xFF64748B),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Update failed: $e'), backgroundColor: urgencyHighColor),
          );
        }
      }
    } else {
      // Queue for offline sync
      final syncQueue = ref.read(offlineSyncQueueProvider);
      await syncQueue.enqueue(PendingAction(
        type: 'set_availability',
        payload: {
          'user_id': user.uid,
          'org_id': defaultOrgId,
          'availability': newVal,
        },
      ));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Will update when back online'),
            backgroundColor: Color(0xFFD97706),
          ),
        );
      }
    }

    if (mounted) setState(() => _updatingAvailability = false);
  }

  void _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign out?'),
        content: const Text('You will stop receiving task notifications.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: urgencyHighColor),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authService = ref.read(authServiceProvider);
      await authService.signOut();
      if (mounted) context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final userId = user?.uid ?? '';
    final firestoreService = ref.read(firestoreServiceProvider);

    return Scaffold(
      body: StreamBuilder<Volunteer?>(
        stream: firestoreService.volunteerStream(userId, defaultOrgId),
        builder: (context, snapshot) {
          final vol = snapshot.data;

          return CustomScrollView(
            slivers: [
              // Sliver App Bar
              SliverAppBar(
                expandedHeight: 220,
                pinned: true,
                backgroundColor: brandPrimary,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      Navigator.of(context).pop();
                    } else {
                      context.go('/tasks');
                    }
                  },
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: Colors.white),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Edit profile coming soon')),
                      );
                    },
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF0F1724), Color(0xFF185FA5)],
                      ),
                    ),
                    child: SafeArea(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 32),
                          // Avatar
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.2),
                              border: Border.all(color: Colors.white, width: 3),
                            ),
                            child: ClipOval(
                              child: user?.photoURL != null
                                  ? Image.network(
                                      user!.photoURL!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => _buildInitials(user),
                                    )
                                  : _buildInitials(user),
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Name
                          Text(
                            vol?.name ?? user?.displayName ?? 'Volunteer',
                            style: const TextStyle(
                              fontSize: 20,
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          // Email
                          Text(
                            user?.email ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Verified badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'Verified Volunteer',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Stats card
                      _buildStatsCard(vol),
                      const SizedBox(height: 16),

                      // Skills card
                      _buildSkillsCard(vol),
                      const SizedBox(height: 16),

                      // Availability card
                      _buildAvailabilityCard(vol),
                      const SizedBox(height: 16),

                      // Certifications card
                      _buildCertificationsCard(),
                      const SizedBox(height: 16),

                      // Account card
                      _buildAccountCard(),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInitials(User? user) {
    final initial = (user?.displayName ?? 'V').substring(0, 1).toUpperCase();
    return Center(
      child: Text(
        initial,
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildCardContainer({required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 0.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildStatsCard(Volunteer? vol) {
    return _buildCardContainer(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Row(
          children: [
            _buildStat('${vol?.tasksCompleted ?? 0}', 'Tasks'),
            Container(width: 1, height: 40, color: const Color(0xFFE2E8F0)),
            _buildStat(
              '${((vol?.completionRate ?? 0) * 100).round()}%',
              'Reliability',
            ),
            Container(width: 1, height: 40, color: const Color(0xFFE2E8F0)),
            _buildStat(
              '${(vol?.avgResponseMinutes ?? 0).round()}m',
              'Avg Response',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: brandPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkillsCard(Volunteer? vol) {
    final skills = vol?.skills ?? [];

    return _buildCardContainer(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Skills',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A202C),
                  ),
                ),
                OutlinedButton(
                  onPressed: () => context.go('/profile-setup'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    side: const BorderSide(color: brandPrimary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Edit', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            skills.isEmpty
                ? const Text(
                    'No skills added yet. Tap Edit to add your skills.',
                    style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  )
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: skills.map((s) => SkillTag(skill: s)).toList(),
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvailabilityCard(Volunteer? vol) {
    final available = vol?.availability ?? true;

    return _buildCardContainer(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Availability',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A202C),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Available for tasks',
                    style: TextStyle(fontSize: 15, color: Color(0xFF1A202C)),
                  ),
                ),
                Switch(
                  value: available,
                  onChanged: vol == null
                      ? null
                      : (_) => _toggleAvailability(vol),
                  activeColor: accentTeal,
                ),
              ],
            ),
            Text(
              'You will receive task notifications when available',
              style: TextStyle(
                fontSize: 12,
                color: const Color(0xFF64748B).withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCertificationsCard() {
    return _buildCardContainer(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Certifications',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A202C),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Coming soon')),
                    );
                  },
                  child: const Text('Add', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.workspace_premium, size: 32, color: Colors.grey[300]),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Upload certifications to get verified skill badges',
                    style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountCard() {
    return _buildCardContainer(
      child: Column(
        children: [
          _buildAccountTile(Icons.notifications_outlined, 'Notification Settings', false),
          const Divider(height: 1, indent: 56),
          _buildAccountTile(Icons.language, 'Language Preference', false),
          const Divider(height: 1, indent: 56),
          _buildAccountTile(Icons.shield_outlined, 'Privacy Policy', false),
          const Divider(height: 1),
          _buildAccountTile(Icons.logout, 'Sign Out', true),
        ],
      ),
    );
  }

  Widget _buildAccountTile(IconData icon, String label, bool isSignOut) {
    final color = isSignOut ? urgencyHighColor : const Color(0xFF1A202C);
    final iconColor = isSignOut ? urgencyHighColor : const Color(0xFF64748B);

    return InkWell(
      onTap: () {
        if (isSignOut) {
          _signOut();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Coming soon')),
          );
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 22, color: iconColor),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  color: color,
                  fontWeight: isSignOut ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            if (!isSignOut)
              const Icon(Icons.chevron_right, size: 20, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }
}
