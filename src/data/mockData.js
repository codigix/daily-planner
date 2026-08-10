// CODIGIX Executive OS Data Configuration (Clean State)
export const initialUser = {
  name: 'Ashwini Khedekar',
  role: 'CEO & Founder',
  email: 'ashwini@codigix.com',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  company: 'CODIGIX INFOTECH'
};

export const navItems = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: 'LayoutDashboard' },
  { id: 'planner', label: 'Daily Planner', icon: 'Calendar', badge: 0, badgeColor: 'bg-blue-600' },
  { id: 'logger', label: 'Daily Task Logger', icon: 'CheckSquare' },
  { id: 'meetings', label: 'Meeting Manager', icon: 'Video' },
  { id: 'followups', label: 'Client Follow-ups', icon: 'UserCheck' },
  { id: 'sales', label: 'Sales KPI', icon: 'TrendingUp' },
  { id: 'projects', label: 'Project KPI', icon: 'Briefcase' },
  { id: 'team', label: 'Team Performance', icon: 'Users' },
  { id: 'finance', label: 'Finance Dashboard', icon: 'DollarSign' },
  { id: 'marketing', label: 'Marketing Dashboard', icon: 'PieChart' },
  { id: 'ai-assistant', label: 'AI Executive Assistant', icon: 'Bot' },
  { id: 'reports', label: 'Reports', icon: 'FileText' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', badge: 0, badgeColor: 'bg-blue-600' },
  { id: 'settings', label: 'Settings', icon: 'Settings' }
];

export const initialPlannerTasks = [];
export const initialScheduleTimeline = [];
export const initialDomains = [
  { id: 1, title: '1. Ops & Pipeline', tasks: [] },
  { id: 2, title: '2. Client & Pitching', tasks: [] },
  { id: 3, title: '3. Systems & Strategy', tasks: [] },
  { id: 4, title: '4. Finance & Governance', tasks: [] },
  { id: 5, title: '5. Daily Execution', tasks: [] },
  { id: 6, title: '6. Growth & Marketing', tasks: [] }
];
export const initialMeetings = [];
export const initialClients = [];
