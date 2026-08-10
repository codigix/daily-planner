# CODIGIX INFOTECH – META BUSINESS MARKETING INTEGRATION SETUP GUIDE

This document provides complete instructions to set up, configure, deploy, test, and maintain the production-ready **Meta Business Marketing Integration** for Codigix Infotech Executive OS.

---

## 1. META DEVELOPER APP CONFIGURATION

1. Log into [Meta Developers Console](https://developers.facebook.com/).
2. Create a new App -> Select **Business** type.
3. App Name: `Codigix Executive OS`
4. In App Settings -> Basic:
   - Note down **App ID** (`META_APP_ID`)
   - Note down **App Secret** (`META_APP_SECRET`)
5. Add Product: **Facebook Login for Business**
   - Valid OAuth Redirect URIs:
     `http://localhost:5001/api/meta/callback`
     `https://yourproductiondomain.com/api/meta/callback`

---

## 2. REQUIRED META GRAPH API PERMISSIONS

Ensure the following Graph API v24.0 permissions are granted:

| Permission | Purpose |
|---|---|
| `public_profile` | Authenticate user & fetch basic profile |
| `email` | Retrieve account contact email |
| `pages_show_list` | Discover connected Facebook Pages |
| `pages_read_engagement` | Fetch Page posts, likes, comments & reach |
| `pages_manage_metadata` | Webhook subscriptions for Facebook Page events |
| `instagram_basic` | Discover Instagram Professional Account |
| `instagram_manage_insights` | Fetch Instagram media, impressions & reach insights |
| `whatsapp_business_management` | Manage WhatsApp Business Cloud API & Phone numbers |
| `ads_management` | Discover Meta Ad Accounts, Campaigns, Ad Sets & Ads |
| `ads_read` | Fetch Ad Insights, Spend, CPM, CPC, CTR & ROAS |
| `leads_retrieval` | Download Meta Lead Form responses & answers |

---

## 3. WEBHOOK CONFIGURATION

1. In Meta Developer Console -> Products -> **Webhooks**.
2. Select Object: **Page** or **User** / **WhatsApp Business Account**.
3. Callback URL: `https://yourdomain.com/api/webhooks/meta`
4. Verify Token: `codigix_meta_webhook_secret_verify_2026`
5. Subscriptions:
   - `leadgen` (Meta Lead Forms)
   - `messages` (WhatsApp Business Cloud API)

---

## 4. ENVIRONMENT VARIABLES SETUP

Copy `.env.example` to `.env` and fill in the official credentials:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=codigix_executive_os
DB_PORT=3306

META_APP_ID=1702132520841033
META_APP_SECRET=your_meta_app_secret_here
META_REDIRECT_URI=http://localhost:5001/api/meta/callback
META_GRAPH_API_VERSION=v24.0
META_WEBHOOK_VERIFY_TOKEN=codigix_meta_webhook_secret_verify_2026
META_WEBHOOK_APP_SECRET=your_meta_app_secret_here
META_TOKEN_ENCRYPTION_KEY=codigix_secret_32_byte_token_encryption_key_2026!
```

---

## 5. DATABASE INITIALIZATION

Run Node server to verify all 27 Meta integration MySQL tables are initialized:

```bash
npm run server
```

All 27 tables will be created automatically in MySQL:
`meta_connections`, `meta_businesses`, `meta_assets`, `meta_facebook_pages`, `meta_facebook_posts`, `meta_facebook_comments`, `meta_facebook_insights`, `meta_instagram_accounts`, `meta_instagram_media`, `meta_instagram_insights`, `meta_whatsapp_accounts`, `meta_whatsapp_phone_numbers`, `meta_whatsapp_contacts`, `meta_whatsapp_conversations`, `meta_whatsapp_messages`, `meta_whatsapp_templates`, `meta_ad_accounts`, `meta_campaigns`, `meta_adsets`, `meta_ads`, `meta_ad_insights`, `meta_lead_forms`, `meta_leads`, `meta_webhook_events`, `meta_sync_jobs`, `meta_audit_logs`, `meta_api_logs`.

---

## 6. END-TO-END VERIFICATION FLOW

1. Start full app: `npm run dev:all`
2. Open `http://localhost:5173/marketing` -> Select **Meta Business Suite** tab.
3. Click **Connect with Meta OAuth v24.0** or paste access token.
4. Verify initial background discovery & UPSERT sync.
5. Click **Push to CRM** on incoming leads to verify auto-creation in CRM (`clients` table).
