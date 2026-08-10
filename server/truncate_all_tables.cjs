require('dotenv').config();
const { getPool } = require('./db_mysql.cjs');

async function truncateAllTables() {
  console.log("🧹 Truncating all MySQL database tables...");
  try {
    const pool = await getPool();
    if (!pool) {
      console.error("❌ Could not connect to MySQL.");
      process.exit(1);
    }

    const [rows] = await pool.query('SHOW TABLES');
    if (!rows || rows.length === 0) {
      console.log("ℹ️ No tables found to truncate.");
      process.exit(0);
    }

    const keyName = Object.keys(rows[0])[0];
    const tableNames = rows.map(r => r[keyName]);

    console.log(`Found ${tableNames.length} tables to truncate.`);

    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of tableNames) {
      try {
        await pool.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  ✓ Truncated table: ${table}`);
      } catch (err) {
        console.warn(`  ⚠️ Could not truncate ${table}: ${err.message}`);
      }
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("\n✨ Successfully truncated all database tables! Your database is now completely clean.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Truncate Error:", err.message);
    process.exit(1);
  }
}

truncateAllTables();
