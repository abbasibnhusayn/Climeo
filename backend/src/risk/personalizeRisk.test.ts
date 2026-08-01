import { describe, it, expect } from 'vitest';
import { personalizeRiskAssessments } from './personalizeRisk.js';
import type { UserProfileRecord } from '../personalization/profile.repository.js';
import type { RiskAssessment } from './risk.types.js';

function buildProfile(overrides: Partial<UserProfileRecord> = {}): UserProfileRecord {
  return {
    userId: 'user-1',
    ageGroup: 'adult',
    hasRespiratoryCondition: false,
    hasCardiovascularCondition: false,
    outdoorActivityLevel: 'moderate',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const baseAssessments: RiskAssessment[] = [
  { type: 'heat', level: 'moderate', metric: null, recommendedActions: [] },
  { type: 'airQuality', level: 'moderate', metric: null, recommendedActions: [] },
  { type: 'uv', level: 'moderate', metric: null, recommendedActions: [] },
];

describe('personalizeRiskAssessments', () => {
  it('returns assessments unchanged when there is no profile', () => {
    const result = personalizeRiskAssessments(baseAssessments, null);
    expect(result).toEqual(baseAssessments);
  });

  it('bumps heat risk up for a senior profile', () => {
    const result = personalizeRiskAssessments(baseAssessments, buildProfile({ ageGroup: 'senior' }));
    const heat = result.find((r) => r.type === 'heat')!;
    expect(heat.level).toBe('high');
  });

  it('bumps air quality risk for a respiratory condition', () => {
    const result = personalizeRiskAssessments(
      baseAssessments,
      buildProfile({ hasRespiratoryCondition: true }),
    );
    const aq = result.find((r) => r.type === 'airQuality')!;
    expect(aq.level).toBe('high');
  });

  it('never lowers a risk level', () => {
    const lowAssessment: RiskAssessment[] = [
      { type: 'heat', level: 'low', metric: null, recommendedActions: [] },
    ];
    const result = personalizeRiskAssessments(lowAssessment, buildProfile({ ageGroup: 'adult' }));
    expect(result[0].level).toBe('low');
  });

  it('stacks multiple applicable bumps', () => {
    const result = personalizeRiskAssessments(
      baseAssessments,
      buildProfile({ ageGroup: 'child', hasCardiovascularCondition: true }),
    );
    const heat = result.find((r) => r.type === 'heat')!;
    // child (+1) + cardiovascular (+1) from moderate -> severe
    expect(heat.level).toBe('severe');
  });
});
