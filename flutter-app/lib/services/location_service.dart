/// Location service for GPS tracking and permission management.

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/constants.dart';

/// Provider for the location service.
final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

/// Handles GPS permissions, position fetching, and background location updates.
class LocationService {
  StreamSubscription<Position>? _positionSubscription;

  /// Check and request location permissions. Returns true if granted.
  Future<bool> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Get the current device position.
  Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) return null;

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint('Failed to get position: $e');
      return null;
    }
  }

  /// Start periodic location updates and sync to Firestore.
  /// Used when volunteer is actively on a task.
  void startTracking({
    required String volunteerId,
    required String orgId,
  }) {
    stopTracking();

    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 50, // Only update when moved 50m
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position position) {
      _updateFirestoreLocation(volunteerId, orgId, position);
    });
  }

  /// Stop location tracking.
  void stopTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  /// Update volunteer location in Firestore.
  Future<void> _updateFirestoreLocation(
    String volunteerId,
    String orgId,
    Position position,
  ) async {
    try {
      await FirebaseFirestore.instance
          .collection('organizations')
          .doc(orgId)
          .collection('volunteers')
          .doc(volunteerId)
          .update({
        'location': {
          'lat': position.latitude,
          'lng': position.longitude,
          'zone': 'GPS Updated',
        },
      });
    } catch (e) {
      debugPrint('Failed to update location: $e');
    }
  }

  /// Calculate distance in km between two coordinates.
  double distanceBetween(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng) /
        1000.0;
  }

  void dispose() {
    stopTracking();
  }
}
