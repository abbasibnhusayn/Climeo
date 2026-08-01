// Climeo — developed by Halool.

import type { RiskAssessment } from '../risk/risk.types.js';
import type { PushPayload } from './fcm.service.js';

const RISK_TYPE_LABEL: Record<RiskAssessment['type'], string> = {
  heat: 'Heat',
  cold: 'Cold',
  storm: 'Storm',
  uv: 'UV',
  airQuality: 'Air Quality',
};

/**
 * Only 'high' and 'severe' risk levels warrant an interruption — 'low'
 * and 'moderate' stay in-app only (visible via GET /v1/weather/risk),
 * so notifications don't become noise the user learns to ignore.
 */
export function shouldAlert(assessment: RiskAssessment): boolean {
  return assessment.level === 'high' || assessment.level === 'severe';
}

export function buildAlertPayload(assessment: RiskAssessment): PushPayload {
  const label = RISK_TYPE_LABEL[assessment.type];
  const severityWord = assessment.level === 'severe' ? 'Severe' : 'High';
  const topAction = assessment.recommendedActions[0];

  const metricSuffix = assessment.metric
    ? ` (${assessment.metric.label}: ${assessment.metric.value}${assessment.metric.unit})`
    : '';

  return {
    title: `${severityWord} ${label} Risk${metricSuffix}`,
    body: topAction ?? `Check the app for current ${label.toLowerCase()} conditions.`,
    data: {
      riskType: assessment.type,
      riskLevel: assessment.level,
    },
  };
}

/** Dedup key so the same risk at the same severity isn't re-sent to the
 *  same device on every job run. */
export function alertDedupKey(token: string, assessment: RiskAssessment): string {
  return `alert-sent:${token}:${assessment.type}:${assessment.level}`;
}
