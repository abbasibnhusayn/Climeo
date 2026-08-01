# Climeo Backend

*Developed by Halool.*

Fastify + TypeScript API serving normalized forecast data from multiple
providers: Open-Meteo and MET Norway, both free with no API key, so the
full pipeline — routing, validation, caching, normalization, multi-model
comparison — is built and tested before paid providers (NOAA/ECMWF/
Tomorrow.io) are added.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Server starts on `http://localhost:8080`.

Redis is optional in local dev — if it's not running, the API falls back
to always fetching fresh from Open-Meteo instead of failing.

To run Redis locally: `docker run -p 6379:6379 redis:7-alpine`

Postgres is required for auth and saved-location endpoints (weather and
AI-brief endpoints work without it).

To run Postgres locally:
```bash
docker run -p 5432:5432 \
  -e POSTGRES_USER=climeo -e POSTGRES_PASSWORD=climeo -e POSTGRES_DB=climeo \
  postgres:16-alpine
npm run migrate
```

## Endpoints

### `GET /v1/weather/current?lat=33.6844&lon=73.0479`

Returns normalized current conditions for the given coordinates.

### `GET /v1/weather/forecast?lat=33.6844&lon=73.0479&days=7`

Returns current conditions plus hourly and daily forecast arrays.
`days` accepts 1–16.

### `GET /v1/ai/daily-brief?lat=33.6844&lon=73.0479`

Returns an AI-written plain-language brief for today, grounded strictly in
the real forecast numbers (see `src/ai/dailyBrief.service.ts`). The AI
never generates a forecast value — it only explains numbers that were
already computed by the weather provider.

Requires an API key for whichever `AI_PROVIDER` is configured in `.env`
(see `.env.example`). Defaults to `anthropic`. Set `AI_PROVIDER=local-llm`
to run against a local Ollama instance with no API key at all.

### `GET /v1/weather/forecast/compare?lat=33.6844&lon=73.0479&days=3`

Fetches Open-Meteo and MET Norway in parallel and returns per-day
agreement analysis: max-temperature disagreement in °C, whether both
providers predict the same condition, and a confidence rating
(`high`/`moderate`/`low`) derived from that agreement — not from either
provider's own internal confidence, which neither exposes. `days` is
capped at 5 (MET Norway's sunrise lookup is one request per day, so this
keeps latency reasonable). If one provider fails, the response still
returns with the successful provider's data plus a `providerFailures`
list — it degrades rather than 502ing outright.

### `GET /healthz`

Liveness check for load balancers / container orchestration.

### `GET /v1/maps/radar/frames`

Returns current RainViewer radar frame metadata: a CDN host plus a list of
past/nowcast frame timestamps and path prefixes. The client builds actual
tile URLs from this — the backend never proxies tile image bytes itself,
just the small metadata payload (cached 5 min).

### `GET /v1/weather/risk?lat=&lon=`

Computes heat, cold, storm, UV, and air-quality risk from real forecast
and air-quality data (Open-Meteo's weather + air-quality APIs). Auth is
**optional** here: send a bearer token and the response is personalized
against the caller's saved profile (age group, respiratory/cardiovascular
conditions bump relevant risks up a level — personalization only ever
raises a risk level, never lowers one). Without a token you still get the
full base assessment.

Heat risk uses the NWS Rothfusz heat-index regression, not an invented
formula. UV and AQI use their real published scales (EPA UV Index, US
AQI). Where a data source doesn't provide a field (e.g. UV index isn't in
every provider), the response says so rather than fabricating a number.

### `GET /v1/profile` / `PUT /v1/profile` (auth required)

Get or update the authenticated user's personalization profile: age
group, respiratory/cardiovascular condition flags, outdoor activity
level. This is what `/v1/weather/risk` personalizes against.

### `POST /v1/auth/register`

Body: `{ "email": "...", "password": "... (min 8 chars)", "displayName": "optional" }`
Returns `{ token, user }`. Password is hashed with bcrypt before storage —
never stored or logged in plaintext.

### `POST /v1/auth/login`

Body: `{ "email": "...", "password": "..." }`. Returns `{ token, user }`.

### `GET /v1/locations` (auth required)

Returns the authenticated user's saved locations, primary first.
Send `Authorization: Bearer <token>`.

### `POST /v1/locations` (auth required)

Body: `{ "label": "Home", "latitude": 33.68, "longitude": 73.05, "isPrimary": true }`.
Setting `isPrimary: true` automatically unsets any previous primary location.

### `DELETE /v1/locations/:id` (auth required)

Deletes a saved location owned by the authenticated user. 404 if it
doesn't exist or belongs to someone else.

### `GET /weather/:citySlug`

Server-rendered HTML landing page for a city (schema.org WeatherForecast
JSON-LD, OpenGraph/Twitter meta, canonical URL) — programmatic SEO built
on real forecast data. Ships with 283 real, hand-verified cities across
every populated continent (`src/seo/curatedCities.ts`). Run
`npm run import-cities` to pull GeoNames' full public dataset
(hundreds of thousands of populated places, CC BY 4.0 — see NOTICE.md)
into `src/seo/generatedCities.json`, which `citySeed.ts` loads
automatically if present, on top of the curated set. Requires network
access this build environment didn't have, so it hasn't been run here —
see `scripts/geonamesImport.ts` for exactly what it does.

### `GET /sitemap.xml` / `GET /sitemap-:page.xml` / `GET /robots.txt`

`/sitemap.xml` serves a flat sitemap while the city count is under
40,000, and automatically switches to a sitemap index (pointing at
`/sitemap-1.xml`, `/sitemap-2.xml`, ...) once it isn't — the sitemap
protocol caps each file at 50,000 URLs, so this is what actually lets
the dataset scale past the curated tier without any code changes.

### `POST /v1/analytics/event`

Body: `{ "eventName": "...", "properties": { ... } }`. Auth is optional —
anonymous events are recorded with a null user. Always returns 202, even
if the write fails, so analytics never breaks the calling request. Set
`POSTHOG_API_KEY` to also forward events to PostHog.

### `GET /v1/monetization/entitlements` (auth required)

Returns the caller's subscription tier and the feature list unlocked by
it (see `src/monetization/entitlements.ts` for the tier → feature map).

### `GET /v1/monetization/ad-context?lat=&lon=`

Returns weather-derived targeting *signals* (condition, day/night, temp
bucket, whether rain is expected) for client-side ad/affiliate content —
never ad creative or a call to an ad network, which belongs in the client
SDK, not this backend.

### `POST /v1/notifications/register-token`

Body: `{ "token": "...", "platform": "android|ios|macos|windows|web", "latitude": optional, "longitude": optional }`.
Auth optional — logged-out devices can still get location-based alerts
using the coordinates they report here. Logged-in users' alerts prefer
their primary saved location over this if both exist.

### `DELETE /v1/notifications/register-token`

Body: `{ "token": "..." }`. Removes a device token (e.g. on logout or
notification opt-out).

### `POST /v1/notifications/run-alert-check`

Header: `x-alert-check-secret: <ALERT_CHECK_SECRET>`. Not a user-facing
endpoint — meant to be called by an external scheduler (see
`.github/workflows/severe-weather-alerts.yml` or DEPLOYMENT.md §10).
Runs the risk engine (Phase 7) against every registered device's
location, sends a push for any `high`/`severe` risk not already sent to
that device in the last 3 hours, and prunes tokens FCM reports as
invalid. Returns a summary of what it did — never fabricated, every
number reflects an actual push attempt.

## Tests

```bash
npm test
```

## Architecture notes

- `src/types/weather.types.ts` — the normalized shape all providers map
  into. Nothing downstream ever touches a provider's raw response format.
- `src/providers/` — one file per weather data source, each implementing
  `WeatherProvider`. Adding NOAA/ECMWF/Tomorrow.io later means adding a
  file here and registering it in `weather.routes.ts` — no other code
  changes.
- `src/cache/redisCache.ts` — cache is best-effort; Redis being down
  degrades to direct provider calls rather than a 500.
- `src/ai/aiProvider.interface.ts` — the AI equivalent of `WeatherProvider`.
  `src/ai/aiProviderFactory.ts` picks the implementation from `AI_PROVIDER`
  in env, so switching Anthropic/OpenAI/Gemini/local is a config change,
  never a code change.
- `src/auth/authPlugin.ts` — registers a `requireAuth` preHandler that
  routes opt into explicitly, so public routes (weather, AI brief) stay
  unauthenticated while `/v1/locations/*` requires a valid bearer token.
- `src/db/migrate.ts` — tracks applied migrations in a `_migrations`
  table; running it twice is safe, it skips what's already applied.
- `src/forecast/comparison.service.ts` — pure function comparing two or
  more providers' daily forecasts and deriving a confidence rating from
  actual agreement/disagreement, not a fabricated number. A single-source
  result is explicitly labeled "moderate" rather than implied "high"
  confidence it didn't earn.
- `src/maps/rainviewer.service.ts` — fetches and caches RainViewer's radar
  frame metadata; actual tile images are always fetched client-side
  directly from RainViewer's CDN, never proxied through this backend.
- `src/risk/riskEngine.service.ts` — pure functions computing risk from
  real published formulas (NWS heat index, EPA UV Index, US AQI), fully
  unit tested against known reference values. `personalizeRisk.ts` only
  ever raises a risk level for a profile, never lowers one.
- Coordinates are rounded to 3 decimal places (~111m precision) for cache
  keys, so requests from the same neighborhood share a cache entry instead
  of missing on every slightly-different GPS reading.
