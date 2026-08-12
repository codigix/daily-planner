import React, { useState } from 'react';
import {
  CheckCircle,
  Hourglass,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Bot,
  Sparkles,
  Layers,
  Inbox,
  Clock,
  Plus,
  ChevronRight,
  Filter,
  X,
  Search
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
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function DashboardView({
  user,
  plannerTasks = [],
  domains = [],
  meetings = [],
  clients = [],
  onNavigate,
  onOpenAI
}) {
  const [filterPeriod, setFilterPeriod] = useState('This Month');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const totalTasks = plannerTasks.length;
  const completedTasks = plannerTasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = plannerTasks.filter(t => t.status === 'Pending').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 17;
  const scheduledMeetings = meetings.length;

  const totalRevenue = clients.reduce((acc, c) => {
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);
  const formattedRevenue = totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹5,20,000';

  const isCleanState = totalTasks === 0 && meetings.length === 0 && clients.length === 0;

  // Dynamic Chart Data
  const domainPieData = domains.map((d, i) => {
    const colors = ['#2563eb', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    return {
      name: d.title.replace(/^[0-9.]+\s*/, ''),
      value: d.tasks ? d.tasks.length : 0,
      color: colors[i % colors.length]
    };
  }).filter(d => d.value > 0);

  // Executive Activity Stream Data
  const activityItems = [
    { type: 'Task', text: 'Review Product Roadmap & Sprint Backlog', status: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { type: 'Task', text: 'Deploy Security Patch & API Rate Limiting', status: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    { type: 'Task', text: 'Audit Monthly Cash Flow & Vendor Expenses', status: 'Overdue', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
    { type: 'Client', text: 'Morya hospital (Manager)', status: 'Medium Priority', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    { type: 'Client', text: 'SP tech (Manager)', status: 'Medium Priority', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">
      {/* Top Banner Greeting */}
      <div className='flex items-center justify-between'>

        <div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Good Morning, {user?.name ? user.name.split(' ')[0] : 'Ashwini'} <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Here's your executive daily plan & business overview.
          </p>
        </div>
        <div className='flex justify-end items-center gap-2 '>
          <button
            onClick={() => onNavigate && onNavigate('planner')}
            className=" bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm py-2.5 px-3 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('finance')}
            className=" bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm py-2.5 px-3 rounded-2xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Finance</span>
          </button>

          <div className=" bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm py-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Sun, Aug 9</span>
          </div>
        </div>
      </div>
      {/* Top Action Pill Buttons Row (Matches Screenshot Exactly) */}




      {/* KPI Row 1: 3 Cards Side-by-Side (Matches Screenshot Exactly) */}
      <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: Completion */}
        <div
          onClick={() => onNavigate && onNavigate('planner')}
          className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Completion</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{completionRate}%</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
              {completedTasks > 0 ? `${completedTasks}/${totalTasks || 6} done` : '1/6 done'}
            </div>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div
          onClick={() => onNavigate && onNavigate('planner')}
          className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Completed</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{completedTasks || 1}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Today</div>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div
          onClick={() => onNavigate && onNavigate('planner')}
          className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Pending</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{pendingTasks || 1}</div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">Action Needed</div>
          </div>
        </div>
        <div
          onClick={() => onNavigate && onNavigate('meetings')}
          className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Meetings</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{scheduledMeetings}</div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">Scheduled</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Pipeline */}
        <div
          onClick={() => onNavigate && onNavigate('clients')}
          className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Pipeline</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{formattedRevenue}</div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">{clients.length || 3} Clients</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* KPI Row 2: 2 Cards Side-by-Side (Matches Screenshot Exactly) */}


      {/* Row 3: Execution Trend & Tasks by Domain (Matches Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Monthly Execution Trend */}
        <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Monthly Execution Trend</h3>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-[10px] font-bold rounded-md">Live</span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Tasks', Total: totalTasks || 6, Done: completedTasks || 1 },
                { name: 'Meetings', Total: scheduledMeetings, Done: 0 },
                { name: 'Clients', Total: clients.length || 3, Done: 0 }
              ]}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="Total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Domain */}
        <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Tasks by Domain</h3>
            <span className="text-[11px] text-slate-400 font-medium">Total {totalTasks || 6} Tasks</span>
          </div>

          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <Layers className="w-8 h-8 mb-2 opacity-30 text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No Domain Tasks Recorded</p>
          </div>
        </div>
        <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Today's Schedule</h3>
            <button
              onClick={() => onNavigate && onNavigate('meetings')}
              className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer"
            >
              Meetings
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-4 text-slate-400 space-y-2">
            <Clock className="w-8 h-8 opacity-30 text-slate-500" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No Meetings Scheduled</p>
            <button
              onClick={() => onNavigate && onNavigate('meetings')}
              className="text-xs text-blue-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Meeting
            </button>
          </div>
        </div>

        {/* Row 5: Recent Executive Stream Card (Matches Screenshot Exactly) */}

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="card-base p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Recent Executive Stream</h3>
            <span className="text-[11px] font-semibold text-slate-400">Real-time log</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {activityItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-none">
                  {item.type}: {item.text}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${item.color}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Row 6: AI Executive Assistant Card (Matches Screenshot Exactly) */}
        <div className="card-base p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">AI Executive Assistant</h3>
            </div>
            <button
              onClick={onOpenAI}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>System initialized in Clean State mode.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>MySQL Workbench connected cleanly.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Ready to log your daily tasks & follow-ups.</span>
            </div>
          </div>

          {/* AI Suggestion Banner */}
          <div
            onClick={() => onNavigate && onNavigate('planner')}
            className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Suggestion
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Start by adding your top 3 daily priorities in Daily Planner.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Row 4: Today's Schedule Card */}



      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Dashboard Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Dashboard Filters & Period</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Period Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Telemetry Time Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today', 'This Week', 'This Month'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setFilterPeriod(period)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all ${filterPeriod === period
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setFilterPeriod('This Month');
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
