import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/weather.dart';
import '../theme/climeo_theme.dart';
import 'condition_icon.dart';

class HourlyForecastStrip extends StatelessWidget {
  final List<HourlyForecastPoint> hourly;

  const HourlyForecastStrip({super.key, required this.hourly});

  @override
  Widget build(BuildContext context) {
    final next24 = hourly.take(24).toList();
    final timeFormat = DateFormat.j();

    return SizedBox(
      height: 118,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: ClimeoSpacing.md),
        itemCount: next24.length,
        separatorBuilder: (_, __) => const SizedBox(width: ClimeoSpacing.sm),
        itemBuilder: (context, index) {
          final point = next24[index];
          final visual = conditionVisual(point.condition);

          return Container(
            width: 64,
            padding: const EdgeInsets.symmetric(vertical: ClimeoSpacing.sm),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(ClimeoRadii.card),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Text(
                  index == 0 ? 'Now' : timeFormat.format(point.time),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Icon(visual.icon, color: visual.accent, size: 22),
                Text(
                  '${point.temperatureC.round()}°',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
                ),
                if (point.precipitationProbabilityPct > 0)
                  Text(
                    '${point.precipitationProbabilityPct.round()}%',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: ClimeoColors.condRain, fontSize: 11),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
