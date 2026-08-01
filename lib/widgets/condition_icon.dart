import 'package:flutter/material.dart';
import '../models/weather.dart';
import '../theme/climeo_theme.dart';

class ConditionVisual {
  final IconData icon;
  final String label;
  final Color accent;

  const ConditionVisual(this.icon, this.label, this.accent);
}

ConditionVisual conditionVisual(ConditionCode condition, {bool isDay = true}) {
  switch (condition) {
    case ConditionCode.clear:
      return ConditionVisual(
        isDay ? Icons.wb_sunny_rounded : Icons.nightlight_round,
        isDay ? 'Clear' : 'Clear night',
        ClimeoColors.condClear,
      );
    case ConditionCode.partlyCloudy:
      return const ConditionVisual(
        Icons.wb_cloudy_rounded,
        'Partly cloudy',
        ClimeoColors.condCloudy,
      );
    case ConditionCode.cloudy:
      return const ConditionVisual(
        Icons.cloud_rounded,
        'Cloudy',
        ClimeoColors.condCloudy,
      );
    case ConditionCode.fog:
      return const ConditionVisual(
        Icons.foggy,
        'Fog',
        ClimeoColors.condFog,
      );
    case ConditionCode.drizzle:
      return const ConditionVisual(
        Icons.grain_rounded,
        'Drizzle',
        ClimeoColors.condRain,
      );
    case ConditionCode.rain:
      return const ConditionVisual(
        Icons.water_drop_rounded,
        'Rain',
        ClimeoColors.condRain,
      );
    case ConditionCode.snow:
      return const ConditionVisual(
        Icons.ac_unit_rounded,
        'Snow',
        ClimeoColors.condSnow,
      );
    case ConditionCode.thunderstorm:
      return const ConditionVisual(
        Icons.thunderstorm_rounded,
        'Storm',
        ClimeoColors.condStorm,
      );
    case ConditionCode.unknown:
      return const ConditionVisual(
        Icons.help_outline_rounded,
        'Unknown',
        ClimeoColors.brandBlue,
      );
  }
}
