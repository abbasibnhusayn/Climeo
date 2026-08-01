// Climeo — developed by Halool.
//
// Android-only for now: home_widget also supports iOS, but an iOS home
// screen widget additionally requires a WidgetKit extension target added
// in Xcode (a GUI-only step — Xcode project files can't be safely
// hand-authored for a new target). See DEPLOYMENT.md for the Swift
// source and exact manual steps. Calling these methods on iOS without
// that extension is harmless (home_widget just has nothing to render
// into) but won't show anything on the home screen.

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:home_widget/home_widget.dart';
import 'package:intl/intl.dart';
import '../models/weather.dart';

class HomeWidgetService {
  /// Must match the App Group configured in the iOS widget extension
  /// (see DEPLOYMENT.md) — harmless no-op on Android.
  static const _iosAppGroupId = 'group.app.halool.climeo';

  bool get isSupported {
    if (kIsWeb) return false;
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  Future<void> updateFromForecast({
    required CurrentConditions current,
    required String locationLabel,
  }) async {
    if (!isSupported) return;

    await HomeWidget.setAppGroupId(_iosAppGroupId);

    await HomeWidget.saveWidgetData<String>('location_label', locationLabel);
    await HomeWidget.saveWidgetData<String>(
      'temperature',
      '${current.temperatureC.round()}°',
    );
    await HomeWidget.saveWidgetData<String>('condition', _conditionLabel(current));
    await HomeWidget.saveWidgetData<String>(
      'updated_at',
      'Updated ${DateFormat.jm().format(DateTime.now())}',
    );

    // Android: triggers ClimeoWidgetProvider.onUpdate immediately rather
    // than waiting for the next scheduled updatePeriodMillis tick.
    // iOS: reloads the WidgetKit timeline, once the extension exists.
    await HomeWidget.updateWidget(
      androidName: 'ClimeoWidgetProvider',
      iOSName: 'ClimeoWidget',
    );
  }

  String _conditionLabel(CurrentConditions current) {
    final label = current.condition.name
        .replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m.group(1)}')
        .trim();
    final capitalized = label[0].toUpperCase() + label.substring(1).toLowerCase();
    return current.isDay ? capitalized : '$capitalized · Night';
  }
}
