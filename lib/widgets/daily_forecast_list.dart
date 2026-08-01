import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/weather.dart';
import '../theme/climeo_theme.dart';
import 'condition_icon.dart';

class DailyForecastList extends StatelessWidget {
  final List<DailyForecastPoint> daily;

  const DailyForecastList({super.key, required this.daily});

  @override
  Widget build(BuildContext context) {
    final dayFormat = DateFormat.E();
    final maxOfMax = daily.map((d) => d.temperatureMaxC).reduce((a, b) => a > b ? a : b);
    final minOfMin = daily.map((d) => d.temperatureMinC).reduce((a, b) => a < b ? a : b);
    final range = (maxOfMax - minOfMin).clamp(1, double.infinity);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: ClimeoSpacing.md),
      padding: const EdgeInsets.symmetric(vertical: ClimeoSpacing.sm),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(ClimeoRadii.card),
      ),
      child: Column(
        children: daily.map((day) {
          final visual = conditionVisual(day.condition);
          final startFraction = (day.temperatureMinC - minOfMin) / range;
          final widthFraction = (day.temperatureMaxC - day.temperatureMinC) / range;

          return Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: ClimeoSpacing.md,
              vertical: ClimeoSpacing.sm,
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 48,
                  child: Text(
                    dayFormat.format(day.date),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ),
                Icon(visual.icon, color: visual.accent, size: 20),
                const SizedBox(width: ClimeoSpacing.sm),
                SizedBox(
                  width: 32,
                  child: Text(
                    '${day.temperatureMinC.round()}°',
                    textAlign: TextAlign.right,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                const SizedBox(width: ClimeoSpacing.sm),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return Stack(
                        children: [
                          Container(
                            height: 4,
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          Positioned(
                            left: constraints.maxWidth * startFraction.clamp(0, 1),
                            child: Container(
                              width: (constraints.maxWidth * widthFraction)
                                  .clamp(4, constraints.maxWidth),
                              height: 4,
                              decoration: BoxDecoration(
                                gradient: ClimeoColors.brandGradient,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                const SizedBox(width: ClimeoSpacing.sm),
                SizedBox(
                  width: 32,
                  child: Text(
                    '${day.temperatureMaxC.round()}°',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
