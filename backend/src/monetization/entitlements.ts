// Climeo — developed by Halool.

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export type Feature =
  | 'extended_forecast_16_day'
  | 'ai_daily_brief'
  | 'multi_model_comparison'
  | 'radar_layer'
  | 'ad_free'
  | 'api_access'
  | 'white_label';

const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  free: ['radar_layer'],
  premium: [
    'radar_layer',
    'extended_forecast_16_day',
    'ai_daily_brief',
    'multi_model_comparison',
    'ad_free',
  ],
  enterprise: [
    'radar_layer',
    'extended_forecast_16_day',
    'ai_daily_brief',
    'multi_model_comparison',
    'ad_free',
    'api_access',
    'white_label',
  ],
};

export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

export function featuresForTier(tier: SubscriptionTier): Feature[] {
  return TIER_FEATURES[tier];
}
