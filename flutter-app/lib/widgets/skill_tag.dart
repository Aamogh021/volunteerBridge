/// Skill tag widget — small rounded chip with teal background.

import 'package:flutter/material.dart';
import '../utils/constants.dart';

class SkillTag extends StatelessWidget {
  final String skill;

  const SkillTag({super.key, required this.skill});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: accentTeal.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        skill,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: accentTeal,
        ),
      ),
    );
  }
}
