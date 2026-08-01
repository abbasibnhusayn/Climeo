// Climeo — developed by Halool.

import type { RiskAssessment } from './risk.types.js';
import { bumpRiskLevel } from './risk.types.js';
import type { UserProfileRecord } from '../personalization/profile.repository.js';

/**
 * Personalization only ever raises a risk level, never lowers one — a
 * generic "low" reading should never be downgraded further just because
 * a profile suggests lower sensitivity; the base assessment already
 * reflects the actual conditions.
 */
export function personalizeRiskAssessments(
  assessments: RiskAssessment[],
  profile: UserProfileRecord | null,
): RiskAssessment[] {
  if (!profile) return assessments;

  return assessments.map((assessment) => {
    let bump = 0;
    const notes: string[] = [];

    if (assessment.type === 'heat' || assessment.type === 'cold') {
      if (profile.ageGroup === 'child' || profile.ageGroup === 'senior') {
        bump += 1;
        notes.push(`Extra caution recommended for ${profile.ageGroup === 'child' ? 'children' : 'older adults'}.`);
      }
      if (profile.hasCardiovascularCondition) {
        bump += 1;
        notes.push('Cardiovascular conditions increase sensitivity to temperature extremes.');
      }
    }

    if (assessment.type === 'airQuality') {
      if (profile.hasRespiratoryCondition) {
        bump += 1;
        notes.push('Respiratory conditions increase sensitivity to poor air quality.');
      }
      if (profile.ageGroup === 'child' || profile.ageGroup === 'senior') {
        bump += 1;
      }
    }

    if (assessment.type === 'uv' && profile.ageGroup === 'child') {
      bump += 1;
      notes.push('Children\'s skin is more sensitive to UV exposure.');
    }

    if (bump === 0) return assessment;

    return {
      ...assessment,
      level: bumpRiskLevel(assessment.level, bump),
      recommendedActions: [...assessment.recommendedActions, ...notes],
    };
  });
}
