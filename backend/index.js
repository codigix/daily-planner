require('dotenv').config();
const express = require('express');
const cors = require('cors');

const plannerRoutes = require('./routes/planner');
const loggerRoutes = require('./routes/logger');
const meetingsRoutes = require('./routes/meetings');
const clientsRoutes = require('./routes/clients');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api/planner', plannerRoutes);
app.use('/api/logger', loggerRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/ai', aiRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CODIGIX Executive OS Node Backend', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 CODIGIX Executive OS Express Server running on http://localhost:${PORT}`);
});
