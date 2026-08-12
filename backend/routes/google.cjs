const express = require('express');
const router = express.Router();
const googleService = require('../services/googleService.cjs');
const { getPool } = require('../db_mysql.cjs');

// Automatic 30-Minute Sync Polling Timer
let syncIntervalTimer = null;
function startScheduledSync() {
  if (syncIntervalTimer) return;
  syncIntervalTimer = setInterval(async () => {
    console.log('⏰ Running 30-Minute Automatic Google Business Sync...');
    try {
      await googleService.performFullSync('Scheduled 30-Min');
    } catch (err) {
      console.error('Scheduled Google Sync Error:', err.message);
    }
  }, 30 * 60 * 1000);
}
startScheduledSync();

// -------------------------------------------------------------
// 1. POST & GET /api/google/login (OAUTH LOGIN INIT)
// -------------------------------------------------------------
const handleGoogleLogin = (req, res) => {
  console.log('[GoogleController] Google OAuth Started');
  const authUrl = googleService.generateAuthUrl();

  if (req.query.redirect === 'true' || req.body?.redirect === true) {
    return res.redirect(authUrl);
  }
  res.json({ success: true, auth_url: authUrl });
};

router.get('/login', handleGoogleLogin);
router.post('/login', handleGoogleLogin);

// -------------------------------------------------------------
// 2. GET & POST /api/google/callback (OAUTH CALLBACK & CODE EXCHANGE)
// -------------------------------------------------------------
const handleGoogleCallback = async (req, res) => {
  const code = req.query.code || req.body?.code;
  const error = req.query.error || req.body?.error;

  if (error) {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.error('[GoogleController] OAuth Error:', error);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Google OAuth Error</title></head>
      <body style="font-family:system-ui;background:#0f172a;color:#fff;padding:3rem;text-align:center;">
        <h2 style="color:#ef4444;">⚠️ Google OAuth Authorization Failed</h2>
        <p>${error}</p>
        <a href="${FRONTEND_URL}" style="color:#f59e0b;font-weight:bold;">Return to Dashboard</a>
      </body>
      </html>
    `);
  }

  try {
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code missing' });
    }

    console.log('[GoogleController] OAuth Success. Exchanging Code for Access Token...');
    const tokenData = await googleService.exchangeCodeForToken(code);
    console.log('[GoogleController] Token Exchanged successfully.');

    const profileData = await googleService.fetchUserProfile(tokenData.access_token);
    await googleService.storeTokens(tokenData, profileData);

    console.log('[GoogleController] Accounts Synced. Triggering full sync...');
    await googleService.performFullSync('OAuth Login Callback', tokenData.access_token);
    console.log('[GoogleController] Sync Completed for Google OAuth Callback.');

    if (req.query.json === 'true' || req.body?.json === true) {
      return res.json({ success: true, message: 'Google OAuth connected successfully', token: tokenData.access_token });
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Business Connected</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 420px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #d97706; color: #fff; text-decoration: none; border-radius: 0.5rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ Google Business Profile Connected!</h2>
          <p style="color:#94a3b8;font-size:0.9rem;margin-top:0.5rem;">
            Google OAuth 2.0 token exchanged & business accounts synced with MySQL.
          </p>
          <a href="${FRONTEND_URL}" class="btn">Return to Marketing Dashboard ↗</a>
        </div>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage('google_auth_success', '*');
              window.close();
            } else {
              window.location.href = "${FRONTEND_URL}";
            }
          }, 1500);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[GoogleController] Callback Error:', err.message);
    res.status(500).send(`<h3>Google OAuth Error: ${err.message}</h3>`);
  }
};

router.get('/callback', handleGoogleCallback);
router.post('/callback', handleGoogleCallback);

// -------------------------------------------------------------
// 3. POST /api/google/sync (MANUAL SYNC TRIGGER)
// -------------------------------------------------------------
router.post('/sync', async (req, res) => {
  try {
    console.log('[GoogleController] Manual Sync Triggered by User.');
    const result = await googleService.performFullSync('Manual Sync');
    res.json(result);
  } catch (err) {
    console.error('[GoogleController] Sync API Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. GET /api/google/dashboard (AGGREGATED DASHBOARD PAYLOAD API)
// -------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  try {
    const payload = await googleService.getDashboardPayload();
    res.json(payload);
  } catch (err) {
    console.error('[GoogleController] Dashboard API Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. GET /api/google/profile (USER PROFILE API)
// -------------------------------------------------------------
router.get('/profile', async (req, res) => {
  try {
    const dashboard = await googleService.getDashboardPayload();
    res.json({ success: true, account: dashboard.account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. GET /api/google/accounts (BUSINESS ACCOUNTS API)
// -------------------------------------------------------------
router.get('/accounts', async (req, res) => {
  const pool = await getPool();
  if (!pool) return res.status(500).json({ success: false, error: 'DB Error' });
  try {
    const [rows] = await pool.query('SELECT * FROM google_accounts');
    res.json({ success: true, accounts: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. GET /api/google/locations (LOCATIONS LIST API)
// -------------------------------------------------------------
router.get('/locations', async (req, res) => {
  const pool = await getPool();
  if (!pool) return res.status(500).json({ success: false, error: 'DB Error' });
  try {
    const [rows] = await pool.query('SELECT * FROM google_locations ORDER BY updated_at DESC');
    res.json({ success: true, locations: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. GET /api/google/reviews (REVIEWS LIST API)
// -------------------------------------------------------------
router.get('/reviews', async (req, res) => {
  const pool = await getPool();
  if (!pool) return res.status(500).json({ success: false, error: 'DB Error' });
  try {
    const [rows] = await pool.query('SELECT * FROM google_reviews ORDER BY updated_at DESC');
    res.json({ success: true, reviews: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. GET /api/google/performance (PERFORMANCE METRICS API)
// -------------------------------------------------------------
router.get('/performance', async (req, res) => {
  try {
    const dashboard = await googleService.getDashboardPayload();
    res.json({ success: true, performance: dashboard.performance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. GET /api/google/photos (PHOTOS & MEDIA API)
// -------------------------------------------------------------
router.get('/photos', async (req, res) => {
  const pool = await getPool();
  if (!pool) return res.status(500).json({ success: false, error: 'DB Error' });
  try {
    const [rows] = await pool.query('SELECT * FROM google_photos ORDER BY uploaded_at DESC');
    res.json({ success: true, photos: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. POST /api/google/disconnect (DISCONNECT ACCOUNT API)
// -------------------------------------------------------------
router.post('/disconnect', async (req, res) => {
  const pool = await getPool();
  if (!pool) return res.status(500).json({ success: false, error: 'DB Error' });
  try {
    await pool.query('TRUNCATE TABLE google_accounts');
    await pool.query('TRUNCATE TABLE google_locations');
    await pool.query('TRUNCATE TABLE google_reviews');
    await pool.query('TRUNCATE TABLE google_photos');
    await pool.query('TRUNCATE TABLE google_posts');
    await pool.query('TRUNCATE TABLE google_performance');
    res.json({ success: true, connected: false, message: 'Google Business Account disconnected and cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 12. POST /api/google/token (MANUAL TOKEN UPDATE API)
// -------------------------------------------------------------
router.post('/token', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ success: false, message: 'Access token required' });

  try {
    const profileData = await googleService.fetchUserProfile(access_token);
    await googleService.storeTokens({ access_token, expires_in: 3600 }, profileData);
    const syncResult = await googleService.performFullSync('Manual Access Token Update');
    res.json({ success: true, message: 'Google Access Token saved and live data synced!', dashboard: syncResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
