// Climeo — developed by Halool.
//
// Requires a real Firebase project. Set FIREBASE_SERVICE_ACCOUNT_JSON to
// the full JSON contents of a service account key downloaded from
// Firebase Console → Project Settings → Service Accounts → Generate new
// private key. There is no working default here — a fabricated/placeholder
// credential would fail every send silently, which is worse than a clear
// startup error telling you what's missing.

import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app: App | null = null;

function getFirebaseApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is required to send push notifications — ' +
        'see DEPLOYMENT.md for how to generate one from your Firebase project.',
    );
  }

  const serviceAccount = JSON.parse(raw);
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  token: string;
  success: boolean;
  /** True if FCM reported the token as invalid/unregistered — caller
   *  should delete it rather than retry. */
  shouldRemoveToken: boolean;
}

export async function sendPush(token: string, payload: PushPayload): Promise<PushResult> {
  try {
    const messaging = getMessaging(getFirebaseApp());
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
    return { token, success: true, shouldRemoveToken: false };
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    const isInvalidToken =
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token';
    return { token, success: false, shouldRemoveToken: isInvalidToken };
  }
}

export async function sendPushToMany(
  tokens: string[],
  payload: PushPayload,
): Promise<PushResult[]> {
  return Promise.all(tokens.map((token) => sendPush(token, payload)));
}
