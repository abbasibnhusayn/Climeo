// Climeo — Know the Weather. Live Better.
// Developed by Halool.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'navigation/app_navigator.dart';
import 'screens/home_screen.dart';
import 'theme/climeo_theme.dart';

void main() {
  runApp(const ProviderScope(child: ClimeoApp()));
}

class ClimeoApp extends StatelessWidget {
  const ClimeoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Climeo',
      debugShowCheckedModeBanner: false,
      theme: ClimeoTheme.light(),
      darkTheme: ClimeoTheme.dark(),
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}
