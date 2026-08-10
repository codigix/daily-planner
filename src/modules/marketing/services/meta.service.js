// src/modules/marketing/services/meta.service.js

export async function fetchMetaDashboard(role = 'Admin') {
  const res = await fetch(`/api/meta/dashboard?role=${role}`);
  if (!res.ok) throw new Error('Failed to fetch Meta Dashboard telemetry');
  return await res.json();
}

export async function fetchMetaStatus() {
  const res = await fetch('/api/meta/status');
  if (!res.ok) throw new Error('Failed to fetch Meta connection status');
  return await res.json();
}

export async function fetchMetaBusiness() {
  const res = await fetch('/api/meta/business');
  if (!res.ok) throw new Error('Failed to fetch Meta Business Portfolio');
  return await res.json();
}

export async function fetchMetaPages() {
  const res = await fetch('/api/meta/pages');
  if (!res.ok) throw new Error('Failed to fetch Meta Facebook Pages');
  return await res.json();
}

export async function fetchMetaInstagram() {
  const res = await fetch('/api/meta/instagram');
  if (!res.ok) throw new Error('Failed to fetch Instagram account details');
  return await res.json();
}

export async function fetchMetaAdAccounts() {
  const res = await fetch('/api/meta/adaccounts');
  if (!res.ok) throw new Error('Failed to fetch Meta Ad Accounts');
  return await res.json();
}

export async function fetchMetaCampaigns() {
  const res = await fetch('/api/meta/campaigns');
  if (!res.ok) throw new Error('Failed to fetch Meta Campaigns');
  return await res.json();
}

export async function fetchMetaLeads() {
  const res = await fetch('/api/meta/leads');
  if (!res.ok) throw new Error('Failed to fetch Meta Lead Generation leads');
  return await res.json();
}

export async function fetchMetaMedia() {
  const res = await fetch('/api/meta/media');
  if (!res.ok) throw new Error('Failed to fetch Meta Instagram media items');
  return await res.json();
}

export async function triggerMetaSync() {
  const res = await fetch('/api/meta/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Meta background sync failed');
  return await res.json();
}

export async function exchangeMetaOAuthToken(code, clientId, clientSecret, redirectUri) {
  const res = await fetch(`/api/meta/oauth/token?code=${encodeURIComponent(code)}&client_id=${encodeURIComponent(clientId || '')}&client_secret=${encodeURIComponent(clientSecret || '')}&redirect_uri=${encodeURIComponent(redirectUri || '')}`);
  if (!res.ok) throw new Error('Failed to exchange OAuth code for access token');
  return await res.json();
}

export async function resetMetaDatabase() {
  const res = await fetch('/api/meta/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset Meta database tables');
  return await res.json();
}
