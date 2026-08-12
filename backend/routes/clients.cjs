const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');
const https = require('https');

// Helper function to fetch CRM projects directly bypassing SSL cert issues
function fetchCrmProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'allinonecrm.codigixinfotech.com',
      port: 443,
      path: '/api/projects',
      method: 'GET',
      rejectUnauthorized: false // Bypass SSL self-signed or unauthorized warning checks
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('JSON Parse Error: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP status code ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

// GET all client follow-ups from external API / MySQL
router.get('/', async (req, res) => {
  try {
    const data = await fetchCrmProjects();
    if (Array.isArray(data)) {
      const clients = data.map(p => {
        const budgetVal = parseFloat(p.budget) || 0;
        const formattedBudget = budgetVal > 0 
          ? `₹ ${Number(budgetVal).toLocaleString('en-IN')}` 
          : '₹ 2,50,000';

        return {
          id: String(p.id),
          company: p.company_name || 'SP Tech',
          tagline: p.name || p.title || 'Ongoing Project',
          lastContact: p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Recently',
          lastContactType: 'CRM Update',
          nextFollowup: p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '28 May 2025',
          nextFollowupType: 'Milestone',
          priority: p.priority || 'Medium',
          status: p.status || 'Planning',
          owner: p.manager_first_name ? `${p.manager_first_name} ${p.manager_last_name || ''}`.trim() : 'Ashwini K.',
          ownerAvatar: p.manager_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
          probability: p.progress !== undefined ? Number(p.progress) : 50,
          expectedValue: formattedBudget,
          contactPerson: p.manager_first_name ? `${p.manager_first_name} ${p.manager_last_name || ''}`.trim() : 'Manager',
          email: p.manager_first_name ? `${p.manager_first_name.toLowerCase()}@codigix.com` : 'info@codigix.com',
          phone: '+91 98765 00000',
          industry: p.workflow_type || 'Technology',
          source: 'CRM Integration',
          notes: p.description || 'Live sync project.',
          starred: false
        };
      });
      return res.json({ clients });
    }
  } catch (e) {
    console.warn('Projects API Fetch warning, falling back to local MySQL database:', e.message);
    if (req.query.debug) {
      return res.status(500).json({ error: e.message, stack: e.stack });
    }
  }

  // Fallback to local MySQL database
  try {
    const pool = await getPool();
    if (!pool) return res.json({ clients: [] });

    const [rows] = await pool.query('SELECT * FROM client_followups ORDER BY id DESC');
    const clients = rows.map(r => ({
      id: r.id,
      company: r.company,
      tagline: r.tagline,
      lastContact: r.last_contact,
      lastContactType: r.last_contact_type,
      nextFollowup: r.next_followup,
      nextFollowupType: r.next_followup_type,
      priority: r.priority,
      status: r.status,
      owner: r.owner,
      ownerAvatar: r.owner_avatar,
      probability: r.probability,
      expectedValue: r.expected_value,
      contactPerson: r.contact_person,
      email: r.email,
      phone: r.phone,
      industry: r.industry,
      source: r.source,
      notes: r.notes,
      starred: Boolean(r.starred)
    }));

    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new client follow-up in MySQL
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const b = req.body;
    const newClient = {
      id: b.id || ('c' + Date.now()),
      company: b.company || 'New Lead Corp',
      tagline: b.tagline || 'New Lead Integration',
      lastContact: b.lastContact || 'Today',
      lastContactType: b.lastContactType || 'Call',
      nextFollowup: b.nextFollowup || '22 May 2025',
      nextFollowupType: b.nextFollowupType || 'Meeting',
      priority: b.priority || 'High',
      status: b.status || 'Pending',
      owner: b.owner || 'Ashwini K.',
      ownerAvatar: b.ownerAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      probability: Number(b.probability) || 75,
      expectedValue: b.expectedValue || '₹10,00,000',
      contactPerson: b.contactPerson || 'Manager',
      email: b.email || 'contact@client.com',
      phone: b.phone || '+91 98765 00000',
      industry: b.industry || 'Technology',
      source: b.source || 'Direct Lead',
      notes: b.notes || 'Initial inquiry logged.',
      starred: Boolean(b.starred)
    };

    if (pool) {
      await pool.query(
        `INSERT INTO client_followups 
          (id, company, tagline, last_contact, last_contact_type, next_followup, next_followup_type, priority, status, owner, owner_avatar, probability, expected_value, contact_person, email, phone, industry, source, notes, starred) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newClient.id, newClient.company, newClient.tagline, newClient.lastContact,
          newClient.lastContactType, newClient.nextFollowup, newClient.nextFollowupType,
          newClient.priority, newClient.status, newClient.owner, newClient.ownerAvatar,
          newClient.probability, newClient.expectedValue, newClient.contactPerson,
          newClient.email, newClient.phone, newClient.industry, newClient.source,
          newClient.notes, newClient.starred
        ]
      );
    }
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update a client follow-up details in MySQL
router.put('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const b = req.body;

    if (pool) {
      await pool.query(
        `UPDATE client_followups SET
          company = COALESCE(?, company),
          tagline = COALESCE(?, tagline),
          last_contact = COALESCE(?, last_contact),
          last_contact_type = COALESCE(?, last_contact_type),
          next_followup = COALESCE(?, next_followup),
          next_followup_type = COALESCE(?, next_followup_type),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          owner = COALESCE(?, owner),
          owner_avatar = COALESCE(?, owner_avatar),
          probability = COALESCE(?, probability),
          expected_value = COALESCE(?, expected_value),
          contact_person = COALESCE(?, contact_person),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          industry = COALESCE(?, industry),
          source = COALESCE(?, source),
          notes = COALESCE(?, notes),
          starred = COALESCE(?, starred)
        WHERE id = ?`,
        [
          b.company, b.tagline, b.lastContact, b.lastContactType,
          b.nextFollowup, b.nextFollowupType, b.priority, b.status,
          b.owner, b.ownerAvatar, b.probability, b.expectedValue,
          b.contactPerson, b.email, b.phone, b.industry, b.source,
          b.notes, b.starred !== undefined ? (b.starred ? 1 : 0) : null,
          id
        ]
      );
    }
    res.json({ message: 'Client follow-up updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a client follow-up from MySQL
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    if (pool) {
      await pool.query('DELETE FROM client_followups WHERE id = ?', [id]);
    }
    res.json({ message: 'Client follow-up deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
