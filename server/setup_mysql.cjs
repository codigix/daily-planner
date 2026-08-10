require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log("🛠️ Starting MySQL Workbench Database Setup for CODIGIX Executive OS...");

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME || 'codigix_executive_os';

  try {
    const conn = await mysql.createConnection({ host, user, password, port });
    console.log(`✅ Connected to local MySQL server at ${host}:${port}`);

    console.log(`📁 Creating Database '${dbName}' if not exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.changeUser({ database: dbName });

    const sqlFile = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(sqlFile)) {
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().startsWith('USE'));

      console.log(`⚡ Executing ${statements.length} schema SQL statements...`);
      for (const statement of statements) {
        await conn.query(statement);
      }
    }

    console.log("🎉 MySQL Workbench Database setup completed successfully!");
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ MySQL Setup Error:", err.message);
    console.log("💡 Tip: Ensure MySQL service is running locally on port 3306 and check credentials in .env");
    process.exit(1);
  }
}

setupDatabase();
