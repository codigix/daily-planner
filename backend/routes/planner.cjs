const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getPool } = require('../db_mysql.cjs');
const { getDomainIdForTask } = require('../domains.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'codigix_executive_os_secret_key_2026';

// ── Helper: Extract Authenticated User ID from Request ──
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

// GET all planner tasks & schedule timeline for logged-in user from MySQL
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ plannerTasks: [], scheduleTimeline: [] });

    const userId = getAuthUserId(req);
    let rawTasks = [];
    let scheduleTimeline = [];

    if (userId) {
      [rawTasks] = await pool.query(
        'SELECT * FROM planner_tasks WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC',
        [userId]
      );
      [scheduleTimeline] = await pool.query(
        'SELECT * FROM schedule_timeline WHERE user_id = ? OR user_id IS NULL ORDER BY id ASC',
        [userId]
      );
    } else {
      [rawTasks] = await pool.query('SELECT * FROM planner_tasks WHERE user_id IS NULL ORDER BY id DESC');
      [scheduleTimeline] = await pool.query('SELECT * FROM schedule_timeline WHERE user_id IS NULL ORDER BY id ASC');
    }

    const plannerTasks = rawTasks.map(t => {
      let checkpointsParsed = [];
      if (t.checkpoints) {
        try {
          checkpointsParsed = typeof t.checkpoints === 'string' ? JSON.parse(t.checkpoints) : t.checkpoints;
        } catch (e) { checkpointsParsed = []; }
      }
      let completedDatesParsed = {};
      if (t.completed_dates) {
        try {
          completedDatesParsed = typeof t.completed_dates === 'string' ? JSON.parse(t.completed_dates) : t.completed_dates;
        } catch (e) { completedDatesParsed = {}; }
      }
      return {
        ...t,
        checkpoints: Array.isArray(checkpointsParsed) ? checkpointsParsed : [],
        completedDates: completedDatesParsed || {},
        domain_id: t.domain_id || getDomainIdForTask(t.title, t.category)
      };
    });

    res.json({ plannerTasks, scheduleTimeline });
  } catch (err) {
    console.error('[Planner GET Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// POST add a new task to MySQL for logged-in user
router.post('/tasks', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const domain_id = req.body.domain_id || getDomainIdForTask(req.body.title, req.body.category);
    const newTask = {
      id: Date.now().toString(),
      title: req.body.title || 'Untitled Task',
      category: req.body.category || 'Tasks & Execution',
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'Pending',
      time: req.body.time || '04:00 PM',
      date: req.body.date || new Date().toDateString(),
      targetDay: req.body.targetDay || 'Today',
      recurring: req.body.recurring || 'None',
      notes: req.body.notes || '',
      checkpoints: req.body.checkpoints || [],
      completedDates: req.body.completedDates || {},
      domain_id,
      user_id: userId
    };

    if (pool) {
      try {
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN completed_dates TEXT');
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN user_id VARCHAR(255)');
      } catch (e) {}

      const checkpointsStr = Array.isArray(newTask.checkpoints) ? JSON.stringify(newTask.checkpoints) : '[]';
      const completedDatesStr = JSON.stringify(newTask.completedDates);
      await pool.query(
        'INSERT INTO planner_tasks (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, completed_dates, domain_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newTask.id, newTask.title, newTask.category, newTask.priority, newTask.status, newTask.time, newTask.date, newTask.targetDay, newTask.recurring, newTask.notes, checkpointsStr, completedDatesStr, newTask.domain_id, userId]
      );
    }
    res.status(201).json(newTask);
  } catch (err) {
    console.error('[Planner POST Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// PUT update planner task details in MySQL
router.put('/tasks/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const userId = getAuthUserId(req);
    const { status, notes, checkpoints, priority, time, category, title, date, targetDay, recurring, completedDates } = req.body;

    const domain_id = req.body.domain_id || getDomainIdForTask(title, category);

    if (pool) {
      try {
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN completed_dates TEXT');
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN user_id VARCHAR(255)');
      } catch (e) {}

      const checkpointsStr = Array.isArray(checkpoints) ? JSON.stringify(checkpoints) : null;
      const completedDatesStr = completedDates ? JSON.stringify(completedDates) : null;

      if (userId) {
        await pool.query(
          `UPDATE planner_tasks SET
            status = COALESCE(?, status),
            notes = COALESCE(?, notes),
            checkpoints = COALESCE(?, checkpoints),
            priority = COALESCE(?, priority),
            time = COALESCE(?, time),
            category = COALESCE(?, category),
            title = COALESCE(?, title),
            date = COALESCE(?, date),
            targetDay = COALESCE(?, targetDay),
            recurring = COALESCE(?, recurring),
            domain_id = COALESCE(?, domain_id),
            completed_dates = COALESCE(?, completed_dates)
          WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
          [status, notes, checkpointsStr, priority, time, category, title, date, targetDay, recurring, domain_id, completedDatesStr, id, userId]
        );
      } else {
        await pool.query(
          `UPDATE planner_tasks SET
            status = COALESCE(?, status),
            notes = COALESCE(?, notes),
            checkpoints = COALESCE(?, checkpoints),
            priority = COALESCE(?, priority),
            time = COALESCE(?, time),
            category = COALESCE(?, category),
            title = COALESCE(?, title),
            date = COALESCE(?, date),
            targetDay = COALESCE(?, targetDay),
            recurring = COALESCE(?, recurring),
            domain_id = COALESCE(?, domain_id),
            completed_dates = COALESCE(?, completed_dates)
          WHERE id = ?`,
          [status, notes, checkpointsStr, priority, time, category, title, date, targetDay, recurring, domain_id, completedDatesStr, id]
        );
      }
    }
    res.json({ message: 'Task details updated in MySQL' });
  } catch (err) {
    console.error('[Planner PUT Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// POST batch save tasks & schedule items for logged-in user
router.post('/batch', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const { tasks = [], timeline = [] } = req.body;

    if (pool) {
      try {
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN user_id VARCHAR(255)');
        await pool.query('ALTER TABLE schedule_timeline ADD COLUMN user_id VARCHAR(255)');
      } catch (e) {}

      const normalizeStr = s => (s || '').trim().toLowerCase();

      for (const t of tasks) {
        let existing = [];
        if (userId) {
          [existing] = await pool.query(
            'SELECT id FROM planner_tasks WHERE LOWER(TRIM(title)) = ? AND LOWER(TRIM(COALESCE(date,""))) = ? AND LOWER(TRIM(COALESCE(time,""))) = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1',
            [normalizeStr(t.title), normalizeStr(t.date), normalizeStr(t.time), userId]
          ).catch(() => [[]]);
        } else {
          [existing] = await pool.query(
            'SELECT id FROM planner_tasks WHERE LOWER(TRIM(title)) = ? AND LOWER(TRIM(COALESCE(date,""))) = ? AND LOWER(TRIM(COALESCE(time,""))) = ? AND user_id IS NULL LIMIT 1',
            [normalizeStr(t.title), normalizeStr(t.date), normalizeStr(t.time)]
          ).catch(() => [[]]);
        }

        if (existing && existing.length > 0) {
          continue;
        }

        const domain_id = t.domain_id || getDomainIdForTask(t.title, t.category);
        const checkpointsStr = Array.isArray(t.checkpoints) ? JSON.stringify(t.checkpoints) : '[]';

        await pool.query(
          `INSERT INTO planner_tasks
            (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, domain_id, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            title=VALUES(title), category=VALUES(category), priority=VALUES(priority),
            status=VALUES(status), time=VALUES(time), date=VALUES(date),
            targetDay=VALUES(targetDay), recurring=VALUES(recurring),
            notes=VALUES(notes), checkpoints=VALUES(checkpoints), domain_id=VALUES(domain_id), user_id=VALUES(user_id)`,
          [t.id, t.title, t.category, t.priority, t.status || 'Pending', t.time || '', t.date, t.targetDay, t.recurring || 'None', t.notes || '', checkpointsStr, domain_id, userId]
        ).catch(err => console.warn('Batch task save error:', err.message));
      }

      for (const item of timeline) {
        await pool.query(
          `INSERT INTO schedule_timeline (id, time, duration, title, subtitle, status, date, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), subtitle=VALUES(subtitle), status=VALUES(status), date=VALUES(date), user_id=VALUES(user_id)`,
          [item.id, item.time, item.duration || '45m', item.title, item.subtitle || '', item.status || 'Pending', item.date, userId]
        ).catch(err => console.warn('Batch timeline save error:', err.message));
      }
    }

    res.status(201).json({ message: 'Batch tasks saved to database', count: tasks.length });
  } catch (err) {
    console.error('[Planner Batch Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// DELETE single task by ID for logged-in user
router.delete('/tasks/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const userId = getAuthUserId(req);
    if (pool) {
      if (userId) {
        await pool.query('DELETE FROM planner_tasks WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId]);
      } else {
        await pool.query('DELETE FROM planner_tasks WHERE id = ?', [id]);
      }
    }
    res.json({ message: 'Task deleted from database' });
  } catch (err) {
    console.error('[Planner DELETE Task Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// DELETE all tasks for logged-in user only
router.delete('/tasks', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    if (pool) {
      if (userId) {
        await pool.query('DELETE FROM planner_tasks WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM schedule_timeline WHERE user_id = ?', [userId]);
      } else {
        await pool.query('DELETE FROM planner_tasks WHERE user_id IS NULL');
        await pool.query('DELETE FROM schedule_timeline WHERE user_id IS NULL');
      }
    }
    res.json({ message: 'User tasks cleared from database' });
  } catch (err) {
    console.error('[Planner DELETE All Tasks Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// DELETE single schedule item by ID for logged-in user
router.delete('/schedule/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const userId = getAuthUserId(req);
    if (pool) {
      if (userId) {
        await pool.query('DELETE FROM schedule_timeline WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId]);
      } else {
        await pool.query('DELETE FROM schedule_timeline WHERE id = ?', [id]);
      }
    }
    res.json({ message: 'Schedule item deleted from database' });
  } catch (err) {
    console.error('[Planner DELETE Schedule Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

module.exports = router;
