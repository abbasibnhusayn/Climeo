// Climeo — developed by Halool.

const BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export interface AirQualitySnapshot {
  observedAt: string;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
}

interface AirQualityApiResponse {
  current: {
    time: string;
    us_aqi: number;
    pm2_5: number;
    pm10: number;
  };
}

export class OpenMeteoAirQualityProvider {
  readonly name = 'open-meteo-air-quality';

  async getCurrent(coords: { latitude: number; longitude: number }): Promise<AirQualitySnapshot> {
    const params = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      current: ['us_aqi', 'pm2_5', 'pm10'].join(','),
    });

    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Open-Meteo Air Quality request failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AirQualityApiResponse;
    return {
      observedAt: data.current.time,
      usAqi: data.current.us_aqi ?? null,
      pm25: data.current.pm2_5 ?? null,
      pm10: data.current.pm10 ?? null,
    };
  }
}
