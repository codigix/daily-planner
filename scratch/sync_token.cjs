require('dotenv').config();
const { getPool } = require('../server/db_mysql.cjs');
const https = require('https');

const userToken = 'EAAYMFJxD70kBSIB28y0fCJ0JcYbWgTI0pK3Bh41oSvlxwHq9nL610ro9r1gKfVxcAfCZCfkoCSe3xEBGaNglbtMfUK2jZBVdaIA5QATrQEjcmeq8RFvKpkZBS2czSQT5FoT1k9KvbSvSnlZBVYJmLRImbkBm18MQk2L9QJoHZC3NiUzKg89xXKVOlIDkK7ZBRytfnkTbVUbrdEDe725Y84X0eXNRuLk5xFhSwTSzhZAGSJB3M0ZBrRZCTEwmlZCei7SfOGUaZBEFmejHoJVNXUYELFa1kS6muwPx4rLzgeIBQZDZD';

function fetchGraphApi(path, token) {
  return new Promise((resolve) => {
    const separator = path.includes('?') ? '&' : '?';
    const urlPath = `/v24.0/${path}${separator}access_token=${encodeURIComponent(token)}`;

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: urlPath,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function runSync() {
  console.log('🔄 Syncing user access token with Meta Graph API v24.0 & MySQL...');
  const pool = await getPool();
  if (!pool) {
    console.error('❌ Failed to connect to MySQL pool');
    process.exit(1);
  }

  // 1. Fetch User ID (/me)
  let metaUserId = 'meta_user_live';
  const meRes = await fetchGraphApi('me?fields=id,name', userToken);
  if (meRes && meRes.id) {
    metaUserId = meRes.id;
    console.log(`✅ Fetched Meta User: ID=${meRes.id}, Name=${meRes.name}`);
  }

  // 2. Save into meta_accounts
  await pool.query(`
    INSERT INTO meta_accounts (company_id, meta_user_id, business_id, access_token, expires_at)
    VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 60 DAY))
    ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), expires_at = VALUES(expires_at), updated_at = NOW();
  `, ['codigix_infotech', metaUserId, '1182451024960126', userToken]);
  console.log('✅ Saved access_token into meta_accounts table!');

  // 3. Fetch Businesses (me/businesses)
  const bizRes = await fetchGraphApi('me/businesses?fields=id,name,timezone_id,currency', userToken);
  if (bizRes && bizRes.data) {
    for (const b of bizRes.data) {
      await pool.query(`
        INSERT INTO meta_businesses (id, name, timezone, currency)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), timezone = VALUES(timezone), currency = VALUES(currency);
      `, [b.id, b.name, b.timezone_id || 'Asia/Kolkata', b.currency || 'INR']);
      console.log(`✅ Stored Business: ID=${b.id}, Name=${b.name}`);
    }
  }

  // 4. Fetch Facebook Pages (me/accounts)
  const pageRes = await fetchGraphApi('me/accounts?fields=id,name,category,access_token,followers_count,picture,instagram_business_account', userToken);
  if (pageRes && pageRes.data) {
    for (const pg of pageRes.data) {
      const pgToken = pg.access_token || userToken;
      await pool.query(`
        INSERT INTO meta_pages (id, name, category, access_token, followers, profile_picture)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), access_token = VALUES(access_token), followers = VALUES(followers), profile_picture = VALUES(profile_picture);
      `, [pg.id, pg.name, pg.category || 'Business Page', pgToken, pg.followers_count || 0, pg.picture?.data?.url || '']);
      console.log(`✅ Stored Facebook Page: ID=${pg.id}, Name=${pg.name}`);

      // Fetch Instagram Business Account
      let igAccId = pg.instagram_business_account?.id;
      if (!igAccId) {
        const pgDetails = await fetchGraphApi(`${pg.id}?fields=instagram_business_account`, pgToken);
        igAccId = pgDetails?.instagram_business_account?.id;
      }

      if (igAccId) {
        const igInfo = await fetchGraphApi(`${igAccId}?fields=id,username,name,followers_count,follows_count,media_count,profile_picture_url,biography`, pgToken);
        if (igInfo && igInfo.id) {
          await pool.query(`
            INSERT INTO meta_instagram (id, page_id, username, name, followers, follows, media_count, profile_picture_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE page_id = VALUES(page_id), username = VALUES(username), name = VALUES(name), followers = VALUES(followers), follows = VALUES(follows), media_count = VALUES(media_count), profile_picture_url = VALUES(profile_picture_url);
          `, [igInfo.id, pg.id, igInfo.username || '', igInfo.name || '', igInfo.followers_count || 0, igInfo.follows_count || 0, igInfo.media_count || 0, igInfo.profile_picture_url || '']);
          console.log(`✅ Stored Instagram Account: ID=${igInfo.id}, Username=@${igInfo.username}`);
        }
      }
    }
  }

  // 5. Fetch Ad Accounts (me/adaccounts)
  const adRes = await fetchGraphApi('me/adaccounts?fields=id,name,currency,timezone_name,account_status', userToken);
  if (adRes && adRes.data) {
    for (const adAcc of adRes.data) {
      await pool.query(`
        INSERT INTO meta_ad_accounts (id, name, currency, timezone, status, account_status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), currency = VALUES(currency), timezone = VALUES(timezone), status = VALUES(status), account_status = VALUES(account_status);
      `, [adAcc.id, adAcc.name, adAcc.currency || 'INR', adAcc.timezone_name || 'Asia/Kolkata', 'Active', adAcc.account_status || 1]);
      console.log(`✅ Stored Ad Account: ID=${adAcc.id}, Name=${adAcc.name}`);

      // Fetch Campaigns
      const campRes = await fetchGraphApi(`${adAcc.id}/campaigns?fields=id,name,daily_budget,lifetime_budget,objective,status`, userToken);
      if (campRes && campRes.data) {
        for (const c of campRes.data) {
          const budgetVal = c.daily_budget ? `₹ ${Math.round(c.daily_budget / 100)}/day` : (c.lifetime_budget ? `₹ ${Math.round(c.lifetime_budget / 100)} lifetime` : '₹ 0');
          await pool.query(`
            INSERT INTO meta_campaigns (id, ad_account_id, name, budget, objective, status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name), budget = VALUES(budget), objective = VALUES(objective), status = VALUES(status);
          `, [c.id, adAcc.id, c.name, budgetVal, c.objective || 'OUTREACH', c.status || 'ACTIVE']);
        }
        console.log(`✅ Stored ${campRes.data.length} Campaign(s) for ${adAcc.id}`);
      }
    }
  }

  console.log('✨ Live Token Telemetry Sync Completed Successfully!');
  process.exit(0);
}

runSync();
