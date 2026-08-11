const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

// GET all client follow-ups
router.get('/', (req, res) => {
  const db = getDB();
  res.json({ clients: db.clients || [] });
});

// POST add a new client follow-up
router.post('/', (req, res) => {
  const db = getDB();
  const newClient = {
    id: 'c' + Date.now(),
    company: req.body.company || 'New Lead Corp',
    tagline: req.body.tagline || 'New Lead Integration',
    lastContact: 'Today',
    lastContactType: 'Call',
    nextFollowup: '22 May 2025',
    nextFollowupType: 'Meeting',
    priority: req.body.priority || 'High',
    status: 'Pending',
    owner: 'Ashwini K.',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    probability: 75,
    expectedValue: req.body.expectedValue || '₹10,00,000',
    contactPerson: req.body.contactPerson || 'Manager',
    email: 'contact@client.com',
    phone: '+91 98765 00000',
    industry: 'Technology',
    source: 'Direct Lead',
    totalInteractions: 1,
    clientSince: 'Today',
    notes: 'Initial inquiry logged.'
  };

  db.clients = [newClient, ...(db.clients || [])];
  saveDB(db);
  res.status(201).json(newClient);
});

module.exports = router;
