require('dotenv').config();
const { getPool } = require('./db_mysql.cjs');

async function truncateMarketingTables() {
  console.log('🔄 Connecting to MySQL to truncate Marketing Suite tables...');
  const pool = await getPool();
  if (!pool) {
    console.error('❌ Failed to connect to MySQL pool');
    process.exit(1);
  }

  const tables = [
    'meta_accounts',
    'meta_businesses',
    'meta_business',
    'meta_pages',
    'meta_page_insights',
    'meta_instagram',
    'meta_instagram_accounts',
    'meta_instagram_insights',
    'meta_ad_accounts',
    'meta_campaigns',
    'meta_campaign_insights',
    'meta_posts',
    'meta_reels',
    'meta_stories',
    'meta_leads',
    'meta_messages',
    'meta_comments',
    'meta_reviews',
    'meta_webhooks'
  ];

  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table};`);
      console.log(`✅ Truncated table: ${table}`);
    } catch (err) {
      console.warn(`⚠️ Could not truncate ${table}: ${err.message}`);
    }
  }

  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('✨ All Marketing Database Tables Truncated Successfully!');
  process.exit(0);
}

truncateMarketingTables();
