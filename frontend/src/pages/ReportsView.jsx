import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  Briefcase, 
  Users, 
  Bot, 
  Calendar, 
  Filter, 
  Download, 
  Plus, 
  Search, 
  Star, 
  Eye, 
  MoreVertical, 
  Sparkles, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function ReportsView({ plannerTasks = [], meetings = [], clients = [], onOpenAI }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  const totalItems = plannerTasks.length + meetings.length + clients.length;

  const perfData = [
    { date: '01 May', rev: 20, exp: 10 },
    { date: '06 May', rev: 22, exp: 11 },
    { date: '11 May', rev: 28, exp: 12 },
    { date: '16 May', rev: 32, exp: 13 },
    { date: '21 May', rev: 27, exp: 15 },
    { date: '26 May', rev: 29, exp: 14 },
    { date: '31 May', rev: 34, exp: 15 },
  ];

  const reportDistData = [
    { name: 'Sales', value: 18, pct: '26.5%', color: '#2563eb' },
    { name: 'Marketing', value: 14, pct: '20.6%', color: '#ec4899' },
    { name: 'Finance', value: 11, pct: '16.2%', color: '#f59e0b' },
    { name: 'Project', value: 10, pct: '14.7%', color: '#38bdf8' },
    { name: 'Team', value: 8, pct: '11.8%', color: '#10b981' },
    { name: 'Client', value: 7, pct: '10.3%', color: '#8b5cf6' },
  ];

  const allReports = [
    { id: 1, name: 'Sales Performance Report', starred: true, cat: 'Sales', catBg: 'bg-emerald-100 text-emerald-700', desc: 'Overview of sales revenue, deals and conversion', createdBy: 'Rahul Shetty', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', date: '20 May 2025 10:30 AM', freq: 'Weekly' },
    { id: 2, name: 'Marketing Channel Report', starred: false, cat: 'Marketing', catBg: 'bg-purple-100 text-purple-700', desc: 'Performance across all marketing channels', createdBy: 'Neha Jadhav', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', date: '20 May 2025 09:45 AM', freq: 'Weekly' },
    { id: 3, name: 'Finance Summary Report', starred: false, cat: 'Finance', catBg: 'bg-amber-100 text-amber-700', desc: 'Income, expenses, profit and cash flow summary', createdBy: 'Vikram Patil', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', date: '19 May 2025 04:20 PM', freq: 'Monthly' },
    { id: 4, name: 'Project Status Report', starred: false, cat: 'Project', catBg: 'bg-blue-100 text-blue-700', desc: 'All projects progress, tasks and deadlines', createdBy: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', date: '19 May 2025 11:15 AM', freq: 'Weekly' },
    { id: 5, name: 'Team Performance Report', starred: false, cat: 'Team', catBg: 'bg-teal-100 text-teal-700', desc: 'Productivity, tasks and performance by team', createdBy: 'Amit Sharma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', date: '18 May 2025 05:30 PM', freq: 'Monthly' },
    { id: 6, name: 'Client Follow-up Report', starred: false, cat: 'Client', catBg: 'bg-rose-100 text-rose-700', desc: 'Follow-ups, meetings and client engagement', createdBy: 'Rahul Shetty', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', date: '18 May 2025 02:10 PM', freq: 'Weekly' },
    { id: 7, name: 'AI Insights Report', starred: false, cat: 'AI Insights', catBg: 'bg-indigo-100 text-indigo-700', desc: 'AI generated insights and smart recommendations', createdBy: 'AI Assistant', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', date: '17 May 2025 01:00 PM', freq: 'Monthly' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reports Hub</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Generate, view and export comprehensive executive reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Schedule Report Modal Opened")}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-blue-500 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Schedule Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Bar (7 Cards) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Report Categories</h3>
          <button className="text-xs font-bold text-blue-600 hover:underline">View All Reports &gt;</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { title: 'Sales Reports', count: '12 Reports', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
            { title: 'Marketing Reports', count: '14 Reports', icon: PieChart, color: 'bg-purple-50 text-purple-600' },
            { title: 'Finance Reports', count: '11 Reports', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
            { title: 'Project Reports', count: '10 Reports', icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
            { title: 'Team Reports', count: '8 Reports', icon: Users, color: 'bg-teal-50 text-teal-600' },
            { title: 'Client Reports', count: '7 Reports', icon: Users, color: 'bg-rose-50 text-rose-600' },
            { title: 'AI Insights Reports', count: '6 Reports', icon: Bot, color: 'bg-indigo-50 text-indigo-600' },
          ].map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div key={i} className="card-base p-3 flex items-center gap-2.5 hover:shadow-card cursor-pointer">
                <div className={`w-8 h-8 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{cat.title}</div>
                  <span className="text-[10px] text-slate-400 font-medium">{cat.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Performance Overview, Report Distribution Donut, Top Performing Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Overview Line */}
        <div className="lg:col-span-5 card-base flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Performance Overview</h3>
            <span className="text-[11px] font-bold text-slate-400">This Month</span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[10px] mb-2">
            <div><span className="text-slate-400 block">Total Revenue</span><span className="font-extrabold text-slate-900 dark:text-white">₹ 24,50,000</span></div>
            <div><span className="text-slate-400 block">Total Expenses</span><span className="font-extrabold text-rose-600">₹ 12,45,000</span></div>
            <div><span className="text-slate-400 block">Net Profit</span><span className="font-extrabold text-emerald-600">₹ 12,05,000</span></div>
            <div><span className="text-slate-400 block">Conversion Rate</span><span className="font-extrabold text-blue-600">5.46%</span></div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perfData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px', color: '#fff' }} />
                <Line type="monotone" dataKey="rev" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="exp" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Distribution Donut */}
        <div className="lg:col-span-4 card-base flex flex-col justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-2">Report Distribution</h3>
          <div className="h-40 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={reportDistData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                  {reportDistData.map((e, idx) => (
                    <Cell key={idx} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-bold">Total</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">68</span>
              <span className="text-[9px] text-slate-400">Reports</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
            {reportDistData.map((rd) => (
              <div key={rd.name} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rd.color }} />
                  {rd.name}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{rd.value} ({rd.pct})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Areas */}
        <div className="lg:col-span-3 card-base space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Top Performing Areas</h3>
            <span className="text-[10px] font-bold text-slate-400">This Month</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { name: 'Sales Revenue', val: '₹ 24,50,000', change: '+ 28.6%' },
              { name: 'Marketing ROI', val: '342%', change: '+ 19.2%' },
              { name: 'Project Delivery', val: '92.6%', change: '+ 6.2%' },
              { name: 'Team Productivity', val: '86.4%', change: '+ 5.8%' },
              { name: 'Client Satisfaction', val: '4.6 / 5', change: '+ 0.4%' },
            ].map((pa, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  <span>{pa.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pa.val}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            ))}
          </div>
          <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 pt-1">
            View Detailed Report <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 3: All Reports Datagrid & Scheduled Reports Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-base p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">All Reports</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1 px-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
              >
                <option value="All Categories">All Categories</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Project">Project</option>
              </select>

              <button 
                onClick={() => alert("Create Custom Report Modal")}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create Custom Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-3">Report Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3">Created On</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {totalItems > 0 ? (
                  [
                    { id: 1, name: 'Executive Sales Summary', cat: 'Sales', catBg: 'bg-emerald-100 text-emerald-700', desc: `Report generated from ${clients.length} client pipeline entries.`, createdBy: 'Ashwini Khedekar', date: 'Today', freq: 'On Demand' },
                    { id: 2, name: 'Daily Execution Log', cat: 'Execution', catBg: 'bg-blue-100 text-blue-700', desc: `Report generated from ${plannerTasks.length} daily planner tasks.`, createdBy: 'Ashwini Khedekar', date: 'Today', freq: 'Daily' },
                    { id: 3, name: 'Meeting Schedule Overview', cat: 'Meetings', catBg: 'bg-purple-100 text-purple-700', desc: `Report generated from ${meetings.length} scheduled meetings.`, createdBy: 'Ashwini Khedekar', date: 'Today', freq: 'Weekly' }
                  ].map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.catBg}`}>{r.cat}</span>
                      </td>
                      <td className="p-3 text-slate-500 truncate max-w-[200px]">{r.desc}</td>
                      <td className="p-3 font-semibold text-slate-700">{r.createdBy}</td>
                      <td className="p-3 text-slate-400 text-[10px]">{r.date}</td>
                      <td className="p-3 font-semibold text-slate-700">{r.freq}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1 rounded text-slate-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1 rounded text-slate-400 hover:text-blue-600"><Download className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Reports Generated Yet</p>
                      <p className="text-xs text-slate-500 mt-1">Database is clean. Create tasks, meetings, or client follow-ups to compile executive reports.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar Scheduled Reports & Insights (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-base space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Scheduled Reports</h4>
              <button className="text-[11px] font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Weekly Sales Report', freq: 'Every Monday at 09:00 AM', status: 'Active' },
                { name: 'Monthly Finance Report', freq: '1st of every month at 10:00 AM', status: 'Active' },
                { name: 'Team Performance Report', freq: 'Every Friday at 05:00 PM', status: 'Active' },
              ].map((sr, idx) => (
                <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{sr.name}</span>
                    <span className="text-[10px] text-slate-400">{sr.freq}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">{sr.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Recent Reports</h4>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Sales Performance Report', date: '20 May 2025, 10:30 AM' },
                { name: 'Marketing Channel Report', date: '20 May 2025, 09:45 AM' },
                { name: 'Finance Summary Report', date: '19 May 2025, 04:20 PM' },
              ].map((rr, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{rr.name}</span>
                    <span className="text-[10px] text-slate-400">{rr.date}</span>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Custom Reports Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Create Custom Reports</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build custom reports with drag & drop, choose metrics, apply filters and schedule.
          </p>
        </div>
        <button 
          onClick={() => alert("Custom Report Builder Opened")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          Create Now
        </button>
      </div>

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Reports Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Report Filters & Options</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Reports</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by report name or description..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Report Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All Categories', 'Performance', 'Financial', 'Sales', 'Executive'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All Categories');
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
