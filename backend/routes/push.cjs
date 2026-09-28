// Web Push API: device subscriptions + upcoming reminder schedule per user.
const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db_mysql.cjs');
const { ensureVapid, saveSubscription, removeSubscription, sendToUser } = require('../services/pushService.cjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'codigix_executive_os_secret_key_2026';
const MAX_REMINDERS = 500;

function getAuthUserId(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      return decoded.id || decoded.userId || decoded.sub || null;
    } catch (e) {
      return null;
    }
  }
  return req.headers['x-user-id'] || null;
}

async function requireContext(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Please sign in to enable phone notifications' });
    return null;
  }
  const pool = await getPool();
  if (!pool) {
    res.status(503).json({ success: false, error: 'Database unavailable' });
    return null;
  }
  return { userId, pool };
}

// GET /api/push/vapid-public-key — the browser needs this to subscribe
router.get('/vapid-public-key', async (req, res) => {
  try {
    const { publicKey } = await ensureVapid();
    res.json({ success: true, publicKey });
  } catch (err) {
    res.status(503).json({ success: false, error: 'Push notifications are not available right now' });
  }
});

// POST /api/push/subscribe  { subscription }
router.post('/subscribe', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    await saveSubscription(ctx.pool, ctx.userId, req.body && req.body.subscription, req.headers['user-agent']);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Could not save subscription' });
  }
});

// POST /api/push/unsubscribe  { endpoint }
router.post('/unsubscribe', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    if (req.body && req.body.endpoint) await removeSubscription(ctx.pool, req.body.endpoint);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not remove subscription' });
  }
});

// GET /api/push/status — devices registered + next pending reminders (for diagnostics)
router.get('/status', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const [[{ devices }]] = await ctx.pool.query('SELECT COUNT(*) AS devices FROM push_subscriptions WHERE user_id = ?', [ctx.userId]);
    const [upcoming] = await ctx.pool.query(
      `SELECT dedupe_key AS dedupeKey, fire_at_ms AS fireAt, title FROM scheduled_reminders
       WHERE user_id = ? AND sent_at_ms IS NULL ORDER BY fire_at_ms ASC LIMIT 5`,
      [ctx.userId]
    );
    res.json({ success: true, devices, upcoming: upcoming.map((u) => ({ ...u, fireAt: Number(u.fireAt) })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not read push status' });
  }
});

// POST /api/push/schedule  { reminders: [{ dedupeKey, fireAt, expiresAt, title, body, url, tag }] }
// Replaces the user's not-yet-sent reminders. Already-sent keys are never re-sent.
router.post('/schedule', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const list = Array.isArray(req.body && req.body.reminders) ? req.body.reminders : null;
    if (!list) return res.status(400).json({ success: false, error: 'reminders must be an array' });
    if (list.length > MAX_REMINDERS) return res.status(400).json({ success: false, error: `At most ${MAX_REMINDERS} reminders` });

    const now = Date.now();
    const rows = [];
    for (const r of list) {
      const fireAt = Number(r.fireAt);
      const expiresAt = Number(r.expiresAt);
      if (!r.dedupeKey || typeof r.dedupeKey !== 'string' || r.dedupeKey.length > 191) continue;
      if (!Number.isFinite(fireAt) || !Number.isFinite(expiresAt) || expiresAt <= fireAt) continue;
      if (expiresAt <= now || fireAt > now + 3 * 86400000) continue;
      if (!r.title || typeof r.title !== 'string') continue;
      const url = typeof r.url === 'string' && r.url.startsWith('/') ? r.url.slice(0, 500) : '/planner';
      rows.push([ctx.userId, r.dedupeKey, fireAt, expiresAt, r.title.slice(0, 255),
        String(r.body || '').slice(0, 500), url, String(r.tag || r.dedupeKey).slice(0, 191)]);
    }

    await ctx.pool.query('DELETE FROM scheduled_reminders WHERE user_id = ? AND sent_at_ms IS NULL', [ctx.userId]);
    if (rows.length) {
      // INSERT IGNORE keeps rows that were already sent (unique user_id + dedupe_key)
      await ctx.pool.query(
        `INSERT IGNORE INTO scheduled_reminders (user_id, dedupe_key, fire_at_ms, expires_at_ms, title, body, url, tag) VALUES ?`,
        [rows]
      );
    }
    res.json({ success: true, scheduled: rows.length, received: list.length });
  } catch (err) {
    console.error('[Push] schedule error:', err.message);
    res.status(500).json({ success: false, error: 'Could not save reminder schedule' });
  }
});

// POST /api/push/test — immediate push to all of the user's devices
router.post('/test', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const delivered = await sendToUser(ctx.pool, ctx.userId, {
      title: '🔔 Test notification',
      body: 'Phone notifications are working. Reminders will arrive even when the app is closed.',
      url: '/notifications',
      tag: `push-test-${Date.now()}`
    });
    if (!delivered) return res.status(404).json({ success: false, error: 'No device is registered for notifications yet' });
    res.json({ success: true, delivered });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not send test notification' });
  }
});

module.exports = router;
