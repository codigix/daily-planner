const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET all planner tasks & schedule timeline
router.get('/', (req, res) => {
  const db = getDB();
  res.json({
    plannerTasks: db.plannerTasks || [],
    scheduleTimeline: db.scheduleTimeline || []
  });
});

// POST add a new task to planner
router.post('/tasks', (req, res) => {
  const db = getDB();
  const newTask = {
    id: Date.now().toString(),
    title: req.body.title || 'Untitled Task',
    category: req.body.category || 'Daily Execution',
    priority: req.body.priority || 'Medium',
    status: req.body.status || 'Pending',
    time: req.body.time || '04:00 PM'
  };

  db.plannerTasks = [newTask, ...(db.plannerTasks || [])];
  saveDB(db);
  res.status(201).json(newTask);
});

// PUT update a task status
router.put('/tasks/:id', (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { status } = req.body;

  db.plannerTasks = (db.plannerTasks || []).map(t => t.id === id ? { ...t, status } : t);
  saveDB(db);
  res.json({ message: "Task updated", tasks: db.plannerTasks });
});

module.exports = router;
