require('dotenv').config();
const { getPool } = require('./db_mysql.cjs');

async function resetDatabase() {
  console.log("🧹 Clearing all dummy data from local MySQL Workbench database...");
  try {
    const pool = await getPool();
    if (!pool) {
      console.error("❌ Could not connect to MySQL.");
      process.exit(1);
    }

    await pool.query('TRUNCATE TABLE planner_tasks');
    await pool.query('TRUNCATE TABLE schedule_timeline');
    await pool.query('TRUNCATE TABLE domain_tasks');
    await pool.query('TRUNCATE TABLE meetings');
    await pool.query('TRUNCATE TABLE client_followups');
    try {
      await pool.query('TRUNCATE TABLE telemetry_overview');
    } catch (e) {
      // Table might not exist yet
    }

    console.log("✨ Successfully cleared all dummy data! Database tables are clean and ready for real data.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset Error:", err.message);
    process.exit(1);
  }
}

resetDatabase();
