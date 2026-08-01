// Climeo — developed by Halool.

import 'package:flutter/material.dart';

/// Shared between main.dart (assigned to MaterialApp.navigatorKey) and
/// notification_providers.dart (used to push a screen when a push
/// notification is tapped, which can happen before any screen's
/// BuildContext exists — e.g. a cold start triggered by the tap itself).
final navigatorKey = GlobalKey<NavigatorState>();
