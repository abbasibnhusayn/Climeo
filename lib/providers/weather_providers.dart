// Climeo — developed by Halool.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/weather.dart';
import '../models/radar_frame.dart';
import '../services/weather_api_service.dart';
import '../services/radar_api_service.dart';
import '../services/home_widget_service.dart';

/// Change this via --dart-define=API_BASE_URL=... at build time; defaults
/// to local dev backend from Phase 1.
const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8080',
);

final weatherApiServiceProvider = Provider<WeatherApiService>((ref) {
  return WeatherApiService(baseUrl: _apiBaseUrl);
});

final radarApiServiceProvider = Provider<RadarApiService>((ref) {
  return RadarApiService(baseUrl: _apiBaseUrl);
});

final radarFramesProvider = FutureProvider<RadarFrameSet>((ref) async {
  final api = ref.watch(radarApiServiceProvider);
  return api.getFrames();
});

/// Currently selected location. Defaults to null until the app resolves
/// device GPS or the user picks a saved location (Phase 4).
final selectedLocationProvider =
    StateProvider<({double latitude, double longitude, String label})?>(
  (ref) => null,
);

final forecastProvider = FutureProvider<ForecastResponse>((ref) async {
  final location = ref.watch(selectedLocationProvider);
  final api = ref.watch(weatherApiServiceProvider);

  // Fallback location so the home screen has something to render before
  // location permissions / saved locations (Phase 4) are wired up.
  final lat = location?.latitude ?? 33.6844;
  final lon = location?.longitude ?? 73.0479;

  return api.getForecast(latitude: lat, longitude: lon, days: 7);
});

final homeWidgetServiceProvider = Provider<HomeWidgetService>((ref) => HomeWidgetService());

/// Watching this anywhere (home_screen.dart does, once) activates a
/// listener that pushes every successful forecast update into the native
/// home screen widget — no polling, no separate fetch, it rides on the
/// same data the app screen itself just displayed.
final homeWidgetSyncProvider = Provider<void>((ref) {
  ref.listen<AsyncValue<ForecastResponse>>(forecastProvider, (previous, next) {
    next.whenData((forecast) {
      final location = ref.read(selectedLocationProvider);
      ref.read(homeWidgetServiceProvider).updateFromForecast(
            current: forecast.current,
            locationLabel: location?.label ?? 'Current Location',
          );
    });
  });
});
