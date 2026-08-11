// src/modules/marketing/services/google.service.js

export async function fetchGoogleDashboard() {
  try {
    const res = await fetch('/api/google/dashboard');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Google Business API fetch notice:', e.message);
  }

  // Real empty state payload when no GMB account is linked or fetched
  return {
    connected: false,
    location: null,
    metrics: {
      total_search_views: 0,
      total_maps_views: 0,
      total_website_clicks: 0,
      total_phone_calls: 0,
      total_direction_requests: 0,
      average_rating: '0.0',
      total_reviews: 0
    },
    reviews: [],
    photos: [],
    posts: [],
    products: [],
    services: [],
    questions: [],
    performance: [],
    sync_logs: []
  };
}

export async function fetchGoogleStatus() {
  const res = await fetch('/api/google/status');
  if (!res.ok) throw new Error('Failed to fetch Google connection status');
  return await res.json();
}

export async function fetchGoogleLocations() {
  const res = await fetch('/api/google/locations');
  if (!res.ok) throw new Error('Failed to fetch Google Business locations');
  return await res.json();
}

export async function fetchGoogleReviews() {
  const res = await fetch('/api/google/reviews');
  if (!res.ok) throw new Error('Failed to fetch Google customer reviews');
  return await res.json();
}

export async function replyGoogleReview(reviewId, replyText) {
  const res = await fetch(`/api/google/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: replyText })
  });
  if (!res.ok) throw new Error('Failed to post reply to Google review');
  return await res.json();
}

export async function fetchGooglePhotos() {
  const res = await fetch('/api/google/photos');
  if (!res.ok) throw new Error('Failed to fetch Google Business media catalog');
  return await res.json();
}

export async function fetchGooglePosts() {
  const res = await fetch('/api/google/posts');
  if (!res.ok) throw new Error('Failed to fetch Google Business posts');
  return await res.json();
}

export async function createGooglePost(postData) {
  const res = await fetch('/api/google/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  if (!res.ok) throw new Error('Failed to publish Google Business post');
  return await res.json();
}

export async function fetchGoogleProducts() {
  const res = await fetch('/api/google/products');
  if (!res.ok) throw new Error('Failed to fetch Google Business products catalog');
  return await res.json();
}

export async function fetchGoogleServices() {
  const res = await fetch('/api/google/services');
  if (!res.ok) throw new Error('Failed to fetch Google Business services catalog');
  return await res.json();
}

export async function fetchGoogleQuestions() {
  const res = await fetch('/api/google/questions');
  if (!res.ok) throw new Error('Failed to fetch Google Q&A list');
  return await res.json();
}

export async function answerGoogleQuestion(questionId, answerText) {
  const res = await fetch(`/api/google/questions/${questionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: answerText })
  });
  if (!res.ok) throw new Error('Failed to post answer to Google question');
  return await res.json();
}

export async function fetchGooglePerformance() {
  const res = await fetch('/api/google/performance');
  if (!res.ok) throw new Error('Failed to fetch Google 30-day performance telemetry');
  return await res.json();
}

export async function postGoogleLogin(redirect = false) {
  const res = await fetch('/api/google/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect })
  });
  if (!res.ok) throw new Error('Failed to initiate Google OAuth login via POST');
  return await res.json();
}

export async function triggerGoogleSync() {
  const res = await fetch('/api/google/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger Google synchronization engine');
  return await res.json();
}

export async function fetchGoogleSyncHistory() {
  const res = await fetch('/api/google/sync/history');
  if (!res.ok) throw new Error('Failed to fetch Google synchronization history log');
  return await res.json();
}

export async function saveGoogleAccessToken(accessToken, refreshToken) {
  const res = await fetch('/api/google/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
  });
  if (!res.ok) throw new Error('Failed to save Google access token');
  return await res.json();
}
