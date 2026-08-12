require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.cjs');
const dashboardRoutes = require('./routes/dashboard.cjs');
const plannerRoutes = require('./routes/planner.cjs');
const loggerRoutes = require('./routes/logger.cjs');
const meetingsRoutes = require('./routes/meetings.cjs');
const clientsRoutes = require('./routes/clients.cjs');
const salesRoutes = require('./routes/sales.cjs');
const projectsRoutes = require('./routes/projects.cjs');
const teamRoutes = require('./routes/team.cjs');
const financeRoutes = require('./routes/finance.cjs');
const marketingRoutes = require('./routes/marketing.cjs');
const reportsRoutes = require('./routes/reports.cjs');
const aiRoutes = require('./routes/ai.cjs');
const metaRoutes = require('./routes/meta.cjs');
const webhookRoutes = require('./routes/webhooks.cjs');
const googleRoutes = require('./routes/google.cjs');
const linkedinRoutes = require('./routes/linkedin.cjs');
const notificationsRoutes = require('./routes/notifications.cjs');

const { checkDbConnection } = require('./db_mysql.cjs');

const app = express();
const PORT = process.env.PORT || 5001;

// Startup Environment Validation (Logs status without leaking secrets)
function validateEnvironment() {
  console.log('[Config] Validating Environment Configuration...');
  console.log(`[Config] GOOGLE_CLIENT_ID configured: ${Boolean(process.env.GOOGLE_CLIENT_ID)}`);
  console.log(`[Config] GOOGLE_CLIENT_SECRET configured: ${Boolean(process.env.GOOGLE_CLIENT_SECRET)}`);
  console.log(`[Config] DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`[Config] DB_PORT: ${process.env.DB_PORT || 3306}`);
  console.log(`[Config] DB_NAME: ${process.env.DB_NAME || 'codigix_executive_os'}`);
  console.log(`[Config] DB_USER: ${process.env.DB_USER || 'root'}`);
  console.log(`[Config] DB_PASSWORD configured: ${Boolean(process.env.DB_PASSWORD)}`);
}
validateEnvironment();

app.use(cors());
app.use(express.json());

// Enable permissive Content Security Policy & CORS headers for DevTools & local API connections
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Content-Security-Policy", "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:;");
  next();
});

// Handle Chrome DevTools probe endpoint gracefully
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ status: 'ok', devtools: true });
});

// API Route Mounts (All Modules including Auth, Meta, Google & LinkedIn Suites)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/logger', loggerRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const isDbConnected = await checkDbConnection();
  if (isDbConnected) {
    return res.status(200).json({
      success: true,
      database: 'connected',
      service: 'daily-planner-api',
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({
      success: false,
      database: 'disconnected',
      service: 'daily-planner-api',
      timestamp: new Date().toISOString()
    });
  }
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`🚀 CODIGIX Executive OS Express Server running on http://localhost:${portToTry}`);
    try {
      const MetaSchedulerService = require('./services/meta/metaScheduler.service.cjs');
      MetaSchedulerService.initScheduler();
    } catch (err) {
      console.warn('[MetaSchedulerInit] Scheduler notice:', err.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${portToTry} in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

