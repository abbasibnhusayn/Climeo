// Climeo — developed by Halool.
//
// Platform support: geolocator has real native implementations for
// Android, iOS, macOS, and Windows. It has no Linux implementation as of
// this build, so Linux is explicitly rejected here with a clear error
// rather than letting a MissingPluginException surface from the plugin
// layer — see LocationUnsupportedPlatformException.

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:geolocator/geolocator.dart';

// Safe inline definitions to avoid duplicate file errors
class LocationServiceDisabledException implements Exception {}
class LocationPermissionDeniedException implements Exception {}
class LocationPermissionDeniedForeverException implements Exception {}
class LocationUnsupportedPlatformException implements Exception {
  final String platform;
  LocationUnsupportedPlatformException(this.platform);
}

class LocationService {
  /// Resolves the device's current GPS position, walking through the
  /// full permission lifecycle.
  Future<Position> getCurrentLocation() async {
    _assertPlatformSupported();

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationServiceDisabledException();
    }

    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw LocationPermissionDeniedException();
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw LocationPermissionDeniedForeverException();
    }

    // permission is now `whileInUse` or `always` — safe to read position.
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 15),
      ),
    );
  }

  /// Opens the OS-level app permission screen — the only recovery path
  /// once permission has been denied "forever".
  Future<void> openAppSettings() => Geolocator.openAppSettings();

  /// Opens the OS-level location services screen (e.g. when GPS/location
  /// is toggled off system-wide, not just for this app).
  Future<void> openLocationSettings() => Geolocator.openLocationSettings();

  void _assertPlatformSupported() {
    if (kIsWeb) return; // geolocator has a web implementation
    if (defaultTargetPlatform == TargetPlatform.linux) {
      throw LocationUnsupportedPlatformException('Linux');
    }
  }
}
