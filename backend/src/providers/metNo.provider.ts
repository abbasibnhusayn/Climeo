// Climeo — developed by Halool.

import type {
  Coordinates,
  ForecastResponse,
  WeatherProvider,
  HourlyForecastPoint,
  DailyForecastPoint,
  ConditionCode,
} from '../types/weather.types.js';
import { metNoSymbolToCondition } from '../utils/metNoSymbol.js';

const FORECAST_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const SUNRISE_URL = 'https://api.met.no/weatherapi/sunrise/3.0/sun';

// MET Norway's terms of service require an identifying User-Agent with
// contact info on every request — this is not optional.
const USER_AGENT = 'Climeo-WeatherApp/0.1 (contact: engineering@climeo.app)';

interface MetNoTimeseriesEntry {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature: number;
        relative_humidity: number;
        wind_speed: number;
        wind_from_direction: number;
        air_pressure_at_sea_level: number;
      };
    };
    next_1_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
    next_6_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
  };
}

interface MetNoResponse {
  properties: { timeseries: MetNoTimeseriesEntry[] };
}

interface MetNoSunResponse {
  properties: {
    sunrise: { time: string };
    sunset: { time: string };
  };
}

export class MetNoProvider implements WeatherProvider {
  readonly name = 'met-no';

  async getForecast(coords: Coordinates, days: number): Promise<ForecastResponse> {
    const clampedDays = Math.min(Math.max(days, 1), 9); // met.no returns ~9 days
    const data = await this.fetchForecast(coords);

    const hourly = this.buildHourly(data.properties.timeseries, clampedDays);
    const daily = await this.buildDaily(coords, data.properties.timeseries, clampedDays);
    const current = this.buildCurrent(data.properties.timeseries[0]);

    return {
      location: coords,
      provider: this.name,
      generatedAt: new Date().toISOString(),
      current,
      hourly,
      daily,
    };
  }

  private async fetchForecast(coords: Coordinates): Promise<MetNoResponse> {
    const params = new URLSearchParams({
      lat: coords.latitude.toFixed(4),
      lon: coords.longitude.toFixed(4),
    });

    const res = await fetch(`${FORECAST_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MET Norway request failed (${res.status}): ${body}`);
    }

    return (await res.json()) as MetNoResponse;
  }

  private async fetchSunTimes(
    coords: Coordinates,
    date: string,
  ): Promise<{ sunrise: string; sunset: string }> {
    const params = new URLSearchParams({
      lat: coords.latitude.toFixed(4),
      lon: coords.longitude.toFixed(4),
      date,
      offset: '+00:00',
    });

    const res = await fetch(`${SUNRISE_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MET Norway sunrise request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as MetNoSunResponse;
    return {
      sunrise: data.properties.sunrise.time,
      sunset: data.properties.sunset.time,
    };
  }

  private buildCurrent(entry: MetNoTimeseriesEntry) {
    const symbol =
      entry.data.next_1_hours?.summary.symbol_code ??
      entry.data.next_6_hours?.summary.symbol_code ??
      'unknown';
    const hour = new Date(entry.time).getUTCHours();

    return {
      observedAt: entry.time,
      temperatureC: entry.data.instant.details.air_temperature,
      // met.no doesn't provide apparent temperature directly in this
      // endpoint — using the actual temperature rather than fabricating
      // a "feels like" figure we haven't computed.
      feelsLikeC: entry.data.instant.details.air_temperature,
      humidityPct: entry.data.instant.details.relative_humidity,
      windSpeedKph: entry.data.instant.details.wind_speed * 3.6, // m/s -> km/h
      windDirectionDeg: entry.data.instant.details.wind_from_direction,
      pressureHpa: entry.data.instant.details.air_pressure_at_sea_level,
      visibilityKm: null,
      uvIndex: null,
      condition: metNoSymbolToCondition(symbol),
      isDay: hour >= 6 && hour < 18,
    };
  }

  private buildHourly(timeseries: MetNoTimeseriesEntry[], days: number): HourlyForecastPoint[] {
    const limit = days * 24;
    return timeseries.slice(0, limit).map((entry) => {
      const next1h = entry.data.next_1_hours;
      const symbol = next1h?.summary.symbol_code ?? 'unknown';

      return {
        time: entry.time,
        temperatureC: entry.data.instant.details.air_temperature,
        // met.no's compact endpoint doesn't include precipitation
        // probability, only expected amount — we report 100% when rain
        // is forecast in the next hour and 0% otherwise rather than
        // inventing a probability figure they don't provide.
        precipitationProbabilityPct: (next1h?.details.precipitation_amount ?? 0) > 0 ? 100 : 0,
        precipitationMm: next1h?.details.precipitation_amount ?? 0,
        windSpeedKph: entry.data.instant.details.wind_speed * 3.6,
        condition: metNoSymbolToCondition(symbol),
      };
    });
  }

  private async buildDaily(
    coords: Coordinates,
    timeseries: MetNoTimeseriesEntry[],
    days: number,
  ): Promise<DailyForecastPoint[]> {
    const byDate = new Map<string, MetNoTimeseriesEntry[]>();
    for (const entry of timeseries) {
      const date = entry.time.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }

    const dates = Array.from(byDate.keys()).slice(0, days);
    const results: DailyForecastPoint[] = [];

    for (const date of dates) {
      const entries = byDate.get(date)!;
      const temps = entries.map((e) => e.data.instant.details.air_temperature);
      const precipSum = entries.reduce(
        (sum, e) => sum + (e.data.next_1_hours?.details.precipitation_amount ?? 0),
        0,
      );
      const anyPrecip = precipSum > 0;

      // Dominant condition = most common symbol among the day's entries.
      const symbolCounts = new Map<ConditionCode, number>();
      for (const e of entries) {
        const symbol = e.data.next_1_hours?.summary.symbol_code ?? 'unknown';
        const condition = metNoSymbolToCondition(symbol);
        symbolCounts.set(condition, (symbolCounts.get(condition) ?? 0) + 1);
      }
      const dominantCondition = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

      const { sunrise, sunset } = await this.fetchSunTimes(coords, date);

      results.push({
        date,
        temperatureMinC: Math.min(...temps),
        temperatureMaxC: Math.max(...temps),
        precipitationProbabilityPct: anyPrecip ? 100 : 0,
        precipitationSumMm: Math.round(precipSum * 10) / 10,
        sunrise,
        sunset,
        condition: dominantCondition,
        // met.no's compact locationforecast endpoint doesn't include UV
        // index (their "complete" variant does, but adds significant
        // payload weight for a field only Open-Meteo needs to supply
        // here) — reporting null rather than fabricating a value.
        uvIndexMax: null,
      });
    }

    return results;
  }
}
