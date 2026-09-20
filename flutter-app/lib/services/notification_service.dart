/// Firebase Cloud Messaging notification service.

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/constants.dart';

/// Provider for the notification service.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

/// Handles FCM initialization, permissions, token management, and message handling.
class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// Initialize FCM and request permissions.
  Future<void> initialize({
    required String userId,
    required String orgId,
    required void Function(String needId) onNotificationTap,
  }) async {
    // Request notification permissions
    final NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('Notification permissions denied');
      return;
    }

    // Get and save FCM token
    final String? token = await _messaging.getToken();
    if (token != null) {
      await _saveTokenToFirestore(userId, orgId, token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      _saveTokenToFirestore(userId, orgId, newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Foreground message: ${message.notification?.title}');
      // In a production app you would show a local notification here
      // using flutter_local_notifications package
    });

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final needId = message.data['need_id'] as String?;
      if (needId != null) {
        onNotificationTap(needId);
      }
    });

    // Handle notification tap when app was terminated
    final RemoteMessage? initialMessage =
        await _messaging.getInitialMessage();
    if (initialMessage != null) {
      final needId = initialMessage.data['need_id'] as String?;
      if (needId != null) {
        onNotificationTap(needId);
      }
    }
  }

  /// Save the FCM token to the volunteer's Firestore document.
  Future<void> _saveTokenToFirestore(
    String userId,
    String orgId,
    String token,
  ) async {
    try {
      await FirebaseFirestore.instance
          .collection('organizations')
          .doc(orgId)
          .collection('volunteers')
          .doc(userId)
          .update({'fcm_token': token});
    } catch (e) {
      debugPrint('Failed to save FCM token: $e');
    }
  }

  /// Get the current FCM token.
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}

/// Top-level background message handler.
/// Must be a top-level function (not a class method).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
}
