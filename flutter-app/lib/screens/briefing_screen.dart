/// Briefing screen — premium full-screen AI-generated mission briefing.

import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/briefing.dart';
import '../models/community_need.dart';
import '../models/volunteer.dart';
import '../services/connectivity_service.dart';
import '../services/firestore_service.dart';
import '../utils/constants.dart';
import '../widgets/urgency_badge.dart';

class BriefingScreen extends ConsumerStatefulWidget {
  final String needId;
  final String volunteerId;

  const BriefingScreen({
    super.key,
    required this.needId,
    required this.volunteerId,
  });

  @override
  ConsumerState<BriefingScreen> createState() => _BriefingScreenState();
}

class _BriefingScreenState extends ConsumerState<BriefingScreen>
    with SingleTickerProviderStateMixin {
  BriefingData? briefing;
  bool loading = true;
  String? error;
  Volunteer? volunteer;
  CommunityNeed? need;
  bool _isOffline = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _loadBriefing();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadBriefing() async {
    final firestoreService = ref.read(firestoreServiceProvider);
    final connectivity = ref.read(connectivityServiceProvider);

    try {
      // Load volunteer and need data in parallel (works from cache offline)
      final results = await Future.wait([
        firestoreService
            .volunteerStream(widget.volunteerId, defaultOrgId)
            .first,
        firestoreService.getNeed(widget.needId, defaultOrgId),
      ]);

      volunteer = results[0] as Volunteer?;
      need = results[1] as CommunityNeed?;

      if (volunteer == null || need == null) {
        if (mounted) {
          setState(() {
            briefing = BriefingData.fallback();
            loading = false;
          });
        }
        return;
      }

      // Check connectivity before calling the API
      if (!connectivity.currentlyOnline) {
        if (mounted) {
          setState(() {
            _isOffline = true;
            briefing = BriefingData.fallback();
            loading = false;
          });
        }
        return;
      }

      // Call backend briefing endpoint
      try {
        final response = await http.Client()
            .post(
              Uri.parse('$apiBaseUrl/briefing'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode({
                'volunteer_id': widget.volunteerId,
                'need_id': widget.needId,
                'volunteer_name': volunteer!.name,
                'skills': volunteer!.skills,
                'tasks_completed': volunteer!.tasksCompleted,
                'need_type': need!.needType,
                'zone': need!.zone,
                'urgency_score': need!.urgencyScore,
                'raw_text': need!.rawText ?? '',
                'nearby_volunteers': [],
              }),
            )
            .timeout(const Duration(seconds: 15));

        if (response.statusCode == 200) {
          final data = json.decode(response.body) as Map<String, dynamic>;
          if (mounted) {
            setState(() {
              briefing = BriefingData.fromJson(data);
              loading = false;
            });
          }
        } else {
          throw Exception('Status ${response.statusCode}');
        }
      } catch (_) {
        // Fallback — never leave volunteer without a briefing
        if (mounted) {
          setState(() {
            briefing = BriefingData.fallback();
            loading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          briefing = BriefingData.fallback();
          loading = false;
          error = e.toString();
        });
      }
    }
  }

  void _openMaps() async {
    if (need == null) return;
    final lat = (need!.location['lat'] as num?)?.toDouble() ?? 0.0;
    final lng = (need!.location['lng'] as num?)?.toDouble() ?? 0.0;
    final uri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Opening maps...')),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open maps.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0F1724), Color(0xFF185FA5)],
                stops: [0.0, 0.6],
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header
                _buildHeader(),

                // Main card
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: loading ? _buildLoadingCard() : _buildBriefingCard(),
                  ),
                ),
              ],
            ),
          ),

          // Floating nav button
          if (!loading)
            Positioned(
              left: 24,
              right: 24,
              bottom: 32,
              child: _buildNavigateButton(),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final userName = volunteer?.name ??
        FirebaseAuth.instance.currentUser?.displayName ??
        'Volunteer';

    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 16, 12),
      child: Column(
        children: [
          // Back button row
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
              onPressed: () => context.go('/tasks'),
            ),
          ),

          const SizedBox(height: 4),

          // Shield icon with glow
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.15),
              boxShadow: [
                BoxShadow(
                  color: Colors.white.withValues(alpha: 0.15),
                  blurRadius: 20,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: const Icon(Icons.volunteer_activism, size: 28, color: Colors.white),
          ),

          const SizedBox(height: 12),

          // Label
          Text(
            'YOUR BRIEFING',
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.8),
              letterSpacing: 3.0,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),

          // Volunteer name
          Text(
            '— $userName —',
            style: const TextStyle(
              fontSize: 20,
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 10),

          // Task type badge
          if (need != null)
            UrgencyBadge(urgencyScore: need!.urgencyScore),

          const SizedBox(height: 12),

          // Divider
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 40),
            height: 1,
            color: Colors.white.withValues(alpha: 0.3),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildLoadingCard() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          // Pulsing brain icon
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Opacity(
                opacity: 0.5 + (_pulseController.value * 0.5),
                child: Transform.scale(
                  scale: 0.9 + (_pulseController.value * 0.15),
                  child: const Icon(
                    Icons.psychology,
                    size: 48,
                    color: brandPrimary,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Gemini AI is preparing your briefing...',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 32),
          // Shimmer blocks
          ...List.generate(3, (i) => _buildShimmerBlock(i)),
        ],
      ),
    );
  }

  Widget _buildShimmerBlock(int index) {
    return Padding(
      padding: EdgeInsets.only(bottom: 20, top: index == 0 ? 0 : 0),
      child: Shimmer.fromColors(
        baseColor: Colors.grey[200]!,
        highlightColor: Colors.grey[100]!,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 120,
              height: 14,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(7),
              ),
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(height: 6),
            Container(
              width: 260,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBriefingCard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Offline notice
          if (_isOffline)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.wifi_off_rounded, size: 16, color: Color(0xFFD97706)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'AI briefing unavailable offline — showing standard protocol',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF92400E)),
                    ),
                  ),
                ],
              ),
            ),
          _buildSection(
            icon: Icons.warning_amber_rounded,
            iconColor: const Color(0xFFEF9F27),
            title: 'SITUATION',
            content: briefing!.situation,
          ),
          _buildSection(
            icon: Icons.person_pin,
            iconColor: const Color(0xFF185FA5),
            title: 'YOUR ROLE',
            content: briefing!.yourRole,
          ),
          _buildSection(
            icon: Icons.psychology,
            iconColor: const Color(0xFF7F77DD),
            title: 'WHAT TO EXPECT',
            content: briefing!.whatToExpect,
          ),
          _buildSection(
            icon: Icons.group,
            iconColor: const Color(0xFF1D9E75),
            title: 'COORDINATE WITH',
            content: briefing!.coordinateWith,
            isCoordinate: true,
          ),
          _buildSafetySection(),
          const SizedBox(height: 16),
          _buildEmergencyRow(),
        ],
      ),
    );
  }

  Widget _buildSection({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String content,
    bool isCoordinate = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Icon(icon, size: 20, color: iconColor),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Container(height: 1, color: const Color(0xFFF1F5F9)),
          const SizedBox(height: 8),
          // Content
          Text(
            content,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF1A202C),
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetySection() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(8),
        border: const Border(
          left: BorderSide(color: Color(0xFFEF9F27), width: 4),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_rounded, size: 18, color: Color(0xFFEF9F27)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SAFETY NOTE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF92400E),
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  briefing!.safetyNote,
                  style: const TextStyle(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    color: Color(0xFF92400E),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyRow() {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contact coordinator: +91 9876543210'),
            backgroundColor: Color(0xFFE24B4A),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          children: [
            Icon(Icons.phone, size: 18, color: Color(0xFFE24B4A)),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Emergency: Contact coordinator',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFFE24B4A),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Icon(Icons.chevron_right, size: 18, color: Color(0xFFE24B4A)),
          ],
        ),
      ),
    );
  }

  Widget _buildNavigateButton() {
    return GestureDetector(
      onTap: _openMaps,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.navigation_rounded, color: Color(0xFF185FA5), size: 24),
            SizedBox(width: 12),
            Text(
              'Start Navigation',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF185FA5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
