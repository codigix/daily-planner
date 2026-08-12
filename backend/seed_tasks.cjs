require('dotenv').config();
const { getPool } = require('./db_mysql.cjs');

async function seedTasks() {
  console.log("Seeding initial planner tasks for today...");
  try {
    const pool = await getPool();
    if (!pool) {
      console.error("❌ Could not connect to MySQL.");
      process.exit(1);
    }

    const todayStr = new Date().toDateString();
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const tasks = [
      {
        id: 'seed_1',
        title: 'Review Executive Dashboard Metrics',
        category: 'Executive Dashboard',
        priority: 'High',
        time: '09:00 AM – 10:00 AM',
        date: todayStr,
        targetDay: todayName,
        status: 'Pending'
      },
      {
        id: 'seed_2',
        title: 'Check Daily Planner Priorities',
        category: 'Calendar & Schedule',
        priority: 'High',
        time: '10:30 AM – 11:30 AM',
        date: todayStr,
        targetDay: todayName,
        status: 'Pending'
      },
      {
        id: 'seed_3',
        title: 'Review Finance Cashflow Report',
        category: 'Finance',
        priority: 'Medium',
        time: '02:00 PM – 03:00 PM',
        date: todayStr,
        targetDay: todayName,
        status: 'Pending'
      }
    ];

    for (const task of tasks) {
      await pool.query(
        `INSERT IGNORE INTO planner_tasks 
        (id, title, category, priority, status, time, date, targetDay, recurring, notes, checkpoints, completed_dates, domain_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.title, task.category, task.priority, task.status, task.time, task.date, task.targetDay, 'None', '', JSON.stringify([]), JSON.stringify({}), 'd22']
      );
    }

    console.log("✅ Successfully seeded 3 tasks for today!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed Error:", err.message);
    process.exit(1);
  }
}

seedTasks();
