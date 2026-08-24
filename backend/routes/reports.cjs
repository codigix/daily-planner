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

// GET /api/reports - Fetch generated reports
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ success: true, reports: [] });

    const userId = getAuthUserId(req);
    let rows = [];
    if (userId) {
      [rows] = await pool.query('SELECT * FROM generated_reports WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    } else {
      [rows] = await pool.query('SELECT * FROM generated_reports WHERE user_id IS NULL ORDER BY created_at DESC');
    }
    return res.json({ success: true, reports: rows });
  } catch (err) {
    console.error('[ReportsRoute] Fetch error:', err.message);
    res.status(500).json({ success: false, error: err.message, reports: [] });
  }
});

// POST /api/reports - Create new generated report
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const userId = getAuthUserId(req);
    const { name, category, description, created_by, frequency, file_url } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, error: 'Name and Category are required' });
    }

    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM generated_reports');
      const colNames = cols.map(c => c.Field);
      if (!colNames.includes('user_id')) await pool.query("ALTER TABLE generated_reports ADD COLUMN user_id VARCHAR(255)");
    } catch (e) {}

    const [result] = await pool.query(`
      INSERT INTO generated_reports (name, category, description, created_by, frequency, file_url, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, category, description || '', created_by || 'System User', frequency || 'On Demand', file_url || '', userId]);

    const [newRows] = await pool.query('SELECT * FROM generated_reports WHERE id = ?', [result.insertId]);

    return res.json({ success: true, report: newRows[0] });
  } catch (err) {
    console.error('[ReportsRoute] Create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/reports/:id - Delete generated report
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const userId = getAuthUserId(req);
    if (userId) {
      await pool.query('DELETE FROM generated_reports WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    } else {
      await pool.query('DELETE FROM generated_reports WHERE id = ?', [req.params.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[ReportsRoute] Delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
