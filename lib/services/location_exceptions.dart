// Climeo — developed by Halool.

/// Device location services (GPS/Wi-Fi positioning) are turned off at the
/// OS level — this is different from app permission being denied.
class LocationServiceDisabledException implements Exception {
  const LocationServiceDisabledException();
}

/// The user has not yet granted permission, or explicitly denied it once
/// (but can still be re-prompted).
class LocationPermissionDeniedException implements Exception {
  const LocationPermissionDeniedException();
}

/// The user denied permission "forever" (Android) / selected "Never"
/// (iOS) — the OS will no longer show the in-app prompt; the only way
/// forward is the system Settings app.
class LocationPermissionDeniedForeverException implements Exception {
  const LocationPermissionDeniedForeverException();
}

/// Raised on platforms geolocator doesn't support rather than letting an
/// opaque plugin error surface. As of this build, that's Linux desktop —
/// the geolocator plugin has no Linux implementation.
class LocationUnsupportedPlatformException implements Exception {
  final String platformName;
  const LocationUnsupportedPlatformException(this.platformName);
}
