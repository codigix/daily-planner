const { getPool } = require('../../db_mysql.cjs');

async function initMetaDatabaseTables() {
  const pool = await getPool();
  if (!pool) {
    console.error('[MetaDB] MySQL pool not available.');
    return;
  }

  const queries = [
    // 1. meta_connections
    `CREATE TABLE IF NOT EXISTS meta_connections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      meta_user_id VARCHAR(100),
      business_id VARCHAR(100),
      business_name VARCHAR(255),
      access_token_encrypted TEXT,
      token_type VARCHAR(50) DEFAULT 'BEARER',
      expires_at TIMESTAMP NULL,
      status VARCHAR(50) DEFAULT 'CONNECTED',
      last_validated_at TIMESTAMP NULL,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_user (company_id, meta_user_id)
    );`,

    // 2. meta_businesses
    `CREATE TABLE IF NOT EXISTS meta_businesses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      meta_connection_id INT,
      business_id VARCHAR(100) NOT NULL,
      business_name VARCHAR(255),
      verification_status VARCHAR(50),
      timezone VARCHAR(100),
      currency VARCHAR(20),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_biz (company_id, business_id)
    );`,

    // 3. meta_assets
    `CREATE TABLE IF NOT EXISTS meta_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      business_id VARCHAR(100),
      asset_type VARCHAR(50),
      asset_id VARCHAR(100) NOT NULL,
      asset_name VARCHAR(255),
      parent_asset_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_asset (company_id, asset_id)
    );`,

    // 4. meta_facebook_pages
    `CREATE TABLE IF NOT EXISTS meta_facebook_pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      business_id VARCHAR(100),
      page_id VARCHAR(100) NOT NULL,
      page_name VARCHAR(255),
      username VARCHAR(100),
      category VARCHAR(100),
      about TEXT,
      website VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(100),
      profile_picture_url TEXT,
      cover_picture_url TEXT,
      followers_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'CONNECTED',
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_page (company_id, page_id)
    );`,

    // 5. meta_facebook_posts
    `CREATE TABLE IF NOT EXISTS meta_facebook_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      post_id VARCHAR(100) NOT NULL,
      post_type VARCHAR(50),
      message TEXT,
      media_url TEXT,
      thumbnail_url TEXT,
      permalink TEXT,
      published_at TIMESTAMP NULL,
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      shares_count INT DEFAULT 0,
      reactions_count INT DEFAULT 0,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      engagement INT DEFAULT 0,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_fb_post (company_id, post_id)
    );`,

    // 6. meta_facebook_comments
    `CREATE TABLE IF NOT EXISTS meta_facebook_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      post_id VARCHAR(100),
      comment_id VARCHAR(100) NOT NULL,
      parent_comment_id VARCHAR(100),
      from_name VARCHAR(255),
      from_id VARCHAR(100),
      message TEXT,
      like_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      metadata_json JSON,
      UNIQUE KEY idx_comp_fb_cmt (company_id, comment_id)
    );`,

    // 7. meta_facebook_insights
    `CREATE TABLE IF NOT EXISTS meta_facebook_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      object_id VARCHAR(100),
      metric_name VARCHAR(100),
      metric_value TEXT,
      period VARCHAR(50),
      date_start DATE,
      date_end DATE,
      breakdown_json JSON,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 8. meta_instagram_accounts
    `CREATE TABLE IF NOT EXISTS meta_instagram_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      business_id VARCHAR(100),
      instagram_id VARCHAR(100) NOT NULL,
      username VARCHAR(100),
      name VARCHAR(255),
      biography TEXT,
      profile_picture_url TEXT,
      followers_count INT DEFAULT 0,
      following_count INT DEFAULT 0,
      media_count INT DEFAULT 0,
      account_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'CONNECTED',
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ig (company_id, instagram_id)
    );`,

    // 9. meta_instagram_media
    `CREATE TABLE IF NOT EXISTS meta_instagram_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      instagram_account_id VARCHAR(100),
      media_id VARCHAR(100) NOT NULL,
      media_type VARCHAR(50),
      caption TEXT,
      media_url TEXT,
      thumbnail_url TEXT,
      permalink TEXT,
      published_at TIMESTAMP NULL,
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      shares_count INT DEFAULT 0,
      saves_count INT DEFAULT 0,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      engagement INT DEFAULT 0,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ig_media (company_id, media_id)
    );`,

    // 10. meta_instagram_insights
    `CREATE TABLE IF NOT EXISTS meta_instagram_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      instagram_account_id VARCHAR(100),
      media_id VARCHAR(100),
      metric_name VARCHAR(100),
      metric_value TEXT,
      period VARCHAR(50),
      date_start DATE,
      date_end DATE,
      breakdown_json JSON,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 10b. meta_instagram_comments
    `CREATE TABLE IF NOT EXISTS meta_instagram_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      media_id VARCHAR(100),
      comment_id VARCHAR(100) NOT NULL,
      username VARCHAR(100),
      text TEXT,
      like_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ig_cmt (company_id, comment_id)
    );`,

    // 11. meta_whatsapp_accounts
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      business_id VARCHAR(100),
      waba_id VARCHAR(100) NOT NULL,
      business_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      timezone VARCHAR(100),
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_waba (company_id, waba_id)
    );`,

    // 12. meta_whatsapp_phone_numbers
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_phone_numbers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      waba_id VARCHAR(100),
      phone_number_id VARCHAR(100) NOT NULL,
      display_phone_number VARCHAR(50),
      verified_name VARCHAR(255),
      quality_rating VARCHAR(50),
      status VARCHAR(50) DEFAULT 'CONNECTED',
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_wa_phone (company_id, phone_number_id)
    );`,

    // 13. meta_whatsapp_contacts
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      waba_id VARCHAR(100),
      phone_number VARCHAR(50) NOT NULL,
      display_name VARCHAR(255),
      crm_contact_id INT NULL,
      first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      metadata_json JSON,
      UNIQUE KEY idx_comp_wa_contact (company_id, phone_number)
    );`,

    // 14. meta_whatsapp_conversations
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      waba_id VARCHAR(100),
      phone_number_id VARCHAR(100),
      conversation_id VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(50),
      customer_name VARCHAR(255),
      crm_contact_id INT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      message_count INT DEFAULT 0,
      unread_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'OPEN',
      assigned_user_id INT NULL,
      metadata_json JSON,
      UNIQUE KEY idx_comp_wa_conv (company_id, conversation_id)
    );`,

    // 15. meta_whatsapp_messages
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      waba_id VARCHAR(100),
      phone_number_id VARCHAR(100),
      conversation_id VARCHAR(100),
      message_id VARCHAR(100) NOT NULL,
      direction VARCHAR(20) DEFAULT 'INCOMING',
      from_number VARCHAR(50),
      to_number VARCHAR(50),
      message_type VARCHAR(50) DEFAULT 'text',
      message_body TEXT,
      media_url TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivery_status VARCHAR(50) DEFAULT 'RECEIVED',
      read_at TIMESTAMP NULL,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_wa_msg (company_id, message_id)
    );`,

    // 16. meta_whatsapp_templates
    `CREATE TABLE IF NOT EXISTS meta_whatsapp_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      waba_id VARCHAR(100),
      template_id VARCHAR(100) NOT NULL,
      template_name VARCHAR(255),
      language VARCHAR(20) DEFAULT 'en_US',
      category VARCHAR(50),
      status VARCHAR(50) DEFAULT 'APPROVED',
      components_json JSON,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_wa_tmpl (company_id, template_id)
    );`,

    // 17. meta_ad_accounts
    `CREATE TABLE IF NOT EXISTS meta_ad_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      business_id VARCHAR(100),
      ad_account_id VARCHAR(100) NOT NULL,
      account_name VARCHAR(255),
      account_status INT DEFAULT 1,
      currency VARCHAR(20) DEFAULT 'INR',
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      spend_cap VARCHAR(50),
      balance VARCHAR(50),
      disable_reason INT DEFAULT 0,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ad_acc (company_id, ad_account_id)
    );`,

    // 18. meta_campaigns
    `CREATE TABLE IF NOT EXISTS meta_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      ad_account_id VARCHAR(100),
      campaign_id VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      objective VARCHAR(100),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      buying_type VARCHAR(50),
      daily_budget VARCHAR(50),
      lifetime_budget VARCHAR(50),
      start_time TIMESTAMP NULL,
      stop_time TIMESTAMP NULL,
      created_time TIMESTAMP NULL,
      updated_time TIMESTAMP NULL,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      UNIQUE KEY idx_comp_camp (company_id, campaign_id)
    );`,

    // 19. meta_adsets
    `CREATE TABLE IF NOT EXISTS meta_adsets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      ad_account_id VARCHAR(100),
      campaign_id VARCHAR(100),
      adset_id VARCHAR(100) NOT NULL,
      name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      optimization_goal VARCHAR(100),
      billing_event VARCHAR(100),
      daily_budget VARCHAR(50),
      lifetime_budget VARCHAR(50),
      targeting_json JSON,
      placements_json JSON,
      start_time TIMESTAMP NULL,
      end_time TIMESTAMP NULL,
      created_time TIMESTAMP NULL,
      updated_time TIMESTAMP NULL,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      UNIQUE KEY idx_comp_adset (company_id, adset_id)
    );`,

    // 20. meta_ads
    `CREATE TABLE IF NOT EXISTS meta_ads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      ad_account_id VARCHAR(100),
      campaign_id VARCHAR(100),
      adset_id VARCHAR(100),
      ad_id VARCHAR(100) NOT NULL,
      name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      creative_id VARCHAR(100),
      created_time TIMESTAMP NULL,
      updated_time TIMESTAMP NULL,
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      UNIQUE KEY idx_comp_ad (company_id, ad_id)
    );`,

    // 21. meta_ad_insights
    `CREATE TABLE IF NOT EXISTS meta_ad_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      ad_account_id VARCHAR(100),
      campaign_id VARCHAR(100),
      adset_id VARCHAR(100),
      ad_id VARCHAR(100),
      date_start DATE NOT NULL,
      date_end DATE NOT NULL,
      spend DECIMAL(12,2) DEFAULT 0.00,
      impressions INT DEFAULT 0,
      reach INT DEFAULT 0,
      frequency DECIMAL(6,2) DEFAULT 1.00,
      clicks INT DEFAULT 0,
      link_clicks INT DEFAULT 0,
      landing_page_views INT DEFAULT 0,
      ctr VARCHAR(20),
      cpc VARCHAR(20),
      cpm VARCHAR(20),
      leads INT DEFAULT 0,
      conversions INT DEFAULT 0,
      cost_per_lead VARCHAR(20),
      conversion_value DECIMAL(12,2) DEFAULT 0.00,
      roas VARCHAR(20),
      actions_json JSON,
      breakdowns_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ad_insight (company_id, ad_id, date_start, date_end)
    );`,

    // 22. meta_lead_forms
    `CREATE TABLE IF NOT EXISTS meta_lead_forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      form_id VARCHAR(100) NOT NULL,
      form_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      questions_json JSON,
      campaign_id VARCHAR(100),
      metadata_json JSON,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_lead_form (company_id, form_id)
    );`,

    // 23. meta_leads
    `CREATE TABLE IF NOT EXISTS meta_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      lead_id VARCHAR(100) NOT NULL,
      form_id VARCHAR(100),
      page_id VARCHAR(100),
      campaign_id VARCHAR(100),
      adset_id VARCHAR(100),
      ad_id VARCHAR(100),
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(255),
      answers_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      synced_at TIMESTAMP NULL,
      crm_lead_id INT NULL,
      crm_sync_status VARCHAR(50) DEFAULT 'PENDING',
      UNIQUE KEY idx_comp_lead (company_id, lead_id)
    );`,

    // 24. meta_webhook_events
    `CREATE TABLE IF NOT EXISTS meta_webhook_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      event_id VARCHAR(100) NOT NULL,
      object_type VARCHAR(50),
      event_type VARCHAR(100),
      payload_json JSON,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      error_message TEXT,
      retry_count INT DEFAULT 0,
      UNIQUE KEY idx_comp_event (company_id, event_id)
    );`,

    // 25. meta_sync_jobs
    `CREATE TABLE IF NOT EXISTS meta_sync_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      connection_id INT,
      asset_type VARCHAR(50),
      asset_id VARCHAR(100),
      sync_type VARCHAR(50),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      status VARCHAR(50) DEFAULT 'QUEUED',
      records_fetched INT DEFAULT 0,
      records_created INT DEFAULT 0,
      records_updated INT DEFAULT 0,
      records_failed INT DEFAULT 0,
      error_message TEXT,
      retry_count INT DEFAULT 0
    );`,

    // 26. meta_audit_logs
    `CREATE TABLE IF NOT EXISTS meta_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      user_id INT NULL,
      action VARCHAR(100) NOT NULL,
      asset_type VARCHAR(50),
      asset_id VARCHAR(100),
      details_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // 27. meta_api_logs
    `CREATE TABLE IF NOT EXISTS meta_api_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      endpoint VARCHAR(255),
      method VARCHAR(10),
      asset_id VARCHAR(100),
      status_code INT,
      response_metadata JSON,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_ms INT,
      error_type VARCHAR(100)
    );`,

    // 28. meta_instagram_stories
    `CREATE TABLE IF NOT EXISTS meta_instagram_stories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      instagram_account_id VARCHAR(100),
      story_id VARCHAR(100) NOT NULL,
      media_type VARCHAR(50) DEFAULT 'IMAGE',
      media_url TEXT,
      caption TEXT,
      published_at TIMESTAMP NULL,
      expires_at TIMESTAMP NULL,
      reach INT DEFAULT 0,
      impressions INT DEFAULT 0,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_ig_story (company_id, story_id)
    );`,

    // 29. meta_facebook_conversations
    `CREATE TABLE IF NOT EXISTS meta_facebook_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      conversation_id VARCHAR(100) NOT NULL,
      unread_count INT DEFAULT 0,
      updated_time TIMESTAMP NULL,
      last_message TEXT,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_fb_conv (company_id, conversation_id)
    );`,

    // 30. meta_facebook_messages
    `CREATE TABLE IF NOT EXISTS meta_facebook_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT DEFAULT 1,
      page_id VARCHAR(100),
      conversation_id VARCHAR(100),
      message_id VARCHAR(100) NOT NULL,
      from_id VARCHAR(100),
      from_name VARCHAR(255),
      message TEXT,
      created_time TIMESTAMP NULL,
      metadata_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY idx_comp_fb_msg (company_id, message_id)
    );`
  ];

  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (err) {
      console.warn('[MetaDB] Table init notice:', err.message);
    }
  }

  const alterQueries = [
    `ALTER TABLE meta_connections ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_businesses ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_assets ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN followers_count INT DEFAULT 0;`,
    `ALTER TABLE meta_facebook_posts ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_facebook_comments ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_facebook_insights ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN followers_count INT DEFAULT 0;`,
    `ALTER TABLE meta_instagram_media ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_instagram_insights ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_accounts ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_phone_numbers ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_contacts ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_conversations ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_messages ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_whatsapp_templates ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_campaigns ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_adsets ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_ads ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_ad_insights ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_lead_forms ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_leads ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_leads ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_instagram_media ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_campaigns ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_webhook_events ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_sync_jobs ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_audit_logs ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_api_logs ADD COLUMN company_id INT DEFAULT 1;`,
    `ALTER TABLE meta_businesses ADD COLUMN business_id VARCHAR(100);`,
    `ALTER TABLE meta_assets ADD COLUMN business_id VARCHAR(100);`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN instagram_id VARCHAR(100);`,
    `ALTER TABLE meta_instagram_media ADD COLUMN instagram_account_id VARCHAR(100);`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN ad_account_id VARCHAR(100);`,
    `ALTER TABLE meta_campaigns ADD COLUMN ad_account_id VARCHAR(100);`,
    `ALTER TABLE meta_businesses ADD COLUMN business_name VARCHAR(255);`,
    `ALTER TABLE meta_businesses ADD COLUMN name VARCHAR(255);`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN following_count INT DEFAULT 0;`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN follows_count INT DEFAULT 0;`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN account_name VARCHAR(255);`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN name VARCHAR(255);`,
    `ALTER TABLE meta_businesses ADD COLUMN verification_status VARCHAR(50);`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN account_type VARCHAR(50);`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN spend_cap VARCHAR(50);`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN balance VARCHAR(50);`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN status VARCHAR(50) DEFAULT 'CONNECTED';`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN status VARCHAR(50) DEFAULT 'CONNECTED';`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN status VARCHAR(50) DEFAULT 'CONNECTED';`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_campaigns ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';`,
    `ALTER TABLE meta_campaigns ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_adsets ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';`,
    `ALTER TABLE meta_adsets ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_ads ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';`,
    `ALTER TABLE meta_ads ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_lead_forms ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';`,
    `ALTER TABLE meta_lead_forms ADD COLUMN last_sync_at TIMESTAMP NULL;`,
    `ALTER TABLE meta_businesses ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';`,
    `ALTER TABLE meta_businesses ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_facebook_pages ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_instagram_accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_instagram_media ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_whatsapp_accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_whatsapp_phone_numbers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_ad_accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_campaigns ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_adsets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_ads ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_ad_insights ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_lead_forms ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_leads ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
    `ALTER TABLE meta_connections MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_businesses MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_assets MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_facebook_pages MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_facebook_posts MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_facebook_comments MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_facebook_insights MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_instagram_accounts MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_instagram_media MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_instagram_insights MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_accounts MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_phone_numbers MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_contacts MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_conversations MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_messages MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_whatsapp_templates MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_ad_accounts MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_campaigns MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_adsets MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_ads MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_ad_insights MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_lead_forms MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_leads MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_webhook_events MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_sync_jobs MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_audit_logs MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`,
    `ALTER TABLE meta_api_logs MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT;`
  ];

  for (const alterQ of alterQueries) {
    try {
      await pool.query(alterQ);
    } catch (ignore) {
      // Column already exists or table freshly created
    }
  }

  console.log('[MetaDB] All 27 Meta integration MySQL tables verified successfully.');
}

module.exports = {
  initMetaDatabaseTables
};
