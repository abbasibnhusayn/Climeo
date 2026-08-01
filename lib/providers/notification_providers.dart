// Climeo — developed by Halool.

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../navigation/app_navigator.dart';
import '../screens/risk_detail_screen.dart';
import '../services/push_notification_service.dart';
import '../services/notification_api_service.dart';
import 'weather_providers.dart';

enum NotificationStatus {
  resolving,
  ready,
  permissionDenied,
  firebaseNotConfigured,
  unsupportedPlatform,
  error,
}

const _apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:8080',
);

final pushNotificationServiceProvider = Provider<PushNotificationService>(
  (ref) => PushNotificationService(),
);

final notificationApiServiceProvider = Provider<NotificationApiService>(
  (ref) => NotificationApiService(baseUrl: _apiBaseUrl),
);

final notificationStatusProvider = StateProvider<NotificationStatus>(
  (ref) => NotificationStatus.resolving,
);

/// Runs once when first watched. Firebase project config
/// (google-services.json / GoogleService-Info.plist) must already be in
/// place via `flutterfire configure` — see DEPLOYMENT.md §10. If it's
/// missing, Firebase.initializeApp() throws and this sets
/// `firebaseNotConfigured` rather than crashing the app; every other
/// feature keeps working without push notifications.
final notificationBootstrapProvider = FutureProvider<void>((ref) async {
  final statusNotifier = ref.read(notificationStatusProvider.notifier);
  statusNotifier.state = NotificationStatus.resolving;

  final pushService = ref.read(pushNotificationServiceProvider);
  final apiService = ref.read(notificationApiServiceProvider);

  try {
    await Firebase.initializeApp();
  } catch (e) {
    if (kDebugMode) {
      debugPrint('Firebase not configured — push notifications disabled. $e');
    }
    statusNotifier.state = NotificationStatus.firebaseNotConfigured;
    return;
  }

  final String platform;
  try {
    platform = pushService.platformName;
  } on UnsupportedError {
    statusNotifier.state = NotificationStatus.unsupportedPlatform;
    return;
  }

  try {
    final token = await pushService.requestPermissionAndGetToken();
    if (token == null) {
      statusNotifier.state = NotificationStatus.permissionDenied;
      return;
    }

    final location = ref.read(selectedLocationProvider);
    await apiService.registerToken(
      token: token,
      platform: platform,
      latitude: location?.latitude,
      longitude: location?.longitude,
    );

    // Token rotates periodically — re-register whenever it does, using
    // whatever location is current at that moment.
    pushService.onTokenRefresh.listen((newToken) {
      final currentLocation = ref.read(selectedLocationProvider);
      apiService.registerToken(
        token: newToken,
        platform: platform,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      );
    });

    // FCM never displays a banner for foreground messages on its own —
    // this is the standard pattern to make severe weather alerts visible
    // while the app is open, not just backgrounded.
    FirebaseMessaging.onMessage.listen((message) {
      pushService.showForegroundNotification(message);
    });

    // Tapping a notification while the app is backgrounded (not
    // terminated) fires this. The push payload carries riskType/riskLevel
    // (set in backend/src/notifications/alertMessage.ts) — no coordinates,
    // since RiskDetailScreen falls back to the app's currently selected
    // location, which is the same location the alert was computed for.
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Tapping a notification that launched the app from a fully
    // terminated state doesn't fire onMessageOpenedApp — this is the
    // separate cold-start path FCM requires for that case.
    final initialMessage = await pushService.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    statusNotifier.state = NotificationStatus.ready;
  } catch (_) {
    statusNotifier.state = NotificationStatus.error;
  }
});

void _handleNotificationTap(RemoteMessage message) {
  final riskType = message.data['riskType'];
  if (riskType == null) return;

  // The navigator may not be mounted yet (cold start races the first
  // frame) — defer to after the current frame rather than dropping the
  // navigation silently.
  WidgetsBinding.instance.addPostFrameCallback((_) {
    navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (_) => RiskDetailScreen(highlightRiskType: riskType),
      ),
    );
  });
}
