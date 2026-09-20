/// Offline location card — shown in place of Google Maps when offline.
///
/// Displays the task zone name and coordinates as text with a compass icon,
/// allowing the volunteer to still know where to go.

import 'package:flutter/material.dart';
import '../utils/constants.dart';

class OfflineLocationCard extends StatelessWidget {
  final String zone;
  final double? lat;
  final double? lng;

  const OfflineLocationCard({
    super.key,
    required this.zone,
    this.lat,
    this.lng,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 0.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Compass icon
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: brandPrimary.withValues(alpha: 0.1),
            ),
            child: const Icon(Icons.explore_outlined, size: 28, color: brandPrimary),
          ),
          const SizedBox(height: 12),

          // Zone name
          Text(
            zone,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A202C),
            ),
          ),
          const SizedBox(height: 4),

          // Coordinates
          if (lat != null && lng != null)
            Text(
              '${lat!.toStringAsFixed(4)}°N, ${lng!.toStringAsFixed(4)}°E',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF94A3B8),
                fontFamily: 'monospace',
              ),
            ),

          const SizedBox(height: 16),

          // Offline hint
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.wifi_off_rounded, size: 14, color: Color(0xFFD97706)),
                SizedBox(width: 6),
                Text(
                  'Map unavailable offline',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF92400E),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
