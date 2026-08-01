// Climeo — developed by Halool.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/location_service.dart';
import '../services/location_exceptions.dart';
import 'weather_providers.dart';

enum LocationStatus {
  resolving,
  resolved,
  serviceDisabled,
  permissionDenied,
  permissionDeniedForever,
  unsupportedPlatform,
  error,
}

final locationServiceProvider = Provider<LocationService>((ref) => LocationService());

final locationStatusProvider = StateProvider<LocationStatus>((ref) => LocationStatus.resolving);

/// Runs once when first watched (app startup). On success, writes the
/// real device coordinates into selectedLocationProvider, which
/// forecastProvider already watches — so the rest of the app updates
/// automatically with no further wiring. On any failure, the app keeps
/// using the existing fallback coordinates and locationStatusProvider
/// tells the UI which specific problem to show (and how to fix it).
///
/// To retry (e.g. after the user grants permission in system Settings
/// and comes back), call `ref.invalidate(locationBootstrapProvider)`.
final locationBootstrapProvider = FutureProvider<void>((ref) async {
  final service = ref.read(locationServiceProvider);
  final statusNotifier = ref.read(locationStatusProvider.notifier);
  statusNotifier.state = LocationStatus.resolving;

  try {
    final position = await service.getCurrentLocation();
    ref.read(selectedLocationProvider.notifier).state = (
      latitude: position.latitude,
      longitude: position.longitude,
      label: 'Current Location',
    );
    statusNotifier.state = LocationStatus.resolved;
  } on LocationServiceDisabledException {
    statusNotifier.state = LocationStatus.serviceDisabled;
  } on LocationPermissionDeniedException {
    statusNotifier.state = LocationStatus.permissionDenied;
  } on LocationPermissionDeniedForeverException {
    statusNotifier.state = LocationStatus.permissionDeniedForever;
  } on LocationUnsupportedPlatformException {
    statusNotifier.state = LocationStatus.unsupportedPlatform;
  } catch (_) {
    statusNotifier.state = LocationStatus.error;
  }
});
