/// Volunteer model for VolunteerBridge.

class Volunteer {
  final String? id;
  final String name;
  final List<String> skills;
  final String skillDescription;
  final Map<String, dynamic> location;
  final bool availability;
  final double completionRate;
  final double avgResponseMinutes;
  final int tasksCompleted;
  final String? fcmToken;

  Volunteer({
    this.id,
    required this.name,
    required this.skills,
    this.skillDescription = '',
    required this.location,
    this.availability = true,
    this.completionRate = 1.0,
    this.avgResponseMinutes = 10.0,
    this.tasksCompleted = 0,
    this.fcmToken,
  });

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      id: json['id'] as String?,
      name: json['name'] as String? ?? 'Unknown',
      skills: List<String>.from(json['skills'] ?? []),
      skillDescription: json['skill_description'] as String? ?? '',
      location: Map<String, dynamic>.from(json['location'] ?? {'lat': 0.0, 'lng': 0.0, 'zone': 'Unknown'}),
      availability: json['availability'] as bool? ?? true,
      completionRate: (json['completion_rate'] as num?)?.toDouble() ?? 1.0,
      avgResponseMinutes: (json['avg_response_minutes'] as num?)?.toDouble() ?? 10.0,
      tasksCompleted: json['tasks_completed'] as int? ?? 0,
      fcmToken: json['fcm_token'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'skills': skills,
      'skill_description': skillDescription,
      'location': location,
      'availability': availability,
      'completion_rate': completionRate,
      'avg_response_minutes': avgResponseMinutes,
      'tasks_completed': tasksCompleted,
      if (fcmToken != null) 'fcm_token': fcmToken,
    };
  }

  Volunteer copyWith({
    String? id,
    String? name,
    List<String>? skills,
    String? skillDescription,
    Map<String, dynamic>? location,
    bool? availability,
    double? completionRate,
    double? avgResponseMinutes,
    int? tasksCompleted,
    String? fcmToken,
  }) {
    return Volunteer(
      id: id ?? this.id,
      name: name ?? this.name,
      skills: skills ?? this.skills,
      skillDescription: skillDescription ?? this.skillDescription,
      location: location ?? this.location,
      availability: availability ?? this.availability,
      completionRate: completionRate ?? this.completionRate,
      avgResponseMinutes: avgResponseMinutes ?? this.avgResponseMinutes,
      tasksCompleted: tasksCompleted ?? this.tasksCompleted,
      fcmToken: fcmToken ?? this.fcmToken,
    );
  }

  @override
  String toString() => 'Volunteer(id: $id, name: $name, skills: $skills)';
}
