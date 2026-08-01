import 'package:flutter/material.dart';
import '../models/weather.dart';
import '../theme/climeo_theme.dart';
import 'condition_icon.dart';

class CurrentConditionsCard extends StatelessWidget {
  final CurrentConditions current;
  final String locationLabel;

  const CurrentConditionsCard({
    super.key,
    required this.current,
    required this.locationLabel,
  });

  @override
  Widget build(BuildContext context) {
    final visual = conditionVisual(current.condition, isDay: current.isDay);
    final textTheme = Theme.of(context).textTheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(ClimeoSpacing.xl),
      decoration: BoxDecoration(
        gradient: current.isDay
            ? ClimeoColors.brandGradient
            : const LinearGradient(
                colors: [ClimeoColors.surfaceDark, ClimeoColors.brandDeepBlue],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(ClimeoRadii.sheet),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            locationLabel,
            style: textTheme.titleLarge?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: ClimeoSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${current.temperatureC.round()}°',
                style: textTheme.displayLarge?.copyWith(
                  color: Colors.white,
                  fontSize: 72,
                ),
              ),
              const SizedBox(width: ClimeoSpacing.md),
              Padding(
                padding: const EdgeInsets.only(top: ClimeoSpacing.md),
                child: Icon(visual.icon, color: Colors.white, size: 48),
              ),
            ],
          ),
          Text(
            visual.label,
            style: textTheme.bodyLarge?.copyWith(color: Colors.white.withOpacity(0.9)),
          ),
          Text(
            'Feels like ${current.feelsLikeC.round()}°',
            style: textTheme.bodyMedium?.copyWith(color: Colors.white.withOpacity(0.75)),
          ),
          const SizedBox(height: ClimeoSpacing.lg),
          Row(
            children: [
              _StatChip(icon: Icons.air_rounded, label: '${current.windSpeedKph.round()} km/h'),
              const SizedBox(width: ClimeoSpacing.sm),
              _StatChip(icon: Icons.water_rounded, label: '${current.humidityPct.round()}%'),
              const SizedBox(width: ClimeoSpacing.sm),
              _StatChip(icon: Icons.speed_rounded, label: '${current.pressureHpa.round()} hPa'),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.18),
        borderRadius: BorderRadius.circular(ClimeoRadii.chip),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}
