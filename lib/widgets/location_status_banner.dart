// Climeo — developed by Halool.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/location_providers.dart';
import '../providers/weather_providers.dart';
import '../theme/climeo_theme.dart';
import 'manual_location_dialog.dart';

class LocationStatusBanner extends ConsumerWidget {
  const LocationStatusBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(locationStatusProvider);
    final service = ref.watch(locationServiceProvider);

    // Nothing to show once resolved — the banner should get out of the
    // way as soon as real location is in use.
    if (status == LocationStatus.resolved || status == LocationStatus.resolving) {
      return const SizedBox.shrink();
    }

    final (String message, Widget action) = switch (status) {
      LocationStatus.serviceDisabled => (
          'Location services are turned off on this device.',
          _BannerButton(
            label: 'Open Settings',
            onPressed: () => service.openLocationSettings(),
          ),
        ),
      LocationStatus.permissionDenied => (
          "Climeo doesn't have permission to use your location yet.",
          _BannerButton(
            label: 'Try Again',
            onPressed: () => ref.invalidate(locationBootstrapProvider),
          ),
        ),
      LocationStatus.permissionDeniedForever => (
          'Location permission was denied. Enable it in system settings to get local weather automatically.',
          _BannerButton(
            label: 'Open Settings',
            onPressed: () => service.openAppSettings(),
          ),
        ),
      LocationStatus.unsupportedPlatform => (
          "Automatic location isn't available on this platform yet — set a location manually.",
          _BannerButton(
            label: 'Set Location',
            onPressed: () => _showManualLocationDialog(context, ref),
          ),
        ),
      LocationStatus.error => (
          "Couldn't determine your location.",
          _BannerButton(
            label: 'Try Again',
            onPressed: () => ref.invalidate(locationBootstrapProvider),
          ),
        ),
      LocationStatus.resolved || LocationStatus.resolving => ('', const SizedBox.shrink()),
    };

    return Container(
      margin: const EdgeInsets.fromLTRB(
        ClimeoSpacing.md,
        ClimeoSpacing.md,
        ClimeoSpacing.md,
        0,
      ),
      padding: const EdgeInsets.all(ClimeoSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(ClimeoRadii.card),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_off_rounded, size: 20),
          const SizedBox(width: ClimeoSpacing.sm),
          Expanded(
            child: Text(message, style: Theme.of(context).textTheme.bodyMedium),
          ),
          const SizedBox(width: ClimeoSpacing.sm),
          action,
        ],
      ),
    );
  }

  Future<void> _showManualLocationDialog(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<({double latitude, double longitude, String label})>(
      context: context,
      builder: (_) => const ManualLocationDialog(),
    );

    if (result != null) {
      ref.read(selectedLocationProvider.notifier).state = result;
      ref.read(locationStatusProvider.notifier).state = LocationStatus.resolved;
    }
  }
}

class _BannerButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const _BannerButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return TextButton(onPressed: onPressed, child: Text(label));
  }
}
