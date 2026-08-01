// Climeo — developed by Halool.

import 'package:dio/dio.dart';
import '../models/radar_frame.dart';

class RadarApiService {
  final Dio _dio;

  RadarApiService({required String baseUrl, Dio? dio})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl));

  Future<RadarFrameSet> getFrames() async {
    final response = await _dio.get('/v1/maps/radar/frames');
    return RadarFrameSet.fromJson(response.data as Map<String, dynamic>);
  }
}
