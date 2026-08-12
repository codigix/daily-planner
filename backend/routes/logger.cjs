const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');
const { EXECUTIVE_DOMAINS } = require('../domains.cjs');

// GET all 22 logger domains from DB
router.get('/domains', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ domains: EXECUTIVE_DOMAINS });

    const [rows] = await pool.query('SELECT * FROM logger_domains ORDER BY id ASC');
    if (rows.length === 0) {
      return res.json({ domains: EXECUTIVE_DOMAINS });
    }

    const domains = rows.map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      color: r.color,
      lightClass: r.light_class,
      barColor: r.bar_color,
      keywords: (() => {
        try { return typeof r.keywords === 'string' ? JSON.parse(r.keywords) : r.keywords; }
        catch (e) { return []; }
      })()
    }));

    res.json({ domains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET domain tasks grouped by domain from MySQL (legacy – still works)
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ domains: [] });

    const [rows] = await pool.query('SELECT * FROM domain_tasks ORDER BY domain_id ASC');

    const domainsMap = {};
    rows.forEach(r => {
      if (!domainsMap[r.domain_id]) {
        domainsMap[r.domain_id] = { id: r.domain_id, title: r.domain_title, tasks: [] };
      }
      domainsMap[r.domain_id].tasks.push({
        id: r.id,
        title: r.title,
        status: r.status,
        note: r.note
      });
    });

    res.json({ domains: Object.values(domainsMap) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update domain task status — syncs planner_tasks.status AND domain_tasks.status
router.put('/task-status', async (req, res) => {
  try {
    const pool = await getPool();
    const { taskId, status, domainId } = req.body;

    if (pool) {
      // Map logger status to planner status
      const plannerStatus = status === 'DONE' ? 'Completed' : 'Pending';

      // Update planner_tasks
      await pool.query(
        'UPDATE planner_tasks SET status = ? WHERE id = ?',
        [plannerStatus, taskId]
      ).catch(() => {});

      // Update domain_tasks if it exists there
      await pool.query(
        'UPDATE domain_tasks SET status = ? WHERE id = ?',
        [status, taskId]
      ).catch(() => {});
    }

    res.json({ message: 'Task status synced across planner and logger' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
