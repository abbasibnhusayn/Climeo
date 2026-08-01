import { describe, it, expect } from 'vitest';
import { DailyBriefService } from './dailyBrief.service.js';
import type { AiGenerateOptions, AiProvider } from './aiProvider.interface.js';
import type { ForecastResponse } from '../types/weather.types.js';

class FakeAiProvider implements AiProvider {
  readonly name = 'fake';
  lastOptions: AiGenerateOptions | null = null;

  async generate(options: AiGenerateOptions): Promise<string> {
    this.lastOptions = options;
    return 'A mild, mostly clear day with a low chance of rain in the afternoon.';
  }
}

function buildFakeForecast(): ForecastResponse {
  return {
    location: { latitude: 33.6844, longitude: 73.0479 },
    provider: 'open-meteo',
    generatedAt: new Date().toISOString(),
    current: {
      observedAt: '2026-07-27T09:00:00Z',
      temperatureC: 29,
      feelsLikeC: 32,
      humidityPct: 55,
      windSpeedKph: 12,
      windDirectionDeg: 180,
      pressureHpa: 1008,
      visibilityKm: null,
      uvIndex: null,
      condition: 'partly_cloudy',
      isDay: true,
    },
    hourly: [
      {
        time: '2026-07-27T10:00:00Z',
        temperatureC: 30,
        precipitationProbabilityPct: 10,
        precipitationMm: 0,
        windSpeedKph: 13,
        condition: 'partly_cloudy',
      },
      {
        time: '2026-07-27T15:00:00Z',
        temperatureC: 33,
        precipitationProbabilityPct: 40,
        precipitationMm: 1.2,
        windSpeedKph: 15,
        condition: 'rain',
      },
    ],
    daily: [
      {
        date: '2026-07-27',
        temperatureMinC: 24,
        temperatureMaxC: 34,
        precipitationProbabilityPct: 40,
        precipitationSumMm: 1.2,
        sunrise: '2026-07-27T05:12:00Z',
        sunset: '2026-07-27T19:03:00Z',
        condition: 'partly_cloudy',
        uvIndexMax: 7,
      },
    ],
  };
}

describe('DailyBriefService', () => {
  it('grounds the prompt in the real forecast numbers, not invented ones', async () => {
    const fakeProvider = new FakeAiProvider();
    const service = new DailyBriefService(fakeProvider);
    const forecast = buildFakeForecast();

    const result = await service.generate(forecast);

    expect(fakeProvider.lastOptions?.userPrompt).toContain('24°C');
    expect(fakeProvider.lastOptions?.userPrompt).toContain('34°C');
    expect(fakeProvider.lastOptions?.userPrompt).toContain('40%');
    expect(result.generatedBy).toBe('fake');
    expect(result.basedOn.tempMinC).toBe(24);
    expect(result.basedOn.tempMaxC).toBe(34);
  });

  it('throws when there is no daily data to brief from', async () => {
    const fakeProvider = new FakeAiProvider();
    const service = new DailyBriefService(fakeProvider);
    const forecast = { ...buildFakeForecast(), daily: [] };

    await expect(service.generate(forecast)).rejects.toThrow(
      'No daily forecast data available',
    );
  });
});
