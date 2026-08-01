import 'package:dio/dio.dart';
import '../models/weather.dart';

/// Talks to the Climeo backend (Phase 1). Base URL is injected so it can
/// point at localhost in dev and the production API once deployed.
class WeatherApiService {
  final Dio _dio;

  WeatherApiService({required String baseUrl, Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: baseUrl,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
            ));

  Future<ForecastResponse> getForecast({
    required double latitude,
    required double longitude,
    int days = 7,
  }) async {
    final response = await _dio.get(
      '/v1/weather/forecast',
      queryParameters: {
        'lat': latitude,
        'lon': longitude,
        'days': days,
      },
    );
    return ForecastResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CurrentConditions> getCurrent({
    required double latitude,
    required double longitude,
  }) async {
    final response = await _dio.get(
      '/v1/weather/current',
      queryParameters: {
        'lat': latitude,
        'lon': longitude,
      },
    );
    return CurrentConditions.fromJson(response.data as Map<String, dynamic>);
  }
}
