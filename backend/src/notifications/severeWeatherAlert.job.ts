// Climeo — developed by Halool.

import { OpenMeteoProvider } from '../providers/openMeteo.provider.js';
import { OpenMeteoAirQualityProvider } from '../airquality/openMeteoAirQuality.provider.js';
import { computeRiskAssessments } from '../risk/riskEngine.service.js';
import { listAlertCheckTargets, removeInvalidTokens } from './deviceToken.repository.js';
import { sendPush } from './fcm.service.js';
import { shouldAlert, buildAlertPayload, alertDedupKey } from './alertMessage.js';
import { cacheGet, cacheSet } from '../cache/redisCache.js';

const weatherProvider = new OpenMeteoProvider();
const airQualityProvider = new OpenMeteoAirQualityProvider();

// Once a given (token, riskType, riskLevel) combination has been sent,
// don't resend for this long even if the job runs again — prevents
// spamming the same ongoing heatwave every run interval.
const ALERT_REPEAT_SUPPRESSION_SECONDS = 3 * 60 * 60; // 3 hours

// Group tokens by rounded coordinate (~11km) so a city with thousands of
// users doesn't trigger thousands of duplicate weather API calls for
// what's effectively the same forecast.
function locationGroupKey(lat: number, lon: number): string {
  return `${lat.toFixed(1)}:${lon.toFixed(1)}`;
}

export interface AlertCheckSummary {
  targetsChecked: number;
  locationsQueried: number;
  pushesSent: number;
  pushesFailed: number;
  invalidTokensRemoved: number;
}

export async function runAlertCheck(): Promise<AlertCheckSummary> {
  const targets = await listAlertCheckTargets();

  const groups = new Map<string, { latitude: number; longitude: number; tokens: string[] }>();
  for (const target of targets) {
    const key = locationGroupKey(target.latitude, target.longitude);
    if (!groups.has(key)) {
      groups.set(key, { latitude: target.latitude, longitude: target.longitude, tokens: [] });
    }
    groups.get(key)!.tokens.push(target.token);
  }

  let pushesSent = 0;
  let pushesFailed = 0;
  const invalidTokens: string[] = [];

  for (const group of groups.values()) {
    let assessments;
    try {
      const [forecast, airQuality] = await Promise.all([
        weatherProvider.getForecast({ latitude: group.latitude, longitude: group.longitude }, 1),
        airQualityProvider.getCurrent({ latitude: group.latitude, longitude: group.longitude }),
      ]);

      assessments = computeRiskAssessments({
        temperatureC: forecast.current.temperatureC,
        humidityPct: forecast.current.humidityPct,
        condition: forecast.current.condition,
        windSpeedKph: forecast.current.windSpeedKph,
        uvIndex: forecast.current.uvIndex,
        airQuality,
      });
    } catch (err) {
      console.error(`Skipping location ${group.latitude},${group.longitude}: failed to fetch risk data`, err);
      continue;
    }

    const alertable = assessments.filter(shouldAlert);
    if (alertable.length === 0) continue;

    for (const token of group.tokens) {
      for (const assessment of alertable) {
        const dedupKey = alertDedupKey(token, assessment);
        const alreadySent = await cacheGet<boolean>(dedupKey);
        if (alreadySent) continue;

        const result = await sendPush(token, buildAlertPayload(assessment));
        if (result.success) {
          pushesSent++;
          await cacheSet(dedupKey, true, ALERT_REPEAT_SUPPRESSION_SECONDS);
        } else {
          pushesFailed++;
          if (result.shouldRemoveToken) invalidTokens.push(token);
        }
      }
    }
  }

  if (invalidTokens.length > 0) {
    await removeInvalidTokens(invalidTokens);
  }

  return {
    targetsChecked: targets.length,
    locationsQueried: groups.size,
    pushesSent,
    pushesFailed,
    invalidTokensRemoved: invalidTokens.length,
  };
}

// Allows `npm run check-alerts` to run this directly, separate from being
// imported by the HTTP trigger route.
const isDirectRun = process.argv[1]?.endsWith('severeWeatherAlert.job.ts') ||
  process.argv[1]?.endsWith('severeWeatherAlert.job.js');

if (isDirectRun) {
  runAlertCheck()
    .then((summary) => {
      console.log('Alert check complete:', summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Alert check failed:', err);
      process.exit(1);
    });
}
