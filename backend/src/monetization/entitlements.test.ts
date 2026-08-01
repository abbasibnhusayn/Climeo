import { describe, it, expect } from 'vitest';
import { hasFeature, featuresForTier } from './entitlements.js';

describe('entitlements', () => {
  it('free tier does not get AI briefs or ad-free', () => {
    expect(hasFeature('free', 'ai_daily_brief')).toBe(false);
    expect(hasFeature('free', 'ad_free')).toBe(false);
  });

  it('premium tier unlocks AI briefs and comparison but not API access', () => {
    expect(hasFeature('premium', 'ai_daily_brief')).toBe(true);
    expect(hasFeature('premium', 'multi_model_comparison')).toBe(true);
    expect(hasFeature('premium', 'api_access')).toBe(false);
  });

  it('enterprise tier includes everything premium has, plus white-label and API access', () => {
    const premiumFeatures = featuresForTier('premium');
    const enterpriseFeatures = featuresForTier('enterprise');

    for (const feature of premiumFeatures) {
      expect(enterpriseFeatures).toContain(feature);
    }
    expect(hasFeature('enterprise', 'white_label')).toBe(true);
    expect(hasFeature('enterprise', 'api_access')).toBe(true);
  });
});
