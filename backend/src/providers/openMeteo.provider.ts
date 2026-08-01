// Climeo — developed by Halool.

import type {
  Coordinates,
  ForecastResponse,
  WeatherProvider,
  HourlyForecastPoint,
  DailyForecastPoint,
} from '../types/weather.types.js';
import { wmoToCondition } from '../utils/wmoCode.js';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    pressure_msl: number;
    weather_code: number;
    is_day: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    sunrise: string[];
    sunset: string[];
    weather_code: number[];
    uv_index_max: number[];
  };
}

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = 'open-meteo';

  async getForecast(coords: Coordinates, days: number): Promise<ForecastResponse> {
    const clampedDays = Math.min(Math.max(days, 1), 16);

    const params = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'pressure_msl',
        'weather_code',
        'is_day',
        'uv_index',
      ].join(','),
      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'precipitation',
        'wind_speed_10m',
        'weather_code',
      ].join(','),
      daily: [
        'temperature_2m_min',
        'temperature_2m_max',
        'precipitation_probability_max',
        'precipitation_sum',
        'sunrise',
        'sunset',
        'weather_code',
        'uv_index_max',
      ].join(','),
      forecast_days: clampedDays.toString(),
      timezone: 'auto',
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Open-Meteo request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as OpenMeteoResponse;
    return this.normalize(coords, data);
  }

  private normalize(coords: Coordinates, data: OpenMeteoResponse): ForecastResponse {
    const hourly: HourlyForecastPoint[] = data.hourly.time.map((time, i) => ({
      time,
      temperatureC: data.hourly.temperature_2m[i],
      precipitationProbabilityPct: data.hourly.precipitation_probability[i],
      precipitationMm: data.hourly.precipitation[i],
      windSpeedKph: data.hourly.wind_speed_10m[i],
      condition: wmoToCondition(data.hourly.weather_code[i]),
    }));

    const daily: DailyForecastPoint[] = data.daily.time.map((date, i) => ({
      date,
      temperatureMinC: data.daily.temperature_2m_min[i],
      temperatureMaxC: data.daily.temperature_2m_max[i],
      precipitationProbabilityPct: data.daily.precipitation_probability_max[i],
      precipitationSumMm: data.daily.precipitation_sum[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      condition: wmoToCondition(data.daily.weather_code[i]),
      uvIndexMax: data.daily.uv_index_max[i],
    }));

    return {
      location: coords,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      current: {
        observedAt: data.current.time,
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        humidityPct: data.current.relative_humidity_2m,
        windSpeedKph: data.current.wind_speed_10m,
        windDirectionDeg: data.current.wind_direction_10m,
        pressureHpa: data.current.pressure_msl,
        visibilityKm: null, // not provided by this endpoint variant
        uvIndex: data.current.uv_index,
        condition: wmoToCondition(data.current.weather_code),
        isDay: data.current.is_day === 1,
      },
      hourly,
      daily,
    };
  }
}
