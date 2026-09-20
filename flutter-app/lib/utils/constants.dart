/// Application-wide constants for VolunteerBridge mobile app.

import 'package:flutter/material.dart';

/// Base URL for the VolunteerBridge API.
/// Replace with your Cloud Run URL in production.
const String apiBaseUrl = 'http://localhost:8000';

/// Default organization ID for multi-tenant Firestore paths.
const String defaultOrgId = 'default';

/// Google Maps API Key.
const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';

/// Urgency score thresholds.
const int urgencyHighThreshold = 8;
const int urgencyMediumThreshold = 5;

/// Urgency-level colors matching the web dashboard design system.
const Color urgencyHighColor = Color(0xFFE24B4A);
const Color urgencyMediumColor = Color(0xFFEF9F27);
const Color urgencyLowColor = Color(0xFF639922);

/// Brand colors.
const Color brandPrimary = Color(0xFF185FA5);
const Color brandLight = Color(0xFFEBF5FF);
const Color accentTeal = Color(0xFF1D9E75);
const Color accentPurple = Color(0xFF7C3AED);

/// Available volunteer skills for profile setup.
const List<String> availableSkills = [
  'Medical',
  'First Aid',
  'Nursing',
  'Construction',
  'Logistics',
  'Teaching',
  'Counseling',
  'Driving',
  'Food Distribution',
  'Translation',
];

/// Transport type options.
const List<String> transportTypes = [
  'Walking',
  'Bike',
  'Car',
  'Motorcycle',
];

/// Returns the appropriate urgency color for a given score.
Color getUrgencyColor(int score) {
  if (score >= urgencyHighThreshold) return urgencyHighColor;
  if (score >= urgencyMediumThreshold) return urgencyMediumColor;
  return urgencyLowColor;
}

/// Returns the urgency label for a given score.
String getUrgencyLabel(int score) {
  if (score >= urgencyHighThreshold) return 'CRITICAL';
  if (score >= urgencyMediumThreshold) return 'MODERATE';
  return 'LOW';
}
