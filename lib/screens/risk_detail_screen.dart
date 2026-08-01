// Climeo — developed by Halool.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/risk.dart';
import '../providers/risk_providers.dart';
import '../providers/weather_providers.dart';
import '../theme/climeo_theme.dart';

class RiskDetailScreen extends ConsumerWidget {
  /// Coordinates to show risk for. If null, falls back to the app's
  /// currently selected location — this is how a notification tap
  /// (which only carries riskType/riskLevel, not coordinates, since the
  /// backend already resolved them at send time) still lands somewhere
  /// sensible rather than needing the push payload to carry lat/lon too.
  final double? latitude;
  final double? longitude;

  /// The specific hazard the notification was about, if opened from a
  /// tap — used to visually highlight that card so the user immediately
  /// sees what triggered the alert, not just a generic risk list.
  final String? highlightRiskType;

  const RiskDetailScreen({
    super.key,
    this.latitude,
    this.longitude,
    this.highlightRiskType,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLocation = ref.watch(selectedLocationProvider);
    final lat = latitude ?? selectedLocation?.latitude;
    final lon = longitude ?? selectedLocation?.longitude;

    if (lat == null || lon == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Weather Risk')),
        body: const Center(child: Text('No location set yet.')),
      );
    }

    final riskAsync = ref.watch(riskProvider((latitude: lat, longitude: lon)));

    return Scaffold(
      appBar: AppBar(title: const Text('Weather Risk')),
      body: riskAsync.when(
        data: (response) => _RiskList(
          response: response,
          highlightRiskType: highlightRiskType,
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(ClimeoSpacing.xl),
            child: Text("Couldn't load risk data: $error"),
          ),
        ),
      ),
    );
  }
}

class _RiskList extends StatelessWidget {
  final RiskResponse response;
  final String? highlightRiskType;

  const _RiskList({required this.response, required this.highlightRiskType});

  @override
  Widget build(BuildContext context) {
    if (response.risks.isEmpty) {
      return const Center(child: Text('No elevated risks right now.'));
    }

    // Put the notification's hazard first so it's immediately visible
    // without scrolling, whatever order the API returned the rest in.
    final risks = [...response.risks];
    if (highlightRiskType != null) {
      risks.sort((a, b) {
        if (a.type == highlightRiskType) return -1;
        if (b.type == highlightRiskType) return 1;
        return 0;
      });
    }

    return ListView.separated(
      padding: const EdgeInsets.all(ClimeoSpacing.md),
      itemCount: risks.length,
      separatorBuilder: (_, __) => const SizedBox(height: ClimeoSpacing.sm),
      itemBuilder: (context, index) {
        final risk = risks[index];
        return _RiskCard(
          risk: risk,
          isHighlighted: risk.type == highlightRiskType,
        );
      },
    );
  }
}

class _RiskCard extends StatelessWidget {
  final RiskAssessment risk;
  final bool isHighlighted;

  const _RiskCard({required this.risk, required this.isHighlighted});

  @override
  Widget build(BuildContext context) {
    final color = ClimeoTheme.riskColor(risk.level);

    return Container(
      padding: const EdgeInsets.all(ClimeoSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(ClimeoRadii.card),
        border: isHighlighted ? Border.all(color: color, width: 2) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: ClimeoSpacing.sm),
              Expanded(
                child: Text(
                  _riskTypeLabel(risk.type),
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              Text(
                risk.level.toUpperCase(),
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: color, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          if (risk.metric != null) ...[
            const SizedBox(height: ClimeoSpacing.xs),
            Text(
              '${risk.metric!.label}: ${risk.metric!.value}${risk.metric!.unit}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
          if (risk.recommendedActions.isNotEmpty) ...[
            const SizedBox(height: ClimeoSpacing.sm),
            ...risk.recommendedActions.map(
              (action) => Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• '),
                    Expanded(
                      child: Text(action, style: Theme.of(context).textTheme.bodyMedium),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _riskTypeLabel(String type) {
    switch (type) {
      case 'heat':
        return 'Heat Risk';
      case 'cold':
        return 'Cold Risk';
      case 'storm':
        return 'Storm Risk';
      case 'uv':
        return 'UV Risk';
      case 'airQuality':
        return 'Air Quality Risk';
      default:
        return type;
    }
  }
}
