// Diet & Wellness items: add individually or import from an Excel/CSV sheet.
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db_mysql.cjs');
const { parseSpreadsheet } = require('../xlsx_reader.cjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'codigix_executive_os_secret_key_2026';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MAX_IMPORT_ROWS = 1000;

function getAuthUserId(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      return decoded.id || decoded.userId || decoded.sub || null;
    } catch (e) {
      return null;
    }
  }
  return req.headers['x-user-id'] || null;
}

// ── Value normalizers (accept what people actually type into spreadsheets) ──
const pad = (n) => String(n).padStart(2, '0');

function normalizeTime(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    // Excel time = fraction of a day (a full datetime has an integer date part)
    const frac = value % 1;
    const mins = Math.round(frac * 1440) % 1440;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  }
  const s = String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  let m = s.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  let h, min, mer;
  if (m) { h = +m[1]; min = +m[2]; mer = m[3]; }
  else if ((m = s.match(/^(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)$/))) { h = +m[1]; min = 0; mer = m[2]; }
  else return null;
  if (mer) {
    if (h < 1 || h > 12) return null;
    const pm = mer.startsWith('p');
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

function isValidYmd(y, mo, d) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    // Excel serial date: days since 1899-12-30
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    const a = +m[1]; const b = +m[2];
    y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    // Day-first (dd/mm/yyyy) unless that is impossible and month-first works
    if (b > 12 && a <= 12) { mo = a; d = b; } else { d = a; mo = b; }
  } else return null;
  return isValidYmd(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
}

function normalizeDay(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  return DAYS.find((d) => d.toLowerCase() === s || d.toLowerCase().slice(0, 3) === s.slice(0, 3) && s.length >= 3) || null;
}

function normalizeRepeat(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return null;
  if (['once', 'one time', 'one-time', 'none', 'no', 'single'].includes(s)) return 'once';
  if (['weekly', 'every week', 'week', 'yes'].includes(s)) return 'weekly';
  if (['daily', 'every day', 'everyday', 'day'].includes(s)) return 'daily';
  return undefined; // unrecognised
}

const dayOfDate = (ymd) => DAYS[(new Date(`${ymd}T00:00:00Z`).getUTCDay() + 6) % 7];

// Validate one item (from the form or a sheet row). Returns { item, errors }.
function validateItem(input) {
  const errors = [];
  const title = String(input.title ?? '').trim();
  if (!title) errors.push('Title is required');
  else if (title.length > 255) errors.push('Title must be 255 characters or fewer');

  const time = normalizeTime(input.time);
  if (!time) errors.push(input.time ? `Time "${input.time}" is not valid (use e.g. 07:30 or 7:30 AM)` : 'Time is required');

  const hasDate = input.date !== undefined && input.date !== null && String(input.date).trim() !== '';
  const date = hasDate ? normalizeDate(input.date) : null;
  if (hasDate && !date) errors.push(`Date "${input.date}" is not valid (use YYYY-MM-DD or DD/MM/YYYY)`);

  const hasDay = input.day !== undefined && input.day !== null && String(input.day).trim() !== '';
  let day = hasDay ? normalizeDay(input.day) : null;
  if (hasDay && !day) errors.push(`Day "${input.day}" is not a weekday name`);

  let repeat = normalizeRepeat(input.repeat);
  if (repeat === undefined) {
    errors.push(`Repeat "${input.repeat}" must be Once, Weekly or Daily`);
    repeat = null;
  }
  if (!repeat) repeat = date ? 'once' : day ? 'weekly' : null;

  if (repeat === 'once' && !date && !(hasDate && !date)) errors.push('Date is required for a one-time item');
  if (repeat === 'weekly' && !day) {
    if (date) day = dayOfDate(date);
    else if (!hasDay) errors.push('Day or Date is required for a weekly item');
  }
  if (!repeat && !hasDate && !hasDay) errors.push('Add a Date (one-time) or a Day (weekly)');

  let reminder = 10;
  if (input.reminderMinutes !== undefined && input.reminderMinutes !== null && String(input.reminderMinutes).trim() !== '') {
    reminder = Number(String(input.reminderMinutes).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(reminder) || reminder < 0 || reminder > 240) {
      errors.push('Reminder must be between 0 and 240 minutes');
      reminder = 10;
    }
    reminder = Math.round(reminder);
  }

  const category = String(input.category ?? '').trim().slice(0, 50) || 'Nutrition';

  return {
    errors,
    item: {
      title,
      time,
      date: repeat === 'once' ? date : repeat === 'weekly' ? date : null,
      day: repeat === 'weekly' ? day : repeat === 'once' && date ? dayOfDate(date) : null,
      repeat: repeat || 'once',
      category,
      description: String(input.description ?? '').trim(),
      instructions: String(input.instructions ?? '').trim(),
      reminderMinutes: reminder
    }
  };
}

const toRow = (r) => ({
  id: r.id,
  date: r.item_date,
  day: r.day_of_week,
  repeat: r.repeat_type,
  time: r.time,
  category: r.category,
  title: r.title,
  description: r.description || '',
  instructions: r.instructions || '',
  reminderMinutes: r.reminder_minutes,
  source: r.source,
  createdAt: r.created_at
});

const SELECT_COLUMNS = `id, DATE_FORMAT(item_date, '%Y-%m-%d') AS item_date, day_of_week, repeat_type, time,
  category, title, description, instructions, reminder_minutes, source, created_at`;

// Same user + schedule + time + title counts as a duplicate
async function findDuplicate(pool, userId, item, excludeId = null) {
  const [rows] = await pool.query(
    `SELECT id FROM diet_items
     WHERE user_id = ? AND repeat_type = ? AND time = ? AND LOWER(title) = LOWER(?)
       AND (item_date <=> ?) AND (day_of_week <=> ?) ${excludeId ? 'AND id <> ?' : ''}
     LIMIT 1`,
    [userId, item.repeat, item.time, item.title, item.repeat === 'once' ? item.date : null,
      item.repeat === 'weekly' ? item.day : null, ...(excludeId ? [excludeId] : [])]
  );
  return rows[0] || null;
}

async function insertItem(pool, userId, item, source) {
  const id = `diet_${crypto.randomUUID()}`;
  await pool.query(
    `INSERT INTO diet_items (id, user_id, item_date, day_of_week, repeat_type, time, category, title,
       description, instructions, reminder_minutes, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, item.repeat === 'once' ? item.date : null, item.repeat === 'weekly' ? item.day : null,
      item.repeat, item.time, item.category, item.title, item.description, item.instructions,
      item.reminderMinutes, source]
  );
  return id;
}

async function requireContext(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Please sign in to manage diet items' });
    return null;
  }
  const pool = await getPool();
  if (!pool) {
    res.status(503).json({ success: false, error: 'Database unavailable' });
    return null;
  }
  return { userId, pool };
}

// GET /api/diet/items — every item for the signed-in user
router.get('/items', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const [rows] = await ctx.pool.query(
      `SELECT ${SELECT_COLUMNS} FROM diet_items WHERE user_id = ? ORDER BY time ASC, created_at ASC`,
      [ctx.userId]
    );
    res.json({ success: true, items: rows.map(toRow) });
  } catch (err) {
    console.error('[Diet Items] list error:', err.message);
    res.status(500).json({ success: false, error: 'Could not load diet items' });
  }
});

// POST /api/diet/items — add one item
router.post('/items', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const { item, errors } = validateItem(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, errors });
    if (await findDuplicate(ctx.pool, ctx.userId, item)) {
      return res.status(409).json({ success: false, errors: ['This item already exists at the same time'] });
    }
    const id = await insertItem(ctx.pool, ctx.userId, item, 'manual');
    const [rows] = await ctx.pool.query(`SELECT ${SELECT_COLUMNS} FROM diet_items WHERE id = ?`, [id]);
    res.status(201).json({ success: true, item: toRow(rows[0]) });
  } catch (err) {
    console.error('[Diet Items] create error:', err.message);
    res.status(500).json({ success: false, error: 'Could not save diet item' });
  }
});

// PUT /api/diet/items/:id — edit an item
router.put('/items/:id', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const { item, errors } = validateItem(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, errors });
    if (await findDuplicate(ctx.pool, ctx.userId, item, req.params.id)) {
      return res.status(409).json({ success: false, errors: ['This item already exists at the same time'] });
    }
    const [result] = await ctx.pool.query(
      `UPDATE diet_items SET item_date = ?, day_of_week = ?, repeat_type = ?, time = ?, category = ?, title = ?,
         description = ?, instructions = ?, reminder_minutes = ?
       WHERE id = ? AND user_id = ?`,
      [item.repeat === 'once' ? item.date : null, item.repeat === 'weekly' ? item.day : null, item.repeat,
        item.time, item.category, item.title, item.description, item.instructions, item.reminderMinutes,
        req.params.id, ctx.userId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Diet item not found' });
    const [rows] = await ctx.pool.query(`SELECT ${SELECT_COLUMNS} FROM diet_items WHERE id = ?`, [req.params.id]);
    res.json({ success: true, item: toRow(rows[0]) });
  } catch (err) {
    console.error('[Diet Items] update error:', err.message);
    res.status(500).json({ success: false, error: 'Could not update diet item' });
  }
});

// DELETE /api/diet/items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const [result] = await ctx.pool.query('DELETE FROM diet_items WHERE id = ? AND user_id = ?', [req.params.id, ctx.userId]);
    if (!result.affectedRows) return res.status(404).json({ success: false, error: 'Diet item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Diet Items] delete error:', err.message);
    res.status(500).json({ success: false, error: 'Could not delete diet item' });
  }
});

// ── Import ──
const normHeader = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const HEADER_ALIASES = {
  date: ['date', 'item date', 'on date', 'schedule date'],
  day: ['day', 'weekday', 'day of week', 'day name'],
  time: ['time', 'start time', 'schedule time', 'at'],
  title: ['title', 'task', 'task title', 'meal', 'item', 'name', 'activity', 'task name', 'meal name'],
  category: ['category', 'type', 'meal type', 'item type'],
  description: ['description', 'ingredients', 'details', 'quantity', 'items', 'ingredients quantity', 'ingredients details'],
  instructions: ['instructions', 'how to', 'steps', 'notes', 'method', 'preparation'],
  reminderMinutes: ['reminder', 'reminder min', 'reminder mins', 'reminder minutes', 'reminder minutes before', 'remind before', 'reminder before min'],
  repeat: ['repeat', 'recurrence', 'frequency', 'recurring']
};

function mapHeaders(headerRow) {
  const map = {};
  headerRow.forEach((cell, idx) => {
    const h = normHeader(cell);
    if (!h) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[field] === undefined && aliases.includes(h)) { map[field] = idx; return; }
    }
  });
  return map;
}

// POST /api/diet/items/import  { fileName, fileBase64, dryRun }
// dryRun=true validates and returns a preview; otherwise valid, non-duplicate rows are saved.
router.post('/items/import', async (req, res) => {
  try {
    const ctx = await requireContext(req, res);
    if (!ctx) return;
    const { fileName = '', fileBase64, dryRun = false } = req.body || {};
    if (!fileBase64) return res.status(400).json({ success: false, error: 'No file uploaded' });

    let sheetRows;
    try {
      sheetRows = parseSpreadsheet(Buffer.from(fileBase64, 'base64'), fileName);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message || 'Could not read the file' });
    }

    // Header row = first of the top 10 rows naming both a title and a time column
    let headerIdx = -1;
    let columns = {};
    for (let i = 0; i < Math.min(10, sheetRows.length); i++) {
      const map = mapHeaders(sheetRows[i]);
      if (map.title !== undefined && map.time !== undefined) { headerIdx = i; columns = map; break; }
    }
    if (headerIdx < 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not find the header row. The sheet needs at least "Title" and "Time" columns (plus "Date" or "Day").'
      });
    }

    const dataRows = sheetRows.slice(headerIdx + 1)
      .map((cells, i) => ({ rowNum: headerIdx + 2 + i, cells }))
      .filter(({ cells }) => cells.some((c) => String(c ?? '').trim() !== ''));
    if (dataRows.length > MAX_IMPORT_ROWS) {
      return res.status(400).json({ success: false, error: `Too many rows (${dataRows.length}). Import up to ${MAX_IMPORT_ROWS} at a time.` });
    }

    const seenInFile = new Set();
    const results = [];
    for (const { rowNum, cells } of dataRows) {
      const input = {};
      for (const [field, idx] of Object.entries(columns)) input[field] = cells[idx];
      const { item, errors } = validateItem(input);
      let status = errors.length ? 'error' : 'ready';

      if (status === 'ready') {
        const key = [item.repeat, item.date, item.day, item.time, item.title.toLowerCase()].join('|');
        if (seenInFile.has(key)) status = 'duplicate';
        else if (await findDuplicate(ctx.pool, ctx.userId, item)) status = 'duplicate';
        seenInFile.add(key);
      }
      results.push({ rowNum, status, errors, item });
    }

    let imported = 0;
    if (!dryRun) {
      for (const r of results) {
        if (r.status !== 'ready') continue;
        await insertItem(ctx.pool, ctx.userId, r.item, 'excel');
        r.status = 'imported';
        imported++;
      }
    }

    res.json({
      success: true,
      dryRun: !!dryRun,
      detectedColumns: Object.keys(columns),
      summary: {
        total: results.length,
        ready: results.filter((r) => r.status === 'ready' || r.status === 'imported').length,
        duplicates: results.filter((r) => r.status === 'duplicate').length,
        errors: results.filter((r) => r.status === 'error').length,
        imported
      },
      rows: results
    });
  } catch (err) {
    console.error('[Diet Items] import error:', err.message);
    res.status(500).json({ success: false, error: 'Import failed' });
  }
});

module.exports = router;
module.exports.validateItem = validateItem;
module.exports.normalizeTime = normalizeTime;
module.exports.normalizeDate = normalizeDate;
