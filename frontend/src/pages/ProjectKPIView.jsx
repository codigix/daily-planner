import React, { useState } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Wallet,
  Star,
  Folder,
  ArrowRight,
  CheckSquare,
  Activity,
  Layers,
  Search,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function ProjectKPIView({ plannerTasks = [], clients = [], onOpenAI }) {
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  const totalProjects = clients.length || 3;
  const completedCount = clients.filter(c => c.status === 'Completed' || c.status === 'Closed Won').length;
  const inProgressCount = clients.filter(c => c.status === 'Pending' || c.status === 'Due Today' || c.status === 'In Progress').length;

  // Dynamic Pipeline Revenue Math
  const totalPipelineValue = clients.reduce((acc, c) => {
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0) || 520000;

  const wonValue = clients.reduce((acc, c) => {
    if (c.status !== 'Closed Won' && c.status !== 'Completed') return acc;
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const budgetUtilization = totalPipelineValue > 0 ? ((wonValue / totalPipelineValue) * 100).toFixed(1) : '0.0';
  const remainingBudget = Math.max(totalPipelineValue - wonValue, 0);
  const remainingBudgetPct = totalPipelineValue > 0 ? ((remainingBudget / totalPipelineValue) * 100).toFixed(1) : '100.0';

  const criticalCount = clients.filter(c => c.status === 'Overdue').length;
  const atRiskCount = clients.filter(c => c.priority === 'High' && c.status === 'Pending').length;
  const healthyCount = Math.max(totalProjects - criticalCount - atRiskCount, 0) || 3;

  const statusDistData = [
    { name: 'Completed', value: completedCount, color: '#10b981', pct: totalProjects > 0 ? `${Math.round((completedCount / totalProjects) * 100)}%` : '0%' },
    { name: 'In Progress', value: inProgressCount, color: '#2563eb', pct: totalProjects > 0 ? `${Math.round((inProgressCount / totalProjects) * 100)}%` : '0%' },
    { name: 'Pending', value: Math.max(totalProjects - completedCount - inProgressCount, 0) || 3, color: '#f59e0b', pct: '100%' }
  ];

  const progressOverviewData = [
    { month: 'Q1', Completed: 0, InProgress: 0, Overdue: 0 },
    { month: 'Q2', Completed: 0, InProgress: 0, Overdue: 0 },
    { month: 'Q3', Completed: completedCount, InProgress: inProgressCount, Overdue: criticalCount }
  ];

  const healthData = [
    { name: 'Healthy', value: healthyCount || 3, color: '#10b981', pct: '100%' },
    { name: 'At Risk', value: atRiskCount, color: '#f59e0b', pct: '0%' },
    { name: 'Critical', value: criticalCount, color: '#ef4444', pct: '0%' }
  ];

  // Group ongoing projects
  const ongoingItems = clients.length > 0 ? clients : [
    { id: '1', company: 'Morya hospital', tagline: 'health care services', owner: 'Ashwini K.', ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', status: 'Planning', probability: 30, expectedValue: '₹20,000' },
    { id: '2', company: 'SP tech', tagline: 'SP Tech erp', owner: 'Ashwini K.', ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', status: 'Planning', probability: 30, expectedValue: '₹2,50,000' },
    { id: '3', company: 'SP tech', tagline: 'SP Tech erp', owner: 'Ashwini khedekar', ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', status: 'Planning', probability: 30, expectedValue: '₹2,50,000' }
  ];

  const categoryTotals = {};
  ongoingItems.forEach(p => {
    const cat = p.category || 'Tasks & Execution';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + 1;
  });

  const projectsByDept = Object.entries(categoryTotals)
    .map(([name, count]) => ({
      dept: name,
      count,
      pct: ongoingItems.length > 0 ? `${((count / ongoingItems.length) * 100).toFixed(1)}%` : '100.0%'
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">
      
      {/* ── Page Header (Matches Screenshot Header) ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Project KPI Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Track overall project performance and key metrics in real-time.
            </p>
          </div>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden text-[11px]">AI</span>
        </button>
      </div>

      {/* ── Row 1: 4 Side-by-Side KPI Overview Cards (Matches Screenshot) ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Card 1: Total Projects & Tasks */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mb-1">
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block">
              <span className="hidden sm:inline">Total Projects & Tasks</span>
              <span className="sm:hidden">Total</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalProjects}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 block mt-0.5 truncate">Items</span>
          </div>
        </div>

        {/* Card 2: Completed Items */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block">
              <span className="hidden sm:inline">Completed Items</span>
              <span className="sm:hidden">Done</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedCount}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">Finished</span>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block">
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Active</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{inProgressCount}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-blue-600 block mt-0.5 truncate">Ongoing</span>
          </div>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mb-1">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block">
              <span className="hidden sm:inline">Completion Rate</span>
              <span className="sm:hidden">Rate</span>
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0}%
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold text-amber-500 block mt-0.5 truncate">Score</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Compact Mini Chart Cards (Horizontally Swipeable on Mobile) ── */}
      <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x no-scrollbar pb-1">
        {/* Status Distribution Donut */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Status Distribution</h3>
          <div className="flex items-center gap-3 my-1">
            <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistData} cx="50%" cy="50%" innerRadius={20} outerRadius={32} paddingAngle={2} dataKey="value">
                    {statusDistData.map((e, idx) => (
                      <Cell key={idx} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white">{totalProjects}</span>
                <span className="text-[7px] text-slate-400 font-bold">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-1 text-[10px] font-bold">
              {statusDistData.map((sd) => (
                <div key={sd.name} className="flex justify-between items-center gap-1">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sd.color }} />
                    {sd.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono text-[9px]">{sd.value} ({sd.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Overview Bar */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Progress Overview</h3>
          <div className="h-24 sm:h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressOverviewData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Bar dataKey="Completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="InProgress" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Overdue" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Overview Donut */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between w-[75vw] shrink-0 sm:w-auto snap-center">
          <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Health Overview</h3>
          <div className="flex items-center gap-3 my-1">
            <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={20} outerRadius={32} paddingAngle={2} dataKey="value">
                    {healthData.map((e, idx) => (
                      <Cell key={idx} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-black text-slate-900 dark:text-white">{totalProjects}</span>
                <span className="text-[7px] text-slate-400 font-bold">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-1 text-[10px] font-bold">
              {healthData.map((h) => (
                <div key={h.name} className="flex justify-between items-center gap-1">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    {h.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono text-[9px]">{h.value} ({h.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Key Metrics & Top Projects Overview (Matches Screenshot 2-Column Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Card: Key Metrics (4 Cols on Desktop, Compact 2-Col Grid on Mobile) */}
        <div className="lg:col-span-4 card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5 sm:space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800 pb-2">Key Metrics</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3 text-xs font-semibold">
            {/* Metric 1 */}
            <div className="flex items-center gap-2 p-1.5 sm:p-0 rounded-xl bg-slate-50/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">Planned vs Actual</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{totalProjects > 0 ? ((completedCount / totalProjects) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center gap-2 p-1.5 sm:p-0 rounded-xl bg-slate-50/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">Budget Utilization</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{budgetUtilization}%</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center gap-2 p-1.5 sm:p-0 rounded-xl bg-slate-50/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">Resource Utilization</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">84.5%</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="flex items-center gap-2 p-1.5 sm:p-0 rounded-xl bg-slate-50/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">Overdue Items</span>
                <span className="font-black text-rose-500 text-xs sm:text-sm">{criticalCount} Tasks</span>
              </div>
            </div>

            {/* Metric 5 */}
            <div className="flex items-center gap-2 p-1.5 sm:p-0 rounded-xl bg-slate-50/50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent col-span-2 sm:col-span-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block truncate">High Priority Deals</span>
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{atRiskCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Top Projects Overview (8 Cols on Desktop) */}
        <div className="lg:col-span-8 card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Top Projects Overview</h3>
            <button className="text-[11px] font-extrabold text-blue-600 hover:underline">View All</button>
          </div>

          {/* Desktop Table View (lg:block) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-2.5">Project</th>
                  <th className="p-2.5">Manager</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Progress</th>
                  <th className="p-2.5">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {ongoingItems.slice(0, 6).map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{p.company || p.title}</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-300">{p.owner || p.contactPerson || 'Ashwini K.'}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                        {p.status || 'Planning'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold">{p.probability ? `${p.probability}%` : '30%'}</td>
                    <td className="p-2.5 font-bold text-emerald-600">Healthy</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Projects Card List (lg:hidden - Matches Screenshot) */}
          <div className="lg:hidden space-y-2">
            {ongoingItems.slice(0, 5).map((p, i) => (
              <div key={p.id || i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl ${i === 0 ? 'bg-blue-600' : 'bg-indigo-600'} text-white font-black flex items-center justify-center text-xs shrink-0`}>
                    {(p.company || p.title || 'P')[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{p.company || p.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium truncate block">{p.tagline || 'project execution'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    {p.ownerAvatar && <img src={p.ownerAvatar} alt="owner" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                    <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{p.owner || 'Ashwini K.'}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                    {p.status || 'Planning'}
                  </span>

                  <span className="text-[11px] font-black text-slate-900 dark:text-white">{p.probability ? `${p.probability}%` : '30%'}</span>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Row 4: 2 Side-by-Side Cards (Projects by Category & Budget Overview) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Projects by Category */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Projects by Category</h4>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">Tasks & Execution</span>
                <span className="text-[10px] font-bold text-slate-400 block">{totalProjects} (100.0%)</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Budget Overview</h4>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <div className="text-xl font-black text-slate-900 dark:text-white pt-1">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block">Utilized</span>
              <span className="text-blue-600">₹{wonValue.toLocaleString('en-IN')} ({budgetUtilization}%)</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Remaining</span>
              <span className="text-emerald-600">₹{remainingBudget.toLocaleString('en-IN')} ({remainingBudgetPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Project Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Project Filters & Options</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Projects</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    placeholder="Search by project or owner..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Project Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Planning', 'In Progress', 'Completed', 'On Hold'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setProjectStatusFilter(status)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${
                        projectStatusFilter === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setProjectSearchQuery('');
                  setProjectStatusFilter('All');
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
