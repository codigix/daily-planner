import React, { useState, useEffect } from 'react';
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
  X,
  Trash2
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
import DataTable from '../components/common/DataTable';
import { getReportsAPI, createReportAPI, deleteReportAPI } from '../services/api';

export default function ReportsView({ plannerTasks = [], meetings = [], clients = [], onOpenAI }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Database Report State
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newReport, setNewReport] = useState({
    name: '',
    category: 'Sales',
    description: '',
    created_by: 'Ashwini Khedekar',
    frequency: 'On Demand'
  });

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await getReportsAPI();
      if (res && Array.isArray(res.reports)) {
        setReportsList(res.reports);
      }
    } catch (err) {
      console.error("Failed to load reports from database:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!newReport.name) return;
    try {
      await createReportAPI(newReport);
      setShowCreateModal(false);
      setNewReport({
        name: '',
        category: 'Sales',
        description: '',
        created_by: 'Ashwini Khedekar',
        frequency: 'On Demand'
      });
      await loadReports();
    } catch (err) {
      console.error("Failed to create report:", err);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete this report from database?")) return;
    try {
      await deleteReportAPI(id);
      await loadReports();
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // Dynamic Counts & Metrics
  const categoryCounts = {
    Sales: reportsList.filter(r => r.category === 'Sales').length,
    Marketing: reportsList.filter(r => r.category === 'Marketing').length,
    Finance: reportsList.filter(r => r.category === 'Finance').length,
    Project: reportsList.filter(r => r.category === 'Project').length,
    Team: reportsList.filter(r => r.category === 'Team').length,
    Client: reportsList.filter(r => r.category === 'Client').length,
    Execution: reportsList.filter(r => r.category === 'Execution').length,
  };

  const filteredReports = reportsList.filter(r => {
    const matchesSearch = !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All Categories' || r.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

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
            Generate, view and export comprehensive executive reports from database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Generate / Create Report</span>
          </button>
        </div>
      </div>

      {/* Report Categories Bar (7 Cards) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Report Categories</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { title: 'Sales Reports', count: `${categoryCounts.Sales} Reports`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
            { title: 'Marketing Reports', count: `${categoryCounts.Marketing} Reports`, icon: PieChart, color: 'bg-purple-50 text-purple-600' },
            { title: 'Finance Reports', count: `${categoryCounts.Finance} Reports`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
            { title: 'Project Reports', count: `${categoryCounts.Project} Reports`, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
            { title: 'Team Reports', count: `${categoryCounts.Team} Reports`, icon: Users, color: 'bg-teal-50 text-teal-600' },
            { title: 'Client Reports', count: `${categoryCounts.Client} Reports`, icon: Users, color: 'bg-rose-50 text-rose-600' },
            { title: 'Execution Reports', count: `${categoryCounts.Execution} Reports`, icon: Bot, color: 'bg-indigo-50 text-indigo-600' },
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

      {/* Row 2: Database Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-bold block">Planner Tasks Report Source</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{plannerTasks.length} Active Tasks</div>
            <span className="text-[10px] text-emerald-600 font-extrabold">{plannerTasks.filter(t => t.completed).length} Completed</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card-base p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-bold block">Calendar Meetings Source</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{meetings.length} Meetings</div>
            <span className="text-[10px] text-purple-600 font-extrabold">Active Calendar Logs</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="card-base p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-bold block">Client Follow-ups Source</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{clients.length} Pipeline Records</div>
            <span className="text-[10px] text-rose-600 font-extrabold">Executive CRM Telemetry</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 3: All Reports Datagrid & Scheduled Reports Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DataTable
            title="Generated Executive Reports Ledger"
            columns={[
              {
                key: 'name',
                header: 'REPORT NAME',
                sortable: true,
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                  </div>
                )
              },
              {
                key: 'category',
                header: 'CATEGORY',
                sortable: true,
                render: (r) => (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {r.category}
                  </span>
                )
              },
              { key: 'description', header: 'DESCRIPTION', sortable: true, render: (r) => <span className="text-slate-500 truncate max-w-[200px] block">{r.description || 'N/A'}</span> },
              { key: 'created_by', header: 'CREATED BY', sortable: true, render: (r) => <span className="font-semibold text-slate-700 dark:text-slate-300">{r.created_by || 'System'}</span> },
              { key: 'created_at', header: 'CREATED ON', sortable: true, render: (r) => <span className="text-slate-400 text-[10px]">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Today'}</span> },
              { key: 'frequency', header: 'FREQUENCY', sortable: true, render: (r) => <span className="font-semibold text-slate-700 dark:text-slate-300">{r.frequency || 'On Demand'}</span> },
              {
                key: 'actions',
                header: 'ACTIONS',
                align: 'right',
                render: (r) => (
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleDeleteReport(r.id)} className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer" title="Delete Report">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            ]}
            data={filteredReports}
            loading={loading}
            defaultPageSize={5}
            searchable={false}
            actionButton={
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="Project">Project</option>
                  <option value="Execution">Execution</option>
                </select>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Generate Report
                </button>
              </div>
            }
          />
        </div>

        {/* Right Sidebar Scheduled Reports & Insights (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-base space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Generated Database Reports</h4>
              <span className="text-[11px] font-bold text-blue-600">{reportsList.length} Total</span>
            </div>
            <div className="space-y-2 text-xs">
              {reportsList.slice(0, 4).map((r, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.name}</span>
                    <span className="text-[10px] text-slate-400">{r.frequency || 'On Demand'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Active DB
                  </span>
                </div>
              ))}
              {reportsList.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No reports generated yet. Click "Generate Report" above to add your first database report.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: GENERATE / CREATE NEW REPORT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Generate New Executive Report</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Sales & Executive Summary"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={newReport.category}
                    onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Project">Project</option>
                    <option value="Team">Team</option>
                    <option value="Client">Client</option>
                    <option value="Execution">Execution</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Frequency</label>
                  <select
                    value={newReport.frequency}
                    onChange={(e) => setNewReport({ ...newReport, frequency: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="On Demand">On Demand</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description / Notes</label>
                <textarea
                  rows="3"
                  placeholder="Summary of report parameters..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save & Save to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
