/// MatchResult model for VolunteerBridge.

import 'volunteer.dart';

class MatchResult {
  final Volunteer volunteer;
  final double skillScore;
  final double proximityScore;
  final double reliabilityScore;
  final double finalScore;
  final double? travelMinutes;
  final String reasoning;

  MatchResult({
    required this.volunteer,
    required this.skillScore,
    required this.proximityScore,
    required this.reliabilityScore,
    required this.finalScore,
    this.travelMinutes,
    required this.reasoning,
  });

  factory MatchResult.fromJson(Map<String, dynamic> json) {
    return MatchResult(
      volunteer: Volunteer.fromJson(
        Map<String, dynamic>.from(json['volunteer'] ?? {}),
      ),
      skillScore: (json['skill_score'] as num?)?.toDouble() ?? 0.0,
      proximityScore: (json['proximity_score'] as num?)?.toDouble() ?? 0.0,
      reliabilityScore: (json['reliability_score'] as num?)?.toDouble() ?? 0.0,
      finalScore: (json['final_score'] as num?)?.toDouble() ?? 0.0,
      travelMinutes: (json['travel_minutes'] as num?)?.toDouble(),
      reasoning: json['reasoning'] as String? ?? '',
    );
  }

  /// Final score formatted as a percentage integer.
  int get scorePercent => (finalScore * 100).round();

  @override
  String toString() =>
      'MatchResult(volunteer: ${volunteer.name}, score: $scorePercent%)';
}
