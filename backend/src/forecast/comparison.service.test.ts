import { describe, it, expect } from 'vitest';
import { compareForecasts } from './comparison.service.js';
import type { ForecastResponse } from '../types/weather.types.js';

function buildForecast(provider: string, maxTemps: number[], condition = 'clear' as const): ForecastResponse {
  return {
    location: { latitude: 33.6844, longitude: 73.0479 },
    provider,
    generatedAt: new Date().toISOString(),
    current: {
      observedAt: '2026-07-27T09:00:00Z',
      temperatureC: 28,
      feelsLikeC: 28,
      humidityPct: 50,
      windSpeedKph: 10,
      windDirectionDeg: 180,
      pressureHpa: 1010,
      visibilityKm: null,
      uvIndex: null,
      condition,
      isDay: true,
    },
    hourly: [],
    daily: maxTemps.map((max, i) => ({
      date: `2026-07-${27 + i}`,
      temperatureMinC: max - 8,
      temperatureMaxC: max,
      precipitationProbabilityPct: 10,
      precipitationSumMm: 0,
      sunrise: '2026-07-27T05:00:00Z',
      sunset: '2026-07-27T19:00:00Z',
      condition,
      uvIndexMax: 6,
    })),
  };
}

describe('compareForecasts', () => {
  it('marks high confidence when providers closely agree', () => {
    const result = compareForecasts([
      buildForecast('open-meteo', [34, 35]),
      buildForecast('met-no', [34.5, 35.2]),
    ]);

    expect(result.days[0].confidence).toBe('high');
    expect(result.days[0].conditionsAgree).toBe(true);
  });

  it('marks low confidence when providers diverge significantly', () => {
    const result = compareForecasts([
      buildForecast('open-meteo', [34]),
      buildForecast('met-no', [42]),
    ]);

    expect(result.days[0].maxTempDisagreementC).toBe(8);
    expect(result.days[0].confidence).toBe('low');
  });

  it('flags disagreeing conditions even with matching temperatures', () => {
    const result = compareForecasts([
      buildForecast('open-meteo', [30], 'clear'),
      buildForecast('met-no', [30.5], 'rain'),
    ]);

    expect(result.days[0].conditionsAgree).toBe(false);
  });

  it('truncates to the shortest provider daily length', () => {
    const result = compareForecasts([
      buildForecast('open-meteo', [30, 31, 32]),
      buildForecast('met-no', [30, 31]),
    ]);

    expect(result.days).toHaveLength(2);
  });
});
