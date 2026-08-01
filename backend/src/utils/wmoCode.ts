import type { ConditionCode } from '../types/weather.types.js';

// Open-Meteo returns WMO 4677 weather interpretation codes.
// Reference: https://open-meteo.com/en/docs (Weather variable documentation)
const WMO_TO_CONDITION: Record<number, ConditionCode> = {
  0: 'clear',
  1: 'clear',
  2: 'partly_cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

export function wmoToCondition(code: number): ConditionCode {
  return WMO_TO_CONDITION[code] ?? 'unknown';
}
