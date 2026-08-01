// Climeo — developed by Halool.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/risk.dart';
import '../services/risk_api_service.dart';

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8080',
);

final riskApiServiceProvider = Provider<RiskApiService>((ref) {
  return RiskApiService(baseUrl: _apiBaseUrl);
});

typedef RiskQuery = ({double latitude, double longitude});

final riskProvider = FutureProvider.family<RiskResponse, RiskQuery>((ref, query) async {
  final api = ref.watch(riskApiServiceProvider);
  return api.getRisk(latitude: query.latitude, longitude: query.longitude);
});
