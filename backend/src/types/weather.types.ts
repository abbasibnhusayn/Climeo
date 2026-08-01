// Normalized shape every provider must map into. This is what keeps the
// rest of the app (and future providers in Phase 5) decoupled from any
// single upstream API's response format.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type ConditionCode =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export interface CurrentConditions {
  observedAt: string; // ISO 8601
  temperatureC: number;
  feelsLikeC: number;
  humidityPct: number;
  windSpeedKph: number;
  windDirectionDeg: number;
  pressureHpa: number;
  visibilityKm: number | null;
  uvIndex: number | null;
  condition: ConditionCode;
  isDay: boolean;
}

export interface HourlyForecastPoint {
  time: string; // ISO 8601
  temperatureC: number;
  precipitationProbabilityPct: number;
  precipitationMm: number;
  windSpeedKph: number;
  condition: ConditionCode;
}

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  temperatureMinC: number;
  temperatureMaxC: number;
  precipitationProbabilityPct: number;
  precipitationSumMm: number;
  sunrise: string; // ISO 8601
  sunset: string; // ISO 8601
  condition: ConditionCode;
  uvIndexMax: number | null;
}

export interface ForecastResponse {
  location: Coordinates;
  provider: string;
  generatedAt: string;
  current: CurrentConditions;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
}

/**
 * Every weather data source (Open-Meteo now; NOAA/ECMWF/Tomorrow.io later
 * in Phase 5) implements this. The rest of the app never talks to a
 * provider's raw API — only to this interface.
 */
export interface WeatherProvider {
  readonly name: string;
  getForecast(coords: Coordinates, days: number): Promise<ForecastResponse>;
}
