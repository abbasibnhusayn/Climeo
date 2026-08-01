// Climeo — developed by Halool.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/location_providers.dart';
import '../providers/notification_providers.dart';
import '../providers/weather_providers.dart';
import '../theme/climeo_theme.dart';
import '../widgets/current_conditions_card.dart';
import '../widgets/daily_forecast_list.dart';
import '../widgets/hourly_forecast_strip.dart';
import '../widgets/location_status_banner.dart';
import '../widgets/manual_location_dialog.dart';
import 'risk_detail_screen.dart';
import 'weather_map_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Triggers the device location lookup once on first build. Riverpod
    // caches the FutureProvider, so this is a no-op on subsequent
    // rebuilds — actual re-resolution only happens via
    // ref.invalidate(locationBootstrapProvider), which the status banner
    // calls on "Try Again".
    ref.watch(locationBootstrapProvider);
    ref.watch(notificationBootstrapProvider);
    ref.watch(homeWidgetSyncProvider);

    final forecastAsync = ref.watch(forecastProvider);
    final location = ref.watch(selectedLocationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Climeo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_location_alt_rounded),
            tooltip: 'Set Location Manually',
            onPressed: () => _showManualLocationDialog(context, ref),
          ),
          IconButton(
            icon: const Icon(Icons.warning_amber_rounded),
            tooltip: 'Weather Risk',
            onPressed: forecastAsync.maybeWhen(
              data: (forecast) => () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => RiskDetailScreen(
                        latitude: forecast.latitude,
                        longitude: forecast.longitude,
                      ),
                    ),
                  ),
              orElse: () => null,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.map_rounded),
            tooltip: 'Weather Map',
            onPressed: forecastAsync.maybeWhen(
              data: (forecast) => () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => WeatherMapScreen(
                        initialLatitude: forecast.latitude,
                        initialLongitude: forecast.longitude,
                      ),
                    ),
                  ),
              orElse: () => null,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const LocationStatusBanner(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => ref.refresh(forecastProvider.future),
                child: forecastAsync.when(
                  data: (forecast) => ListView(
                    padding: const EdgeInsets.symmetric(vertical: ClimeoSpacing.md),
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: ClimeoSpacing.md),
                        child: CurrentConditionsCard(
                          current: forecast.current,
                          locationLabel: location?.label ?? 'Current Location',
                        ),
                      ),
                      const SizedBox(height: ClimeoSpacing.lg),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: ClimeoSpacing.md),
                        child: Text('Hourly Forecast', style: Theme.of(context).textTheme.headlineMedium),
                      ),
                      const SizedBox(height: ClimeoSpacing.sm),
                      HourlyForecastStrip(hourly: forecast.hourly),
                      const SizedBox(height: ClimeoSpacing.lg),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: ClimeoSpacing.md),
                        child: Text('7-Day Forecast', style: Theme.of(context).textTheme.headlineMedium),
                      ),
                      const SizedBox(height: ClimeoSpacing.sm),
                      DailyForecastList(daily: forecast.daily),
                      const SizedBox(height: ClimeoSpacing.xxl),
                    ],
                  ),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, stack) => _ErrorState(
                    message: error.toString(),
                    onRetry: () => ref.invalidate(forecastProvider),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showManualLocationDialog(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<({double latitude, double longitude, String label})>(
      context: context,
      builder: (_) => const ManualLocationDialog(),
    );

    if (result != null) {
      ref.read(selectedLocationProvider.notifier).state = result;
      ref.read(locationStatusProvider.notifier).state = LocationStatus.resolved;
    }
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ClimeoSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: ClimeoColors.inkLightSecondary),
            const SizedBox(height: ClimeoSpacing.md),
            Text(
              "Couldn't load the forecast",
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: ClimeoSpacing.sm),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: ClimeoSpacing.lg),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
