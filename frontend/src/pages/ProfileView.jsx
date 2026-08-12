import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar, 
  Edit3, 
  Save, 
  Sparkles, 
  CheckSquare, 
  Video, 
  DollarSign, 
  Activity, 
  Key, 
  FileText, 
  ChevronRight,
  ArrowUpRight,
  Flame,
  Zap,
  Star,
  Target,
  BarChart2,
  Lock,
  Bell,
  Sliders,
  Layers,
  Copy,
  ExternalLink,
  Filter,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function ProfileView({ 
  user: defaultUser, 
  plannerTasks = [], 
  meetings = [], 
  clients = [], 
  domains = [], 
  onNavigate, 
  onOpenAI 
}) {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'milestones' | 'settings'
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // User Profile Object
  const currentUser = authUser ? {
    name: authUser.fullName || authUser.email,
    role: authUser.role || 'Executive',
    email: authUser.email,
    avatar: authUser.avatarUrl || defaultUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'Overseeing company strategy, key client relationships, cross-functional execution, and revenue growth.'
  } : {
    name: defaultUser?.name || 'Ashwini Khedekar',
    role: defaultUser?.role || 'Managing Director',
    email: defaultUser?.email || 'ashwini@codigix.com',
    avatar: defaultUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'Overseeing company strategy, key client relationships, cross-functional execution, and revenue growth.'
  };

  const [editForm, setEditForm] = useState({
    name: currentUser.name,
    role: currentUser.role,
    email: currentUser.email,
    bio: currentUser.bio,
    currentPassword: '',
    newPassword: '',
    emailNotifications: true,
    weeklyReport: true
  });

  const [toastMessage, setToastMessage] = useState('');

  // ── Calculate Live Executive Performance Metrics ──
  const totalTasks = plannerTasks.length;
  const completedTasks = plannerTasks.filter(t => t.status === 'DONE' || t.status === 'Completed' || t.completed).length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 84;

  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter(m => m.status === 'Completed' || m.status === 'Done').length;

  const wonRevenue = clients.reduce((acc, c) => {
    if (c.status === 'Closed Won' || c.status === 'Completed') {
      const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
      return acc + val;
    }
    return acc;
  }, 0);

  const totalLoggedHours = Math.max(domains.reduce((acc, d) => {
    return acc + (d.tasks ? d.tasks.filter(t => t.status === 'DONE' || t.status === 'Completed').length * 2 : 6);
  }, 0), 52);

  // Dual-Area Execution Trend Data
  const areaChartData = [
    { month: 'Jan', completed: 22, efficiency: 78 },
    { month: 'Feb', completed: 34, efficiency: 86 },
    { month: 'Mar', completed: 29, efficiency: 82 },
    { month: 'Apr', completed: 41, efficiency: 90 },
    { month: 'May', completed: Math.max(completedTasks, 32), efficiency: Math.max(taskRate, 86) },
    { month: 'Jun', completed: Math.max(completedTasks + 6, 38), efficiency: 95 }
  ];

  // Domain Time Focus Allocation
  const domainFocusData = [
    { name: 'Engineering & Dev', value: 35, color: '#3b82f6' },
    { name: 'Sales & Client Growth', value: 25, color: '#10b981' },
    { name: 'Operations & Strategy', value: 25, color: '#8b5cf6' },
    { name: 'Finance & Resource Admin', value: 15, color: '#f59e0b' }
  ];

  // Weekly Activity Heatmap Data
  const weeklyHeatmap = [
    { day: 'Mon', tasks: 8, intensity: 'bg-emerald-500' },
    { day: 'Tue', tasks: 12, intensity: 'bg-emerald-600' },
    { day: 'Wed', tasks: 10, intensity: 'bg-emerald-500' },
    { day: 'Thu', tasks: 14, intensity: 'bg-emerald-700' },
    { day: 'Fri', tasks: 9, intensity: 'bg-emerald-500' },
    { day: 'Sat', tasks: 4, intensity: 'bg-emerald-300' },
    { day: 'Sun', tasks: 2, intensity: 'bg-emerald-200' }
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(currentUser.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setToastMessage('Executive preferences & security settings updated successfully!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 relative animate-in fade-in duration-300 max-w-[1600px] mx-auto">

      {/* ── Seamless Executive Profile Header Card ── */}
      <div className="card-base p-4 sm:p-8 space-y-4 sm:space-y-6 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-lg">
        {/* Subtle Top Brand Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600" />

        {/* Top Profile Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
          
          {/* Avatar & User Details */}
          <div className="flex flex-row sm:flex-row items-start gap-3.5 sm:gap-5">
            {/* Avatar Container */}
            <div className="relative shrink-0">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md bg-slate-100" 
              />
              <span className="absolute bottom-1 right-1 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-xs" title="Active Executive Session" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight capitalize truncate">
                  {currentUser.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/50">
                  {currentUser.role}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500" /> Top 1%
                </span>
              </div>

              <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                {currentUser.bio}
              </p>

              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                <button onClick={handleCopyEmail} className="flex items-center gap-1 hover:text-brand-600 transition-colors cursor-pointer bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[200px] sm:max-w-none">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                  <Copy className="w-2.5 h-2.5 text-slate-400 ml-0.5 shrink-0" />
                  {copiedEmail && <span className="text-[9px] text-emerald-600 font-bold">Copied!</span>}
                </button>

                <span className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Executive ID
                </span>

                <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since Jan 2026
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto">
            <button 
              onClick={onOpenAI}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Coach</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'analytics' : 'settings')}
              className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{activeTab === 'settings' ? 'Analytics' : 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Tab Navigation Bar (Scrollable Strip on Mobile) */}
        <div className="flex border-t border-slate-100 dark:border-slate-800 pt-3 gap-1.5 sm:gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-white shadow-md font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Performance & Analytics
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'milestones'
                ? 'bg-brand-600 text-white shadow-md font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Recent Milestones
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-brand-600 text-white shadow-md font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Account Settings
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TAB 1: PERFORMANCE & ANALYTICS DASHBOARD ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 sm:space-y-6">

          {/* 4 Metric Cards Ribbon (2x2 Grid on Mobile, 4 Side-by-Side on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* 1. Task Execution Index Card */}
            <div className="card-base p-3.5 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Completion Rate</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{taskRate}%</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${taskRate}%` }} />
                  </div>
                  <span className="text-[9px] font-extrabold text-brand-600 dark:text-brand-400 shrink-0">{completedTasks}/{totalTasks}</span>
                </div>
              </div>
            </div>

            {/* 2. Meetings Velocity Card */}
            <div className="card-base p-3.5 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Meetings Velocity</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{completedMeetings || totalMeetings}</div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-purple-600 dark:text-purple-400 block truncate">
                  {totalMeetings > 0 ? `${totalMeetings} Logged Calls` : 'Active Sessions'}
                </span>
              </div>
            </div>

            {/* 3. Sales Contribution Card */}
            <div className="card-base p-3.5 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Revenue Generated</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {wonRevenue > 0 ? `₹ ${(wonRevenue / 100000).toFixed(1)}L` : '₹ 45.0L'}
                </div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">
                  Closed Won Deals
                </span>
              </div>
            </div>

            {/* 4. Logged Ops Time Card */}
            <div className="card-base p-3.5 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ops Hours</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalLoggedHours} hrs</div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-500 block truncate">
                  Logger Sum
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Dual-Area Performance Curve & Weekly Activity Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Dual Area Performance Chart (8 Cols) */}
            <div className="lg:col-span-8 card-base flex flex-col justify-between p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base">Monthly Execution Curve & Efficiency</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Completed tasks vs efficiency score</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold">
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Tasks
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Efficiency
                  </span>
                </div>
              </div>

              <div className="h-56 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" name="Completed Tasks" />
                    <Area type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorEff)" name="Efficiency Index" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Output Heatmap & Focus Distribution (4 Cols) */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              
              {/* Weekly Output Heatmap Card */}
              <div className="card-base space-y-2.5 p-4 sm:p-5">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Weekly Activity Heatmap
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">This Week</span>
                </div>

                <div className="grid grid-cols-7 gap-1 pt-1">
                  {weeklyHeatmap.map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-1">
                      <div className={`w-full h-10 sm:h-12 rounded-lg sm:rounded-xl ${item.intensity} flex items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-xs transition-transform hover:scale-105`}>
                        {item.tasks}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{item.day}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 text-center pt-0.5">
                  🔥 High Output Consistency
                </div>
              </div>

              {/* Domain Focus Donut */}
              <div className="card-base space-y-2.5 p-4 sm:p-5">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" /> Domain Time Allocation
                </h4>

                <div className="h-40 sm:h-44 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={domainFocusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {domainFocusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-slate-900 dark:text-white">100%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Focus Sum</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                  {domainFocusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        {d.name.split(' ')[0]}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: RECENT MILESTONES FEED ── */}
      {activeTab === 'milestones' && (
        <div className="card-base space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-lg">Executive Milestones & Key Accomplishments</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Timeline of verified deliverables and accomplishments</p>
            </div>
            <button 
              onClick={() => onNavigate('planner')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Daily Planner</span> <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 relative before:absolute before:left-4 sm:before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {plannerTasks.map((task, idx) => (
              <div key={idx} className="relative pl-9 sm:pl-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all">
                <div className="absolute left-4 sm:left-6 top-4 sm:top-5 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">{task.title || `Executive Task #${idx + 1}`}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                      {task.category || 'Executive Ops'}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {task.note || 'Successfully executed milestone deliverable.'}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block">{task.time || 'Completed Today'}</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: ACCOUNT SETTINGS & SECURITY ── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="card-base space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-lg">Account Profile Settings</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Manage executive profile, email preferences, and security</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Designation / Role</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Executive Summary Bio</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-brand-600" /> Security & Password Update
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editForm.currentPassword}
                  onChange={e => setEditForm({ ...editForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editForm.newPassword}
                  onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Profile Section Modal"
      >
        <Filter className="w-6 h-6 text-white" />
      </button>

      {/* ── Mobile Filters Drawer Modal ── */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Profile Navigation & Options</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Select Profile Section</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'analytics', label: 'Performance & Analytics' },
                    { id: 'milestones', label: 'Recent Milestones Feed' },
                    { id: 'settings', label: 'Account Settings & Security' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMobileFilterModal(false);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${activeTab === tab.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

