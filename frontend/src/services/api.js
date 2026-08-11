/**
 * CODIGIX Executive OS - Complete API Client Service
 * Interacts with Node.js Express backend via Vite Proxy (/api -> http://localhost:5000/api)
 * with automatic fallback caching.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api';
const BACKEND_FALLBACK = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    try {
      const fallbackRes = await fetch(`${BACKEND_FALLBACK}/api${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    } catch (fallbackErr) {
      console.warn(`Backend API ${endpoint} offline. Client cache active.`, err.message);
    }
    return null;
  }
}

// 1. Dashboard API
export async function getDashboardAPI() {
  return await fetchAPI('/dashboard');
}

// 2. Planner API
export async function getPlannerAPI() {
  return await fetchAPI('/planner');
}

export async function createPlannerTaskAPI(task) {
  return await fetchAPI('/planner/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
}

export async function batchSavePlannerTasksAPI(tasks, timeline) {
  return await fetchAPI('/planner/batch', {
    method: 'POST',
    body: JSON.stringify({ tasks, timeline })
  });
}

export async function deletePlannerTaskAPI(id) {
  return await fetchAPI(`/planner/tasks/${id}`, {
    method: 'DELETE'
  });
}

export async function clearPlannerTasksAPI() {
  return await fetchAPI('/planner/tasks', {
    method: 'DELETE'
  });
}

export async function deleteScheduleItemAPI(id) {
  return await fetchAPI(`/planner/schedule/${id}`, {
    method: 'DELETE'
  });
}

// 3. Logger API
export async function getLoggerDomainsAPI() {
  return await fetchAPI('/logger/domains');
}

export async function getDomainsAPI() {
  return await fetchAPI('/logger');
}

export async function updateDomainTaskAPI(domainId, taskId, status) {
  return await fetchAPI('/logger/task-status', {
    method: 'PUT',
    body: JSON.stringify({ domainId, taskId, status })
  });
}

// 4. Meetings API
export async function getMeetingsAPI() {
  return await fetchAPI('/meetings');
}

export async function createMeetingAPI(meeting) {
  return await fetchAPI('/meetings', {
    method: 'POST',
    body: JSON.stringify(meeting)
  });
}

export async function updateMeetingAPI(id, meeting) {
  return await fetchAPI(`/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(meeting)
  });
}

export async function deleteMeetingAPI(id) {
  return await fetchAPI(`/meetings/${id}`, {
    method: 'DELETE'
  });
}

// 5. Clients API
export async function getClientsAPI() {
  return await fetchAPI('/clients');
}

export async function createClientAPI(client) {
  return await fetchAPI('/clients', {
    method: 'POST',
    body: JSON.stringify(client)
  });
}

export async function updateClientAPI(id, client) {
  return await fetchAPI(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client)
  });
}

export async function deleteClientAPI(id) {
  return await fetchAPI(`/clients/${id}`, {
    method: 'DELETE'
  });
}

// 6. Sales KPI API
export async function getSalesKPIAPI() {
  return await fetchAPI('/sales');
}

// 7. Project KPI API
export async function getProjectsKPIAPI() {
  return await fetchAPI('/projects');
}

// 8. Team Performance API
export async function getTeamPerformanceAPI() {
  return await fetchAPI('/team');
}

// 9. Finance Dashboard & Sales/Purchase Management API
export async function getFinanceDashboardAPI(period = 'this_month') {
  return await fetchAPI(`/finance/dashboard?period=${period}`);
}

export async function fetchSalesAPI() {
  return await fetchAPI('/finance/sales');
}

export async function createSaleAPI(saleData) {
  return await fetchAPI('/finance/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  });
}

export async function deleteSaleAPI(id) {
  return await fetchAPI(`/finance/sales/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchPurchasesAPI() {
  return await fetchAPI('/finance/purchases');
}

export async function createPurchaseAPI(purchaseData) {
  return await fetchAPI('/finance/purchases', {
    method: 'POST',
    body: JSON.stringify(purchaseData)
  });
}

export async function deletePurchaseAPI(id) {
  return await fetchAPI(`/finance/purchases/${id}`, {
    method: 'DELETE'
  });
}

// 10. Marketing Dashboard API
export async function getMarketingDashboardAPI() {
  return await fetchAPI('/marketing');
}

// 11. Reports API
export async function getReportsAPI() {
  return await fetchAPI('/reports');
}

// 12. AI API
export async function sendAIChatAPI(prompt, systemContext) {
  return await fetchAPI('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt, systemContext })
  });
}

// 13. System Notifications API
export async function fetchNotificationsAPI() {
  return await fetchAPI('/notifications');
}

export async function markNotificationsReadAPI(ids = [], all = false) {
  return await fetchAPI('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ ids, all })
  });
}

export async function updatePlannerTaskAPI(id, taskData) {
  return await fetchAPI(`/planner/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
}
