// Mirrors backend/src/types/weather.types.ts exactly. If the backend's
// normalized shape changes, update both together.

enum ConditionCode {
  clear,
  partlyCloudy,
  cloudy,
  fog,
  drizzle,
  rain,
  snow,
  thunderstorm,
  unknown;

  static ConditionCode fromApi(String value) {
    switch (value) {
      case 'clear':
        return ConditionCode.clear;
      case 'partly_cloudy':
        return ConditionCode.partlyCloudy;
      case 'cloudy':
        return ConditionCode.cloudy;
      case 'fog':
        return ConditionCode.fog;
      case 'drizzle':
        return ConditionCode.drizzle;
      case 'rain':
        return ConditionCode.rain;
      case 'snow':
        return ConditionCode.snow;
      case 'thunderstorm':
        return ConditionCode.thunderstorm;
      default:
        return ConditionCode.unknown;
    }
  }
}

class CurrentConditions {
  final DateTime observedAt;
  final double temperatureC;
  final double feelsLikeC;
  final double humidityPct;
  final double windSpeedKph;
  final double windDirectionDeg;
  final double pressureHpa;
  final double? visibilityKm;
  final double? uvIndex;
  final ConditionCode condition;
  final bool isDay;

  const CurrentConditions({
    required this.observedAt,
    required this.temperatureC,
    required this.feelsLikeC,
    required this.humidityPct,
    required this.windSpeedKph,
    required this.windDirectionDeg,
    required this.pressureHpa,
    required this.visibilityKm,
    required this.uvIndex,
    required this.condition,
    required this.isDay,
  });

  factory CurrentConditions.fromJson(Map<String, dynamic> json) {
    return CurrentConditions(
      observedAt: DateTime.parse(json['observedAt'] as String),
      temperatureC: (json['temperatureC'] as num).toDouble(),
      feelsLikeC: (json['feelsLikeC'] as num).toDouble(),
      humidityPct: (json['humidityPct'] as num).toDouble(),
      windSpeedKph: (json['windSpeedKph'] as num).toDouble(),
      windDirectionDeg: (json['windDirectionDeg'] as num).toDouble(),
      pressureHpa: (json['pressureHpa'] as num).toDouble(),
      visibilityKm: (json['visibilityKm'] as num?)?.toDouble(),
      uvIndex: (json['uvIndex'] as num?)?.toDouble(),
      condition: ConditionCode.fromApi(json['condition'] as String),
      isDay: json['isDay'] as bool,
    );
  }
}

class HourlyForecastPoint {
  final DateTime time;
  final double temperatureC;
  final double precipitationProbabilityPct;
  final double precipitationMm;
  final double windSpeedKph;
  final ConditionCode condition;

  const HourlyForecastPoint({
    required this.time,
    required this.temperatureC,
    required this.precipitationProbabilityPct,
    required this.precipitationMm,
    required this.windSpeedKph,
    required this.condition,
  });

  factory HourlyForecastPoint.fromJson(Map<String, dynamic> json) {
    return HourlyForecastPoint(
      time: DateTime.parse(json['time'] as String),
      temperatureC: (json['temperatureC'] as num).toDouble(),
      precipitationProbabilityPct:
          (json['precipitationProbabilityPct'] as num).toDouble(),
      precipitationMm: (json['precipitationMm'] as num).toDouble(),
      windSpeedKph: (json['windSpeedKph'] as num).toDouble(),
      condition: ConditionCode.fromApi(json['condition'] as String),
    );
  }
}

class DailyForecastPoint {
  final DateTime date;
  final double temperatureMinC;
  final double temperatureMaxC;
  final double precipitationProbabilityPct;
  final double precipitationSumMm;
  final DateTime sunrise;
  final DateTime sunset;
  final ConditionCode condition;

  const DailyForecastPoint({
    required this.date,
    required this.temperatureMinC,
    required this.temperatureMaxC,
    required this.precipitationProbabilityPct,
    required this.precipitationSumMm,
    required this.sunrise,
    required this.sunset,
    required this.condition,
  });

  factory DailyForecastPoint.fromJson(Map<String, dynamic> json) {
    return DailyForecastPoint(
      date: DateTime.parse(json['date'] as String),
      temperatureMinC: (json['temperatureMinC'] as num).toDouble(),
      temperatureMaxC: (json['temperatureMaxC'] as num).toDouble(),
      precipitationProbabilityPct:
          (json['precipitationProbabilityPct'] as num).toDouble(),
      precipitationSumMm: (json['precipitationSumMm'] as num).toDouble(),
      sunrise: DateTime.parse(json['sunrise'] as String),
      sunset: DateTime.parse(json['sunset'] as String),
      condition: ConditionCode.fromApi(json['condition'] as String),
    );
  }
}

class ForecastResponse {
  final double latitude;
  final double longitude;
  final String provider;
  final DateTime generatedAt;
  final CurrentConditions current;
  final List<HourlyForecastPoint> hourly;
  final List<DailyForecastPoint> daily;

  const ForecastResponse({
    required this.latitude,
    required this.longitude,
    required this.provider,
    required this.generatedAt,
    required this.current,
    required this.hourly,
    required this.daily,
  });

  factory ForecastResponse.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>;
    return ForecastResponse(
      latitude: (location['latitude'] as num).toDouble(),
      longitude: (location['longitude'] as num).toDouble(),
      provider: json['provider'] as String,
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      current: CurrentConditions.fromJson(json['current'] as Map<String, dynamic>),
      hourly: (json['hourly'] as List)
          .map((e) => HourlyForecastPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      daily: (json['daily'] as List)
          .map((e) => DailyForecastPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
