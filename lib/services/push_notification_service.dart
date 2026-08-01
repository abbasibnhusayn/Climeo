// Climeo — developed by Halool.
//
// Requires a real Firebase project wired up via `flutterfire configure`
// (see DEPLOYMENT.md §10) — this file has no fabricated project config.
// Without that step, Firebase.initializeApp() throws, which
// notification_providers.dart catches and treats as "notifications
// unavailable" rather than crashing the app.

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _localNotificationsInitialized = false;

  /// Backend expects one of: android, ios, macos, windows, web.
  /// Linux isn't in that list — FCM itself has no Linux SDK, independent
  /// of the GPS/geolocator gap noted elsewhere.
  String get platformName {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'android';
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.macOS:
        return 'macos';
      case TargetPlatform.windows:
        return 'windows';
      default:
        throw UnsupportedError('Push notifications are not supported on this platform.');
    }
  }

  /// Requests OS-level notification permission and returns the FCM
  /// registration token, or null if permission was denied. Throws if
  /// Firebase isn't configured for this platform (see file header).
  Future<String?> requestPermissionAndGetToken() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return null;
    }

    await _initLocalNotifications();
    return _messaging.getToken();
  }

  /// Fires whenever FCM rotates the token (happens periodically and on
  /// reinstall) — callers should re-register with the backend each time.
  Stream<String> get onTokenRefresh => _messaging.onTokenRefresh;

  /// The notification that launched the app from a fully terminated
  /// state, if any — null on a normal launch. This is the only way to
  /// detect a cold-start notification tap; onMessageOpenedApp does not
  /// fire for it.
  Future<RemoteMessage?> getInitialMessage() => _messaging.getInitialMessage();

  /// Shows a local notification while the app is in the foreground — FCM
  /// does not display foreground notifications automatically on any
  /// platform, this is the standard pattern to make that visible.
  Future<void> showForegroundNotification(RemoteMessage message) async {
    await _initLocalNotifications();

    final notification = message.notification;
    if (notification == null) return;

    const androidDetails = AndroidNotificationDetails(
      'severe_weather_alerts',
      'Severe Weather Alerts',
      channelDescription: 'High and severe risk weather alerts for your location',
      importance: Importance.high,
      priority: Priority.high,
    );
    const darwinDetails = DarwinNotificationDetails();

    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(android: androidDetails, iOS: darwinDetails, macOS: darwinDetails),
    );
  }

  Future<void> _initLocalNotifications() async {
    if (_localNotificationsInitialized) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinInit = DarwinInitializationSettings();
    const settings = InitializationSettings(
      android: androidInit,
      iOS: darwinInit,
      macOS: darwinInit,
    );

    await _localNotifications.initialize(settings);
    _localNotificationsInitialized = true;
  }
}
