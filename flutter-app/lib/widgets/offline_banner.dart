/// Offline banner — persistent amber bar shown when the device loses connectivity.
///
/// Automatically slides in/out and shows a "Back Online ✓" confirmation
/// when connectivity returns before hiding.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/connectivity_service.dart';
import '../services/offline_sync_queue.dart';

class OfflineBanner extends ConsumerStatefulWidget {
  const OfflineBanner({super.key});

  @override
  ConsumerState<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends ConsumerState<OfflineBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  bool _wasOffline = false;
  bool _showingReconnected = false;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    _hideTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connectivityAsync = ref.watch(isOnlineProvider);
    final syncQueue = ref.read(offlineSyncQueueProvider);

    return connectivityAsync.when(
      data: (isOnline) {
        if (!isOnline) {
          // Show offline banner
          _wasOffline = true;
          _showingReconnected = false;
          _hideTimer?.cancel();
          _controller.forward();
        } else if (_wasOffline && !_showingReconnected) {
          // Just reconnected — show green "Back Online" briefly
          _showingReconnected = true;
          _controller.forward();

          // Flush the sync queue
          syncQueue.flush();

          _hideTimer?.cancel();
          _hideTimer = Timer(const Duration(seconds: 2), () {
            if (mounted) {
              _controller.reverse().then((_) {
                if (mounted) {
                  setState(() {
                    _wasOffline = false;
                    _showingReconnected = false;
                  });
                }
              });
            }
          });
        } else if (!_wasOffline) {
          // Normal online state — hide
          _controller.reverse();
        }

        if (!_wasOffline && !_showingReconnected) {
          return const SizedBox.shrink();
        }

        return SlideTransition(
          position: _slideAnimation,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _showingReconnected
                  ? const Color(0xFFD1FAE5)
                  : const Color(0xFFFEF3C7),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  _showingReconnected
                      ? Icons.wifi
                      : Icons.wifi_off_rounded,
                  size: 16,
                  color: _showingReconnected
                      ? const Color(0xFF059669)
                      : const Color(0xFFD97706),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _showingReconnected
                        ? 'Back online ✓  Syncing changes...'
                        : 'Offline Mode — changes will sync when connected',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _showingReconnected
                          ? const Color(0xFF059669)
                          : const Color(0xFF92400E),
                    ),
                  ),
                ),
                if (!_showingReconnected && syncQueue.hasPending)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD97706),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      '${syncQueue.pendingCount}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
