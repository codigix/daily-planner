import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  TrendingUp,
  CheckSquare,
  Clock,
  Award,
  Star,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  MoreVertical,
  Sparkles,
  ChevronRight,
  Crown,
  TrendingDown,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function TeamPerformanceView({ domains = [], plannerTasks = [], onOpenAI }) {
  const [crmData, setCrmData] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState(null);

  useEffect(() => {
    async function loadCrmTeamData() {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const json = await res.json();
          setCrmData(json);
        }
      } catch (err) {
        console.error('Failed to load CRM team performance details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCrmTeamData();
  }, []);

  const totalTasks = crmData
    ? crmData.members.reduce((acc, m) => acc + m.totalTasks, 0)
    : plannerTasks.length;

  const completedTasks = crmData
    ? crmData.members.reduce((acc, m) => acc + m.completedTasks, 0)
    : plannerTasks.filter(t => t.status === 'Completed').length;

  const prodRate = crmData
    ? crmData.overallProductivity
    : 79;

  const totalMembers = crmData ? crmData.members.length : 20;

  const prodTrendData = [
    { date: 'Aug 5', rate: 38 },
    { date: 'Aug 6', rate: 56 },
    { date: 'Aug 7', rate: 45 },
    { date: 'Aug 8', rate: 70 },
    { date: 'Aug 9', rate: 60 }
  ];

  const deptProdData = [
    { name: 'Marketing', val: '80%', color: '#2563eb' },
    { name: 'IT Dept', val: '76%', color: '#3b82f6' },
    { name: 'Sales', val: '80%', color: '#f59e0b' },
    { name: 'Accounting', val: '80%', color: '#8b5cf6' },
    { name: 'Deals Mgmt', val: '80%', color: '#ef4444' },
    { name: 'Leads Mgmt', val: '80%', color: '#10b981' }
  ];

  const pendingTasks = crmData
    ? crmData.members.reduce((acc, m) => acc + (m.totalTasks - m.completedTasks), 0)
    : plannerTasks.filter(t => t.status === 'Pending').length;

  const overdueTasks = plannerTasks.filter(t => t.status === 'Overdue').length || 2;

  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981', pct: '0%' },
    { name: 'Pending', value: pendingTasks, color: '#2563eb', pct: '0%' },
    { name: 'Overdue', value: overdueTasks, color: '#ef4444', pct: '2 (Infinity%)' }
  ];

  const sampleTeamMembers = [
    { id: '1', name: 'aadarsh kumar', role: 'SEO & GMB', onTime: '80%', productivity: '80%', rating: '4.8', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', avatarBg: 'bg-blue-600' },
    { id: '2', name: 'mangavka vinayak', role: 'Video Editor', onTime: '80%', productivity: '80%', rating: '4.8', avatar: null, avatarBg: 'bg-blue-600' },
    { id: '3', name: 'karan gusinge', role: 'Graphics Designer', onTime: '80%', productivity: '80%', rating: '4.8', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', avatarBg: 'bg-blue-600' },
    { id: '4', name: 'sujata Choudhari', role: 'Wordpress Developer', onTime: '80%', productivity: '80%', rating: '4.8', avatar: null, avatarBg: 'bg-pink-500' },
    { id: '5', name: 'ashwini khedekar', role: 'Manager', onTime: '80%', productivity: '80%', rating: '4.8', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', avatarBg: 'bg-blue-600' }
  ];

  const filteredMembers = sampleTeamMembers.filter(m =>
    !memberSearchQuery || m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.role.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const topPerformers = [
    { name: 'aadarsh kumar', score: '80%' },
    { name: 'mangavka vinayak', score: '80%' },
    { name: 'karan gusinge', score: '80%' }
  ];

  const needsImprovement = [
    { name: 'sanika mote', score: '70%' },
    { name: 'Ashwini khedekar', score: '70%' },
    { name: 'sudarshan kale', score: '70%' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">

      {/* ── Page Header (Matches Screenshot Header) ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Team Performance</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Track, evaluate and improve team productivity
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAI}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">AI Team Assistant</span>
          <span className="sm:hidden text-[11px]">AI Assistant</span>
        </button>
      </div>

      {/* ── Row 1: 4 Side-by-Side KPI Cards (Matches Screenshot Row 1) ── */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {/* Card 1: Productivity Rate */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Productivity Rate</span>
              <span className="sm:hidden">Prod Rate</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{prodRate}%</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-blue-600 block mt-0.5 truncate">Task Rate</span>
          </div>
        </div>

        {/* Card 2: Work Items */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mb-1">
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Work Items</span>
              <span className="sm:hidden">Work</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalTasks}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-purple-600 block mt-0.5 truncate">Tasks</span>
          </div>
        </div>

        {/* Card 3: Completed Work */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Completed Work</span>
              <span className="sm:hidden">Done</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedTasks}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">Finished</span>
          </div>
        </div>

        {/* Card 4: Active Domains */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mb-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Active Domains</span>
              <span className="sm:hidden">Domains</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{domains.length}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-amber-500 block mt-0.5 truncate">Areas</span>
          </div>
        </div>
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Team Members</span>
              <span className="sm:hidden">Members</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalMembers}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> Sync
            </span>
          </div>
        </div>

        {/* Card 2: Productivity */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Productivity</span>
              <span className="sm:hidden">Prod</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{prodRate}%</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> Avg
            </span>
          </div>
        </div>

        {/* Card 3: Tasks Completed */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Tasks Completed</span>
              <span className="sm:hidden">Completed</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedTasks}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> Sync
            </span>
          </div>
        </div>

        {/* Card 4: Tasks Pending */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mb-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Tasks Pending</span>
              <span className="sm:hidden">Pending</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{pendingTasks}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowDownRight className="w-3 h-3" /> Open
            </span>
          </div>
        </div>
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">On-Time Delivery</span>
              <span className="sm:hidden">On-Time</span>
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{prodRate}%</div>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
        </div>

        {/* Card 2: Avg. Rating */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mb-1">
            <Star className="w-4 h-4 fill-purple-600" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block truncate">
              <span className="hidden sm:inline">Avg. Rating</span>
              <span className="sm:hidden">Rating</span>
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">4.8 / 5</div>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> Satisfactory
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 2: 4 Side-by-Side KPI Cards (Matches Screenshot Row 2) ── */}


      {/* ── Row 4: Compact Mini Chart Cards (Horizontally Swipeable on Mobile) ── */}
      <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x no-scrollbar pb-1">
        {/* Productivity Trend */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-black text-slate-900 dark:text-white text-xs">Productivity Trend</h3>
            <span className="text-[10px] font-bold text-slate-400">This Month</span>
          </div>
          <div className="h-28 sm:h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prodTrendData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity by Dept. Donut */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Productivity by Dept.</h3>
          <div className="flex items-center gap-3 my-1">
            <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptProdData} cx="50%" cy="50%" innerRadius={20} outerRadius={32} paddingAngle={2} dataKey="val">
                    {deptProdData.map((e, idx) => (
                      <Cell key={idx} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white">{prodRate}%</span>
                <span className="text-[7px] text-slate-400 font-bold">Overall</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-1 text-[9px] font-bold">
              {deptProdData.map((d) => (
                <div key={d.name} className="flex justify-between items-center gap-1">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono text-[9px]">{d.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Status Overview Donut */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Tasks Status Overview</h3>
          <div className="flex items-center gap-3 my-1">
            <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={20} outerRadius={32} paddingAngle={2} dataKey="value">
                    {taskStatusData.map((e, idx) => (
                      <Cell key={idx} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white">0</span>
                <span className="text-[7px] text-slate-400 font-bold">Total Tasks</span>
              </div>
            </div>

            <div className="flex-1 space-y-1 text-[9px] font-bold">
              {taskStatusData.map((s) => (
                <div key={s.name} className="flex justify-between items-center gap-1">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono text-[9px]">{s.value} ({s.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Team Member Performance & Right Sidebar Grid (Matches Screenshot) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

        {/* Left Column: Team Member Performance (8 Cols on Desktop) */}
        <div className="lg:col-span-8 card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Team Member Performance</h3>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={e => setMemberSearchQuery(e.target.value)}
              placeholder="Search team member..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Table Header Row */}
          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="w-1/3">Member</span>
            <span className="w-1/4">Role</span>
            <span className="text-center">On-Time</span>
            <span className="text-center">Productivity</span>
            <span className="text-right pr-2">Rating</span>
          </div>

          {/* Team Members List */}
          <div className="space-y-1.5">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedEmployeeForReport(m)}
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-2 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 w-1/3">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-7 h-7 rounded-full ${m.avatarBg} text-white font-black flex items-center justify-center text-xs shrink-0`}>
                      {m.name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{m.name}</span>
                </div>

                <div className="text-[10px] font-semibold text-slate-400 truncate w-1/4">
                  {m.role}
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {m.onTime}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {m.productivity}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" /> {m.rating}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button className="text-xs font-extrabold text-blue-600 hover:underline">
              View All Members
            </button>
          </div>
        </div>

        {/* Right Column: Top Performers, Needs Improvement & Attendance (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Top Performers Card */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" /> Top Performers
            </h4>
            <div className="space-y-1.5 text-xs font-extrabold">
              {topPerformers.map((tp, idx) => (
                <div key={tp.name} className="flex justify-between items-center">
                  <span className="text-slate-800 dark:text-slate-200">{idx + 1}. {tp.name}</span>
                  <span className="text-emerald-600">{tp.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Improvement Card */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-orange-500" /> Needs Improvement
            </h4>
            <div className="space-y-1.5 text-xs font-extrabold">
              {needsImprovement.map((ni) => (
                <div key={ni.name} className="flex justify-between items-center">
                  <span className="text-slate-800 dark:text-slate-200">{ni.name}</span>
                  <span className="text-orange-500">{ni.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Overview Ring Card */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Attendance Overview</h4>
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-500" strokeDasharray="91, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base font-black text-slate-900 dark:text-white">91%</span>
                <span className="text-[8px] font-bold text-slate-400">Attendance</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Team Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Team Filters & Options</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Search Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Team Members</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search by member name or role..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Department Filter</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Engineering', 'Marketing', 'Sales', 'Product', 'QA'].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setDeptFilter(dept)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${deptFilter === dept
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setMemberSearchQuery('');
                  setDeptFilter('All');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
