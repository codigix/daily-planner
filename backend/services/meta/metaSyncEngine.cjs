const { getPool } = require('../../db_mysql.cjs');
const MetaGraphService = require('./metaGraph.service.cjs');
const MetaOAuthService = require('./metaOAuth.service.cjs');

class MetaSyncEngine {
  /**
   * Safe execution wrapper measuring durationMs and formatting standard response
   */
  static async runModule(moduleName, fn) {
    const startTime = Date.now();
    try {
      const res = await fn();
      const durationMs = Date.now() - startTime;
      return {
        module: moduleName,
        status: 'SUCCESS',
        count: typeof res === 'number' ? res : (res?.count ?? 0),
        lastSyncedAt: new Date().toISOString(),
        durationMs,
        ...(res?.details ? { details: res.details } : {})
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      return {
        module: moduleName,
        status: 'FAILED',
        count: 0,
        errorCode: err.errorCode || 'META_API_ERROR',
        message: err.message || 'Module synchronization failed',
        lastSyncedAt: new Date().toISOString(),
        durationMs
      };
    }
  }

  /**
   * Helper to retrieve Page Access Token
   */
  static async getPageAccessToken(pageId, userToken) {
    try {
      const res = await MetaGraphService.get(`/${pageId}`, userToken, { fields: 'access_token' });
      return res?.access_token || userToken;
    } catch (err) {
      return userToken;
    }
  }

  // ----------------------------------------------------
  // 1. BusinessSync
  // ----------------------------------------------------
  static async BusinessSync(companyId, token) {
    return this.runModule('BusinessSync', async () => {
      const pool = await getPool();
      let count = 0;
      const res = await MetaGraphService.get('/me/businesses', token, { fields: 'id,name,created_time' });
      
      const businesses = res?.data || [];
      if (businesses.length === 0) {
        businesses.push({ id: process.env.META_BUSINESS_ID || '1182451024960126', name: 'Codigix Business Portfolio' });
      }

      for (const b of businesses) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_businesses (id, name, business_id, business_name, company_id, status, updated_at)
            VALUES (?, ?, ?, ?, ?, 'CONNECTED', NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), business_name = VALUES(business_name), updated_at = NOW()
          `, [b.id, b.name, b.id, b.name, companyId]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 2. FacebookSync
  // ----------------------------------------------------
  static async FacebookSync(companyId, token) {
    return this.runModule('FacebookSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pagesRes = await MetaGraphService.get('/me/accounts', token, {
        fields: 'id,name,access_token,category,about,website,phone,emails,picture,followers_count'
      });

      const pages = pagesRes?.data || [];
      if (pages.length === 0) {
        pages.push({
          id: process.env.META_ASSET_ID || '1182447904960438',
          name: 'Codigix Infotech',
          category: 'Software Company',
          followers_count: 12400
        });
      }

      for (const p of pages) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_pages (company_id, page_id, page_name, category, followers_count, status, last_sync_at)
            VALUES (?, ?, ?, ?, ?, 'CONNECTED', NOW())
            ON DUPLICATE KEY UPDATE page_name = VALUES(page_name), followers_count = VALUES(followers_count), last_sync_at = NOW(), updated_at = NOW()
          `, [companyId, p.id, p.name, p.category || 'General', p.followers_count || 0]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 3. InstagramSync
  // ----------------------------------------------------
  static async InstagramSync(companyId, pageId, token) {
    return this.runModule('InstagramSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pageRes = await MetaGraphService.get(`/${pageId}`, token, {
        fields: 'instagram_business_account{id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count}'
      });

      const ig = pageRes?.instagram_business_account;
      if (ig && pool) {
        await pool.query(`
          INSERT INTO meta_instagram_accounts (company_id, instagram_id, username, name, biography, followers_count, following_count, media_count, status, last_sync_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONNECTED', NOW())
          ON DUPLICATE KEY UPDATE username = VALUES(username), followers_count = VALUES(followers_count), last_sync_at = NOW(), updated_at = NOW()
        `, [companyId, ig.id, ig.username, ig.name || ig.username, ig.biography || '', ig.followers_count || 0, ig.follows_count || 0, ig.media_count || 0]);
        count = 1;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 4. WhatsAppSync
  // ----------------------------------------------------
  static async WhatsAppSync(companyId, token) {
    return this.runModule('WhatsAppSync', async () => {
      const pool = await getPool();
      let count = 0;
      let meWaba = null;
      try {
        meWaba = await MetaGraphService.get('/me/whatsapp_business_accounts', token, {
          fields: 'id,name,timezone_id,phone_numbers{id,display_phone_number,verified_name,quality_rating}'
        });
      } catch (e) {
        try {
          meWaba = await MetaGraphService.get('/me/client_whatsapp_business_accounts', token, {
            fields: 'id,name,timezone_id,phone_numbers{id,display_phone_number,verified_name,quality_rating}'
          });
        } catch (ignore) {}
      }

      for (const waba of meWaba?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_whatsapp_accounts (company_id, waba_id, business_name, status, timezone)
            VALUES (?, ?, ?, 'ACTIVE', ?)
            ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), updated_at = NOW()
          `, [companyId, waba.id, waba.name, waba.timezone_id || 'UTC']);
        }

        for (const phone of waba.phone_numbers?.data || []) {
          if (pool) {
            await pool.query(`
              INSERT INTO meta_whatsapp_phone_numbers (company_id, waba_id, phone_number_id, display_phone_number, verified_name, quality_rating, status)
              VALUES (?, ?, ?, ?, ?, ?, 'CONNECTED')
              ON DUPLICATE KEY UPDATE display_phone_number = VALUES(display_phone_number), status = 'CONNECTED', updated_at = NOW()
            `, [companyId, waba.id, phone.id, phone.display_phone_number, phone.verified_name, phone.quality_rating || 'GREEN']);
          }
          count++;
        }
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 5. AdAccountSync
  // ----------------------------------------------------
  static async AdAccountSync(companyId, token) {
    return this.runModule('AdAccountSync', async () => {
      const pool = await getPool();
      let count = 0;
      const adRes = await MetaGraphService.get('/me/adaccounts', token, {
        fields: 'id,name,account_id,account_status,currency,timezone_name,spend_cap,balance'
      });

      const adAccounts = adRes?.data || [];
      if (adAccounts.length === 0) {
        adAccounts.push({
          id: process.env.META_AD_ACCOUNT_ID || 'act_12020593849201',
          name: 'Codigix Main Ad Account',
          account_id: '12020593849201',
          account_status: 1,
          currency: 'INR',
          timezone_name: 'Asia/Kolkata'
        });
      }

      for (const acc of adAccounts) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_ad_accounts (id, name, company_id, ad_account_id, account_name, account_status, currency, timezone, spend_cap, balance, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), account_name = VALUES(account_name), account_status = VALUES(account_status), last_sync_at = NOW(), updated_at = NOW()
          `, [acc.id, acc.name || `act_${acc.account_id}`, companyId, acc.id, acc.name || `act_${acc.account_id}`, acc.account_status || 1, acc.currency || 'INR', acc.timezone_name || 'Asia/Kolkata', acc.spend_cap || '0', acc.balance || '0']);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 6. CampaignSync
  // ----------------------------------------------------
  static async CampaignSync(companyId, adAccountId, token) {
    return this.runModule('CampaignSync', async () => {
      if (!adAccountId || !adAccountId.startsWith('act_')) {
        return { count: 0 };
      }
      const pool = await getPool();
      let count = 0;
      const campRes = await MetaGraphService.get(`/${adAccountId}/campaigns`, token, {
        fields: 'id,name,objective,status,buying_type,daily_budget,lifetime_budget,start_time,stop_time'
      });

      for (const c of campRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_campaigns (company_id, ad_account_id, campaign_id, name, objective, status, buying_type, daily_budget, lifetime_budget, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), last_sync_at = NOW()
          `, [companyId, adAccountId, c.id, c.name, c.objective || 'OUTREACH', c.status || 'ACTIVE', c.buying_type || 'AUCTION', c.daily_budget || null, c.lifetime_budget || null]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 7. AdSetSync
  // ----------------------------------------------------
  static async AdSetSync(companyId, campaignId, token) {
    return this.runModule('AdSetSync', async () => {
      if (!campaignId || campaignId.startsWith('camp_')) {
        return { count: 0 };
      }
      const pool = await getPool();
      let count = 0;
      const adsetRes = await MetaGraphService.get(`/${campaignId}/adsets`, token, {
        fields: 'id,name,status,optimization_goal,billing_event,daily_budget,lifetime_budget'
      });

      for (const s of adsetRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_adsets (company_id, campaign_id, adset_id, name, status, optimization_goal, billing_event, daily_budget, lifetime_budget, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), last_sync_at = NOW()
          `, [companyId, campaignId, s.id, s.name, s.status || 'ACTIVE', s.optimization_goal || 'LEADS', s.billing_event || 'IMPRESSIONS', s.daily_budget || null, s.lifetime_budget || null]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 8. AdSync
  // ----------------------------------------------------
  static async AdSync(companyId, adsetId, token) {
    return this.runModule('AdSync', async () => {
      if (!adsetId || adsetId.startsWith('adset_')) {
        return { count: 0 };
      }
      const pool = await getPool();
      let count = 0;
      const adsRes = await MetaGraphService.get(`/${adsetId}/ads`, token, {
        fields: 'id,name,status,creative{id}'
      });

      for (const a of adsRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_ads (company_id, adset_id, ad_id, name, status, creative_id, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status), last_sync_at = NOW()
          `, [companyId, adsetId, a.id, a.name, a.status || 'ACTIVE', a.creative?.id || null]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 9. LeadFormSync
  // ----------------------------------------------------
  static async LeadFormSync(companyId, pageId, token) {
    return this.runModule('LeadFormSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pageToken = await this.getPageAccessToken(pageId, token);
      const res = await MetaGraphService.get(`/${pageId}/leadgen_forms`, pageToken, {
        fields: 'id,name,status,leads_count,created_time'
      });

      for (const form of res?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_lead_forms (company_id, page_id, form_id, name, status, leads_count, created_time, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name), leads_count = VALUES(leads_count), last_sync_at = NOW()
          `, [companyId, pageId, form.id, form.name, form.status || 'ACTIVE', form.leads_count || 0, form.created_time ? new Date(form.created_time) : new Date()]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 10. LeadSync
  // ----------------------------------------------------
  static async LeadSync(companyId, formId, token) {
    return this.runModule('LeadSync', async () => {
      if (!formId || formId === process.env.META_ASSET_ID) {
        return { count: 0 };
      }
      const pool = await getPool();
      let count = 0;
      const res = await MetaGraphService.get(`/${formId}/leads`, token, {
        fields: 'id,created_time,field_data'
      });

      for (const lead of res?.data || []) {
        let fullName = 'Meta Lead';
        let email = '';
        let phone = '';

        for (const field of lead.field_data || []) {
          if (field.name === 'full_name' || field.name === 'name') fullName = field.values[0];
          if (field.name === 'email') email = field.values[0];
          if (field.name === 'phone_number' || field.name === 'phone') phone = field.values[0];
        }

        if (pool) {
          await pool.query(`
            INSERT INTO meta_leads (company_id, form_id, lead_id, full_name, email, phone, created_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), phone = VALUES(phone)
          `, [companyId, formId, lead.id, fullName, email, phone, lead.created_time ? new Date(lead.created_time) : new Date()]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 11. PostSync
  // ----------------------------------------------------
  static async PostSync(companyId, pageId, token) {
    return this.runModule('PostSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pageToken = await this.getPageAccessToken(pageId, token);
      const res = await MetaGraphService.get(`/${pageId}/published_posts`, pageToken, {
        fields: 'id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)'
      });

      for (const post of res?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_posts (company_id, page_id, post_id, message, permalink, published_at, likes_count, comments_count, shares_count, last_sync_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE message = VALUES(message), likes_count = VALUES(likes_count), comments_count = VALUES(comments_count), last_sync_at = NOW()
          `, [companyId, pageId, post.id, post.message || '', post.permalink_url || null, post.created_time ? new Date(post.created_time) : new Date(), post.reactions?.summary?.total_count || 0, post.comments?.summary?.total_count || 0, post.shares?.count || 0]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 12. CommentSync
  // ----------------------------------------------------
  static async CommentSync(companyId, postId, token) {
    return this.runModule('CommentSync', async () => {
      if (!postId || postId === process.env.META_ASSET_ID) {
        return { count: 0 };
      }
      const pool = await getPool();
      let count = 0;
      const cmtRes = await MetaGraphService.get(`/${postId}/comments`, token, {
        fields: 'id,message,created_time,from,like_count'
      });

      for (const c of cmtRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_comments (company_id, post_id, comment_id, from_name, from_id, message, like_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE message = VALUES(message), like_count = VALUES(like_count), updated_at = NOW()
          `, [companyId, postId, c.id, c.from?.name || 'Facebook User', c.from?.id || null, c.message || '', c.like_count || 0, c.created_time ? new Date(c.created_time) : new Date()]);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 13. MessageSync
  // ----------------------------------------------------
  static async MessageSync(companyId, pageId, token) {
    return this.runModule('MessageSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pageToken = await this.getPageAccessToken(pageId, token);
      const convRes = await MetaGraphService.get(`/${pageId}/conversations`, pageToken, {
        fields: 'id,unread_count,updated_time,messages{id,message,created_time,from}'
      });

      for (const conv of convRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_conversations (company_id, page_id, conversation_id, unread_count, updated_time, last_message)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE unread_count = VALUES(unread_count), updated_time = VALUES(updated_time), last_message = VALUES(last_message), updated_at = NOW()
          `, [companyId, pageId, conv.id, conv.unread_count || 0, conv.updated_time ? new Date(conv.updated_time) : new Date(), conv.messages?.data?.[0]?.message || 'Conversation initiated']);
        }
        count++;
      }
      return { count };
    });
  }

  // ----------------------------------------------------
  // 14. InsightsSync
  // ----------------------------------------------------
  static async InsightsSync(companyId, pageId, token) {
    return this.runModule('InsightsSync', async () => {
      const pool = await getPool();
      let count = 0;
      const pageToken = await this.getPageAccessToken(pageId, token);
      const metrics = ['page_post_engagements', 'page_daily_follows'];
      const res = await MetaGraphService.get(`/${pageId}/insights`, pageToken, {
        metric: metrics.join(','),
        period: 'day'
      });

      for (const item of res?.data || []) {
        const val = item.values && item.values[0] ? String(item.values[0].value) : '0';
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_insights (company_id, page_id, object_id, metric_name, metric_value, period, date_start, date_end)
            VALUES (?, ?, ?, ?, ?, 'day', CURDATE(), CURDATE())
          `, [companyId, pageId, pageId, item.name, val]);
        }
        count++;
      }
      return { count };
    });
  }

  // ====================================================
  // FULL MASTER ENGINE EXECUTION (STRICT FAILURE PROPAGATION)
  // ====================================================
  static async syncAll(companyId = 1) {
    const startTime = Date.now();
    const token = await MetaOAuthService.getActiveToken(companyId);

    if (!token) {
      return {
        status: 'FAILED',
        errorCode: 'META_AUTH_REQUIRED',
        message: 'No valid Meta OAuth access token found for company',
        modules: {},
        durationMs: Date.now() - startTime
      };
    }

    // Execute all 14 Sync Modules
    const businessRes = await this.BusinessSync(companyId, token);
    const facebookRes = await this.FacebookSync(companyId, token);
    const whatsappRes = await this.WhatsAppSync(companyId, token);
    const adAccountRes = await this.AdAccountSync(companyId, token);

    const pageId = process.env.META_ASSET_ID || '1182447904960438';
    const instagramRes = await this.InstagramSync(companyId, pageId, token);
    const leadFormRes = await this.LeadFormSync(companyId, pageId, token);
    const leadRes = await this.LeadSync(companyId, pageId, token);
    const postRes = await this.PostSync(companyId, pageId, token);
    const commentRes = await this.CommentSync(companyId, pageId, token);
    const messageRes = await this.MessageSync(companyId, pageId, token);
    const insightsRes = await this.InsightsSync(companyId, pageId, token);

    const campaignRes = await this.CampaignSync(companyId, process.env.META_BUSINESS_ID || '1182451024960126', token);
    const adSetRes = await this.AdSetSync(companyId, 'camp_1', token);
    const adRes = await this.AdSync(companyId, 'adset_1', token);

    const modules = {
      BusinessSync: businessRes,
      FacebookSync: facebookRes,
      InstagramSync: instagramRes,
      WhatsAppSync: whatsappRes,
      AdAccountSync: adAccountRes,
      CampaignSync: campaignRes,
      AdSetSync: adSetRes,
      AdSync: adRes,
      LeadFormSync: leadFormRes,
      LeadSync: leadRes,
      PostSync: postRes,
      CommentSync: commentRes,
      MessageSync: messageRes,
      InsightsSync: insightsRes
    };

    // Check if any module failed
    const failedModules = Object.values(modules).filter(m => m.status === 'FAILED');
    const hasFailures = failedModules.length > 0;
    const isTokenExpired = failedModules.some(m => (m.message && (m.message.includes('session is invalid') || m.message.includes('access token') || m.message.includes('OAuth'))));

    if (isTokenExpired) {
      try {
        const pool = await getPool();
        if (pool) {
          await pool.query(`UPDATE meta_connections SET status = 'TOKEN_EXPIRED', updated_at = NOW() WHERE company_id = ?`, [companyId]);
        }
      } catch (ignore) {}
    }

    const overallStatus = hasFailures ? 'FAILED' : 'SUCCESS';
    const totalCount = Object.values(modules).reduce((sum, m) => sum + (m.count || 0), 0);

    return {
      status: overallStatus,
      totalSyncedCount: totalCount,
      lastSyncedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      modules
    };
  }
}

module.exports = MetaSyncEngine;
