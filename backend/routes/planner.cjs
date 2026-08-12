const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');
const { getDomainIdForTask } = require('../domains.cjs');

// GET all planner tasks & schedule timeline from MySQL
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ plannerTasks: [], scheduleTimeline: [] });

    const [rawTasks] = await pool.query('SELECT * FROM planner_tasks ORDER BY id DESC');
    const [scheduleTimeline] = await pool.query('SELECT * FROM schedule_timeline ORDER BY id ASC');

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
    res.status(500).json({ error: err.message });
  }
});

// POST add a new task to MySQL
router.post('/tasks', async (req, res) => {
  try {
    const pool = await getPool();
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
      domain_id
    };

    if (pool) {
      try {
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN completed_dates TEXT');
      } catch (e) {}

      const checkpointsStr = Array.isArray(newTask.checkpoints) ? JSON.stringify(newTask.checkpoints) : '[]';
      const completedDatesStr = JSON.stringify(newTask.completedDates);
      await pool.query(
        'INSERT INTO planner_tasks (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, completed_dates, domain_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newTask.id, newTask.title, newTask.category, newTask.priority, newTask.status, newTask.time, newTask.date, newTask.targetDay, newTask.recurring, newTask.notes, checkpointsStr, completedDatesStr, newTask.domain_id]
      );
    }
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update planner task details in MySQL
router.put('/tasks/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const { status, notes, checkpoints, priority, time, category, title, date, targetDay, recurring, completedDates } = req.body;

    // Re-compute domain_id if title or category changed
    const domain_id = req.body.domain_id || getDomainIdForTask(title, category);

    if (pool) {
      try {
        await pool.query('ALTER TABLE planner_tasks ADD COLUMN completed_dates TEXT');
      } catch (e) {}

      const checkpointsStr = Array.isArray(checkpoints) ? JSON.stringify(checkpoints) : null;
      const completedDatesStr = completedDates ? JSON.stringify(completedDates) : null;

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
    res.json({ message: 'Task details updated in MySQL' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST batch save tasks & schedule items (with server-side deduplication + domain_id)
router.post('/batch', async (req, res) => {
  try {
    const pool = await getPool();
    const { tasks = [], timeline = [] } = req.body;

    if (pool) {
      const normalizeStr = s => (s || '').trim().toLowerCase();

      for (const t of tasks) {
        // Server-side dedup: skip if same title+date+time already exists
        const [existing] = await pool.query(
          'SELECT id FROM planner_tasks WHERE LOWER(TRIM(title)) = ? AND LOWER(TRIM(COALESCE(date,""))) = ? AND LOWER(TRIM(COALESCE(time,""))) = ? LIMIT 1',
          [normalizeStr(t.title), normalizeStr(t.date), normalizeStr(t.time)]
        ).catch(() => [[]]);

        if (existing && existing.length > 0) {
          console.info(`Skipping duplicate: "${t.title}" on ${t.date}`);
          continue;
        }

        const domain_id = t.domain_id || getDomainIdForTask(t.title, t.category);
        const checkpointsStr = Array.isArray(t.checkpoints) ? JSON.stringify(t.checkpoints) : '[]';

        await pool.query(
          `INSERT INTO planner_tasks
            (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, domain_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            title=VALUES(title), category=VALUES(category), priority=VALUES(priority),
            status=VALUES(status), time=VALUES(time), date=VALUES(date),
            targetDay=VALUES(targetDay), recurring=VALUES(recurring),
            notes=VALUES(notes), checkpoints=VALUES(checkpoints), domain_id=VALUES(domain_id)`,
          [t.id, t.title, t.category, t.priority, t.status || 'Pending', t.time || '', t.date, t.targetDay, t.recurring || 'None', t.notes || '', checkpointsStr, domain_id]
        ).catch(err => console.warn('Batch task save error:', err.message));
      }

      for (const item of timeline) {
        await pool.query(
          `INSERT INTO schedule_timeline (id, time, duration, title, subtitle, status, date)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), subtitle=VALUES(subtitle), status=VALUES(status), date=VALUES(date)`,
          [item.id, item.time, item.duration || '45m', item.title, item.subtitle || '', item.status || 'Pending', item.date]
        ).catch(err => console.warn('Batch timeline save error:', err.message));
      }
    }

    res.status(201).json({ message: 'Batch tasks saved to database', count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE single task by ID
router.delete('/tasks/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    if (pool) await pool.query('DELETE FROM planner_tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all tasks and clear database
router.delete('/tasks', async (req, res) => {
  try {
    const pool = await getPool();
    if (pool) {
      await pool.query('DELETE FROM planner_tasks');
      await pool.query('DELETE FROM schedule_timeline');
    }
    res.json({ message: 'All tasks deleted from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE single schedule item by ID
router.delete('/schedule/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    if (pool) await pool.query('DELETE FROM schedule_timeline WHERE id = ?', [id]);
    res.json({ message: 'Schedule item deleted from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
