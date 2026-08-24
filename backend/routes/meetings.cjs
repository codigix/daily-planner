const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getPool } = require('../db_mysql.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'codigix_executive_os_secret_key_2026';

function getAuthUserId(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.id || decoded.userId || decoded.sub || null;
    } catch (e) {
      return null;
    }
  }
  if (req.headers['x-user-id']) return req.headers['x-user-id'];
  if (req.query && req.query.user_id) return req.query.user_id;
  return null;
}

// GET all meetings from MySQL
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ meetings: [] });

    const userId = getAuthUserId(req);
    let rows = [];
    if (userId) {
      [rows] = await pool.query('SELECT * FROM meetings WHERE user_id = ? ORDER BY id DESC', [userId]);
    } else {
      [rows] = await pool.query('SELECT * FROM meetings WHERE user_id IS NULL ORDER BY id DESC');
    }

    const meetings = rows.map(r => ({
      ...r,
      videoLink: r.video_link || r.videoLink || '',
      members: (() => { try { return typeof r.members === 'string' ? JSON.parse(r.members) : (r.members || []); } catch { return []; } })(),
      agenda: (() => { try { return typeof r.agenda === 'string' ? JSON.parse(r.agenda) : (r.agenda || []); } catch { return []; } })(),
      actionItems: (() => { try { return typeof r.action_items === 'string' ? JSON.parse(r.action_items) : (r.action_items || []); } catch { return []; } })()
    }));

    res.json({ meetings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST schedule a new meeting in MySQL
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const b = req.body;
    const newMeeting = {
      id: b.id || ('m' + Date.now()),
      time: b.time || '10:00 AM',
      duration: b.duration || '45 min',
      title: b.title || 'Untitled Meeting',
      description: b.description || '',
      client: b.client || '',
      type: b.type || 'Client',
      status: b.status || 'Upcoming',
      date: b.date || '',
      location: b.location || '',
      videoLink: b.videoLink || b.video_link || '',
      organizer: b.organizer || '',
      members: b.members || [],
      agenda: b.agenda || [],
      actionItems: b.actionItems || [],
      user_id: userId
    };

    if (pool) {
      // Check if date, video_link, and user_id columns exist; add if not
      try {
        const [cols] = await pool.query('SHOW COLUMNS FROM meetings');
        const colNames = cols.map(c => c.Field);
        if (!colNames.includes('date'))       await pool.query("ALTER TABLE meetings ADD COLUMN date VARCHAR(50) DEFAULT ''");
        if (!colNames.includes('location'))   await pool.query("ALTER TABLE meetings ADD COLUMN location VARCHAR(255) DEFAULT ''");
        if (!colNames.includes('video_link')) await pool.query("ALTER TABLE meetings ADD COLUMN video_link TEXT");
        if (!colNames.includes('organizer'))  await pool.query("ALTER TABLE meetings ADD COLUMN organizer VARCHAR(100) DEFAULT ''");
        if (!colNames.includes('user_id'))    await pool.query("ALTER TABLE meetings ADD COLUMN user_id VARCHAR(255)");
      } catch (e) { /* already exists */ }

      await pool.query(
        `INSERT INTO meetings (id, time, duration, title, description, client, type, status, date, location, video_link, organizer, members, agenda, action_items, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status), date=VALUES(date), video_link=VALUES(video_link), user_id=VALUES(user_id)`,
        [
          newMeeting.id, newMeeting.time, newMeeting.duration, newMeeting.title,
          newMeeting.description, newMeeting.client, newMeeting.type, newMeeting.status,
          newMeeting.date, newMeeting.location, newMeeting.videoLink, newMeeting.organizer,
          JSON.stringify(newMeeting.members),
          JSON.stringify(newMeeting.agenda),
          JSON.stringify(newMeeting.actionItems),
          userId
        ]
      );
    }
    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update meeting by ID
router.put('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const { id } = req.params;
    const b = req.body;

    if (pool) {
      try {
        await pool.query("ALTER TABLE meetings ADD COLUMN video_link TEXT");
        await pool.query("ALTER TABLE meetings ADD COLUMN user_id VARCHAR(255)");
      } catch (e) {}

      if (userId) {
        await pool.query(
          `UPDATE meetings SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            client = COALESCE(?, client),
            type = COALESCE(?, type),
            status = COALESCE(?, status),
            time = COALESCE(?, time),
            duration = COALESCE(?, duration),
            date = COALESCE(?, date),
            location = COALESCE(?, location),
            video_link = COALESCE(?, video_link),
            organizer = COALESCE(?, organizer),
            members = COALESCE(?, members),
            agenda = COALESCE(?, agenda),
            action_items = COALESCE(?, action_items)
          WHERE id = ? AND user_id = ?`,
          [
            b.title, b.description, b.client, b.type, b.status,
            b.time, b.duration, b.date, b.location, b.videoLink || b.video_link, b.organizer,
            b.members ? JSON.stringify(b.members) : null,
            b.agenda ? JSON.stringify(b.agenda) : null,
            b.actionItems ? JSON.stringify(b.actionItems) : null,
            id, userId
          ]
        );
      } else {
        await pool.query(
          `UPDATE meetings SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            client = COALESCE(?, client),
            type = COALESCE(?, type),
            status = COALESCE(?, status),
            time = COALESCE(?, time),
            duration = COALESCE(?, duration),
            date = COALESCE(?, date),
            location = COALESCE(?, location),
            video_link = COALESCE(?, video_link),
            organizer = COALESCE(?, organizer),
            members = COALESCE(?, members),
            agenda = COALESCE(?, agenda),
            action_items = COALESCE(?, action_items)
          WHERE id = ?`,
          [
            b.title, b.description, b.client, b.type, b.status,
            b.time, b.duration, b.date, b.location, b.videoLink || b.video_link, b.organizer,
            b.members ? JSON.stringify(b.members) : null,
            b.agenda ? JSON.stringify(b.agenda) : null,
            b.actionItems ? JSON.stringify(b.actionItems) : null,
            id
          ]
        );
      }
    }
    res.json({ message: 'Meeting updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a meeting by ID
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const { id } = req.params;
    if (pool) {
      if (userId) {
        await pool.query('DELETE FROM meetings WHERE id = ? AND user_id = ?', [id, userId]);
      } else {
        await pool.query('DELETE FROM meetings WHERE id = ?', [id]);
      }
    }
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
