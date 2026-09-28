// Web Push delivery: VAPID key management, sending, and the due-reminder dispatcher.
// Reminders are computed on the device (it knows the tasks, diet plan and local time)
// and uploaded to scheduled_reminders; this dispatcher sends them when due, so they
// arrive even while the PWA is closed.
const crypto = require('crypto');
const webpush = require('web-push');
const { getPool } = require('../db_mysql.cjs');

const DISPATCH_INTERVAL_MS = 15000;
let vapidReady = null;
let dispatcherTimer = null;
let dispatching = false;

async function getSetting(pool, key) {
  const [rows] = await pool.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key]);
  return rows[0] ? rows[0].setting_value : null;
}

// VAPID keys: from env if provided, otherwise generated once and stored in app_settings
async function ensureVapid() {
  if (vapidReady) return vapidReady;
  vapidReady = (async () => {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@codigix.local';

    if (!publicKey || !privateKey) {
      const pool = await getPool();
      if (!pool) throw new Error('Database unavailable');
      publicKey = await getSetting(pool, 'vapid_public_key');
      privateKey = await getSetting(pool, 'vapid_private_key');
      if (!publicKey || !privateKey) {
        const keys = webpush.generateVAPIDKeys();
        await pool.query(
          'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?), (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value',
          ['vapid_public_key', keys.publicKey, 'vapid_private_key', keys.privateKey]
        );
        // Re-read in case another process inserted first
        publicKey = await getSetting(pool, 'vapid_public_key');
        privateKey = await getSetting(pool, 'vapid_private_key');
        console.log('[Push] Generated VAPID keys and stored them in app_settings');
      }
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return { publicKey };
  })();
  try {
    return await vapidReady;
  } catch (err) {
    vapidReady = null; // retry next time (e.g. DB was down)
    throw err;
  }
}

const hashEndpoint = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex');

async function saveSubscription(pool, userId, subscription, userAgent) {
  const { endpoint, keys = {} } = subscription || {};
  if (!endpoint || !keys.p256dh || !keys.auth) throw new Error('Invalid push subscription');
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint_hash, endpoint, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
    [userId, hashEndpoint(endpoint), endpoint, keys.p256dh, keys.auth, String(userAgent || '').slice(0, 255)]
  );
}

async function removeSubscription(pool, endpoint) {
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint_hash = ?', [hashEndpoint(endpoint)]);
}

// Send one payload to every device of a user. Returns number of successful deliveries.
async function sendToUser(pool, userId, payload) {
  await ensureVapid();
  const [subs] = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?', [userId]);
  let delivered = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 15 * 60, urgency: 'high', topic: payload.tag ? crypto.createHash('md5').update(payload.tag).digest('hex').slice(0, 32) : undefined }
      );
      delivered++;
      await pool.query('UPDATE push_subscriptions SET last_success_at = CURRENT_TIMESTAMP WHERE id = ?', [sub.id]);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription expired or the user revoked permission on that device
        await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
      } else {
        console.warn(`[Push] Delivery failed (${err.statusCode || err.code || 'error'}):`, err.body || err.message);
      }
    }
  }
  return delivered;
}

async function dispatchDue() {
  if (dispatching) return;
  dispatching = true;
  try {
    const pool = await getPool();
    if (!pool) return;
    const now = Date.now();
    const [due] = await pool.query(
      `SELECT id, user_id, dedupe_key, expires_at_ms, title, body, url, tag
       FROM scheduled_reminders
       WHERE sent_at_ms IS NULL AND fire_at_ms <= ?
       ORDER BY fire_at_ms ASC LIMIT 200`,
      [now]
    );
    for (const r of due) {
      // Claim the row first so a restart or parallel run can't double-send
      const [claim] = await pool.query(
        'UPDATE scheduled_reminders SET sent_at_ms = ?, status = ? WHERE id = ? AND sent_at_ms IS NULL',
        [now, r.expires_at_ms <= now ? 'expired' : 'sending', r.id]
      );
      if (!claim.affectedRows || r.expires_at_ms <= now) continue;
      const delivered = await sendToUser(pool, r.user_id, {
        title: r.title,
        body: r.body || '',
        url: r.url || '/planner',
        tag: r.tag || r.dedupe_key,
        dedupeKey: r.dedupe_key,
        sentAt: now
      });
      await pool.query('UPDATE scheduled_reminders SET status = ? WHERE id = ?', [delivered ? 'sent' : 'no-device', r.id]);
    }
    // Housekeeping: drop rows older than 3 days
    await pool.query('DELETE FROM scheduled_reminders WHERE fire_at_ms < ?', [now - 3 * 86400000]);
  } catch (err) {
    console.warn('[Push] Dispatcher error:', err.message);
  } finally {
    dispatching = false;
  }
}

function startPushDispatcher() {
  if (dispatcherTimer) return;
  ensureVapid().catch((err) => console.warn('[Push] VAPID setup deferred:', err.message));
  dispatcherTimer = setInterval(dispatchDue, DISPATCH_INTERVAL_MS);
  dispatchDue();
  console.log('[Push] Reminder dispatcher started (every 15s)');
}

module.exports = { ensureVapid, saveSubscription, removeSubscription, sendToUser, dispatchDue, startPushDispatcher };
