import 'dart:async';

class WeatherService {
  /// Bypasses the missing server completely and forces the application
  /// to instantly load clean local data structures.
  Future<Map<String, dynamic>> getWeatherForecast(double lat, double lon) async {
    // Delays for 1 second to mimic a realistic server loader ring
    await Future.delayed(const Duration(seconds: 1));

    // Delays an exact structured Map table your app requires to draw the dashboard
    return {
      "current": {
        "temp": 24.5,
        "feels_like": 25.0,
        "humidity": 62,
        "wind_speed": 4.1,
        "condition": "Sunny",
        "icon": "01d",
        "description": "Clear skies and beautiful sunshine"
      },
      "location": {
        "name": "Your Current Location",
        "country": "GPS Locked"
      },
      "hourly": [
        {"time": "12:00 PM", "temp": 24.5, "condition": "Sunny"},
        {"time": "1:00 PM", "temp": 25.1, "condition": "Sunny"},
        {"time": "2:00 PM", "temp": 25.3, "condition": "Sunny"},
        {"time": "3:00 PM", "temp": 24.8, "condition": "Clear"},
        {"time": "4:00 PM", "temp": 23.9, "condition": "Clear"}
      ],
      "daily": [
        {"day": "Today", "temp_max": 26.0, "temp_min": 18.0, "condition": "Sunny"},
        {"day": "Tomorrow", "temp_max": 25.5, "temp_min": 17.5, "condition": "Partly Cloudy"},
        {"day": "Wednesday", "temp_max": 27.2, "temp_min": 19.0, "condition": "Clear"},
        {"day": "Thursday", "temp_max": 24.0, "temp_min": 16.5, "condition": "Light Rain"},
        {"day": "Friday", "temp_max": 26.5, "temp_min": 18.2, "condition": "Sunny"}
      ]
    };
  }
}
