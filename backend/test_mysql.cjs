require('dotenv').config();
const { getPool } = require('./db_mysql.cjs');

async function testConnection() {
  console.log("🔍 Testing Local MySQL Connection & Telemetry Queries...");
  try {
    const pool = await getPool();
    if (!pool) {
      console.error("❌ Failed to acquire MySQL connection pool.");
      process.exit(1);
    }

    const [tasks] = await pool.query('SELECT COUNT(*) as count FROM planner_tasks');
    const [meetings] = await pool.query('SELECT COUNT(*) as count FROM meetings');
    const [clients] = await pool.query('SELECT COUNT(*) as count FROM client_followups');
    const [telemetry] = await pool.query('SELECT metric_key FROM telemetry_overview');

    console.log(`📊 DB Status:`);
    console.log(`- Planner Tasks: ${tasks[0].count} records`);
    console.log(`- Meetings: ${meetings[0].count} records`);
    console.log(`- Client Follow-ups: ${clients[0].count} records`);
    console.log(`- Telemetry Modules: ${telemetry.map(t => t.metric_key).join(', ')}`);

    console.log("✅ MySQL Database integration verified successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
    process.exit(1);
  }
}

testConnection();
