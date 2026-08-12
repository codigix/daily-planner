const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');

// GET /api/reports - Fetch generated reports
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ success: true, reports: [] });

    const [rows] = await pool.query('SELECT * FROM generated_reports ORDER BY created_at DESC');
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

    const { name, category, description, created_by, frequency, file_url } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, error: 'Name and Category are required' });
    }

    const [result] = await pool.query(`
      INSERT INTO generated_reports (name, category, description, created_by, frequency, file_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, category, description || '', created_by || 'System User', frequency || 'On Demand', file_url || '']);

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

    await pool.query('DELETE FROM generated_reports WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[ReportsRoute] Delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
