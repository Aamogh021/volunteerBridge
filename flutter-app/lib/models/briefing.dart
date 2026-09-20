/// AI briefing data model for volunteer task briefings.

class BriefingData {
  final String situation;
  final String yourRole;
  final String whatToExpect;
  final String coordinateWith;
  final String safetyNote;

  BriefingData({
    required this.situation,
    required this.yourRole,
    required this.whatToExpect,
    required this.coordinateWith,
    required this.safetyNote,
  });

  factory BriefingData.fromJson(Map<String, dynamic> json) => BriefingData(
        situation: json['situation'] as String? ?? '',
        yourRole: json['your_role'] as String? ?? '',
        whatToExpect: json['what_to_expect'] as String? ?? '',
        coordinateWith: json['coordinate_with'] as String? ??
            'You are the sole responder for this task.',
        safetyNote:
            json['safety_note'] as String? ?? 'Follow standard safety protocols.',
      );

  factory BriefingData.fallback() => BriefingData(
        situation: 'Community need requiring immediate volunteer assistance.',
        yourRole: 'Your skills make you well-suited for this task.',
        whatToExpect:
            'Assess the situation on arrival and act according to your training.',
        coordinateWith: 'You are the sole responder for this task.',
        safetyNote: 'Follow standard safety protocols at all times.',
      );
}
