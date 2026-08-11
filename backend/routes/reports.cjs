const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({});

    const [rows] = await pool.query('SELECT metric_value FROM telemetry_overview WHERE metric_key = "reports"');
    if (rows.length > 0) {
      const val = typeof rows[0].metric_value === 'string' ? JSON.parse(rows[0].metric_value) : rows[0].metric_value;
      return res.json(val);
    }
    res.json({});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
