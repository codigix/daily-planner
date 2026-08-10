const mysql = require('mysql2/promise');
const { EXECUTIVE_DOMAINS } = require('./domains.cjs');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'codigix_executive_os';
const DB_PORT = process.env.DB_PORT || 3306;

let pool = null;

async function getPool() {
  if (pool) return pool;

  try {
    const rootConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await initializeTables();
    return pool;
  } catch (err) {
    console.error("MySQL Connection Error:", err.message);
    return null;
  }
}

async function initializeTables() {
  if (!pool) return;
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(100) NOT NULL,
      avatar VARCHAR(255)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      status VARCHAR(100) DEFAULT 'New',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS planner_tasks (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      time VARCHAR(50),
      date VARCHAR(100),
      targetDay VARCHAR(50),
      recurring VARCHAR(50) DEFAULT 'None',
      notes TEXT,
      checkpoints JSON,
      domain_id INT DEFAULT 4
    );
  `);

  // Create logger_domains table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logger_domains (
      id INT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(10) NOT NULL,
      color VARCHAR(20) NOT NULL,
      light_class VARCHAR(100),
      bar_color VARCHAR(50),
      keywords JSON
    );
  `);

  // Seed logger_domains if empty
  const [domainRows] = await pool.query('SELECT COUNT(*) as cnt FROM logger_domains');
  if (domainRows[0].cnt === 0) {
    for (const d of EXECUTIVE_DOMAINS) {
      await pool.query(
        'INSERT INTO logger_domains (id, name, icon, color, light_class, bar_color, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [d.id, d.name, d.icon, d.color, d.lightClass, d.barColor, JSON.stringify(d.keywords)]
      ).catch(() => {});
    }
    console.log('✅ Seeded 22 executive domains into logger_domains table');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedule_timeline (
      id VARCHAR(50) PRIMARY KEY,
      time VARCHAR(50) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      color VARCHAR(50) DEFAULT 'blue',
      date VARCHAR(100)
    );
  `);

  // Dynamic schema migration — add missing columns to existing tables
  try {
    const [plannerCols] = await pool.query('SHOW COLUMNS FROM planner_tasks');
    const plannerColNames = plannerCols.map(c => c.Field);
    if (!plannerColNames.includes('date'))       await pool.query('ALTER TABLE planner_tasks ADD COLUMN date VARCHAR(100)');
    if (!plannerColNames.includes('targetDay'))  await pool.query('ALTER TABLE planner_tasks ADD COLUMN targetDay VARCHAR(50)');
    if (!plannerColNames.includes('recurring'))  await pool.query("ALTER TABLE planner_tasks ADD COLUMN recurring VARCHAR(50) DEFAULT 'None'");
    if (!plannerColNames.includes('notes'))      await pool.query('ALTER TABLE planner_tasks ADD COLUMN notes TEXT');
    if (!plannerColNames.includes('checkpoints'))await pool.query('ALTER TABLE planner_tasks ADD COLUMN checkpoints JSON');
    if (!plannerColNames.includes('domain_id'))  await pool.query('ALTER TABLE planner_tasks ADD COLUMN domain_id INT DEFAULT 4');

    const [timelineCols] = await pool.query('SHOW COLUMNS FROM schedule_timeline');
    const timelineColNames = timelineCols.map(c => c.Field);
    if (!timelineColNames.includes('date'))      await pool.query('ALTER TABLE schedule_timeline ADD COLUMN date VARCHAR(100)');
  } catch (err) {
    console.warn('Schema migration warning:', err.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS domain_tasks (
      id VARCHAR(50) PRIMARY KEY,
      domain_id INT NOT NULL,
      domain_title VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'NOT DONE',
      note TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id VARCHAR(50) PRIMARY KEY,
      time VARCHAR(50) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      client VARCHAR(100),
      type VARCHAR(50) NOT NULL DEFAULT 'Client',
      status VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
      members JSON,
      agenda JSON,
      action_items JSON
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_followups (
      id VARCHAR(50) PRIMARY KEY,
      company VARCHAR(100) NOT NULL,
      tagline VARCHAR(255),
      last_contact VARCHAR(100),
      last_contact_type VARCHAR(50),
      next_followup VARCHAR(100),
      next_followup_type VARCHAR(50),
      priority VARCHAR(50) NOT NULL DEFAULT 'High',
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      owner VARCHAR(100),
      owner_avatar VARCHAR(255),
      probability INT DEFAULT 50,
      expected_value VARCHAR(100),
      contact_person VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(50),
      industry VARCHAR(100),
      source VARCHAR(100),
      notes TEXT,
      starred BOOLEAN DEFAULT FALSE
    );
  `);

  try {
    const [cols] = await pool.query('DESCRIBE users');
    const colNames = cols.map(c => c.Field);
    if (!colNames.includes('email')) {
      await pool.query('DROP TABLE IF EXISTS users');
    }
  } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'Executive',
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS telemetry_overview (
      metric_key VARCHAR(100) PRIMARY KEY,
      metric_value JSON NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id VARCHAR(100) DEFAULT 'codigix_infotech',
      meta_user_id VARCHAR(100),
      business_id VARCHAR(100) DEFAULT '1182451024960126',
      access_token TEXT NOT NULL,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_business (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      currency VARCHAR(20) DEFAULT 'INR'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_businesses (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      currency VARCHAR(20) DEFAULT 'INR'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_pages (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      access_token TEXT,
      followers INT DEFAULT 0,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      engagement INT DEFAULT 0,
      profile_picture TEXT
    );
  `);

  // Safe schema migrations for existing tables
  try { await pool.query('ALTER TABLE meta_pages ADD COLUMN reach INT DEFAULT 0;'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_pages ADD COLUMN impressions INT DEFAULT 0;'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_pages ADD COLUMN engagement INT DEFAULT 0;'); } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_page_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page_id VARCHAR(100),
      date DATE NOT NULL,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      followers INT DEFAULT 0,
      engagement INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_instagram (
      id VARCHAR(100) PRIMARY KEY,
      page_id VARCHAR(100),
      username VARCHAR(100) NOT NULL,
      name VARCHAR(255),
      biography TEXT,
      website TEXT,
      followers INT DEFAULT 0,
      follows INT DEFAULT 0,
      media_count INT DEFAULT 0,
      profile_picture_url TEXT
    );
  `);

  try { await pool.query('ALTER TABLE meta_instagram ADD COLUMN page_id VARCHAR(100);'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram ADD COLUMN name VARCHAR(255);'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram ADD COLUMN biography TEXT;'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram ADD COLUMN website TEXT;'); } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_instagram_accounts (
      id VARCHAR(100) PRIMARY KEY,
      page_id VARCHAR(100),
      username VARCHAR(100) NOT NULL,
      name VARCHAR(255),
      biography TEXT,
      website TEXT,
      followers INT DEFAULT 0,
      follows INT DEFAULT 0,
      media_count INT DEFAULT 0,
      profile_picture_url TEXT
    );
  `);

  try { await pool.query('ALTER TABLE meta_instagram_accounts ADD COLUMN page_id VARCHAR(100);'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram_accounts ADD COLUMN name VARCHAR(255);'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram_accounts ADD COLUMN biography TEXT;'); } catch (e) {}
  try { await pool.query('ALTER TABLE meta_instagram_accounts ADD COLUMN website TEXT;'); } catch (e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_instagram_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      instagram_id VARCHAR(100),
      date DATE NOT NULL,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      profile_views INT DEFAULT 0,
      website_clicks INT DEFAULT 0,
      engaged_accounts INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_posts (
      id VARCHAR(100) PRIMARY KEY,
      caption TEXT,
      likes INT DEFAULT 0,
      comments INT DEFAULT 0,
      shares INT DEFAULT 0,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      media_url TEXT,
      post_type VARCHAR(50) DEFAULT 'IMAGE',
      timestamp TIMESTAMP NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_reels (
      id VARCHAR(100) PRIMARY KEY,
      caption TEXT,
      likes INT DEFAULT 0,
      comments INT DEFAULT 0,
      views INT DEFAULT 0,
      plays INT DEFAULT 0,
      reach INT DEFAULT 0,
      video_url TEXT,
      timestamp TIMESTAMP NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_stories (
      id VARCHAR(100) PRIMARY KEY,
      impressions INT DEFAULT 0,
      reach INT DEFAULT 0,
      exits INT DEFAULT 0,
      replies INT DEFAULT 0,
      timestamp TIMESTAMP NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_accounts (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255),
      currency VARCHAR(20) DEFAULT 'INR',
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      status VARCHAR(50) DEFAULT 'Active',
      account_status INT DEFAULT 1
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_campaigns (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      budget VARCHAR(50),
      objective VARCHAR(100),
      spend VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      roi VARCHAR(50),
      roas VARCHAR(50)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_sets (
      id VARCHAR(100) PRIMARY KEY,
      campaign_id VARCHAR(100),
      name VARCHAR(255),
      budget VARCHAR(50),
      bid_strategy VARCHAR(100),
      optimization_goal VARCHAR(100)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_adsets (
      id VARCHAR(100) PRIMARY KEY,
      campaign_id VARCHAR(100),
      name VARCHAR(255),
      budget VARCHAR(50),
      bid_strategy VARCHAR(100),
      optimization_goal VARCHAR(100)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ads (
      id VARCHAR(100) PRIMARY KEY,
      headline VARCHAR(255),
      creative_url TEXT,
      cta VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      spend VARCHAR(50),
      ctr VARCHAR(20),
      cpc VARCHAR(20),
      cpm VARCHAR(20)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_campaign_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      spend DECIMAL(12,2) DEFAULT 0.00,
      ctr VARCHAR(20),
      cpm VARCHAR(20),
      cpc VARCHAR(20),
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      conversions INT DEFAULT 0,
      roas VARCHAR(20)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_leads (
      id VARCHAR(100) PRIMARY KEY,
      form_id VARCHAR(100),
      form_name VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      campaign VARCHAR(255),
      ad VARCHAR(255),
      submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      crm_lead_id INT NULL,
      lead_score INT DEFAULT 85
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_messages (
      id VARCHAR(100) PRIMARY KEY,
      sender_id VARCHAR(100),
      sender_name VARCHAR(255),
      recipient_id VARCHAR(100),
      text TEXT,
      platform VARCHAR(50) DEFAULT 'messenger',
      direction VARCHAR(20) DEFAULT 'inbound',
      unread BOOLEAN DEFAULT TRUE,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_comments (
      id VARCHAR(100) PRIMARY KEY,
      post_id VARCHAR(100),
      author VARCHAR(255),
      text TEXT,
      sentiment VARCHAR(50) DEFAULT 'Positive',
      reply TEXT,
      platform VARCHAR(50) DEFAULT 'instagram',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_reviews (
      id VARCHAR(100) PRIMARY KEY,
      reviewer VARCHAR(255),
      rating INT DEFAULT 5,
      text TEXT,
      owner_reply TEXT,
      date VARCHAR(50)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_webhooks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(100),
      payload JSON,
      status VARCHAR(50) DEFAULT 'Processed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(255),
      status VARCHAR(50),
      message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // --- GOOGLE BUSINESS PROFILE INTEGRATION TABLES ---
  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id VARCHAR(100) UNIQUE NOT NULL,
      company_id VARCHAR(100) DEFAULT 'codigix_infotech',
      account_name VARCHAR(255) NOT NULL,
      account_type VARCHAR(100) DEFAULT 'LOCATION_GROUP',
      email VARCHAR(255),
      profile_name VARCHAR(255),
      profile_picture TEXT,
      scope TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  try { await pool.query("ALTER TABLE google_accounts ADD COLUMN email VARCHAR(255) AFTER account_type;"); } catch(e){}
  try { await pool.query("ALTER TABLE google_accounts ADD COLUMN profile_name VARCHAR(255) AFTER email;"); } catch(e){}
  try { await pool.query("ALTER TABLE google_accounts ADD COLUMN profile_picture TEXT AFTER profile_name;"); } catch(e){}
  try { await pool.query("ALTER TABLE google_accounts ADD COLUMN scope TEXT AFTER profile_picture;"); } catch(e){}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_locations (
      id VARCHAR(100) PRIMARY KEY,
      account_id VARCHAR(100),
      business_name VARCHAR(255) NOT NULL,
      primary_category VARCHAR(100),
      secondary_categories JSON,
      address TEXT,
      phone VARCHAR(100),
      website TEXT,
      status VARCHAR(50) DEFAULT 'VERIFIED',
      latitude DECIMAL(10, 8) DEFAULT 18.520430,
      longitude DECIMAL(11, 8) DEFAULT 73.856744,
      opening_hours JSON,
      description TEXT,
      attributes JSON,
      service_areas JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_reviews (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      reviewer_name VARCHAR(255) NOT NULL,
      reviewer_photo TEXT,
      rating INT DEFAULT 5,
      comment TEXT,
      reply TEXT,
      reply_time TIMESTAMP NULL,
      created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_photos (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      photo_type VARCHAR(50) DEFAULT 'BUSINESS',
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      views INT DEFAULT 0,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_posts (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      post_type VARCHAR(50) DEFAULT 'UPDATE',
      title VARCHAR(255),
      summary TEXT,
      call_to_action VARCHAR(50) DEFAULT 'LEARN_MORE',
      action_url TEXT,
      media_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_products (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      product_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      price VARCHAR(50),
      description TEXT,
      image_url TEXT,
      availability VARCHAR(50) DEFAULT 'IN_STOCK',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_services (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      service_name VARCHAR(255) NOT NULL,
      pricing VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_questions (
      id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(100),
      question TEXT NOT NULL,
      answer TEXT,
      author VARCHAR(255),
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_performance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      location_id VARCHAR(100),
      date DATE NOT NULL,
      search_views INT DEFAULT 0,
      maps_views INT DEFAULT 0,
      website_clicks INT DEFAULT 0,
      phone_calls INT DEFAULT 0,
      direction_requests INT DEFAULT 0,
      bookings INT DEFAULT 0,
      food_orders INT DEFAULT 0,
      messages INT DEFAULT 0,
      profile_views INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_sync_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id VARCHAR(100) DEFAULT 'codigix_infotech',
      sync_type VARCHAR(50) DEFAULT 'Manual',
      status VARCHAR(50) DEFAULT 'SUCCESS',
      records_synced INT DEFAULT 0,
      details TEXT,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // LinkedIn Integration Tables (All 6 Schema Tables)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_accounts (
      account_id VARCHAR(100) PRIMARY KEY,
      company_id VARCHAR(100) DEFAULT 'codigix_infotech',
      member_urn VARCHAR(100) NOT NULL,
      sub VARCHAR(100),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255),
      profile_picture TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  try {
    await pool.query("ALTER TABLE linkedin_accounts ADD COLUMN sub VARCHAR(100) AFTER member_urn;");
  } catch (e) {
    // Column sub already exists
  }

  try {
    await pool.query("ALTER TABLE linkedin_accounts ADD COLUMN email VARCHAR(255) AFTER last_name;");
  } catch (e) {
    // Column email already exists
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_organizations (
      org_id VARCHAR(100) PRIMARY KEY,
      account_id VARCHAR(100),
      org_name VARCHAR(255) NOT NULL,
      vanity_name VARCHAR(100),
      logo_url TEXT,
      website TEXT,
      industry VARCHAR(100),
      description TEXT,
      follower_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_posts (
      id VARCHAR(100) PRIMARY KEY,
      org_id VARCHAR(100),
      author_urn VARCHAR(100),
      post_type VARCHAR(50) DEFAULT 'IMAGE',
      text_content TEXT,
      media_url TEXT,
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      shares_count INT DEFAULT 0,
      impressions_count INT DEFAULT 0,
      clicks_count INT DEFAULT 0,
      created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_followers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      org_id VARCHAR(100),
      date DATE NOT NULL,
      total_followers INT DEFAULT 0,
      organic_followers INT DEFAULT 0,
      paid_followers INT DEFAULT 0,
      follower_gains INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_analytics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      org_id VARCHAR(100),
      date DATE NOT NULL,
      impressions INT DEFAULT 0,
      unique_impressions INT DEFAULT 0,
      clicks INT DEFAULT 0,
      reactions INT DEFAULT 0,
      comments INT DEFAULT 0,
      shares INT DEFAULT 0,
      engagement_rate DECIMAL(5,2) DEFAULT 0.00
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linkedin_sync_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id VARCHAR(100) DEFAULT 'codigix_infotech',
      sync_type VARCHAR(50) DEFAULT 'Manual',
      status VARCHAR(50) DEFAULT 'SUCCESS',
      records_synced INT DEFAULT 0,
      details TEXT,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    const { initMetaDatabaseTables } = require('./services/meta/init_meta_db.cjs');
    await initMetaDatabaseTables();
  } catch (err) {
    console.warn('[DB] Meta table initialization warning:', err.message);
  }
}

module.exports = { getPool };
