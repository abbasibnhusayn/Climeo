// ==========================================================================
// CLIMEO DESIGN SYSTEM
// Climeo — developed by Halool.
//
// Derived directly from the Climeo brand mark:
//   - The "C" wave/cloud icon: teal → deep blue gradient
//   - Day accent: warm sun gradient (amber/gold)
//   - Night accent: cream moonlight on deep navy
//   - Wordmark: rounded geometric sans, lowercase, wide tagline tracking
//
// This file is the single source of truth for color, type, spacing and
// shape across the Climeo Flutter app. Every screen should theme from
// here rather than hardcoding values.
// ==========================================================================

import 'package:flutter/material.dart';

/// -----------------------------------------------------------------------
/// COLOR TOKENS
/// -----------------------------------------------------------------------
class ClimeoColors {
  ClimeoColors._();

  // Brand gradient — the "C" wave. This is Climeo's signature and should
  // appear on: app icon, splash, primary CTA buttons, active nav states,
  // loading indicators, and hero weather-condition cards.
  static const Color brandTeal = Color(0xFF2DD4BF);
  static const Color brandBlue = Color(0xFF1D4ED8);
  static const Color brandDeepBlue = Color(0xFF1E3A8A);

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandTeal, brandBlue],
  );

  // Day mode accent — sun
  static const Color sunCore = Color(0xFFFBBF24);
  static const Color sunEdge = Color(0xFFF59E0B);
  static const LinearGradient sunGradient = LinearGradient(
    colors: [sunCore, sunEdge],
  );

  // Night mode accent — moon / stars
  static const Color moonlight = Color(0xFFFDE68A);
  static const Color starWhite = Color(0xFFF8FAFC);

  // Surfaces
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceLightAlt = Color(0xFFF6F9FC); // soft cloud-white
  static const Color surfaceDark = Color(0xFF0B1220); // deep navy, not black
  static const Color surfaceDarkAlt = Color(0xFF111A2E);

  // Text
  static const Color inkLight = Color(0xFF0F172A); // near-navy, not pure black
  static const Color inkLightSecondary = Color(0xFF475569);
  static const Color inkDark = Color(0xFFF8FAFC);
  static const Color inkDarkSecondary = Color(0xFFB7C2D0);

  // Semantic / risk colors (used across the risk engine, alerts, scores)
  static const Color riskLow = Color(0xFF22C55E);
  static const Color riskModerate = Color(0xFFFACC15);
  static const Color riskHigh = Color(0xFFF97316);
  static const Color riskSevere = Color(0xFFDC2626);

  // Dynamic weather-condition accents (used for hourly/daily condition
  // cards; each maps to a background treatment, not just an icon tint)
  static const Color condClear = Color(0xFF38BDF8);
  static const Color condCloudy = Color(0xFF94A3B8);
  static const Color condRain = Color(0xFF3B82F6);
  static const Color condStorm = Color(0xFF6366F1);
  static const Color condSnow = Color(0xFFBAE6FD);
  static const Color condFog = Color(0xFFCBD5E1);
}

/// -----------------------------------------------------------------------
/// TYPOGRAPHY
/// Wordmark uses a rounded geometric sans (Poppins/Quicksand family).
/// Body copy uses a highly-legible humanist sans for accessibility across
/// the full age range the product targets (age 4 → senior citizens).
/// -----------------------------------------------------------------------
class ClimeoType {
  ClimeoType._();

  static const String displayFontFamily = 'Poppins'; // wordmark / headlines
  static const String bodyFontFamily = 'Inter'; // body copy, data-dense UI

  static TextTheme textTheme(Color onSurface, Color onSurfaceMuted) {
    return TextTheme(
      // App name / hero temperature
      displayLarge: TextStyle(
        fontFamily: displayFontFamily,
        fontSize: 57,
        fontWeight: FontWeight.w600,
        letterSpacing: -1.0,
        color: onSurface,
      ),
      displayMedium: TextStyle(
        fontFamily: displayFontFamily,
        fontSize: 45,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
        color: onSurface,
      ),
      // Section headers ("Hourly Forecast", "Air Quality")
      headlineMedium: TextStyle(
        fontFamily: displayFontFamily,
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: onSurface,
      ),
      titleLarge: TextStyle(
        fontFamily: displayFontFamily,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: onSurface,
      ),
      // Body copy — briefs, advice text, descriptions
      bodyLarge: TextStyle(
        fontFamily: bodyFontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: onSurface,
      ),
      bodyMedium: TextStyle(
        fontFamily: bodyFontFamily,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: onSurfaceMuted,
      ),
      // Tagline / eyebrow / caption — wide tracking, uppercase, like
      // "KNOW THE WEATHER. LIVE BETTER."
      labelSmall: TextStyle(
        fontFamily: bodyFontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 1.5,
        color: onSurfaceMuted,
      ),
    );
  }
}

/// -----------------------------------------------------------------------
/// SPACING / SHAPE
/// 4pt base grid. Rounded, soft geometry echoing the logo's rounded
/// square container and the wave's continuous curves.
/// -----------------------------------------------------------------------
class ClimeoSpacing {
  ClimeoSpacing._();
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class ClimeoRadii {
  ClimeoRadii._();
  static const double card = 20;
  static const double button = 16;
  static const double sheet = 28;
  static const double chip = 999; // pill
}

/// -----------------------------------------------------------------------
/// THEME DATA
/// -----------------------------------------------------------------------
class ClimeoTheme {
  ClimeoTheme._();

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ClimeoColors.brandBlue,
      brightness: Brightness.light,
      primary: ClimeoColors.brandBlue,
      secondary: ClimeoColors.brandTeal,
      surface: ClimeoColors.surfaceLight,
      error: ClimeoColors.riskSevere,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ClimeoColors.surfaceLightAlt,
      textTheme: ClimeoType.textTheme(
        ClimeoColors.inkLight,
        ClimeoColors.inkLightSecondary,
      ),
      cardTheme: CardTheme(
        color: ClimeoColors.surfaceLight,
        elevation: 3,
        shadowColor: ClimeoColors.brandDeepBlue.withOpacity(0.12),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ClimeoRadii.card),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ClimeoColors.brandBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(
            horizontal: ClimeoSpacing.lg,
            vertical: ClimeoSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ClimeoRadii.button),
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: ClimeoColors.inkLight,
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: ClimeoColors.brandTeal,
      brightness: Brightness.dark,
      primary: ClimeoColors.brandTeal,
      secondary: ClimeoColors.moonlight,
      surface: ClimeoColors.surfaceDark,
      error: ClimeoColors.riskSevere,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ClimeoColors.surfaceDark,
      textTheme: ClimeoType.textTheme(
        ClimeoColors.inkDark,
        ClimeoColors.inkDarkSecondary,
      ),
      cardTheme: CardTheme(
        color: ClimeoColors.surfaceDarkAlt,
        elevation: 3,
        shadowColor: Colors.black.withOpacity(0.4),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ClimeoRadii.card),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ClimeoColors.brandTeal,
          foregroundColor: ClimeoColors.surfaceDark,
          padding: const EdgeInsets.symmetric(
            horizontal: ClimeoSpacing.lg,
            vertical: ClimeoSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ClimeoRadii.button),
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: ClimeoColors.inkDark,
      ),
    );
  }

  /// Dynamic weather theme: call this to tint a screen's accent color
  /// based on live conditions, layered on top of light() or dark().
  static Color conditionAccent(String conditionCode) {
    switch (conditionCode) {
      case 'clear':
        return ClimeoColors.condClear;
      case 'cloudy':
      case 'partly_cloudy':
        return ClimeoColors.condCloudy;
      case 'rain':
      case 'drizzle':
        return ClimeoColors.condRain;
      case 'storm':
      case 'thunderstorm':
        return ClimeoColors.condStorm;
      case 'snow':
        return ClimeoColors.condSnow;
      case 'fog':
      case 'mist':
      case 'haze':
        return ClimeoColors.condFog;
      default:
        return ClimeoColors.brandBlue;
    }
  }

  static Color riskColor(String riskLevel) {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return ClimeoColors.riskLow;
      case 'moderate':
        return ClimeoColors.riskModerate;
      case 'high':
        return ClimeoColors.riskHigh;
      case 'severe':
      case 'extreme':
        return ClimeoColors.riskSevere;
      default:
        return ClimeoColors.riskLow;
    }
  }
}
