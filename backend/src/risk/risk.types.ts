// Climeo — developed by Halool.

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export type RiskType = 'heat' | 'cold' | 'storm' | 'uv' | 'airQuality';

export interface RiskAssessment {
  type: RiskType;
  level: RiskLevel;
  /** The underlying figure the assessment is based on, for display. */
  metric: { label: string; value: number; unit: string } | null;
  recommendedActions: string[];
}

export const RISK_LEVEL_ORDER: RiskLevel[] = ['low', 'moderate', 'high', 'severe'];

export function bumpRiskLevel(level: RiskLevel, steps: number): RiskLevel {
  const index = RISK_LEVEL_ORDER.indexOf(level);
  const bumped = Math.min(RISK_LEVEL_ORDER.length - 1, Math.max(0, index + steps));
  return RISK_LEVEL_ORDER[bumped];
}
