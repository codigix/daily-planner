const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET all meetings
router.get('/', (req, res) => {
  const db = getDB();
  res.json({ meetings: db.meetings || [] });
});

// POST schedule a new meeting
router.post('/', (req, res) => {
  const db = getDB();
  const newMeeting = {
    id: 'm' + Date.now(),
    time: req.body.time || '02:30 PM',
    duration: req.body.duration || '45 min',
    title: req.body.title || 'Untitled Meeting',
    description: req.body.description || 'Scheduled via CODIGIX Executive OS',
    client: req.body.client || 'Client Team',
    type: req.body.type || 'Client',
    status: req.body.status || 'Upcoming',
    members: req.body.members || ['Ashwini K.']
  };

  db.meetings = [newMeeting, ...(db.meetings || [])];
  saveDB(db);
  res.status(201).json(newMeeting);
});

module.exports = router;
