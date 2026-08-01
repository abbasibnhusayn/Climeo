import type { ConditionCode } from '../types/weather.types.js';

// MET Norway symbol codes look like "clearsky_day", "lightrainshowers_night",
// "heavysnow", etc. Reference: https://api.met.no/weatherapi/weathericon/2.0/documentation
// We match on the base term (stripping _day/_night/_polartwilight suffixes).
export function metNoSymbolToCondition(symbolCode: string): ConditionCode {
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, '');

  if (base.startsWith('clearsky') || base.startsWith('fair')) return 'clear';
  if (base.startsWith('partlycloudy')) return 'partly_cloudy';
  if (base === 'cloudy') return 'cloudy';
  if (base.startsWith('fog')) return 'fog';
  if (base.includes('thunder')) return 'thunderstorm';
  if (base.includes('sleet')) return 'drizzle';
  if (base.includes('snow')) return 'snow';
  if (base.includes('rain') || base.includes('showers')) return 'rain';

  return 'unknown';
}
