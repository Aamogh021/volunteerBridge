/// Match score chip — circular progress indicator with percentage.

import 'package:flutter/material.dart';
import '../utils/constants.dart';

class MatchScoreChip extends StatelessWidget {
  final double score;
  final int urgencyScore;

  const MatchScoreChip({
    super.key,
    required this.score,
    this.urgencyScore = 5,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (score * 100).round();
    final color = getUrgencyColor(urgencyScore);

    return SizedBox(
      width: 52,
      height: 52,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              value: score,
              strokeWidth: 4,
              backgroundColor: color.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          Text(
            '$percentage%',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
