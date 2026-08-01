// Climeo — developed by Halool.

import 'package:dio/dio.dart';

class NotificationApiService {
  final Dio _dio;

  NotificationApiService({required String baseUrl, Dio? dio})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl));

  Future<void> registerToken({
    required String token,
    required String platform,
    double? latitude,
    double? longitude,
    String? authToken,
  }) async {
    await _dio.post(
      '/v1/notifications/register-token',
      data: {
        'token': token,
        'platform': platform,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
      },
      options: Options(
        headers: authToken != null ? {'Authorization': 'Bearer $authToken'} : null,
      ),
    );
  }

  Future<void> unregisterToken(String token) async {
    await _dio.delete('/v1/notifications/register-token', data: {'token': token});
  }
}
