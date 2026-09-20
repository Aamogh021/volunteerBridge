/// Urgency badge pill widget.

import 'package:flutter/material.dart';
import '../utils/constants.dart';

class UrgencyBadge extends StatelessWidget {
  final int urgencyScore;

  const UrgencyBadge({super.key, required this.urgencyScore});

  @override
  Widget build(BuildContext context) {
    final color = getUrgencyColor(urgencyScore);
    final label = getUrgencyLabel(urgencyScore);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
