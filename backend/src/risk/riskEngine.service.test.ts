import { describe, it, expect } from 'vitest';
import {
  assessHeatRisk,
  assessColdRisk,
  assessStormRisk,
  assessUvRisk,
  assessAirQualityRisk,
} from './riskEngine.service.js';

describe('assessHeatRisk', () => {
  it('is low for mild weather', () => {
    expect(assessHeatRisk(20, 50).level).toBe('low');
  });

  it('is severe for extreme heat and humidity', () => {
    expect(assessHeatRisk(43, 70).level).toBe('severe');
  });
});

describe('assessColdRisk', () => {
  it('is low above freezing', () => {
    expect(assessColdRisk(5).level).toBe('low');
  });

  it('is severe well below freezing', () => {
    expect(assessColdRisk(-25).level).toBe('severe');
  });
});

describe('assessStormRisk', () => {
  it('is severe for thunderstorms with high wind', () => {
    expect(assessStormRisk('thunderstorm', 70).level).toBe('severe');
  });

  it('is low for clear calm weather', () => {
    expect(assessStormRisk('clear', 10).level).toBe('low');
  });
});

describe('assessUvRisk', () => {
  it('is low for a low UV index', () => {
    expect(assessUvRisk(1).level).toBe('low');
  });

  it('is severe for extreme UV', () => {
    expect(assessUvRisk(10).level).toBe('severe');
  });

  it('does not fabricate a risk level when UV data is missing', () => {
    const result = assessUvRisk(null);
    expect(result.metric).toBeNull();
  });
});

describe('assessAirQualityRisk', () => {
  it('is low for good AQI', () => {
    expect(assessAirQualityRisk({ observedAt: '', usAqi: 30, pm25: 5, pm10: 10 }).level).toBe('low');
  });

  it('is severe for hazardous AQI', () => {
    expect(assessAirQualityRisk({ observedAt: '', usAqi: 250, pm25: 150, pm10: 200 }).level).toBe(
      'severe',
    );
  });
});
