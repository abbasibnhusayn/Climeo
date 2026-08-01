// Climeo — developed by Halool.
//
// Two-tier city dataset:
//   1. CURATED_CITIES (curatedCities.ts) — ~280 real, hand-verified major
//      cities across every populated continent. Always available, no
//      setup required.
//   2. generatedCities.json — produced by `npm run import-cities`
//      (scripts/geonamesImport.ts), which pulls GeoNames' full public
//      cities dataset (hundreds of thousands of populated places,
//      CC BY 4.0 — see NOTICE.md). If present, this is what actually
//      answers the original "millions of indexable pages" ask; it's not
//      included in this repo because generating it requires network
//      access this build environment didn't have, and because a dataset
//      that size doesn't belong committed to source control.
//
// This file loads whichever is available at startup, with the generated
// set taking priority (curated entries fill in only if a slug isn't
// already present in the generated set).

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CURATED_CITIES } from './curatedCities.js';

export interface CitySeed {
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const GENERATED_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'generatedCities.json',
);

function loadCitySeeds(): CitySeed[] {
  const bySlug = new Map<string, CitySeed>();

  if (existsSync(GENERATED_PATH)) {
    try {
      const generated = JSON.parse(readFileSync(GENERATED_PATH, 'utf-8')) as CitySeed[];
      for (const city of generated) bySlug.set(city.slug, city);
      console.log(`[seo] Loaded ${generated.length} cities from generatedCities.json (GeoNames import)`);
    } catch (err) {
      console.error('[seo] Failed to parse generatedCities.json, falling back to curated list only', err);
    }
  }

  for (const city of CURATED_CITIES) {
    if (!bySlug.has(city.slug)) bySlug.set(city.slug, city);
  }

  return Array.from(bySlug.values());
}

export const CITY_SEEDS: CitySeed[] = loadCitySeeds();

// O(1) lookup — matters once this is hundreds of thousands of entries,
// not just the ~280-city curated tier.
const cityBySlugIndex = new Map(CITY_SEEDS.map((c) => [c.slug, c]));

export function findCityBySlug(slug: string): CitySeed | undefined {
  return cityBySlugIndex.get(slug);
}
