// src/modules/marketing/services/linkedin.service.js

export async function fetchLinkedInDashboard() {
  try {
    const res = await fetch('/api/linkedin/dashboard');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('LinkedIn API fetch notice:', e.message);
  }

  return {
    connected: false,
    account: null,
    organization: null,
    metrics: {
      total_followers: 0,
      total_impressions: 0,
      total_clicks: 0,
      total_reactions: 0,
      total_comments: 0,
      total_shares: 0,
      average_engagement_rate: '0.00%'
    },
    posts: [],
    analytics: [],
    followers: [],
    sync_logs: []
  };
}

export async function fetchLinkedInProfile() {
  const res = await fetch('/api/linkedin/profile');
  if (!res.ok) throw new Error('Failed to fetch LinkedIn profile');
  return await res.json();
}

export async function fetchLinkedInOrganizations() {
  const res = await fetch('/api/linkedin/organizations');
  if (!res.ok) throw new Error('Failed to fetch LinkedIn organizations');
  return await res.json();
}

export async function fetchLinkedInPosts() {
  const res = await fetch('/api/linkedin/posts');
  if (!res.ok) throw new Error('Failed to fetch LinkedIn corporate posts');
  return await res.json();
}

export async function fetchLinkedInAnalytics() {
  const res = await fetch('/api/linkedin/analytics');
  if (!res.ok) throw new Error('Failed to fetch LinkedIn analytics telemetry');
  return await res.json();
}

export async function triggerLinkedInSync() {
  const res = await fetch('/api/linkedin/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger LinkedIn sync engine');
  return await res.json();
}

export async function postLinkedInLogin(redirect = false) {
  const res = await fetch('/api/linkedin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect })
  });
  if (!res.ok) throw new Error('Failed to initiate LinkedIn OAuth login');
  return await res.json();
}

export async function saveLinkedInAccessToken(accessToken) {
  const res = await fetch('/api/linkedin/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken })
  });
  if (!res.ok) throw new Error('Failed to save LinkedIn access token');
  return await res.json();
}
