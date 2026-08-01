import { describe, it, expect } from 'vitest';
import { shouldAlert, buildAlertPayload, alertDedupKey } from './alertMessage.js';
import type { RiskAssessment } from '../risk/risk.types.js';

function buildAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    type: 'heat',
    level: 'severe',
    metric: { label: 'Heat Index', value: 42, unit: '°C' },
    recommendedActions: ['Avoid outdoor activity if possible.', 'Stay in air conditioning.'],
    ...overrides,
  };
}

describe('shouldAlert', () => {
  it('alerts on high and severe', () => {
    expect(shouldAlert(buildAssessment({ level: 'high' }))).toBe(true);
    expect(shouldAlert(buildAssessment({ level: 'severe' }))).toBe(true);
  });

  it('does not alert on low or moderate', () => {
    expect(shouldAlert(buildAssessment({ level: 'low' }))).toBe(false);
    expect(shouldAlert(buildAssessment({ level: 'moderate' }))).toBe(false);
  });
});

describe('buildAlertPayload', () => {
  it('builds title and body from the real assessment data', () => {
    const payload = buildAlertPayload(buildAssessment());
    expect(payload.title).toContain('Severe');
    expect(payload.title).toContain('Heat');
    expect(payload.title).toContain('42°C');
    expect(payload.body).toBe('Avoid outdoor activity if possible.');
    expect(payload.data?.riskType).toBe('heat');
    expect(payload.data?.riskLevel).toBe('severe');
  });

  it('falls back to a generic body when no recommended actions exist', () => {
    const payload = buildAlertPayload(buildAssessment({ recommendedActions: [] }));
    expect(payload.body).toContain('heat');
  });
});

describe('alertDedupKey', () => {
  it('is stable for the same token/type/level and differs otherwise', () => {
    const a = buildAssessment({ type: 'heat', level: 'severe' });
    const b = buildAssessment({ type: 'storm', level: 'severe' });

    expect(alertDedupKey('token-1', a)).toBe(alertDedupKey('token-1', a));
    expect(alertDedupKey('token-1', a)).not.toBe(alertDedupKey('token-1', b));
    expect(alertDedupKey('token-1', a)).not.toBe(alertDedupKey('token-2', a));
  });
});
