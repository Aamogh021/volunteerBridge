/// CommunityNeed model for VolunteerBridge.

import 'package:flutter/material.dart';
import '../utils/constants.dart';

class CommunityNeed {
  final String? id;
  final String needType;
  final int urgencyScore;
  final List<String> requiredSkills;
  final Map<String, dynamic> location;
  final double volunteerHoursNeeded;
  final double? confidenceScore;
  final String? rawText;
  final String status;
  final String orgId;
  final DateTime? createdAt;

  CommunityNeed({
    this.id,
    required this.needType,
    required this.urgencyScore,
    required this.requiredSkills,
    required this.location,
    this.volunteerHoursNeeded = 0,
    this.confidenceScore,
    this.rawText,
    this.status = 'unassigned',
    this.orgId = 'default',
    this.createdAt,
  });

  /// Returns the urgency color based on the score.
  Color get urgencyColor => getUrgencyColor(urgencyScore);

  /// Returns the urgency label based on the score.
  String get urgencyLabel => getUrgencyLabel(urgencyScore);

  /// Returns the zone from the location map.
  String get zone => location['zone'] as String? ?? 'Unknown';

  factory CommunityNeed.fromJson(Map<String, dynamic> json) {
    DateTime? parsedDate;
    if (json['created_at'] != null) {
      if (json['created_at'] is String) {
        parsedDate = DateTime.tryParse(json['created_at'] as String);
      }
    }

    return CommunityNeed(
      id: json['id'] as String?,
      needType: json['need_type'] as String? ?? 'Unknown',
      urgencyScore: json['urgency_score'] as int? ?? 5,
      requiredSkills: List<String>.from(json['required_skills'] ?? []),
      location: Map<String, dynamic>.from(
        json['location'] ?? {'lat': 0.0, 'lng': 0.0, 'zone': 'Unknown'},
      ),
      volunteerHoursNeeded:
          (json['volunteer_hours_needed'] as num?)?.toDouble() ?? 0,
      confidenceScore: (json['confidence_score'] as num?)?.toDouble(),
      rawText: json['raw_text'] as String?,
      status: json['status'] as String? ?? 'unassigned',
      orgId: json['org_id'] as String? ?? 'default',
      createdAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'need_type': needType,
      'urgency_score': urgencyScore,
      'required_skills': requiredSkills,
      'location': location,
      'volunteer_hours_needed': volunteerHoursNeeded,
      if (confidenceScore != null) 'confidence_score': confidenceScore,
      if (rawText != null) 'raw_text': rawText,
      'status': status,
      'org_id': orgId,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
    };
  }

  @override
  String toString() =>
      'CommunityNeed(id: $id, type: $needType, urgency: $urgencyScore)';
}
