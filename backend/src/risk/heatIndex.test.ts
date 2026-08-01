import { describe, it, expect } from 'vitest';
import { heatIndexCelsius, celsiusToFahrenheit } from './heatIndex.js';

describe('heatIndexCelsius', () => {
  it('returns actual temperature below the 80°F threshold', () => {
    // 25°C ≈ 77°F, under the threshold where heat index applies
    expect(heatIndexCelsius(25, 50)).toBeCloseTo(25, 5);
  });

  it('matches the known NWS reference point: 90°F at 60% RH ≈ 100°F heat index', () => {
    const tempC = (90 - 32) * (5 / 9);
    const hiC = heatIndexCelsius(tempC, 60);
    const hiF = celsiusToFahrenheit(hiC);
    expect(hiF).toBeGreaterThan(97);
    expect(hiF).toBeLessThan(103);
  });

  it('increases with humidity at the same temperature', () => {
    const tempC = (95 - 32) * (5 / 9);
    const lowHumidity = heatIndexCelsius(tempC, 30);
    const highHumidity = heatIndexCelsius(tempC, 70);
    expect(highHumidity).toBeGreaterThan(lowHumidity);
  });
});
