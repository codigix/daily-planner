const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET domain tasks
router.get('/', (req, res) => {
  const db = getDB();
  res.json({ domains: db.domains || [] });
});

// PUT update task status in a domain
router.put('/task-status', (req, res) => {
  const { domainId, taskId, status } = req.body;
  const db = getDB();

  db.domains = (db.domains || []).map(d => {
    if (d.id === Number(domainId)) {
      const updatedTasks = d.tasks.map(t => t.id === taskId ? { ...t, status } : t);
      return { ...d, tasks: updatedTasks };
    }
    return d;
  });

  saveDB(db);
  res.json({ message: "Domain task updated", domains: db.domains });
});

module.exports = router;
