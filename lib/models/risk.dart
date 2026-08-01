// Climeo — developed by Halool.
//
// Mirrors backend/src/risk/risk.types.ts. If that shape changes, update
// both together.

class RiskMetric {
  final String label;
  final double value;
  final String unit;

  const RiskMetric({required this.label, required this.value, required this.unit});

  factory RiskMetric.fromJson(Map<String, dynamic> json) {
    return RiskMetric(
      label: json['label'] as String,
      value: (json['value'] as num).toDouble(),
      unit: json['unit'] as String,
    );
  }
}

class RiskAssessment {
  final String type; // heat | cold | storm | uv | airQuality
  final String level; // low | moderate | high | severe
  final RiskMetric? metric;
  final List<String> recommendedActions;

  const RiskAssessment({
    required this.type,
    required this.level,
    required this.metric,
    required this.recommendedActions,
  });

  factory RiskAssessment.fromJson(Map<String, dynamic> json) {
    return RiskAssessment(
      type: json['type'] as String,
      level: json['level'] as String,
      metric: json['metric'] != null
          ? RiskMetric.fromJson(json['metric'] as Map<String, dynamic>)
          : null,
      recommendedActions:
          (json['recommendedActions'] as List).map((e) => e as String).toList(),
    );
  }
}

class RiskResponse {
  final double latitude;
  final double longitude;
  final DateTime generatedAt;
  final bool personalized;
  final List<RiskAssessment> risks;

  const RiskResponse({
    required this.latitude,
    required this.longitude,
    required this.generatedAt,
    required this.personalized,
    required this.risks,
  });

  factory RiskResponse.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>;
    return RiskResponse(
      latitude: (location['latitude'] as num).toDouble(),
      longitude: (location['longitude'] as num).toDouble(),
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      personalized: json['personalized'] as bool? ?? false,
      risks: (json['risks'] as List)
          .map((e) => RiskAssessment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
