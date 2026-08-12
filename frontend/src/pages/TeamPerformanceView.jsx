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
  X,
  PieChart as PieIcon,
  CheckCircle2,
  Hourglass,
  Layers,
  FileText
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
import DataTable from '../components/common/DataTable';

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
    : plannerTasks.filter(t => t.status === 'Completed' || t.completed).length;

  const pendingTasks = crmData
    ? crmData.members.reduce((acc, m) => acc + (m.totalTasks - m.completedTasks), 0)
    : plannerTasks.filter(t => t.status === 'Pending' || !t.completed).length;

  const prodRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const sampleTeamMembers = [
    { 
      id: '1', 
      name: 'Aadarsh Kumar', 
      role: 'SEO & GMB Lead', 
      assigned: plannerTasks.length > 0 ? Math.ceil(plannerTasks.length * 0.3) : 12, 
      pending: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => !t.completed).length * 0.3) : 2, 
      completed: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => t.completed).length * 0.3) : 9, 
      inProgress: 1, 
      progressPct: 75, 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 
      avatarBg: 'bg-blue-600' 
    },
    { 
      id: '2', 
      name: 'Mangavka Vinayak', 
      role: 'Video Editor & Media', 
      assigned: plannerTasks.length > 0 ? Math.ceil(plannerTasks.length * 0.2) : 8, 
      pending: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => !t.completed).length * 0.2) : 1, 
      completed: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => t.completed).length * 0.2) : 6, 
      inProgress: 1, 
      progressPct: 75, 
      avatar: null, 
      avatarBg: 'bg-indigo-600' 
    },
    { 
      id: '3', 
      name: 'Karan Gusinge', 
      role: 'Graphics Designer', 
      assigned: plannerTasks.length > 0 ? Math.ceil(plannerTasks.length * 0.2) : 10, 
      pending: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => !t.completed).length * 0.2) : 2, 
      completed: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => t.completed).length * 0.2) : 7, 
      inProgress: 1, 
      progressPct: 70, 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', 
      avatarBg: 'bg-blue-600' 
    },
    { 
      id: '4', 
      name: 'Sujata Choudhari', 
      role: 'Wordpress Developer', 
      assigned: plannerTasks.length > 0 ? Math.ceil(plannerTasks.length * 0.15) : 15, 
      pending: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => !t.completed).length * 0.15) : 3, 
      completed: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => t.completed).length * 0.15) : 11, 
      inProgress: 1, 
      progressPct: 73, 
      avatar: null, 
      avatarBg: 'bg-pink-500' 
    },
    { 
      id: '5', 
      name: 'Ashwini Khedekar', 
      role: 'Manager & Ops Lead', 
      assigned: plannerTasks.length > 0 ? Math.ceil(plannerTasks.length * 0.15) : 18, 
      pending: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => !t.completed).length * 0.15) : 3, 
      completed: plannerTasks.length > 0 ? Math.ceil(plannerTasks.filter(t => t.completed).length * 0.15) : 14, 
      inProgress: 1, 
      progressPct: 78, 
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', 
      avatarBg: 'bg-emerald-600' 
    }
  ];

  const filteredMembers = sampleTeamMembers.filter(m =>
    !memberSearchQuery || m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.role.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const topPerformers = [
    { name: 'Aadarsh Kumar', score: '80%' },
    { name: 'Mangavka Vinayak', score: '80%' },
    { name: 'Karan Gusinge', score: '80%' }
  ];

  const needsImprovement = [
    { name: 'Sanika Mote', score: '70%' },
    { name: 'Ashwini Khedekar', score: '70%' },
    { name: 'Sudarshan Kale', score: '70%' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Team Performance</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Track assigned tasks, pending items, completed work & team progress reports
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

      {/* ── KPI Overview Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Assigned Tasks */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block truncate">Total Tasks Assigned</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalTasks}</div>
            <span className="text-[10px] font-bold text-blue-600 block mt-0.5 truncate">Across Domains</span>
          </div>
        </div>

        {/* Card 2: Completed Tasks */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block truncate">Tasks Completed</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedTasks}</div>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">Finished Work</span>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block truncate">Tasks Pending</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{pendingTasks}</div>
            <span className="text-[10px] font-bold text-amber-500 block mt-0.5 truncate">In Execution</span>
          </div>
        </div>

        {/* Card 4: Team Progress Rate */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block truncate">Team Progress Rate</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{prodRate}%</div>
            <span className="text-[10px] font-bold text-purple-600 block mt-0.5 truncate">Completion Rate</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Team Performance Table & Side Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

        {/* Left Column: Teams Task Performance Table (8 Cols) */}
        <div className="lg:col-span-8">
          <DataTable
            title="Team Members Task & Progress Table"
            columns={[
              {
                key: 'name',
                header: 'Member',
                sortable: true,
                render: (m) => (
                  <div className="flex items-center gap-2.5">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${m.avatarBg} text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs`}>
                        {m.name[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block truncate">{m.name}</span>
                  </div>
                )
              },
              {
                key: 'role',
                header: 'Role',
                sortable: true,
                render: (m) => <span className="text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[120px]">{m.role}</span>
              },
              {
                key: 'assigned',
                header: 'Assigned',
                align: 'center',
                sortable: true,
                render: (m) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                    {m.assigned}
                  </span>
                )
              },
              {
                key: 'pending',
                header: 'Pending',
                align: 'center',
                sortable: true,
                render: (m) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                    {m.pending}
                  </span>
                )
              },
              {
                key: 'completed',
                header: 'Completed',
                align: 'center',
                sortable: true,
                render: (m) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                    {m.completed}
                  </span>
                )
              },
              {
                key: 'inProgress',
                header: 'In Progress',
                align: 'center',
                sortable: true,
                render: (m) => (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                    {m.inProgress}
                  </span>
                )
              },
              {
                key: 'progressPct',
                header: 'Progress Report',
                align: 'center',
                sortable: true,
                render: (m) => (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${m.progressPct}%` }} />
                    </div>
                    <span className="font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0">
                      {m.progressPct}%
                    </span>
                  </div>
                )
              }
            ]}
            data={sampleTeamMembers}
            loading={loading}
            defaultPageSize={5}
            searchable={true}
            searchPlaceholder="Search member or role..."
            onRowClick={(m) => setSelectedEmployeeForReport(m)}
          />
        </div>

        {/* Right Column: Top Performers & Attendance (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Performers Card */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" /> Top Performers
            </h4>
            <div className="space-y-2 text-xs font-extrabold">
              {topPerformers.map((tp, idx) => (
                <div key={tp.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200">{idx + 1}. {tp.name}</span>
                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px]">{tp.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Improvement Card */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Needs Attention
            </h4>
            <div className="space-y-2 text-xs font-extrabold">
              {needsImprovement.map((ni) => (
                <div key={ni.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-800 dark:text-slate-200">{ni.name}</span>
                  <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px]">{ni.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detailed Progress Report Modal ── */}
      {selectedEmployeeForReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {selectedEmployeeForReport.avatar ? (
                  <img src={selectedEmployeeForReport.avatar} alt={selectedEmployeeForReport.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${selectedEmployeeForReport.avatarBg} text-white font-black flex items-center justify-center text-sm`}>
                    {selectedEmployeeForReport.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">{selectedEmployeeForReport.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">{selectedEmployeeForReport.role}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeForReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Stats Breakdown */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{selectedEmployeeForReport.assigned}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pending</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{selectedEmployeeForReport.pending}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Completed</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedEmployeeForReport.completed}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Progress</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400">{selectedEmployeeForReport.progressPct}%</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Completion Report</span>
                <span className="text-emerald-600">{selectedEmployeeForReport.progressPct}% Achieved</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${selectedEmployeeForReport.progressPct}%` }} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEmployeeForReport(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
