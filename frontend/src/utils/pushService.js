// Web Push client: registers this device with the backend and uploads the upcoming
// reminder schedule so reminders arrive on time even while the PWA is closed.
import { claimAlertKey } from './notificationService';

const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api';
const PUSH_FLAG = 'codigix_push_enabled';
const FIRED_CACHE = 'codigix-push-fired';

async function api(path, options = {}) {
  const token = localStorage.getItem('codigix_auth_token') || '';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  let data = {};
  try { data = await res.json(); } catch (e) { }
  return { ok: res.ok, status: res.status, data };
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// True when this device has an active server push subscription (set after enablePush)
export const isPushEnabled = () => {
  try { return localStorage.getItem(PUSH_FLAG) === '1'; } catch (e) { return false; }
};

const setPushFlag = (on) => {
  try { on ? localStorage.setItem(PUSH_FLAG, '1') : localStorage.removeItem(PUSH_FLAG); } catch (e) { }
};

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Subscribe this device (requires notification permission already granted).
// Returns { ok, reason } — reason explains why push isn't possible.
export async function enablePush() {
  if (!pushSupported()) {
    return { ok: false, reason: /iphone|ipad/i.test(navigator.userAgent)
      ? 'On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), then open it from there.'
      : 'This browser does not support background notifications.' };
  }
  if (!window.isSecureContext) return { ok: false, reason: 'Background notifications need the app to be opened over HTTPS.' };
  if (Notification.permission !== 'granted') return { ok: false, reason: 'Notification permission has not been granted.' };

  try {
    const registration = await navigator.serviceWorker.ready;
    const keyRes = await api('/push/vapid-public-key');
    if (!keyRes.ok) return { ok: false, reason: keyRes.data.error || 'Server push is unavailable.' };
    const serverKey = keyRes.data.publicKey;

    let subscription = await registration.pushManager.getSubscription();
    // Re-subscribe if the server's key changed (e.g. keys regenerated)
    if (subscription) {
      const current = subscription.options && subscription.options.applicationServerKey;
      const currentB64 = current ? btoa(String.fromCharCode(...new Uint8Array(current))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : null;
      if (currentB64 && currentB64 !== serverKey) {
        await subscription.unsubscribe();
        subscription = null;
      }
    }
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(serverKey)
      });
    }

    const saved = await api('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
    if (!saved.ok) return { ok: false, reason: saved.data.error || 'Could not register this device.' };
    setPushFlag(true);
    return { ok: true };
  } catch (err) {
    setPushFlag(false);
    return { ok: false, reason: err && err.message ? err.message : 'Could not enable background notifications.' };
  }
}

export async function sendTestPush() {
  return api('/push/test', { method: 'POST' });
}

// Upload the next reminders (from buildReminders). Only future/active ones are sent.
export async function syncReminderSchedule(reminders) {
  if (!isPushEnabled()) return { ok: false, skipped: true };
  const now = Date.now();
  const payload = reminders
    .filter((r) => r.expiresAt > now)
    .slice(0, 500)
    .map(({ dedupeKey, fireAt, expiresAt, title, body, url, tag }) => ({ dedupeKey, fireAt, expiresAt, title, body, url, tag }));
  try {
    return await api('/push/schedule', { method: 'POST', body: JSON.stringify({ reminders: payload }) });
  } catch (e) {
    return { ok: false };
  }
}

// The service worker records every reminder it showed while the app was closed
// (Cache Storage is shared with the page). Import those keys so the in-app
// scheduler doesn't repeat them when the app is opened.
export async function importPushFiredKeys() {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(FIRED_CACHE);
    const requests = await cache.keys();
    const cutoff = Date.now() - 36 * 60 * 60 * 1000;
    await Promise.all(requests.map(async (req) => {
      const key = decodeURIComponent(new URL(req.url).pathname.replace('/__fired/', ''));
      claimAlertKey(key);
      const res = await cache.match(req);
      const firedAt = Number(res ? await res.text() : 0);
      if (!firedAt || firedAt < cutoff) await cache.delete(req);
    }));
  } catch (e) {
    // Cache Storage unavailable — worst case a reminder shows once more in-app
  }
}
