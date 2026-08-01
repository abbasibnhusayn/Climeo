// Climeo — developed by Halool.

import type { RiskAssessment, RiskLevel } from './risk.types.js';
import { celsiusToFahrenheit, heatIndexCelsius } from './heatIndex.js';
import type { ConditionCode } from '../types/weather.types.js';
import type { AirQualitySnapshot } from '../airquality/openMeteoAirQuality.provider.js';

export function assessHeatRisk(temperatureC: number, humidityPct: number): RiskAssessment {
  const heatIndexC = heatIndexCelsius(temperatureC, humidityPct);
  const heatIndexF = celsiusToFahrenheit(heatIndexC);

  let level: RiskLevel;
  let actions: string[];

  if (heatIndexF < 80) {
    level = 'low';
    actions = ['No special precautions needed for heat.'];
  } else if (heatIndexF < 90) {
    level = 'moderate';
    actions = ['Stay hydrated during extended outdoor activity.', 'Take breaks in shade.'];
  } else if (heatIndexF < 103) {
    level = 'high';
    actions = [
      'Limit strenuous outdoor activity, especially midday.',
      'Drink water regularly even if not thirsty.',
      'Watch for signs of heat exhaustion.',
    ];
  } else {
    level = 'severe';
    actions = [
      'Avoid outdoor activity if possible.',
      'Stay in air conditioning.',
      'Check on children, older adults, and pets frequently.',
    ];
  }

  return {
    type: 'heat',
    level,
    metric: { label: 'Heat Index', value: Math.round(heatIndexC), unit: '°C' },
    recommendedActions: actions,
  };
}

export function assessColdRisk(temperatureC: number): RiskAssessment {
  let level: RiskLevel;
  let actions: string[];

  if (temperatureC >= 0) {
    level = 'low';
    actions = ['No special precautions needed for cold.'];
  } else if (temperatureC >= -10) {
    level = 'moderate';
    actions = ['Dress in layers.', 'Cover exposed skin in wind.'];
  } else if (temperatureC >= -20) {
    level = 'high';
    actions = [
      'Limit time outdoors.',
      'Watch for signs of frostbite on exposed skin.',
      'Keep phone charged in case of emergency.',
    ];
  } else {
    level = 'severe';
    actions = [
      'Avoid going outside unless necessary.',
      'Frostbite can occur within minutes on exposed skin.',
    ];
  }

  return {
    type: 'cold',
    level,
    metric: { label: 'Air Temperature', value: Math.round(temperatureC), unit: '°C' },
    recommendedActions: actions,
  };
}

export function assessStormRisk(condition: ConditionCode, windSpeedKph: number): RiskAssessment {
  let level: RiskLevel;
  let actions: string[];

  if (condition === 'thunderstorm' && windSpeedKph > 60) {
    level = 'severe';
    actions = ['Seek sturdy shelter immediately.', 'Stay away from windows.', 'Avoid travel.'];
  } else if (condition === 'thunderstorm') {
    level = 'high';
    actions = ['Move indoors.', 'Postpone outdoor plans.'];
  } else if (windSpeedKph > 50) {
    level = 'moderate';
    actions = ['Secure loose outdoor objects.', 'Drive with caution in high wind.'];
  } else {
    level = 'low';
    actions = ['No storm precautions needed.'];
  }

  return {
    type: 'storm',
    level,
    metric: { label: 'Wind Speed', value: Math.round(windSpeedKph), unit: 'km/h' },
    recommendedActions: actions,
  };
}

/** EPA/WHO UV Index scale. */
export function assessUvRisk(uvIndex: number | null): RiskAssessment {
  if (uvIndex === null) {
    return { type: 'uv', level: 'low', metric: null, recommendedActions: ['UV data unavailable.'] };
  }

  let level: RiskLevel;
  let actions: string[];

  if (uvIndex <= 2) {
    level = 'low';
    actions = ['Minimal sun protection needed.'];
  } else if (uvIndex <= 5) {
    level = 'moderate';
    actions = ['Wear sunscreen and sunglasses for extended time outside.'];
  } else if (uvIndex <= 7) {
    level = 'high';
    actions = ['Apply SPF 30+ sunscreen.', 'Seek shade during midday hours.', 'Wear a hat.'];
  } else {
    level = 'severe';
    actions = [
      'Minimize sun exposure between 10am–4pm.',
      'Apply SPF 30+ sunscreen and reapply every 2 hours.',
      'Wear protective clothing and sunglasses.',
    ];
  }

  return {
    type: 'uv',
    level,
    metric: { label: 'UV Index', value: uvIndex, unit: '' },
    recommendedActions: actions,
  };
}

/** US EPA Air Quality Index scale. */
export function assessAirQualityRisk(snapshot: AirQualitySnapshot): RiskAssessment {
  if (snapshot.usAqi === null) {
    return {
      type: 'airQuality',
      level: 'low',
      metric: null,
      recommendedActions: ['Air quality data unavailable.'],
    };
  }

  const aqi = snapshot.usAqi;
  let level: RiskLevel;
  let actions: string[];

  if (aqi <= 50) {
    level = 'low';
    actions = ['Air quality is good — no precautions needed.'];
  } else if (aqi <= 100) {
    level = 'moderate';
    actions = ['Unusually sensitive individuals should consider limiting prolonged exertion.'];
  } else if (aqi <= 150) {
    level = 'high';
    actions = [
      'Sensitive groups (asthma, heart/lung conditions, children, older adults) should limit outdoor exertion.',
    ];
  } else {
    level = 'severe';
    actions = [
      'Everyone should limit outdoor exertion.',
      'Sensitive groups should stay indoors where possible.',
    ];
  }

  return {
    type: 'airQuality',
    level,
    metric: { label: 'US AQI', value: aqi, unit: '' },
    recommendedActions: actions,
  };
}

export interface RiskEngineInput {
  temperatureC: number;
  humidityPct: number;
  condition: ConditionCode;
  windSpeedKph: number;
  uvIndex: number | null;
  airQuality: AirQualitySnapshot;
}

export function computeRiskAssessments(input: RiskEngineInput): RiskAssessment[] {
  return [
    assessHeatRisk(input.temperatureC, input.humidityPct),
    assessColdRisk(input.temperatureC),
    assessStormRisk(input.condition, input.windSpeedKph),
    assessUvRisk(input.uvIndex),
    assessAirQualityRisk(input.airQuality),
  ];
}
