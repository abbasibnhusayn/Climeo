// Climeo — developed by Halool.
//
// Heat index formula: NWS Rothfusz regression.
// Reference: https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

/**
 * Returns heat index in Celsius given air temperature (C) and relative
 * humidity (%). Below 80°F (~26.7°C) the heat index is essentially the
 * same as air temperature, per NWS guidance, so we skip the regression
 * and return the actual temperature.
 */
export function heatIndexCelsius(temperatureC: number, relativeHumidityPct: number): number {
  const T = celsiusToFahrenheit(temperatureC);
  const R = relativeHumidityPct;

  if (T < 80) {
    return temperatureC;
  }

  // Rothfusz regression
  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  // Low relative humidity adjustment
  if (R < 13 && T >= 80 && T <= 112) {
    const adjustment = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    hi -= adjustment;
  }
  // High relative humidity adjustment
  if (R > 85 && T >= 80 && T <= 87) {
    const adjustment = ((R - 85) / 10) * ((87 - T) / 5);
    hi += adjustment;
  }

  return fahrenheitToCelsius(hi);
}
