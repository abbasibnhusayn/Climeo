// Climeo — developed by Halool.

import { cacheGet, cacheSet } from '../cache/redisCache.js';

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const FRAMES_CACHE_KEY = 'radar:frames';
const FRAMES_CACHE_TTL_SECONDS = 300; // RainViewer publishes new frames every ~10 min

export interface RadarFrame {
  time: number; // unix timestamp
  // Path PREFIX only, e.g. "/v2/radar/1690000000" — the client appends
  // "/{size}/{z}/{x}/{y}/{color}/{options}.png" to build an actual tile URL.
  path: string;
}

export interface RadarFrameSet {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[];
}

interface RainViewerApiResponse {
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
}

/**
 * Radar tiles themselves are always fetched directly by the client from
 * RainViewer's CDN (that's what tile layers are built for) — this service
 * only fetches and caches the small metadata payload listing which frame
 * timestamps currently exist, so the app knows what tile URLs to build.
 */
export async function getRadarFrames(): Promise<RadarFrameSet> {
  const cached = await cacheGet<RadarFrameSet>(FRAMES_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(RAINVIEWER_API);
  if (!res.ok) {
    throw new Error(`RainViewer request failed (${res.status})`);
  }

  const data = (await res.json()) as RainViewerApiResponse;
  const result: RadarFrameSet = {
    host: data.host,
    past: data.radar.past,
    nowcast: data.radar.nowcast,
  };

  await cacheSet(FRAMES_CACHE_KEY, result, FRAMES_CACHE_TTL_SECONDS);
  return result;
}
