// Climeo — developed by Halool.

import type { CitySeed } from './citySeed.js';
import type { ForecastResponse } from '../types/weather.types.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCityWeatherPage(city: CitySeed, forecast: ForecastResponse): string {
  const title = `${city.name} Weather Forecast — Today & 7-Day Outlook | Climeo`;
  const description = `Current conditions in ${city.name}, ${city.country}: ${forecast.current.temperatureC}°C, ${forecast.current.condition.replace('_', ' ')}. Get the hourly and 7-day forecast on Climeo.`;
  const canonicalUrl = `https://climeo.app/weather/${city.slug}`;

  // schema.org structured data — helps search engines and AI answer
  // engines surface this as a direct weather answer.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WeatherForecast',
    name: `${city.name} Weather Forecast`,
    url: canonicalUrl,
    about: {
      '@type': 'City',
      name: city.name,
      containedInPlace: { '@type': 'Country', name: city.country },
      geo: { '@type': 'GeoCoordinates', latitude: city.latitude, longitude: city.longitude },
    },
    temperature: {
      '@type': 'QuantitativeValue',
      value: forecast.current.temperatureC,
      unitCode: 'CEL',
    },
    datePublished: forecast.generatedAt,
  };

  const dailyRows = forecast.daily
    .map(
      (day) => `
      <tr>
        <td>${escapeHtml(day.date)}</td>
        <td>${escapeHtml(day.condition.replace('_', ' '))}</td>
        <td>${Math.round(day.temperatureMinC)}°C – ${Math.round(day.temperatureMaxC)}°C</td>
        <td>${Math.round(day.precipitationProbabilityPct)}%</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="Climeo" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(city.name)}, ${escapeHtml(city.country)} Weather</h1>
    <p>Currently ${forecast.current.temperatureC}°C, feels like ${forecast.current.feelsLikeC}°C,
       ${escapeHtml(forecast.current.condition.replace('_', ' '))}.</p>
    <h2>7-Day Forecast</h2>
    <table>
      <thead><tr><th>Date</th><th>Condition</th><th>Range</th><th>Rain Chance</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
    <footer><p>Climeo — Know the Weather. Live Better. Developed by Halool.</p></footer>
  </main>
</body>
</html>`;
}
