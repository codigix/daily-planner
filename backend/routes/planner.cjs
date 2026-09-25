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
        'SELECT * FROM planner_tasks WHERE user_id = ? ORDER BY id DESC',
        [userId]
      );
      [scheduleTimeline] = await pool.query(
        'SELECT * FROM schedule_timeline WHERE user_id = ? ORDER BY id ASC',
        [userId]
      );
    } else {
      [rawTasks] = await pool.query('SELECT * FROM planner_tasks WHERE user_id IS NULL ORDER BY id DESC');
      [scheduleTimeline] = await pool.query('SELECT * FROM schedule_timeline WHERE user_id IS NULL ORDER BY id ASC');
    }

    // Deduplicate plannerTasks by fingerprint (normalized title + time + date + targetDay)
    const normalizeTitle = s => (s || '').trim().toLowerCase().replace(/\[🥗\s*diet\]\s*/i, '');
    const normalizeTime = s => (s || '').split('–')[0].split('-')[0].trim().toLowerCase();
    const seenTaskKeys = new Set();
    const duplicateTaskIds = [];
    const uniqueRawTasks = [];

    for (const t of rawTasks) {
      const key = `${normalizeTitle(t.title)}||${normalizeTime(t.time)}||${(t.date || '').trim().toLowerCase()}||${(t.targetDay || '').trim().toLowerCase()}`;
      if (seenTaskKeys.has(key)) {
        duplicateTaskIds.push(t.id);
      } else {
        seenTaskKeys.add(key);
        uniqueRawTasks.push(t);
      }
    }

    // Deduplicate scheduleTimeline
    const seenTlKeys = new Set();
    const duplicateTlIds = [];
    const uniqueTimeline = [];

    for (const tl of scheduleTimeline) {
      const key = `${normalizeTitle(tl.title)}||${normalizeTime(tl.time)}||${(tl.date || '').trim().toLowerCase()}`;
      if (seenTlKeys.has(key)) {
        duplicateTlIds.push(tl.id);
      } else {
        seenTlKeys.add(key);
        uniqueTimeline.push(tl);
      }
    }

    // Asynchronously prune duplicates from MySQL so database is kept clean
    if (pool && duplicateTaskIds.length > 0) {
      const placeholders = duplicateTaskIds.map(() => '?').join(',');
      pool.query(`DELETE FROM planner_tasks WHERE id IN (${placeholders})`, duplicateTaskIds)
        .then(() => console.log(`[Auto-Deduplicate]: Pruned ${duplicateTaskIds.length} duplicate planner tasks from DB`))
        .catch(err => console.warn('Prune duplicate tasks error:', err.message));
    }
    if (pool && duplicateTlIds.length > 0) {
      const placeholders = duplicateTlIds.map(() => '?').join(',');
      pool.query(`DELETE FROM schedule_timeline WHERE id IN (${placeholders})`, duplicateTlIds)
        .then(() => console.log(`[Auto-Deduplicate]: Pruned ${duplicateTlIds.length} duplicate timeline items from DB`))
        .catch(err => console.warn('Prune duplicate timeline error:', err.message));
    }

    const plannerTasks = uniqueRawTasks.map(t => {
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

    res.json({ plannerTasks, scheduleTimeline: uniqueTimeline });
  } catch (err) {
    console.error('[Planner GET Error]:', err.message);
    res.status(500).json({ error: 'Database connection temporarily unavailable' });
  }
});

// POST Manual Deduplicate Endpoint: Prune all duplicate tasks from MySQL
router.post('/deduplicate', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ success: true, removedCount: 0 });
    const userId = getAuthUserId(req);

    const [tasks] = userId
      ? await pool.query('SELECT id, title, time, date, targetDay FROM planner_tasks WHERE user_id = ? ORDER BY id ASC', [userId])
      : await pool.query('SELECT id, title, time, date, targetDay FROM planner_tasks WHERE user_id IS NULL ORDER BY id ASC');

    const normalizeTitle = s => (s || '').trim().toLowerCase().replace(/\[🥗\s*diet\]\s*/i, '');
    const normalizeTime = s => (s || '').split('–')[0].split('-')[0].trim().toLowerCase();
    const seen = new Set();
    const toDelete = [];

    for (const t of tasks) {
      const key = `${normalizeTitle(t.title)}||${normalizeTime(t.time)}||${(t.date || '').trim().toLowerCase()}||${(t.targetDay || '').trim().toLowerCase()}`;
      if (seen.has(key)) {
        toDelete.push(t.id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      const placeholders = toDelete.map(() => '?').join(',');
      await pool.query(`DELETE FROM planner_tasks WHERE id IN (${placeholders})`, toDelete);
    }

    res.json({ success: true, removedCount: toDelete.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      } catch (e) { }

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
      } catch (e) { }

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
          WHERE id = ? AND user_id = ?`,
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
      } catch (e) { }

      const normalizeStr = s => (s || '').trim().toLowerCase();

      for (const t of tasks) {
        let existing = [];
        if (userId) {
          [existing] = await pool.query(
            'SELECT id FROM planner_tasks WHERE LOWER(TRIM(title)) = ? AND LOWER(TRIM(COALESCE(date,""))) = ? AND LOWER(TRIM(COALESCE(time,""))) = ? AND user_id = ? LIMIT 1',
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
        await pool.query('DELETE FROM planner_tasks WHERE id = ? AND user_id = ?', [id, userId]);
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
        await pool.query('DELETE FROM schedule_timeline WHERE id = ? AND user_id = ?', [id, userId]);
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

// ── DIET & NUTRITION MODULE ROUTES ──
const { parseXlsx } = require('../diet_excel_reader.cjs');
const fs = require('fs');
const path = require('path');

// In-memory + persistent diet tracking store
const dietCompletionsStore = {};

router.get('/diet-inspect', (req, res) => {
  try {
    const defaultPath = 'D:\\downloads\\Daily_Planner_Weekly_Diet_Import.xlsx';
    const filePath = req.query.path || defaultPath;
    const data = parseXlsx(filePath);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET Diet Plan (Parsed from Excel with full details)
router.get('/diet/plan', (req, res) => {
  try {
    const defaultPath = 'D:\\downloads\\Daily_Planner_Weekly_Diet_Import.xlsx';
    const filePath = req.query.path || defaultPath;
    if (fs.existsSync(filePath)) {
      const parsed = parseXlsx(filePath);
      return res.json({ success: true, source: 'excel', data: parsed });
    }
    res.json({ success: true, source: 'cached' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Diet Completion Status for user
router.get('/diet/status', (req, res) => {
  const userId = getAuthUserId(req) || 'guest';
  const userStatus = dietCompletionsStore[userId] || {};
  res.json({ success: true, status: userStatus });
});

// POST Diet Completion Status for user (Complete, Skip, Reschedule)
router.post('/diet/status', (req, res) => {
  try {
    const userId = getAuthUserId(req) || 'guest';
    const { taskId, date, day, status, skipReason, rescheduledTime, timestamp } = req.body;
    if (!dietCompletionsStore[userId]) {
      dietCompletionsStore[userId] = {};
    }
    const key = `${date || new Date().toISOString().split('T')[0]}_${taskId}`;
    dietCompletionsStore[userId][key] = {
      taskId,
      date: date || new Date().toISOString().split('T')[0],
      day,
      status, // 'completed' | 'skipped' | 'rescheduled' | 'pending'
      skipReason: skipReason || '',
      rescheduledTime: rescheduledTime || null,
      updatedAt: timestamp || new Date().toISOString()
    };
    res.json({ success: true, entry: dietCompletionsStore[userId][key] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Sync Diet Items into Daily Planner Tasks & Timeline
router.post('/diet/sync-to-planner', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = getAuthUserId(req);
    const { items = [], targetDate, targetDay } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No diet items provided for syncing' });
    }

    const effectiveDate = targetDate || new Date().toDateString();
    const effectiveDay = targetDay || new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const cleanDay = (effectiveDay || '').toLowerCase();

    const newTasks = items.map((item, i) => {
      // Ingredients as checkpoints
      const ingredientCheckpoints = (item.description || '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map((ing, idx) => ({
          id: `diet_cp_${(item.day || effectiveDay).toLowerCase()}_${item.time.replace(':', '')}_${idx}`,
          text: ing,
          done: false
        }));

      // Deterministic unique task ID: diet_{day}_{time}
      const taskId = item.id ? `diet_${item.id}` : `diet_${(item.day || effectiveDay).toLowerCase()}_${item.time.replace(':', '')}`;

      return {
        id: taskId,
        title: `${item.taskTitle}`,
        category: item.category || 'Nutrition',
        priority: ['Breakfast', 'Lunch', 'Dinner', 'Nutrition', 'Hydration'].includes(item.category) ? 'High' : 'Medium',
        status: 'Pending',
        time: item.timeFormatted || item.time,
        date: effectiveDate,
        targetDay: item.day || effectiveDay,
        recurring: 'Weekly',
        notes: `Ingredients:\n${item.description}\n\nInstructions:\n${item.instructions || 'N/A'}${item.nextDayPrepReminder ? `\n\nNext Day Prep:\n${item.nextDayPrepReminder}` : ''}`,
        checkpoints: ingredientCheckpoints,
        user_id: userId,
        domain_id: 1
      };
    });

    const newTimeline = items.map((item, i) => ({
      id: `diet_tl_${(item.day || effectiveDay).toLowerCase()}_${item.time.replace(':', '')}`,
      time: item.timeFormatted || item.time,
      duration: '30m',
      title: item.taskTitle,
      subtitle: `${item.category} • Diet Plan`,
      status: 'Pending',
      color: 'emerald',
      date: effectiveDate,
      user_id: userId
    }));

    if (pool) {
      // 1. Clean up any existing duplicate tasks for this day / date in MySQL
      const dietPrefixed = items.map(it => `[🥗 Diet] ${it.taskTitle}`);
      const rawTitles = items.map(it => it.taskTitle.trim());
      const allTitles = Array.from(new Set([...dietPrefixed, ...rawTitles]));
      const placeholders = allTitles.map(() => '?').join(',');

      await pool.query(
        `DELETE FROM planner_tasks 
         WHERE (user_id = ? OR (user_id IS NULL AND ? IS NULL))
           AND (targetDay = ? OR date = ?)
           AND (title IN (${placeholders}) OR id LIKE 'diet_%')`,
        [userId, userId, effectiveDay, effectiveDate, ...allTitles]
      ).catch(e => console.warn('Clean up existing diet tasks error:', e.message));

      await pool.query(
        `DELETE FROM schedule_timeline 
         WHERE (user_id = ? OR (user_id IS NULL AND ? IS NULL))
           AND date = ?
           AND (subtitle LIKE '%Diet Plan%' OR id LIKE 'diet_tl_%')`,
        [userId, userId, effectiveDate]
      ).catch(e => console.warn('Clean up existing diet timeline error:', e.message));

      // 2. Insert or update the canonical deterministic tasks
      for (const t of newTasks) {
        await pool.query(
          `INSERT INTO planner_tasks 
            (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, user_id, domain_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), 
             category = VALUES(category),
             priority = VALUES(priority),
             status = VALUES(status),
             time = VALUES(time),
             date = VALUES(date),
             targetDay = VALUES(targetDay),
             recurring = VALUES(recurring),
             notes = VALUES(notes), 
             checkpoints = VALUES(checkpoints),
             user_id = VALUES(user_id),
             domain_id = VALUES(domain_id)`,
          [
            t.id, t.title, t.category, t.priority, t.status, t.time, t.date, t.targetDay,
            t.recurring, t.notes, JSON.stringify(t.checkpoints), t.user_id, t.domain_id
          ]
        );
      }

      for (const tl of newTimeline) {
        await pool.query(
          `INSERT INTO schedule_timeline 
            (id, time, duration, title, subtitle, status, color, date, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), 
             subtitle = VALUES(subtitle), 
             status = VALUES(status),
             color = VALUES(color),
             date = VALUES(date),
             user_id = VALUES(user_id)`,
          [tl.id, tl.time, tl.duration, tl.title, tl.subtitle, tl.status, tl.color, tl.date, tl.user_id]
        );
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${newTasks.length} diet tasks for ${effectiveDay} (${effectiveDate})`,
      tasks: newTasks,
      timeline: newTimeline
    });
  } catch (err) {
    console.error('[Diet Sync to Planner Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /deduplicate: Explicitly prune duplicate tasks and timeline items
router.post('/deduplicate', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ success: true, removedTasksCount: 0, removedTimelineCount: 0 });

    const userId = getAuthUserId(req);
    let rawTasks = [];
    let scheduleTimeline = [];

    if (userId) {
      [rawTasks] = await pool.query('SELECT * FROM planner_tasks WHERE user_id = ? ORDER BY id DESC', [userId]);
      [scheduleTimeline] = await pool.query('SELECT * FROM schedule_timeline WHERE user_id = ? ORDER BY id ASC', [userId]);
    } else {
      [rawTasks] = await pool.query('SELECT * FROM planner_tasks WHERE user_id IS NULL ORDER BY id DESC');
      [scheduleTimeline] = await pool.query('SELECT * FROM schedule_timeline WHERE user_id IS NULL ORDER BY id ASC');
    }

    const normalizeTitle = s => (s || '').trim().toLowerCase().replace(/\[🥗\s*diet\]\s*/i, '');
    const normalizeTime = s => (s || '').split('–')[0].split('-')[0].trim().toLowerCase();

    const seenTaskKeys = new Set();
    const duplicateTaskIds = [];

    for (const t of rawTasks) {
      const key = `${normalizeTitle(t.title)}||${normalizeTime(t.time)}||${(t.date || '').trim().toLowerCase()}||${(t.targetDay || '').trim().toLowerCase()}`;
      if (seenTaskKeys.has(key)) {
        duplicateTaskIds.push(t.id);
      } else {
        seenTaskKeys.add(key);
      }
    }

    const seenTlKeys = new Set();
    const duplicateTlIds = [];

    for (const tl of scheduleTimeline) {
      const key = `${normalizeTitle(tl.title)}||${normalizeTime(tl.time)}||${(tl.date || '').trim().toLowerCase()}`;
      if (seenTlKeys.has(key)) {
        duplicateTlIds.push(tl.id);
      } else {
        seenTlKeys.add(key);
      }
    }

    if (duplicateTaskIds.length > 0) {
      const placeholders = duplicateTaskIds.map(() => '?').join(',');
      await pool.query(`DELETE FROM planner_tasks WHERE id IN (${placeholders})`, duplicateTaskIds);
    }

    if (duplicateTlIds.length > 0) {
      const placeholders = duplicateTlIds.map(() => '?').join(',');
      await pool.query(`DELETE FROM schedule_timeline WHERE id IN (${placeholders})`, duplicateTlIds);
    }

    res.json({
      success: true,
      removedTasksCount: duplicateTaskIds.length,
      removedTimelineCount: duplicateTlIds.length,
      message: `Pruned ${duplicateTaskIds.length} duplicate tasks and ${duplicateTlIds.length} duplicate timeline items.`
    });
  } catch (err) {
    console.error('[Planner Deduplicate Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/planner/voice-analyze
// Analyzes spoken voice transcript using AI (Gemini / Intelligent NLP) to structure the optimal task
router.post('/voice-analyze', async (req, res) => {
  try {
    const { transcript, currentDateStr, currentDayName } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const cleanSpeech = transcript.trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.FALLBACK_AI_KEY;

    let aiResult = null;

    // Try Gemini API if available
    if (apiKey && typeof fetch !== 'undefined') {
      try {
        const prompt = `You are an elite executive productivity AI assistant for Codigix Daily Planner OS.
Analyze the following user speech transcript:
"${cleanSpeech}"

Current Reference Date: ${currentDateStr || new Date().toDateString()} (${currentDayName || 'Today'})

Extract and generate the most optimal executive task in JSON format only (no markdown, no backticks):
{
  "title": "Actionable, clear, professional task title",
  "time": "e.g. 10:00 AM – 11:00 AM or 02:30 PM – 03:15 PM (infer from speech or default to a reasonable hour)",
  "date": "Date string in format 'Wed Oct 14 2026' or 'Today' if today",
  "targetDay": "e.g. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, or Today",
  "priority": "High | Medium | Low (set High if urgent/critical/asap/important, else Medium)",
  "category": "Meetings | Strategy & Business Growth | Engineering | Tasks & Execution | Health | Sales & Clients | Operations",
  "notes": "Brief summary of context or details mentioned",
  "checkpoints": ["Actionable subtask 1", "Actionable subtask 2", "Actionable subtask 3"]
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            }),
            signal: AbortSignal.timeout(6000)
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiResult = JSON.parse(cleanJson);
          }
        }
      } catch (geminiErr) {
        console.warn('[Voice Assistant] Gemini API skipped/failed, using NLP fallback:', geminiErr.message);
      }
    }

    // Fallback: Robust Rule-Based NLP Parser
    if (!aiResult) {
      aiResult = parseSpeechWithNLP(cleanSpeech, currentDateStr, currentDayName);
    }

    res.json({
      success: true,
      task: aiResult
    });
  } catch (err) {
    console.error('[Voice Assistant Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// Robust NLP fallback parser for voice speech
function parseSpeechWithNLP(speech, currentDateStr, currentDayName) {
  const lower = speech.toLowerCase();

  // 1. Date Detection
  let targetDate = new Date();
  let targetDay = 'Today';

  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
    targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else if (lower.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
    targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const todayDayIndex = targetDate.getDay();
        const diff = (i + 7 - todayDayIndex) % 7;
        targetDate.setDate(targetDate.getDate() + (diff === 0 ? 7 : diff));
        targetDay = days[i].charAt(0).toUpperCase() + days[i].slice(1);
        break;
      }
    }
  }

  // 2. Time Detection
  let finalTime = '10:00 AM – 11:00 AM';
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i;
  const timeMatch = lower.match(timeRegex);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3].toLowerCase().startsWith('p') ? 'PM' : 'AM';
    if (hour === 0) hour = 12;

    const endHour = hour === 12 ? 1 : hour + 1;
    const pad = n => (n < 10 ? '0' + n : n);
    finalTime = `${pad(hour)}:${pad(min)} ${ampm} – ${pad(endHour)}:${pad(min)} ${ampm}`;
  } else if (lower.includes('morning')) {
    finalTime = '09:00 AM – 10:00 AM';
  } else if (lower.includes('afternoon') || lower.includes('noon')) {
    finalTime = '02:00 PM – 03:00 PM';
  } else if (lower.includes('evening')) {
    finalTime = '05:00 PM – 06:00 PM';
  } else if (lower.includes('night')) {
    finalTime = '08:30 PM – 09:15 PM';
  }

  // 3. Priority Detection
  let priority = 'Medium';
  if (/\b(urgent|asap|critical|important|top priority|high priority|emergency|must)\b/i.test(lower)) {
    priority = 'High';
  } else if (/\b(later|whenever|low priority|minor|optional)\b/i.test(lower)) {
    priority = 'Low';
  }

  // 4. Category Detection
  let category = 'Tasks & Execution';
  if (/\b(meeting|meet|sync|zoom|call|interview|discuss|alignment|team)\b/i.test(lower)) {
    category = 'Meetings';
  } else if (/\b(client|customer|sales|pitch|proposal|deal|contract|lead)\b/i.test(lower)) {
    category = 'Sales & Clients';
  } else if (/\b(diet|food|lunch|dinner|breakfast|snack|drink|water|workout|gym|yoga|exercise|health|sleep)\b/i.test(lower)) {
    category = 'Health';
  } else if (/\b(bug|code|deploy|frontend|backend|api|database|feature|release|git|test)\b/i.test(lower)) {
    category = 'Engineering';
  } else if (/\b(strategy|roadmap|kpi|review|growth|revenue|budget|finance|invoice)\b/i.test(lower)) {
    category = 'Strategy & Business Growth';
  }

  // 5. Clean Title Extraction
  let cleanTitle = speech
    .replace(/^(\s*can you|\s*please|\s*remind me to|\s*schedule a|\s*create a task for|\s*i want to|\s*i need to|\s*add a task to)\s*/i, '')
    .replace(/\b(tomorrow|today|day after tomorrow|yesterday)\b/gi, '')
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanTitle.length < 3) cleanTitle = speech.trim();
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // 6. Action Checkpoints
  const subParts = cleanTitle.split(/\b(?:and|then|also|after that)\b|,|;/i).map(s => s.trim()).filter(s => s.length > 3);
  let checkpoints = [];
  if (subParts.length > 1) {
    checkpoints = subParts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
  } else {
    checkpoints = [
      `Review requirements for ${cleanTitle.slice(0, 30)}`,
      'Execute key deliverables',
      'Follow up and confirm completion'
    ];
  }

  return {
    title: cleanTitle,
    time: finalTime,
    date: targetDate.toDateString(),
    targetDay: targetDay,
    priority: priority,
    category: category,
    notes: `Voice input: "${speech}"`,
    checkpoints: checkpoints
  };
}

module.exports = router;

