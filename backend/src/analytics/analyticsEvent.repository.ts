// Climeo — developed by Halool.

import { getPool } from '../db/pool.js';

export interface AnalyticsEventInput {
  userId: string | null;
  eventName: string;
  properties: Record<string, unknown>;
}

export async function recordEvent(input: AnalyticsEventInput): Promise<void> {
  await getPool().query(
    `INSERT INTO analytics_events (user_id, event_name, properties)
     VALUES ($1, $2, $3::jsonb)`,
    [input.userId, input.eventName, JSON.stringify(input.properties)],
  );

  await forwardToPostHog(input);
}

/**
 * Optional: if POSTHOG_API_KEY is configured, also forward the event to
 * PostHog's capture API. Best-effort — analytics forwarding failures
 * should never break the request that triggered them.
 */
async function forwardToPostHog(input: AnalyticsEventInput): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return;

  const host = process.env.POSTHOG_HOST ?? 'https://app.posthog.com';

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: input.eventName,
        distinct_id: input.userId ?? 'anonymous',
        properties: input.properties,
      }),
    });
  } catch {
    // Swallow — analytics forwarding is never allowed to fail the request.
  }
}
