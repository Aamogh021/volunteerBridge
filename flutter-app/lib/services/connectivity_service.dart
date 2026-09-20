/// Connectivity monitoring service with real ping verification.
///
/// Uses connectivity_plus for network state and verifies with an HTTP ping
/// to the backend health endpoint to detect captive portals / dead WiFi.

import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';

/// Riverpod provider for the connectivity service singleton.
final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Stream provider that widgets can watch for real-time connectivity changes.
final isOnlineProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(connectivityServiceProvider);
  return service.onlineStream;
});

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  final _controller = StreamController<bool>.broadcast();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _currentlyOnline = true;
  Timer? _pingTimer;

  ConnectivityService() {
    _init();
  }

  /// Whether the device currently has verified connectivity.
  bool get currentlyOnline => _currentlyOnline;

  /// Broadcast stream of connectivity state changes.
  Stream<bool> get onlineStream => _controller.stream;

  void _init() {
    // Listen to system connectivity changes
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection) {
        // System says we have a connection — verify with ping
        _verifyConnectivity();
      } else {
        _setOnline(false);
      }
    });

    // Initial check
    _checkNow();

    // Periodic ping every 30s to detect silent disconnections
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _verifyConnectivity();
    });
  }

  /// Perform an immediate connectivity check.
  Future<bool> _checkNow() async {
    try {
      final results = await _connectivity.checkConnectivity();
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (!hasConnection) {
        _setOnline(false);
        return false;
      }
      return await _verifyConnectivity();
    } catch (_) {
      _setOnline(false);
      return false;
    }
  }

  /// Ping the backend to verify real connectivity.
  Future<bool> _verifyConnectivity() async {
    try {
      final response = await http
          .get(Uri.parse('$apiBaseUrl/health'))
          .timeout(const Duration(seconds: 3));
      final online = response.statusCode == 200;
      _setOnline(online);
      return online;
    } catch (_) {
      _setOnline(false);
      return false;
    }
  }

  /// Force a manual connectivity check (e.g. before a critical operation).
  Future<bool> checkNow() => _checkNow();

  void _setOnline(bool value) {
    if (_currentlyOnline != value) {
      _currentlyOnline = value;
      _controller.add(value);
      debugPrint('[Connectivity] ${value ? "ONLINE" : "OFFLINE"}');
    }
  }

  void dispose() {
    _subscription?.cancel();
    _pingTimer?.cancel();
    _controller.close();
  }
}
