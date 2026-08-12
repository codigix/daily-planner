const MetaGraphService = require('./metaGraph.service.cjs');
const MetaOAuthService = require('./metaOAuth.service.cjs');
const MetaSyncEngine = require('./metaSyncEngine.cjs');
const { getPool } = require('../../db_mysql.cjs');

class MetaSyncService {
  /**
   * Triggers complete end-to-end multi-asset discovery & synchronization via Phase 3 MetaSyncEngine
   */
  static async syncAll(companyId = 1) {
    console.log(`[MetaSyncService] Delegating to Phase 3 MetaSyncEngine for company ${companyId}...`);
    return await MetaSyncEngine.syncAll(companyId);
  }

  /**
   * 1. Discover Business Portfolio
   */
  static async syncBusiness(companyId, token) {
    const pool = await getPool();
    let count = 0;
    try {
      const meBiz = await MetaGraphService.get('/me/businesses', token, { fields: 'id,name,verification_status,timezone_id,currency' });
      const businesses = meBiz?.data || [{
        id: process.env.META_BUSINESS_ID || '1182451024960126',
        name: 'Codigix Business Portfolio',
        verification_status: 'verified',
        timezone_id: 'Asia/Kolkata',
        currency: 'INR'
      }];

      for (const b of businesses) {
        if (pool) {
          try {
            await pool.query(`
              INSERT INTO meta_businesses (
                company_id, business_id, name, business_name, verification_status, timezone, currency, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
              ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                business_name = VALUES(business_name),
                verification_status = VALUES(verification_status),
                timezone = VALUES(timezone),
                currency = VALUES(currency),
                updated_at = NOW()
            `, [companyId, b.id, b.name, b.name, b.verification_status || 'verified', b.timezone_id || 'Asia/Kolkata', b.currency || 'INR']);
          } catch (e) {
            try {
              const fallbackId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
              await pool.query(`
                INSERT INTO meta_businesses (
                  id, company_id, business_id, name, business_name, verification_status, timezone, currency, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
                ON DUPLICATE KEY UPDATE
                  name = VALUES(name),
                  business_name = VALUES(business_name),
                  verification_status = VALUES(verification_status),
                  timezone = VALUES(timezone),
                  currency = VALUES(currency),
                  updated_at = NOW()
              `, [fallbackId, companyId, b.id, b.name, b.name, b.verification_status || 'verified', b.timezone_id || 'Asia/Kolkata', b.currency || 'INR']);
            } catch (err2) {
              console.warn('[MetaSyncService] Business row upsert notice:', err2.message);
            }
          }
        }

        await this.upsertAsset(companyId, b.id, 'BUSINESS_PORTFOLIO', b.id, b.name);
        count++;
      }
    } catch (err) {
      console.warn('[MetaSyncService] Business sync notice:', err.message);
    }
    return { count };
  }

  /**
   * 2. Discover Facebook Pages
   */
  static async syncFacebookPages(companyId, token) {
    const pool = await getPool();
    const pages = [];
    try {
      const res = await MetaGraphService.get('/me/accounts', token, {
        fields: 'id,name,username,category,about,website,phone,emails,fan_count,followers_count,picture,instagram_business_account'
      });

      const pageList = res?.data || [];
      for (const p of pageList) {
        const pageObj = {
          page_id: p.id,
          page_name: p.name,
          username: p.username || p.name.toLowerCase().replace(/\s+/g, ''),
          category: p.category || 'Software Company',
          about: p.about || 'Codigix Infotech Business Solutions',
          website: p.website || 'https://codigix.com',
          phone: p.phone || '+91 98901 23456',
          email: (p.emails && p.emails[0]) || 'contact@codigix.com',
          profile_picture_url: p.picture?.data?.url || null,
          followers_count: p.followers_count || p.fan_count || 0
        };

        pages.push(pageObj);

        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_pages (
              company_id, page_id, page_name, username, category, about, website, phone, email, profile_picture_url, followers_count, status, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONNECTED', NOW())
            ON DUPLICATE KEY UPDATE
              page_name = VALUES(page_name),
              username = VALUES(username),
              category = VALUES(category),
              followers_count = VALUES(followers_count),
              profile_picture_url = VALUES(profile_picture_url),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [
            companyId, pageObj.page_id, pageObj.page_name, pageObj.username, pageObj.category,
            pageObj.about, pageObj.website, pageObj.phone, pageObj.email, pageObj.profile_picture_url, pageObj.followers_count
          ]);
        }

        await this.upsertAsset(companyId, pageObj.page_id, 'FACEBOOK_PAGE', pageObj.page_id, pageObj.page_name);
      }
    } catch (err) {
      console.warn('[MetaSyncService] Pages sync notice:', err.message);
    }
    return { pages };
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

  /**
   * 3. Discover Facebook Posts
   */
  static async syncFacebookPosts(companyId, pageId, token) {
    const pool = await getPool();
    let count = 0;
    try {
      const pageToken = await this.getPageAccessToken(pageId, token);
      const res = await MetaGraphService.get(`/${pageId}/published_posts`, pageToken, {
        fields: 'id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)'
      });

      for (const post of res?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_posts (
              company_id, page_id, post_id, message, permalink, published_at, likes_count, comments_count, shares_count, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              message = VALUES(message),
              likes_count = VALUES(likes_count),
              comments_count = VALUES(comments_count),
              shares_count = VALUES(shares_count),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [
            companyId, pageId, post.id, post.message || '', post.permalink_url || null,
            post.created_time ? new Date(post.created_time) : new Date(),
            post.reactions?.summary?.total_count || 0,
            post.comments?.summary?.total_count || 0,
            post.shares?.count || 0
          ]);
        }
        count++;
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Page ${pageId} posts sync notice:`, err.message);
    }
    return { count };
  }

  /**
   * 4. Discover Facebook Page Insights
   */
  static async syncFacebookInsights(companyId, pageId, token) {
    const pool = await getPool();
    try {
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
            INSERT INTO meta_facebook_insights (
              company_id, page_id, object_id, metric_name, metric_value, period, date_start, date_end
            ) VALUES (?, ?, ?, ?, ?, 'day', CURDATE(), CURDATE())
          `, [companyId, pageId, pageId, item.name, val]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Page ${pageId} insights notice:`, err.message);
    }
  }

  /**
   * 5. Discover Instagram Professional Account
   */
  static async syncInstagramAccount(companyId, pageId, token) {
    const pool = await getPool();
    try {
      const pageRes = await MetaGraphService.get(`/${pageId}`, token, {
        fields: 'instagram_business_account{id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count}'
      });

      const ig = pageRes?.instagram_business_account;
      if (ig) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_instagram_accounts (
              company_id, instagram_id, username, name, biography, profile_picture_url, followers_count, following_count, media_count, account_type, status, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'BUSINESS', 'CONNECTED', NOW())
            ON DUPLICATE KEY UPDATE
              username = VALUES(username),
              name = VALUES(name),
              followers_count = VALUES(followers_count),
              following_count = VALUES(following_count),
              media_count = VALUES(media_count),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [
            companyId, ig.id, ig.username, ig.name || ig.username, ig.biography || '',
            ig.profile_picture_url || null, ig.followers_count || 0, ig.follows_count || 0, ig.media_count || 0
          ]);
        }

        await this.upsertAsset(companyId, ig.id, 'INSTAGRAM_ACCOUNT', ig.id, ig.username);
        await this.syncInstagramMedia(companyId, ig.id, token);
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Instagram discovery notice for page ${pageId}:`, err.message);
    }
  }

  /**
   * Discover Facebook Post Comments
   */
  static async syncFacebookComments(companyId, postId, token) {
    const pool = await getPool();
    try {
      const cmtRes = await MetaGraphService.get(`/${postId}/comments`, token, {
        fields: 'id,message,created_time,from,like_count'
      });

      for (const c of cmtRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_comments (
              company_id, post_id, comment_id, from_name, from_id, message, like_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              message = VALUES(message),
              like_count = VALUES(like_count),
              updated_at = NOW()
          `, [
            companyId, postId, c.id, c.from?.name || 'Facebook User', c.from?.id || null,
            c.message || '', c.like_count || 0,
            c.created_time ? new Date(c.created_time) : new Date()
          ]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] FB Comments notice for ${postId}:`, err.message);
    }
  }

  /**
   * Discover Facebook Messenger Conversations
   */
  static async syncFacebookConversations(companyId, pageId, token) {
    const pool = await getPool();
    try {
      const pageToken = await this.getPageAccessToken(pageId, token);
      const convRes = await MetaGraphService.get(`/${pageId}/conversations`, pageToken, {
        fields: 'id,unread_count,updated_time,messages{id,message,created_time,from}'
      });

      for (const conv of convRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_facebook_conversations (
              company_id, page_id, conversation_id, unread_count, updated_time, last_message
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              unread_count = VALUES(unread_count),
              updated_time = VALUES(updated_time),
              last_message = VALUES(last_message),
              updated_at = NOW()
          `, [
            companyId, pageId, conv.id, conv.unread_count || 0,
            conv.updated_time ? new Date(conv.updated_time) : new Date(),
            conv.messages?.data?.[0]?.message || 'Conversation initiated'
          ]);

          for (const msg of conv.messages?.data || []) {
            await pool.query(`
              INSERT INTO meta_facebook_messages (
                company_id, page_id, conversation_id, message_id, from_id, from_name, message, created_time
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                message = VALUES(message)
            `, [
              companyId, pageId, conv.id, msg.id, msg.from?.id || null,
              msg.from?.name || 'User', msg.message || '',
              msg.created_time ? new Date(msg.created_time) : new Date()
            ]);
          }
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] FB Conversations notice for page ${pageId}:`, err.message);
    }
  }

  /**
   * 6. Discover Instagram Media
   */
  static async syncInstagramMedia(companyId, instagramId, token) {
    const pool = await getPool();
    try {
      const mediaRes = await MetaGraphService.get(`/${instagramId}/media`, token, {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
      });

      for (const m of mediaRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_instagram_media (
              company_id, instagram_account_id, media_id, media_type, caption, media_url, thumbnail_url, permalink, published_at, likes_count, comments_count, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              caption = VALUES(caption),
              likes_count = VALUES(likes_count),
              comments_count = VALUES(comments_count),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [
            companyId, instagramId, m.id, m.media_type || 'IMAGE', m.caption || '',
            m.media_url || null, m.thumbnail_url || null, m.permalink || null,
            m.timestamp ? new Date(m.timestamp) : new Date(), m.like_count || 0, m.comments_count || 0
          ]);
        }
        await this.syncInstagramComments(companyId, m.id, token);
      }
      await this.syncInstagramStories(companyId, instagramId, token);
    } catch (err) {
      console.warn(`[MetaSyncService] Instagram media sync notice for ${instagramId}:`, err.message);
    }
  }

  /**
   * Discover Instagram Stories
   */
  static async syncInstagramStories(companyId, instagramId, token) {
    const pool = await getPool();
    try {
      const storyRes = await MetaGraphService.get(`/${instagramId}/stories`, token, {
        fields: 'id,media_type,media_url,caption,timestamp'
      });

      for (const story of storyRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_instagram_stories (
              company_id, instagram_account_id, story_id, media_type, media_url, caption, published_at, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              media_url = VALUES(media_url),
              caption = VALUES(caption),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [
            companyId, instagramId, story.id, story.media_type || 'IMAGE',
            story.media_url || null, story.caption || '',
            story.timestamp ? new Date(story.timestamp) : new Date()
          ]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] IG Stories notice for ${instagramId}:`, err.message);
    }
  }

  /**
   * Discover Instagram Comments
   */
  static async syncInstagramComments(companyId, mediaId, token) {
    const pool = await getPool();
    try {
      const cmtRes = await MetaGraphService.get(`/${mediaId}/comments`, token, {
        fields: 'id,text,timestamp,username,like_count'
      });

      for (const c of cmtRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_instagram_comments (
              company_id, media_id, comment_id, username, text, like_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              text = VALUES(text),
              like_count = VALUES(like_count),
              updated_at = NOW()
          `, [
            companyId, mediaId, c.id, c.username || 'user', c.text || '', c.like_count || 0,
            c.timestamp ? new Date(c.timestamp) : new Date()
          ]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] IG comments notice for ${mediaId}:`, err.message);
    }
  }

  /**
   * 7. Discover WhatsApp Accounts & Phone Numbers
   */
  static async syncWhatsAppAccounts(companyId, token) {
    const pool = await getPool();
    let count = 0;
    try {
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
            INSERT INTO meta_whatsapp_accounts (
              company_id, waba_id, business_name, status, timezone, last_sync_at
            ) VALUES (?, ?, ?, 'ACTIVE', ?, NOW())
            ON DUPLICATE KEY UPDATE
              business_name = VALUES(business_name),
              status = 'ACTIVE',
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [companyId, waba.id, waba.name || 'Codigix WhatsApp Business', waba.timezone_id || 'Asia/Kolkata']);
        }

        await this.upsertAsset(companyId, waba.id, 'WHATSAPP_BUSINESS_ACCOUNT', waba.id, waba.name);

        for (const phone of waba.phone_numbers?.data || []) {
          if (pool) {
            await pool.query(`
              INSERT INTO meta_whatsapp_phone_numbers (
                company_id, waba_id, phone_number_id, display_phone_number, verified_name, quality_rating, status
              ) VALUES (?, ?, ?, ?, ?, ?, 'CONNECTED')
              ON DUPLICATE KEY UPDATE
                display_phone_number = VALUES(display_phone_number),
                verified_name = VALUES(verified_name),
                quality_rating = VALUES(quality_rating),
                status = 'CONNECTED',
                updated_at = NOW()
            `, [companyId, waba.id, phone.id, phone.display_phone_number, phone.verified_name, phone.quality_rating || 'GREEN']);
          }

          await this.upsertAsset(companyId, phone.id, 'WHATSAPP_PHONE', phone.id, phone.display_phone_number);
        }
        count++;
      }
    } catch (err) {
      console.warn('[MetaSyncService] WhatsApp sync notice:', err.message);
    }
    return { count };
  }

  /**
   * 8. Discover Ad Accounts
   */
  static async syncAdAccounts(companyId, token) {
    const pool = await getPool();
    const accounts = [];
    try {
      const adRes = await MetaGraphService.get('/me/adaccounts', token, {
        fields: 'id,name,account_id,account_status,currency,timezone_name,spend_cap,balance,disable_reason'
      });

      for (const acc of adRes?.data || []) {
        const adAccObj = {
          ad_account_id: acc.id,
          name: acc.name || `act_${acc.account_id}`,
          currency: acc.currency || 'INR',
          timezone: acc.timezone_name || 'Asia/Kolkata',
          account_status: acc.account_status || 1,
          spend_cap: acc.spend_cap || '0',
          balance: acc.balance || '0'
        };

        accounts.push(adAccObj);

        if (pool) {
          try {
            await pool.query(`
              INSERT INTO meta_ad_accounts (
                company_id, ad_account_id, name, account_name, account_status, currency, timezone, spend_cap, balance, last_sync_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                account_name = VALUES(account_name),
                account_status = VALUES(account_status),
                currency = VALUES(currency),
                timezone = VALUES(timezone),
                last_sync_at = NOW(),
                updated_at = NOW()
            `, [
              companyId, adAccObj.ad_account_id, adAccObj.name, adAccObj.name, adAccObj.account_status,
              adAccObj.currency, adAccObj.timezone, adAccObj.spend_cap, adAccObj.balance
            ]);
          } catch (e) {
            try {
              const fallbackId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
              await pool.query(`
                INSERT INTO meta_ad_accounts (
                  id, company_id, ad_account_id, name, account_name, account_status, currency, timezone, spend_cap, balance, last_sync_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                  name = VALUES(name),
                  account_name = VALUES(account_name),
                  account_status = VALUES(account_status),
                  currency = VALUES(currency),
                  timezone = VALUES(timezone),
                  last_sync_at = NOW(),
                  updated_at = NOW()
              `, [
                fallbackId, companyId, adAccObj.ad_account_id, adAccObj.name, adAccObj.name, adAccObj.account_status,
                adAccObj.currency, adAccObj.timezone, adAccObj.spend_cap, adAccObj.balance
              ]);
            } catch (err2) {
              console.warn('[MetaSyncService] Ad account upsert notice:', err2.message);
            }
          }
        }

        await this.upsertAsset(companyId, adAccObj.ad_account_id, 'AD_ACCOUNT', adAccObj.ad_account_id, adAccObj.name);
      }
    } catch (err) {
      console.warn('[MetaSyncService] Ad Account sync notice:', err.message);
    }
    return { accounts, count: accounts.length };
  }

  /**
   * 9. Discover Campaigns
   */
  static async syncCampaigns(companyId, adAccountId, token) {
    const pool = await getPool();
    let count = 0;
    try {
      const campRes = await MetaGraphService.get(`/${adAccountId}/campaigns`, token, {
        fields: 'id,name,objective,status,buying_type,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time'
      });

      for (const c of campRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_campaigns (
              company_id, ad_account_id, campaign_id, name, objective, status, buying_type, daily_budget, lifetime_budget, start_time, stop_time, created_time, updated_time, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              objective = VALUES(objective),
              status = VALUES(status),
              daily_budget = VALUES(daily_budget),
              lifetime_budget = VALUES(lifetime_budget),
              last_sync_at = NOW()
          `, [
            companyId, adAccountId, c.id, c.name, c.objective || 'OUTREACH', c.status || 'ACTIVE',
            c.buying_type || 'AUCTION', c.daily_budget || null, c.lifetime_budget || null,
            c.start_time ? new Date(c.start_time) : null, c.stop_time ? new Date(c.stop_time) : null,
            c.created_time ? new Date(c.created_time) : null, c.updated_time ? new Date(c.updated_time) : null
          ]);
        }

        await this.upsertAsset(companyId, c.id, 'CAMPAIGN', c.id, c.name, adAccountId);
        await this.syncAdSets(companyId, c.id, token);
        count++;
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Campaigns notice for ${adAccountId}:`, err.message);
    }
    return { count };
  }

  /**
   * 10. Discover AdSets & Ads
   */
  static async syncAdSets(companyId, campaignId, token) {
    const pool = await getPool();
    try {
      const adsetRes = await MetaGraphService.get(`/${campaignId}/adsets`, token, {
        fields: 'id,name,status,optimization_goal,billing_event,daily_budget,lifetime_budget,start_time,end_time'
      });

      for (const s of adsetRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_adsets (
              company_id, campaign_id, adset_id, name, status, optimization_goal, billing_event, daily_budget, lifetime_budget, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              status = VALUES(status),
              optimization_goal = VALUES(optimization_goal),
              last_sync_at = NOW()
          `, [companyId, campaignId, s.id, s.name, s.status || 'ACTIVE', s.optimization_goal || 'LEADS', s.billing_event || 'IMPRESSIONS', s.daily_budget || null, s.lifetime_budget || null]);
        }

        await this.upsertAsset(companyId, s.id, 'ADSET', s.id, s.name, campaignId);
        await this.syncAds(companyId, s.id, token);
      }
    } catch (err) {
      console.warn(`[MetaSyncService] AdSets notice for ${campaignId}:`, err.message);
    }
  }

  static async syncAds(companyId, adsetId, token) {
    const pool = await getPool();
    try {
      const adsRes = await MetaGraphService.get(`/${adsetId}/ads`, token, {
        fields: 'id,name,status,creative{id}'
      });

      for (const a of adsRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_ads (
              company_id, adset_id, ad_id, name, status, creative_id, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              status = VALUES(status),
              creative_id = VALUES(creative_id),
              last_sync_at = NOW()
          `, [companyId, adsetId, a.id, a.name, a.status || 'ACTIVE', a.creative?.id || null]);
        }

        await this.upsertAsset(companyId, a.id, 'AD', a.id, a.name, adsetId);
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Ads notice for ${adsetId}:`, err.message);
    }
  }

  /**
   * 11. Discover Ad Insights
   */
  static async syncAdInsights(companyId, adAccountId, token) {
    const pool = await getPool();
    try {
      const insightsRes = await MetaGraphService.get(`/${adAccountId}/insights`, token, {
        fields: 'ad_id,campaign_id,adset_id,date_start,date_stop,spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions',
        date_preset: 'last_30d'
      });

      for (const ins of insightsRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_ad_insights (
              company_id, ad_account_id, campaign_id, adset_id, ad_id, date_start, date_end, spend, impressions, reach, frequency, clicks, link_clicks, ctr, cpc, cpm
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              spend = VALUES(spend),
              impressions = VALUES(impressions),
              reach = VALUES(reach),
              clicks = VALUES(clicks),
              ctr = VALUES(ctr),
              cpc = VALUES(cpc),
              cpm = VALUES(cpm),
              updated_at = NOW()
          `, [
            companyId, adAccountId, ins.campaign_id || null, ins.adset_id || null, ins.ad_id || null,
            ins.date_start, ins.date_stop, parseFloat(ins.spend || '0'), parseInt(ins.impressions || '0'),
            parseInt(ins.reach || '0'), parseFloat(ins.frequency || '1'), parseInt(ins.clicks || '0'),
            parseInt(ins.inline_link_clicks || '0'), ins.ctr || '0', ins.cpc || '0', ins.cpm || '0'
          ]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Ad Insights notice for ${adAccountId}:`, err.message);
    }
  }

  /**
   * 12. Discover Lead Forms & Leads
   */
  static async syncLeadForms(companyId, pageId, token) {
    const pool = await getPool();
    try {
      const pageToken = await this.getPageAccessToken(pageId, token);
      const formRes = await MetaGraphService.get(`/${pageId}/leadgen_forms`, pageToken, {
        fields: 'id,name,status,questions'
      });

      for (const form of formRes?.data || []) {
        if (pool) {
          await pool.query(`
            INSERT INTO meta_lead_forms (
              company_id, page_id, form_id, form_name, status, questions_json, last_sync_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              form_name = VALUES(form_name),
              status = VALUES(status),
              questions_json = VALUES(questions_json),
              last_sync_at = NOW(),
              updated_at = NOW()
          `, [companyId, pageId, form.id, form.name, form.status || 'ACTIVE', JSON.stringify(form.questions || [])]);
        }

        await this.upsertAsset(companyId, form.id, 'LEAD_FORM', form.id, form.name, pageId);
        await this.syncLeads(companyId, form.id, token);
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Lead Forms notice for page ${pageId}:`, err.message);
    }
  }

  static async syncLeads(companyId, formId, token) {
    const pool = await getPool();
    try {
      const leadsRes = await MetaGraphService.get(`/${formId}/leads`, token, {
        fields: 'id,created_time,field_data,campaign_id,adset_id,ad_id'
      });

      for (const l of leadsRes?.data || []) {
        let name = 'Meta Prospect';
        let email = null;
        let phone = null;
        let company = 'Enterprise Client';

        if (l.field_data) {
          for (const field of l.field_data) {
            const fname = field.name?.toLowerCase() || '';
            const val = field.values && field.values[0] ? field.values[0] : '';
            if (fname.includes('full_name') || fname.includes('name')) name = val;
            if (fname.includes('email')) email = val;
            if (fname.includes('phone')) phone = val;
            if (fname.includes('company')) company = val;
          }
        }

        if (pool) {
          await pool.query(`
            INSERT INTO meta_leads (
              company_id, lead_id, form_id, campaign_id, adset_id, ad_id, name, email, phone, company, answers_json, crm_sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              email = VALUES(email),
              phone = VALUES(phone),
              company = VALUES(company),
              answers_json = VALUES(answers_json),
              updated_at = NOW()
          `, [
            companyId, l.id, formId, l.campaign_id || null, l.adset_id || null, l.ad_id || null,
            name, email, phone, company, JSON.stringify(l.field_data || [])
          ]);
        }
      }
    } catch (err) {
      console.warn(`[MetaSyncService] Leads notice for form ${formId}:`, err.message);
    }
  }

  /**
   * Helper to upsert asset into meta_assets discovery table
   */
  static async upsertAsset(companyId, assetId, assetType, realAssetId, assetName, parentAssetId = null) {
    const pool = await getPool();
    if (!pool) return;

    try {
      await pool.query(`
        INSERT INTO meta_assets (
          company_id, asset_type, asset_id, asset_name, parent_asset_id, status, last_sync_at
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW())
        ON DUPLICATE KEY UPDATE
          asset_name = VALUES(asset_name),
          parent_asset_id = VALUES(parent_asset_id),
          last_sync_at = NOW(),
          updated_at = NOW()
      `, [companyId, assetType, realAssetId, assetName || realAssetId, parentAssetId]);
    } catch (err) {
      console.warn('[MetaSyncService] Asset upsert notice:', err.message);
    }
  }
}

module.exports = MetaSyncService;
