require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateMultiTenant() {
  const envHost = process.env.DB_HOST || 'localhost';
  const envUser = process.env.DB_USER || 'root';
  const envPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const envName = process.env.DB_NAME || 'codigix_executive_os';
  const envPort = Number(process.env.DB_PORT) || 3306;

  console.log(`[Migration] Connecting to MySQL at ${envHost}:${envPort} ...`);
  const connection = await mysql.createConnection({
    host: envHost,
    user: envUser,
    password: envPass,
    database: envName,
    port: envPort
  });

  const tablesToUpdate = [
    'planner_tasks',
    'schedule_timeline',
    'domain_tasks',
    'meetings',
    'client_followups',
    'telemetry_overview'
  ];

  console.log('[Migration] Starting Multi-Tenant Schema Updates...');

  // 1. Update Users Table
  try {
    await connection.query(`ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE AFTER name;`);
    console.log('✅ Added email column to users table.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚡ email column already exists in users table.');
    } else {
      console.error('❌ Error updating users table:', err.message);
    }
  }

  // 2. Update Data Tables
  for (const table of tablesToUpdate) {
    try {
      await connection.query(`ALTER TABLE ${table} ADD COLUMN user_email VARCHAR(255);`);
      // Add index for fast querying
      await connection.query(`ALTER TABLE ${table} ADD INDEX idx_user_email (user_email);`);
      console.log(`✅ Added user_email column to ${table} table.`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`⚡ user_email column already exists in ${table} table.`);
      } else {
        console.error(`❌ Error updating ${table} table:`, err.message);
      }
    }
  }

  console.log('[Migration] Successfully completed multi-tenant schema upgrades!');
  await connection.end();
}

migrateMultiTenant().catch(err => {
  console.error('[Migration] Fatal Error:', err);
  process.exit(1);
});
