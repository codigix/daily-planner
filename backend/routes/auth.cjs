const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db_mysql.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'codigix_executive_os_secret_key_2026';

// ── Helper: Format User Profile Object ──
function formatUser(u) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name || u.fullName || 'Executive User',
    role: u.role || 'Executive',
    avatarUrl: u.avatar_url || u.avatarUrl || ''
  };
}

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Please provide email, password, and full name.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pool = await getPool();

    if (pool) {
      // Check existing email
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      const userId = 'usr_' + Date.now();
      const passwordHash = await bcrypt.hash(password, 10);
      const userRole = role || 'Executive';
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`;

      await pool.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, cleanEmail, passwordHash, fullName.trim(), userRole, avatarUrl]
      );

      const user = { id: userId, email: cleanEmail, fullName: fullName.trim(), role: userRole, avatarUrl };
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({ token, user });
    } else {
      return res.status(500).json({ error: 'Database connection offline.' });
    }
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to register account.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pool = await getPool();

    if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const dbUser = rows[0];
      const isValid = await bcrypt.compare(password, dbUser.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = formatUser(dbUser);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({ token, user });
    } else {
      return res.status(500).json({ error: 'Database connection offline.' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to authenticate user.' });
  }
});

// ── POST /api/auth/google ──
router.post('/google', async (req, res) => {
  try {
    const { credential, userInfo } = req.body;
    let email, name, picture;

    if (credential) {
      // Safely decode Base64URL JWT payload from Google GIS Client
      try {
        const payloadBase64 = credential.split('.')[1];
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        const decodedPayload = JSON.parse(jsonPayload);
        email = decodedPayload.email;
        name = decodedPayload.name;
        picture = decodedPayload.picture;
      } catch (jwtErr) {
        console.error('Error parsing Google JWT Credential:', jwtErr);
        return res.status(400).json({ error: 'Invalid Google credential token format.' });
      }
    } else if (userInfo) {
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      return res.status(400).json({ error: 'No Google credential provided.' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Could not extract valid email from Google Account.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pool = await getPool();

    if (pool) {
      const [existing] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

      let userObj;
      if (existing && existing.length > 0) {
        userObj = formatUser(existing[0]);
        if (picture && (!existing[0].avatar_url || existing[0].avatar_url.includes('ui-avatars'))) {
          await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [picture, existing[0].id]);
          userObj.avatarUrl = picture;
        }
      } else {
        const userId = 'usr_g_' + Date.now();
        const userRole = 'Executive';
        const avatarUrl = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Google User')}&background=0D8ABC&color=fff`;

        await pool.query(
          `INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, cleanEmail, 'google_oauth_user', (name || 'Google User').trim(), userRole, avatarUrl]
        );

        userObj = { id: userId, email: cleanEmail, fullName: (name || 'Google User').trim(), role: userRole, avatarUrl };
      }

      const token = jwt.sign({ id: userObj.id, email: userObj.email, role: userObj.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: userObj });
    } else {
      return res.status(500).json({ error: 'Database connection offline.' });
    }
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to authenticate with Google Account.' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const pool = await getPool();
    if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      return res.json({ user: formatUser(rows[0]) });
    } else {
      return res.status(500).json({ error: 'Database connection offline.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
});

module.exports = router;
