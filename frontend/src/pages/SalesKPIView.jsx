import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Award, 
  Calendar, 
  RefreshCw, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Bot,
  ChevronRight,
  Search,
  Edit,
  Save,
  X,
  PieChart as PieIcon,
  Sliders,
  DollarSign,
  Trophy,
  FileCheck,
  ChevronDown,
  ArrowRight
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
import { updateClientAPI } from '../services/api';
import DataTable from '../components/common/DataTable';

export default function SalesKPIView({ clients = [], setClients, plannerTasks = [], onOpenAI }) {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [monthlyTarget, setMonthlyTarget] = useState(() => {
    const saved = localStorage.getItem('codigix_sales_target');
    return saved ? parseInt(saved, 10) : 3000000;
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [oppSearchQuery, setOppSearchQuery] = useState('');
  const [oppStageFilter, setOppStageFilter] = useState('All');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  const handleSaveTarget = () => {
    const val = parseInt(targetInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      setMonthlyTarget(val);
      localStorage.setItem('codigix_sales_target', val.toString());
    }
    setIsEditingTarget(false);
  };

  const handleUpdateStage = async (clientId, newStatus) => {
    if (setClients) {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
    }
    try {
      await updateClientAPI(clientId, { status: newStatus });
    } catch (e) {
      console.warn('Failed to sync stage update:', e);
    }
  };

  const totalRevenue = clients.reduce((acc, c) => {
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);
  const totalOps = clients.length;
  const wonDeals = clients.filter(c => c.status === 'Closed Won' || c.status === 'Completed').length;
  const winRate = totalOps > 0 ? Math.round((wonDeals / totalOps) * 100) : 0;

  const revenueTrendData = [
    { month: 'Jan', rev: 12 },
    { month: 'Feb', rev: 18 },
    { month: 'Mar', rev: 15 },
    { month: 'Apr', rev: 22 },
    { month: 'May', rev: Math.max(Math.round(totalRevenue / 100000), 10) },
    { month: 'Jun', rev: Math.max(Math.round(totalRevenue / 100000) + 5, 15) }
  ];

  const pipelineStageData = [
    { name: 'Lead', value: clients.filter(c => c.status === 'Pending').length || 1, color: '#3b82f6', pct: '30%' },
    { name: 'Qualified', value: clients.filter(c => c.priority === 'High').length || 1, color: '#8b5cf6', pct: '25%' },
    { name: 'Negotiation', value: clients.filter(c => c.priority === 'Medium').length || 1, color: '#f59e0b', pct: '25%' },
    { name: 'Closed', value: clients.filter(c => c.status === 'Completed' || c.status === 'Closed Won').length || 1, color: '#10b981', pct: '20%' }
  ];

  const revVsTargetData = [
    { month: 'Q1', Revenue: 45, Target: Math.round(monthlyTarget / 100000) },
    { month: 'Q2', Revenue: 52, Target: Math.round(monthlyTarget / 100000) },
    { month: 'Q3', Revenue: Math.max(Math.round(totalRevenue / 100000), 20), Target: Math.round(monthlyTarget / 100000) },
    { month: 'Q4', Revenue: 0, Target: Math.round(monthlyTarget / 100000) }
  ];

  const openOpportunities = clients.filter(c => c.status !== 'Closed Won' && c.status !== 'Completed' && c.status !== 'Closed Lost' && c.status !== 'Cancelled');

  // Weighted Revenue Forecast Calculation
  const totalWeightedRevenue = openOpportunities.reduce((sum, c) => {
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    const prob = c.probability || (c.priority === 'High' ? 80 : c.priority === 'Medium' ? 50 : 30);
    return sum + Math.round(val * (prob / 100));
  }, 0);

  const rawOpportunities = openOpportunities.map((c, i) => ({
    id: c.id,
    name: c.company || `Opportunity ${i + 1}`,
    company: c.contactPerson || 'Manager',
    stage: c.status || (c.priority === 'High' ? 'Negotiation' : 'Qualified'),
    stageColor: c.status === 'Closed Won' || c.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : c.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    owner: c.owner || 'Ashwini K.',
    ownerAvatar: c.ownerAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    val: c.expectedValue || '₹20,000',
    valNum: parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0,
    close: c.nextFollowup || '28 May 2025',
    prob: c.probability || (c.priority === 'High' ? 80 : c.priority === 'Medium' ? 50 : 30),
    action: c.status === 'Overdue' ? 'Re-engage Immediate' : 'Send Proposal'
  }));

  const topOpportunities = rawOpportunities.filter(op => {
    if (oppStageFilter !== 'All' && op.stage !== oppStageFilter) return false;
    if (oppSearchQuery && !op.name.toLowerCase().includes(oppSearchQuery.toLowerCase()) && !op.company.toLowerCase().includes(oppSearchQuery.toLowerCase())) return false;
    return true;
  });

  const leadSourceData = [
    { name: 'Direct Lead', value: clients.filter(c => c.source === 'Direct Lead').length || 1, color: '#2563eb', pct: '32%' },
    { name: 'Referral', value: clients.filter(c => c.source === 'Referral').length || 1, color: '#10b981', pct: '27%' },
    { name: 'Website', value: clients.filter(c => c.source === 'Website').length || 1, color: '#f59e0b', pct: '22%' },
    { name: 'Outreach', value: clients.filter(c => c.source?.includes('Campaign') || c.source?.includes('Outreach')).length || 1, color: '#8b5cf6', pct: '19%' }
  ];

  // Won deals amount
  const wonRevenue = clients.reduce((acc, c) => {
    if (c.status !== 'Closed Won' && c.status !== 'Completed') return acc;
    const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const targetPct = monthlyTarget > 0 ? Math.min(Math.round((wonRevenue / monthlyTarget) * 100), 100) : 0;
  const targetPctString = monthlyTarget > 0 ? ((wonRevenue / monthlyTarget) * 100).toFixed(1) : '0';
  const remainingTarget = Math.max(monthlyTarget - wonRevenue, 0);

  const wonDealsList = clients.filter(c => c.status === 'Closed Won' || c.status === 'Completed');

  // Compute top sales performers dynamically from won deals
  const ownerTotals = {};
  clients.forEach(c => {
    if (c.status === 'Closed Won' || c.status === 'Completed') {
      const val = parseInt((c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
      const owner = c.owner || 'Ashwini K.';
      if (!ownerTotals[owner]) {
        ownerTotals[owner] = { name: owner, total: 0, avatar: c.ownerAvatar };
      }
      ownerTotals[owner].total += val;
    }
  });

  const topSalesPerformers = Object.values(ownerTotals)
    .sort((a, b) => b.total - a.total)
    .map((p, idx) => ({
      name: p.name,
      val: `₹ ${p.total.toLocaleString('en-IN')}`,
      rank: idx + 1,
      avatar: p.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    }));

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">
      
      {/* ── Page Header & Period Selector (Matches Screenshot) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Sales KPI Dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Track performance & achieve your sales targets
              </p>
            </div>
          </div>

          <button 
            onClick={onOpenAI}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
            title="AI Sales Assistant"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">AI Sales Assistant</span>
            <span className="sm:hidden text-[11px]">AI</span>
          </button>
        </div>

        {/* Timeframe Period Filter Pills Bar (Compact, Modern Segmented Tabs Bar) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-fit text-xs font-bold shadow-xs">
          {[
            { id: 'This Month', full: 'This Month', short: 'Month' },
            { id: 'This Quarter', full: 'This Quarter', short: 'Quarter' },
            { id: 'YTD', full: 'YTD', short: 'YTD' },
            { id: 'All Time', full: 'All Time', short: 'All' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id)}
              className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center text-xs ${
                selectedPeriod === item.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">{item.full}</span>
              <span className="sm:hidden">{item.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: 4 Side-by-Side KPI Overview Cards (Matches Screenshot) ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">Total Revenue</span>
            <div className="text-xs sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 block mt-0.5 truncate">Live Pipeline Sum</span>
          </div>
        </div>

        {/* Card 2: Active Deals */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mb-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">Active Deals</span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalOps}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 block mt-0.5 truncate">Tracked Opportunities</span>
          </div>
        </div>

        {/* Card 3: Deals Closed Won */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">Deals Closed Won</span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{wonDeals}</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 block mt-0.5 truncate">Conducted</span>
          </div>
        </div>

        {/* Card 4: Win Rate */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mb-1">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 block truncate">Win Rate</span>
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{winRate}%</div>
            <span className="text-[8px] sm:text-[10px] font-bold text-amber-500 block mt-0.5 truncate">Conversion Ratio</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: 3 Side-by-Side Mini Chart Cards (Matches Screenshot) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Chart 1: Revenue Trend Line */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-slate-900 dark:text-white text-xs">Revenue Trend</h3>
            <span className="text-[10px] font-bold text-slate-400">Monthly</span>
          </div>
          <div className="h-32 sm:h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Line type="monotone" dataKey="rev" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pipeline by Stage Donut */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-slate-900 dark:text-white text-xs">Pipeline by Stage</h3>
          </div>
          <div className="h-28 sm:h-36 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pipelineStageData} cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={3} dataKey="value">
                  {pipelineStageData.map((e, idx) => (
                    <Cell key={idx} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[8px] text-slate-400 font-bold">Total</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{totalOps || 3}</span>
              <span className="text-[8px] text-slate-400">Opportunities</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-bold border-t border-slate-100 dark:border-slate-800 pt-1.5">
            {pipelineStageData.map((s) => (
              <div key={s.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="text-slate-900 dark:text-white">{s.value} ({s.pct})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Revenue vs Target Bar */}
        <div className="card-base p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-slate-900 dark:text-white text-xs">Revenue vs Target</h3>
            <span className="text-[10px] font-bold text-slate-400">This Month</span>
          </div>
          <div className="h-32 sm:h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revVsTargetData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Main Desktop & Mobile Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Top Opportunities & Recent Closed Deals (8 Cols on Desktop) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Top Opportunities Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">Top Opportunities</h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full" title="Weighted Revenue Forecast">
                  Forecast: ₹ {totalWeightedRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={oppSearchQuery}
                    onChange={e => setOppSearchQuery(e.target.value)}
                    placeholder="Search deals..."
                    className="pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <select
                  value={oppStageFilter}
                  onChange={e => setOppStageFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="All">All Stages</option>
                  <option value="Pending">Pending</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                </select>
              </div>
            </div>

            {/* Desktop Table View (lg:block - DataTable Component with Pagination & Search) */}
            <div className="hidden lg:block">
              <DataTable
                title="Top Opportunities & Deals"
                columns={[
                  { key: 'name', header: 'Opportunity Name', sortable: true, render: (op) => <span className="font-bold text-slate-900 dark:text-white">{op.name}</span> },
                  { key: 'company', header: 'Client / Company', sortable: true, render: (op) => <span className="text-slate-600 dark:text-slate-300">{op.company}</span> },
                  {
                    key: 'stage',
                    header: 'Stage',
                    sortable: true,
                    render: (op) => (
                      <select
                        value={op.stage}
                        onChange={e => op.id && handleUpdateStage(op.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border-none cursor-pointer focus:outline-none ${op.stageColor}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Closed Won">Closed Won</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    )
                  },
                  {
                    key: 'owner',
                    header: 'Owner',
                    sortable: true,
                    render: (op) => (
                      <div className="flex items-center gap-1.5">
                        <img src={op.ownerAvatar} alt={op.owner} className="w-4 h-4 rounded-full object-cover" />
                        <span>{op.owner}</span>
                      </div>
                    )
                  },
                  { key: 'val', header: 'Value', sortable: true, render: (op) => <span className="font-bold text-slate-900 dark:text-white">{op.val}</span> },
                  { key: 'close', header: 'Close Date', sortable: true, render: (op) => <span className="text-slate-500">{op.close}</span> },
                  {
                    key: 'prob',
                    header: 'Probability',
                    sortable: true,
                    render: (op) => (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[10px]">{op.prob}%</span>
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${op.prob}%` }} />
                        </div>
                      </div>
                    )
                  },
                  { key: 'action', header: 'Next Action', render: (op) => <span className="text-slate-600 font-semibold">{op.action}</span> }
                ]}
                data={topOpportunities}
                defaultPageSize={5}
                searchable={true}
                searchPlaceholder="Search opportunities..."
              />
            </div>

            {/* Mobile Opportunities Card List (lg:hidden - Matches Screenshot) */}
            <div className="lg:hidden space-y-2">
              {topOpportunities.map((op, i) => (
                <div key={op.id || i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${i === 0 ? 'bg-blue-600' : 'bg-indigo-600'} text-white font-black flex items-center justify-center text-xs shrink-0`}>
                      {op.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{op.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium truncate block">{op.company}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                      {op.stage} ∨
                    </span>

                    <div className="flex items-center gap-1">
                      <img src={op.ownerAvatar} alt={op.owner} className="w-5 h-5 rounded-full object-cover shrink-0" />
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 hidden sm:inline">{op.owner}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-black text-slate-900 dark:text-white">{op.val}</div>
                      <span className="text-[8px] text-slate-400 font-bold block">{op.close}</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Closed Won Deals Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Recent Closed Won Deals</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">Deal Name</th>
                    <th className="p-3">Client / Company</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Close Date</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {wonDealsList.length > 0 ? (
                    wonDealsList.map((c, i) => (
                      <tr key={c.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{c.company}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{c.contactPerson}</td>
                        <td className="p-3 font-bold text-emerald-600">{c.expectedValue}</td>
                        <td className="p-3 text-slate-500">{c.nextFollowup || 'Closed'}</td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{c.owner || 'Ashwini K.'}</td>
                        <td className="p-3 text-slate-600 font-semibold">{c.source || 'Direct'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-600" />
                        <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">No Closed Deals Recorded</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Move a lead to 'Closed Won' to populate won sales records.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Target Overview, Performers & Lead Source Breakdown (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Sales Target Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Sales Target Overview</h4>
              {isEditingTarget ? (
                <div className="flex items-center gap-1">
                  <button onClick={handleSaveTarget} className="text-emerald-600 hover:text-emerald-700 p-1 cursor-pointer"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingTarget(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => { setTargetInput(monthlyTarget.toString()); setIsEditingTarget(true); }} className="text-[11px] font-extrabold text-blue-600 hover:underline cursor-pointer">
                  Edit
                </button>
              )}
            </div>

            {isEditingTarget && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-left space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Set Monthly Target (₹)</label>
                <input
                  type="text"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  placeholder="e.g. 3000000"
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeDasharray={`${targetPct}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{targetPctString}%</span>
                  <span className="text-[8px] font-bold text-slate-400">Achieved</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 flex-1">
                <div className="flex justify-between"><span>Target:</span><span className="text-slate-900 dark:text-white">₹{monthlyTarget.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Achieved:</span><span className="text-emerald-600">₹{wonRevenue.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Remaining:</span><span className="text-rose-500">₹{remainingTarget.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-blue-600 pt-1 border-t border-slate-100 dark:border-slate-800"><span>Forecast:</span><span>₹{totalWeightedRevenue.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>

          {/* Top Sales Performers Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Top Sales Performers</h4>
              <span className="text-[10px] font-bold text-slate-400">This Month</span>
            </div>

            {topSalesPerformers.length > 0 ? (
              <div className="space-y-3 text-xs">
                {topSalesPerformers.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-bold text-slate-400 text-xs">{p.rank}</span>
                      <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{p.val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 mx-auto flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-400">No won deals logged yet.</p>
              </div>
            )}
          </div>

          {/* Lead Source Breakdown Donut Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Lead Source Breakdown</h4>
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leadSourceData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={3} dataKey="value">
                      {leadSourceData.map((e, idx) => (
                        <Cell key={idx} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[8px] text-slate-400 font-bold">Total Leads</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{clients.length || 3}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-bold flex-1">
                {leadSourceData.map((ls) => (
                  <div key={ls.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ls.color }} />
                      {ls.name}
                    </span>
                    <span className="text-slate-900 dark:text-white">{ls.value} ({ls.pct})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom AI Sales Insight Banner ── */}
      <div
        onClick={onOpenAI}
        className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:bg-purple-100/70 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <span className="font-black text-xs sm:text-sm text-purple-900 dark:text-purple-300 block">AI Sales Insight</span>
            <p className="text-xs text-purple-950/70 dark:text-purple-300/80 font-medium leading-relaxed">
              Your win rate has improved by 6.2% compared to last month. Focus on negotiation stage to close more high-value deals.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-600 shrink-0" />
      </div>

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Sales Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Sales Filters & Options</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Opportunities</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={oppSearchQuery}
                    onChange={(e) => setOppSearchQuery(e.target.value)}
                    placeholder="Search by company or contact..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Period Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Target Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Monthly', 'Quarterly', 'Yearly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                        selectedPeriod === period
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline Stage Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Pipeline Stage</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setOppStageFilter(stage)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${
                        oppStageFilter === stage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setOppSearchQuery('');
                  setOppStageFilter('All');
                  setSelectedPeriod('Monthly');
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
