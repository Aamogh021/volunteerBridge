/// VolunteerBridge mobile application entry point.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'firebase_options.dart';
import 'screens/briefing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/my_tasks_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/profile_setup_screen.dart';
import 'screens/task_detail_screen.dart';
import 'screens/task_feed_screen.dart';
import 'services/auth_service.dart';
import 'services/connectivity_service.dart';
import 'services/notification_service.dart';
import 'services/offline_sync_queue.dart';
import 'utils/theme.dart';
import 'utils/constants.dart';
import 'widgets/offline_banner.dart';

/// Top-level background message handler — must be top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('Background message received: ${message.messageId}');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Register background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Enable Firestore offline persistence with unlimited cache
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  // Load any pending offline actions from disk
  final syncQueue = OfflineSyncQueue();
  await syncQueue.load();

  runApp(
    const ProviderScope(
      child: VolunteerBridgeApp(),
    ),
  );
}

class VolunteerBridgeApp extends ConsumerWidget {
  const VolunteerBridgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = _createRouter(ref);

    return MaterialApp.router(
      title: 'VolunteerBridge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }

  GoRouter _createRouter(WidgetRef ref) {
    return GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final authService = ref.read(authServiceProvider);
        final isSignedIn = authService.isSignedIn;
        final isOnLogin = state.matchedLocation == '/login';
        final isOnRoot = state.matchedLocation == '/';

        if (!isSignedIn && !isOnLogin) {
          return '/login';
        }

        if (isSignedIn && (isOnLogin || isOnRoot)) {
          return '/tasks';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/',
          redirect: (context, state) => '/login',
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/profile-setup',
          builder: (context, state) => const ProfileSetupScreen(),
        ),
        GoRoute(
          path: '/briefing',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return BriefingScreen(
              needId: extra['needId'] as String,
              volunteerId: extra['volunteerId'] as String,
            );
          },
        ),
        ShellRoute(
          builder: (context, state, child) {
            return _MainShell(
              currentPath: state.matchedLocation,
              child: child,
            );
          },
          routes: [
            GoRoute(
              path: '/tasks',
              builder: (context, state) => const TaskFeedScreen(),
            ),
            GoRoute(
              path: '/tasks/:needId',
              builder: (context, state) {
                final needId = state.pathParameters['needId']!;
                return TaskDetailScreen(needId: needId);
              },
            ),
            GoRoute(
              path: '/my-tasks',
              builder: (context, state) => const MyTasksScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    );
  }
}

/// Main shell with bottom navigation bar that tracks the active route.
class _MainShell extends StatelessWidget {
  final Widget child;
  final String currentPath;

  const _MainShell({required this.child, required this.currentPath});

  int get _selectedIndex {
    if (currentPath.startsWith('/my-tasks')) return 1;
    if (currentPath.startsWith('/profile')) return 2;
    return 0; // /tasks and /tasks/:id
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Offline banner — shown above all content when offline
          const OfflineBanner(),
          // Main content
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) {
            switch (index) {
              case 0:
                context.go('/tasks');
                break;
              case 1:
                context.go('/my-tasks');
                break;
              case 2:
                context.go('/profile');
                break;
            }
          },
          backgroundColor: Colors.white,
          selectedItemColor: brandPrimary,
          unselectedItemColor: const Color(0xFF9CA3AF),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w400,
          ),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.list_alt_outlined),
              activeIcon: Icon(Icons.list_alt),
              label: 'Tasks',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_outlined),
              activeIcon: Icon(Icons.assignment),
              label: 'My Tasks',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
