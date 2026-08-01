// Climeo — developed by Halool.
//
// Downloads GeoNames' free public "cities" dataset and converts it into
// generatedCities.json, which src/seo/citySeed.ts loads automatically if
// present. This is the real mechanism for scaling the SEO page count
// past the ~280-city curated tier toward the "millions of pages" scope
// in the original spec — GeoNames' full cities1000 dataset alone is
// ~150,000+ populated places.
//
// Requires network access, which this build environment did not have —
// run this yourself:
//   npm run import-cities
//   npm run import-cities -- --dataset=cities1000   # ~150k+ cities, slower
//   npm run import-cities -- --dataset=cities5000    # ~50k cities
//
// Default is cities15000 (~26k cities, population 15,000+) — a sane
// middle ground for a first run; the sitemap generator (seo.routes.ts)
// already splits output into multiple sitemap files once past 50,000
// URLs, per the sitemap protocol's per-file limit, so scaling up the
// dataset doesn't require touching that code.
//
// Data license: GeoNames is CC BY 4.0 — attribution is already declared
// in NOTICE.md. Re-check https://www.geonames.org/ if redistributing the
// generated file itself (as opposed to just using it to power this app).

import AdmZip from 'adm-zip';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { CitySeed } from '../src/seo/citySeed.js';

const VALID_DATASETS = ['cities500', 'cities1000', 'cities5000', 'cities15000'] as const;
type Dataset = (typeof VALID_DATASETS)[number];

function parseArgs(): { dataset: Dataset } {
  const arg = process.argv.find((a) => a.startsWith('--dataset='));
  const requested = (arg?.split('=')[1] ?? 'cities15000') as Dataset;
  if (!VALID_DATASETS.includes(requested)) {
    throw new Error(`Unknown dataset "${requested}". Choose from: ${VALID_DATASETS.join(', ')}`);
  }
  return { dataset: requested };
}

// GeoNames tab-separated columns, 0-indexed (per geonames.org/export/):
// 0 geonameid, 1 name, 2 asciiname, 3 alternatenames, 4 latitude,
// 5 longitude, 6 feature class, 7 feature code, 8 country code, ...,
// 14 population, ...
const COL = {
  geonameId: 0,
  asciiName: 2,
  latitude: 4,
  longitude: 5,
  countryCode: 8,
  population: 14,
};

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function countryNameFromCode(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function slugify(name: string, countryCode: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${countryCode.toLowerCase()}`;
}

async function run() {
  const { dataset } = parseArgs();
  const url = `https://download.geonames.org/export/dump/${dataset}.zip`;

  console.log(`Downloading ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find((e) => e.entryName === `${dataset}.txt`);
  if (!entry) {
    throw new Error(`Expected ${dataset}.txt inside the archive but didn't find it`);
  }

  const text = entry.getData().toString('utf-8');
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  console.log(`Parsing ${lines.length} rows...`);

  const bySlug = new Map<string, CitySeed>();
  let skippedDuplicates = 0;

  for (const line of lines) {
    const cols = line.split('\t');
    const name = cols[COL.asciiName];
    const countryCode = cols[COL.countryCode];
    const lat = Number(cols[COL.latitude]);
    const lon = Number(cols[COL.longitude]);

    if (!name || !countryCode || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const slug = slugify(name, countryCode);
    const population = Number(cols[COL.population]) || 0;

    // Same city name can appear twice in a country (rare but real) —
    // keep whichever has the higher population rather than silently
    // overwriting with an arbitrary duplicate.
    const existing = bySlug.get(slug);
    if (existing) {
      skippedDuplicates++;
      const existingPop = (existing as unknown as { _population?: number })._population ?? 0;
      if (population <= existingPop) continue;
    }

    bySlug.set(slug, {
      slug,
      name,
      country: countryNameFromCode(countryCode),
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
    });
  }

  const cities = Array.from(bySlug.values());
  console.log(`Resolved ${cities.length} unique cities (${skippedDuplicates} slug collisions resolved by population)`);

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'seo',
    'generatedCities.json',
  );
  writeFileSync(outPath, JSON.stringify(cities), 'utf-8');
  console.log(`Wrote ${outPath}`);
  console.log('Restart the backend (or re-run migrations/build) to pick up the new dataset.');
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
