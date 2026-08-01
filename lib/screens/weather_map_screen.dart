// Climeo — developed by Halool.

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart' as latlong;
import '../providers/weather_providers.dart';
import '../theme/climeo_theme.dart';

class WeatherMapScreen extends ConsumerStatefulWidget {
  final double initialLatitude;
  final double initialLongitude;

  const WeatherMapScreen({
    super.key,
    required this.initialLatitude,
    required this.initialLongitude,
  });

  @override
  ConsumerState<WeatherMapScreen> createState() => _WeatherMapScreenState();
}

class _WeatherMapScreenState extends ConsumerState<WeatherMapScreen> {
  bool _showRadar = true;
  double _radarOpacity = 0.7;

  @override
  Widget build(BuildContext context) {
    final framesAsync = ref.watch(radarFramesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Weather Map'),
        actions: [
          IconButton(
            icon: Icon(_showRadar ? Icons.layers : Icons.layers_outlined),
            tooltip: 'Toggle radar layer',
            onPressed: () => setState(() => _showRadar = !_showRadar),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: latlong.LatLng(
                widget.initialLatitude,
                widget.initialLongitude,
              ),
              initialZoom: 7,
              minZoom: 2,
              maxZoom: 12, // RainViewer tiles are only generated up to z12
            ),
            children: [
              // Base map — OpenStreetMap raster tiles. Attribution below
              // is required by OSM's tile usage policy.
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'app.climeo',
              ),
              if (_showRadar)
                framesAsync.when(
                  data: (frameSet) {
                    final frame = frameSet.latest;
                    if (frame == null) return const SizedBox.shrink();
                    return Opacity(
                      opacity: _radarOpacity,
                      child: TileLayer(
                        urlTemplate:
                            '${frameSet.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png',
                        userAgentPackageName: 'app.climeo',
                      ),
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
            ],
          ),
          Positioned(
            left: ClimeoSpacing.sm,
            bottom: ClimeoSpacing.sm,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                '© OpenStreetMap contributors · Radar: RainViewer',
                style: TextStyle(color: Colors.white, fontSize: 10),
              ),
            ),
          ),
          if (_showRadar)
            Positioned(
              right: ClimeoSpacing.md,
              bottom: ClimeoSpacing.xl + ClimeoSpacing.md,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ClimeoSpacing.sm,
                  vertical: ClimeoSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(ClimeoRadii.chip),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.opacity_rounded, size: 16),
                    SizedBox(
                      width: 100,
                      child: Slider(
                        value: _radarOpacity,
                        onChanged: (v) => setState(() => _radarOpacity = v),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          framesAsync.maybeWhen(
            error: (error, _) => Positioned(
              top: ClimeoSpacing.md,
              left: ClimeoSpacing.md,
              right: ClimeoSpacing.md,
              child: _RadarErrorBanner(message: error.toString()),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _RadarErrorBanner extends StatelessWidget {
  final String message;

  const _RadarErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(ClimeoSpacing.sm),
      decoration: BoxDecoration(
        color: ClimeoColors.riskHigh.withOpacity(0.9),
        borderRadius: BorderRadius.circular(ClimeoRadii.card),
      ),
      child: const Text(
        "Radar layer couldn't load — showing base map only.",
        style: TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  }
}
