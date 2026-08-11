/**
 * CODIGIX Executive OS — 22 Executive Domain Definitions (Frontend)
 * Mirrors server/domains.cjs for use in React components
 */

export const EXECUTIVE_DOMAINS = [
  { id: 1,  name: 'Executive Dashboard',        icon: '📊', color: '#6366f1', lightClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',   barColor: 'bg-indigo-500',  keywords: ['executive', 'dashboard', 'kpi overview', 'telemetry'] },
  { id: 2,  name: "Today's Priorities",          icon: '🎯', color: '#ef4444', lightClass: 'bg-red-50 text-red-700 border-red-200',             barColor: 'bg-red-500',     keywords: ['priorities', 'top priority', 'urgent', 'critical', 'focus'] },
  { id: 3,  name: 'Calendar & Schedule',         icon: '📅', color: '#0ea5e9', lightClass: 'bg-sky-50 text-sky-700 border-sky-200',             barColor: 'bg-sky-500',     keywords: ['calendar', 'schedule', 'appointment', 'agenda', 'time block'] },
  { id: 4,  name: 'Tasks & Execution',           icon: '✅', color: '#10b981', lightClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', barColor: 'bg-emerald-500', keywords: ['task', 'execution', 'daily execution', 'standup', 'sprint', 'daily'] },
  { id: 5,  name: 'Meetings',                    icon: '🤝', color: '#8b5cf6', lightClass: 'bg-violet-50 text-violet-700 border-violet-200',   barColor: 'bg-violet-500',  keywords: ['meeting', 'meet', 'call', 'sync', 'stand-up', 'leadership standup', 'weekly standup'] },
  { id: 6,  name: 'Decisions',                   icon: '⚖️', color: '#f59e0b', lightClass: 'bg-amber-50 text-amber-700 border-amber-200',      barColor: 'bg-amber-500',   keywords: ['decision', 'approve', 'approval', 'sign-off', 'authorize'] },
  { id: 7,  name: 'Operations',                  icon: '⚙️', color: '#64748b', lightClass: 'bg-slate-50 text-slate-700 border-slate-200',      barColor: 'bg-slate-500',   keywords: ['operations', 'ops', 'pipeline', 'delivery', 'operational', 'project portfolio', 'portfolio'] },
  { id: 8,  name: 'Sales & Clients',             icon: '💼', color: '#06b6d4', lightClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',         barColor: 'bg-cyan-500',    keywords: ['sales', 'client', 'lead', 'pitch', 'pitching', 'proposal', 'quotation', 'enterprise client', 'crm'] },
  { id: 9,  name: 'Product & Innovation',        icon: '🚀', color: '#7c3aed', lightClass: 'bg-purple-50 text-purple-700 border-purple-200',   barColor: 'bg-purple-500',  keywords: ['product', 'innovation', 'roadmap', 'feature', 'erp', 'hospital erp', 'manufacturing', 'release', 'product roadmap'] },
  { id: 10, name: 'Marketing & Brand',           icon: '📣', color: '#ec4899', lightClass: 'bg-pink-50 text-pink-700 border-pink-200',         barColor: 'bg-pink-500',    keywords: ['marketing', 'brand', 'seo', 'campaign', 'social media', 'inbound', 'growth', 'marketing brand', 'digital marketing'] },
  { id: 11, name: 'Finance',                     icon: '💰', color: '#16a34a', lightClass: 'bg-green-50 text-green-700 border-green-200',      barColor: 'bg-green-500',   keywords: ['finance', 'revenue', 'cash', 'budget', 'invoice', 'financial', 'accounts', 'billing'] },
  { id: 12, name: 'People & Leadership',         icon: '👥', color: '#0284c7', lightClass: 'bg-blue-50 text-blue-700 border-blue-200',         barColor: 'bg-blue-500',    keywords: ['people', 'leadership', 'hr', 'team', 'hire', 'hiring', 'talent', 'performance review', 'employee', 'leadership development'] },
  { id: 13, name: 'Strategy & Business Growth',  icon: '♟️', color: '#b45309', lightClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',   barColor: 'bg-yellow-500',  keywords: ['strategy', 'business', 'growth', 'board', 'strategic', 'business growth', 'executive strategy', 'planning'] },
  { id: 14, name: 'AI & Automation',             icon: '🤖', color: '#6366f1', lightClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',   barColor: 'bg-indigo-400',  keywords: ['ai', 'automation', 'assistant', 'llm', 'artificial intelligence', 'machine learning', 'ai executive', 'ai strategy'] },
  { id: 15, name: 'Risks & Escalations',         icon: '⚠️', color: '#dc2626', lightClass: 'bg-red-50 text-red-700 border-red-100',            barColor: 'bg-red-400',     keywords: ['risk', 'escalation', 'blocker', 'issue', 'incident', 'crisis', 'compliance'] },
  { id: 16, name: 'Documents & Approvals',       icon: '📋', color: '#475569', lightClass: 'bg-slate-50 text-slate-600 border-slate-200',      barColor: 'bg-slate-400',   keywords: ['document', 'approval', 'contract', 'legal', 'agreement', 'proposal review', 'sign', 'review'] },
  { id: 17, name: 'KPIs & Performance',          icon: '📈', color: '#059669', lightClass: 'bg-teal-50 text-teal-700 border-teal-200',         barColor: 'bg-teal-500',    keywords: ['kpi', 'performance', 'metric', 'analytics', 'dashboard review', 'sprint review', 'sprint progress', 'engineering leadership'] },
  { id: 18, name: 'Learning & Research',         icon: '📚', color: '#7c3aed', lightClass: 'bg-purple-50 text-purple-600 border-purple-200',   barColor: 'bg-purple-400',  keywords: ['learning', 'research', 'training', 'study', 'course', 'read', 'development'] },
  { id: 19, name: 'Notes & Ideas',               icon: '💡', color: '#d97706', lightClass: 'bg-amber-50 text-amber-600 border-amber-200',      barColor: 'bg-amber-400',   keywords: ['notes', 'ideas', 'brainstorm', 'capture', 'idea', 'thought', 'insight'] },
  { id: 20, name: 'End of Day Review',           icon: '🌙', color: '#4338ca', lightClass: 'bg-indigo-50 text-indigo-600 border-indigo-200',   barColor: 'bg-indigo-400',  keywords: ['end of day', 'eod', 'day review', 'wrap up', 'close of day', 'daily review', 'day end'] },
  { id: 21, name: 'Tomorrow Planning',           icon: '🌅', color: '#0369a1', lightClass: 'bg-sky-50 text-sky-600 border-sky-200',            barColor: 'bg-sky-400',     keywords: ['tomorrow', 'next day', 'prepare', 'tomorrow planning', 'week planning', 'weekly planning', 'weekly execution'] },
  { id: 22, name: 'AI Executive Summary',        icon: '✨', color: '#9333ea', lightClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', barColor: 'bg-fuchsia-500', keywords: ['ai summary', 'executive summary', 'weekly summary', 'report', 'briefing', 'ai report'] }
];

/**
 * Get best-matching domain for a task by scoring keyword matches on title + category
 */
export function getDomainIdForTask(title, category) {
  const searchStr = `${title || ''} ${category || ''}`.toLowerCase();
  let bestScore = 0;
  let bestId = 4; // Default: Tasks & Execution

  for (const domain of EXECUTIVE_DOMAINS) {
    let score = 0;
    for (const kw of domain.keywords) {
      if (searchStr.includes(kw.toLowerCase())) {
        score += kw.length; // longer match = more specific = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = domain.id;
    }
  }
  return bestId;
}

export function getDomainById(id) {
  return EXECUTIVE_DOMAINS.find(d => d.id === id) || EXECUTIVE_DOMAINS[3]; // fallback to Tasks & Execution
}
