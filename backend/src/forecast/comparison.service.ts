import type { ForecastResponse, ConditionCode } from '../types/weather.types.js';

export type ConfidenceLevel = 'high' | 'moderate' | 'low';

export interface ProviderDaySnapshot {
  provider: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  condition: ConditionCode;
}

export interface DayComparison {
  date: string;
  providers: ProviderDaySnapshot[];
  maxTempDisagreementC: number;
  conditionsAgree: boolean;
  confidence: ConfidenceLevel;
}

export interface ComparisonResult {
  location: { latitude: number; longitude: number };
  generatedAt: string;
  providersUsed: string[];
  days: DayComparison[];
}

// Thresholds for how much providers' max-temperature forecasts can differ
// before we call it "moderate" or "low" confidence. These are a starting
// point — tune once real-world comparisons across seasons/regions are
// gathered in production.
const HIGH_CONFIDENCE_MAX_DIFF_C = 2;
const MODERATE_CONFIDENCE_MAX_DIFF_C = 5;

export function compareForecasts(forecasts: ForecastResponse[]): ComparisonResult {
  if (forecasts.length === 0) {
    throw new Error('compareForecasts requires at least one forecast');
  }

  const [first] = forecasts;
  const dayCount = Math.min(...forecasts.map((f) => f.daily.length));
  const days: DayComparison[] = [];

  for (let i = 0; i < dayCount; i++) {
    const date = first.daily[i].date;
    const providers: ProviderDaySnapshot[] = forecasts.map((f) => ({
      provider: f.provider,
      temperatureMinC: f.daily[i].temperatureMinC,
      temperatureMaxC: f.daily[i].temperatureMaxC,
      condition: f.daily[i].condition,
    }));

    const maxTemps = providers.map((p) => p.temperatureMaxC);
    const maxTempDisagreementC =
      Math.round((Math.max(...maxTemps) - Math.min(...maxTemps)) * 10) / 10;

    const conditionsAgree = providers.every((p) => p.condition === providers[0].condition);

    let confidence: ConfidenceLevel;
    if (providers.length < 2) {
      // Can't assess agreement with a single data source — report
      // moderate rather than implying multi-model consensus that didn't
      // happen.
      confidence = 'moderate';
    } else if (maxTempDisagreementC <= HIGH_CONFIDENCE_MAX_DIFF_C && conditionsAgree) {
      confidence = 'high';
    } else if (maxTempDisagreementC <= MODERATE_CONFIDENCE_MAX_DIFF_C) {
      confidence = 'moderate';
    } else {
      confidence = 'low';
    }

    days.push({ date, providers, maxTempDisagreementC, conditionsAgree, confidence });
  }

  return {
    location: { latitude: first.location.latitude, longitude: first.location.longitude },
    generatedAt: new Date().toISOString(),
    providersUsed: forecasts.map((f) => f.provider),
    days,
  };
}
