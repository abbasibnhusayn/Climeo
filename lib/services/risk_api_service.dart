// Climeo — developed by Halool.

import 'package:dio/dio.dart';
import '../models/risk.dart';

class RiskApiService {
  final Dio _dio;

  RiskApiService({required String baseUrl, Dio? dio})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl));

  Future<RiskResponse> getRisk({
    required double latitude,
    required double longitude,
    String? authToken,
  }) async {
    final response = await _dio.get(
      '/v1/weather/risk',
      queryParameters: {'lat': latitude, 'lon': longitude},
      options: Options(
        headers: authToken != null ? {'Authorization': 'Bearer $authToken'} : null,
      ),
    );
    return RiskResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
