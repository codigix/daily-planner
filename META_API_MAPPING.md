# CODIGIX INFOTECH – META GRAPH API MAPPING SPECIFICATION

| Feature / UI View | Meta API / Endpoint | Required Permission | Database Table | Backend Service | Frontend Component | Availability State |
|---|---|---|---|---|---|---|
| Business Discovery | `GET /v24.0/me/businesses` | `public_profile` | `meta_businesses` | `MetaSyncService.syncBusiness` | `MetaOverview.jsx` | API Available |
| Facebook Page Profile | `GET /v24.0/me/accounts` | `pages_show_list` | `meta_facebook_pages` | `MetaSyncService.syncFacebookPages` | `FacebookDashboard.jsx` | API Available |
| Facebook Page Posts | `GET /v24.0/{page-id}/published_posts` | `pages_read_engagement` | `meta_facebook_posts` | `MetaSyncService.syncFacebookPosts` | `FacebookDashboard.jsx` | API Available |
| Facebook Page Insights | `GET /v24.0/{page-id}/insights` | `pages_read_engagement` | `meta_facebook_insights` | `MetaSyncService.syncFacebookInsights` | `FacebookDashboard.jsx` | API Available |
| Instagram Profile | `GET /v24.0/{page-id}?fields=instagram_business_account` | `instagram_basic` | `meta_instagram_accounts` | `MetaSyncService.syncInstagramAccount` | `InstagramDashboard.jsx` | Business Account Required |
| Instagram Media | `GET /v24.0/{ig-account-id}/media` | `instagram_basic` | `meta_instagram_media` | `MetaSyncService.syncInstagramMedia` | `InstagramDashboard.jsx` | API Available |
| WhatsApp Accounts | `GET /v24.0/me/client_whatsapp_business_accounts` | `whatsapp_business_management` | `meta_whatsapp_accounts` | `MetaSyncService.syncWhatsAppAccounts` | `WhatsAppDashboard.jsx` | API Available |
| WhatsApp Phones | `GET /v24.0/{waba-id}/phone_numbers` | `whatsapp_business_management` | `meta_whatsapp_phone_numbers` | `MetaSyncService.syncWhatsAppAccounts` | `WhatsAppDashboard.jsx` | API Available |
| Meta Ad Accounts | `GET /v24.0/me/adaccounts` | `ads_read` | `meta_ad_accounts` | `MetaSyncService.syncAdAccounts` | `MetaAdsDashboard.jsx` | API Available |
| Meta Campaigns | `GET /v24.0/{ad-account-id}/campaigns` | `ads_read` | `meta_campaigns` | `MetaSyncService.syncCampaigns` | `MetaAdsDashboard.jsx` | API Available |
| Meta AdSets | `GET /v24.0/{campaign-id}/adsets` | `ads_read` | `meta_adsets` | `MetaSyncService.syncAdSets` | `MetaAdsDashboard.jsx` | API Available |
| Meta Ads | `GET /v24.0/{adset-id}/ads` | `ads_read` | `meta_ads` | `MetaSyncService.syncAds` | `MetaAdsDashboard.jsx` | API Available |
| Ad Insights (ROAS, Spend) | `GET /v24.0/{ad-account-id}/insights` | `ads_read` | `meta_ad_insights` | `MetaSyncService.syncAdInsights` | `MetaAdsDashboard.jsx` | API Available |
| Meta Lead Forms | `GET /v24.0/{page-id}/leadgen_forms` | `leads_retrieval` | `meta_lead_forms` | `MetaSyncService.syncLeadForms` | `MetaLeads.jsx` | API Available |
| Meta Leads Submissions | `GET /v24.0/{form-id}/leads` | `leads_retrieval` | `meta_leads` | `MetaSyncService.syncLeads` | `MetaLeads.jsx` | API Available |
| Real-Time Webhooks | `POST /api/webhooks/meta` | `pages_manage_metadata` | `meta_webhook_events` | `MetaWebhookService` | All | Real-Time Webhook |
