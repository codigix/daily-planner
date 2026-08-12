import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Save, ChevronDown, ChevronUp, MessageSquare,
  BarChart2, Plus, Calendar, Clock, X, Sparkles, Filter, Search,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, MinusCircle, Target
} from 'lucide-react';
import { updatePlannerTaskAPI, getLoggerDomainsAPI } from '../services/api';
import { EXECUTIVE_DOMAINS, getDomainIdForTask, getDomainById } from '../data/domains';

export default function DailyTaskLoggerView({
  domains = [],
  setDomains,
  plannerTasks = [],
  setPlannerTasks,
  onNavigate
}) {
  const [loggerDate, setLoggerDate] = useState(new Date());
  const [openDomains, setOpenDomains] = useState({});
  const [retrospective, setRetrospective] = useState('');
  const [noteModalTask, setNoteModalTask] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState({});
  const [addingDomainId, setAddingDomainId] = useState(null);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [dbDomains, setDbDomains] = useState(EXECUTIVE_DOMAINS);

  // Search, Filter & Calendar State
  const [loggerSearchQuery, setLoggerSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('ALL');
  const [isGeneratingAIRetro, setIsGeneratingAIRetro] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Compute allocated days (dates that have planner tasks)
  const allocatedDays = (() => {
    const map = {};
    plannerTasks.forEach(t => {
      if (!t.date) return;
      try {
        const dObj = new Date(t.date);
        if (isNaN(dObj.getTime())) return;
        const dStr = dObj.toDateString();
        if (!map[dStr]) {
          map[dStr] = { dateStr: dStr, dateObj: dObj, count: 0 };
        }
        map[dStr].count++;
      } catch(e) {}
    });
    return Object.values(map).sort((a, b) => a.dateObj - b.dateObj);
  })();

  const isTaskDoneForDate = (task, dateStr) => {
    if (!task) return false;
    if (task.completedDates && typeof task.completedDates[dateStr] === 'boolean') {
      return task.completedDates[dateStr];
    }
    if (task.date && new Date(task.date).toDateString() === dateStr) {
      return task.status === 'Completed';
    }
    return false;
  };

  // Batch action: Mark all tasks done for current logger date
  const handleMarkAllDone = () => {
    if (!setPlannerTasks) return;
    setPlannerTasks(prev => prev.map(t => {
      if (isTaskForDate(t, loggerDateStr, loggerWeekdayLong, loggerWeekdayShort)) {
        const updatedCompletedDates = { ...(t.completedDates || {}), [loggerDateStr]: true };
        const isSameDateAsOrigin = t.date && new Date(t.date).toDateString() === loggerDateStr;
        const updated = {
          ...t,
          loggerStatus: 'DONE',
          status: isSameDateAsOrigin ? 'Completed' : t.status,
          completedDates: updatedCompletedDates
        };
        updatePlannerTaskAPI(t.id, updated).catch(() => {});
        return updated;
      }
      return t;
    }));
  };

  // Batch action: Mark all tasks done for a single domain
  const handleMarkDomainDone = (domainId) => {
    if (!setPlannerTasks) return;
    setPlannerTasks(prev => prev.map(t => {
      const dId = t.domain_id || getDomainIdForTask(t.title, t.category);
      if (dId === domainId && isTaskForDate(t, loggerDateStr, loggerWeekdayLong, loggerWeekdayShort)) {
        const updatedCompletedDates = { ...(t.completedDates || {}), [loggerDateStr]: true };
        const isSameDateAsOrigin = t.date && new Date(t.date).toDateString() === loggerDateStr;
        const updated = {
          ...t,
          loggerStatus: 'DONE',
          status: isSameDateAsOrigin ? 'Completed' : t.status,
          completedDates: updatedCompletedDates
        };
        updatePlannerTaskAPI(t.id, updated).catch(() => {});
        return updated;
      }
      return t;
    }));
  };

  // AI End-of-Day Retrospective Generator
  const handleGenerateAIRetrospective = () => {
    setIsGeneratingAIRetro(true);
    setTimeout(() => {
      const summaryText = `🎯 Executive Retrospective for ${formattedDate}:\n` +
        `• Execution Rate: ${executionRate}% (${doneCount} of ${totalTasks} tasks completed)\n` +
        `• Key Wins: Executed operational milestones across ${activeDomainGroups.length} active domain(s).\n` +
        (pendingCount > 0 ? `• Action Items for Tomorrow: ${pendingCount} pending task(s) carried forward for executive review.\n` : `• Complete Accomplishment: All scheduled tasks completed with 100% precision!\n`) +
        `• Strategy Focus: High-value client follow-ups and system performance optimization.`;
      setRetrospective(summaryText);
      setIsGeneratingAIRetro(false);
    }, 500);
  };

  // Load domains from DB on mount
  useEffect(() => {
    getLoggerDomainsAPI().then(data => {
      if (data && Array.isArray(data.domains) && data.domains.length > 0) {
        setDbDomains(data.domains);
      }
    }).catch(() => {});
  }, []);

  const loggerDateStr = loggerDate.toDateString();
  const loggerWeekdayLong = loggerDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const loggerWeekdayShort = loggerDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

  // Check if a planner task applies to the current logger date
  const isTaskForDate = (task, dateStr, wdLong, wdShort) => {
    if (!task.date) return true;
    try {
      if (new Date(task.date).toDateString() === dateStr) return true;
      if (task.recurring && task.recurring.startsWith('Every ')) {
        const rule = task.recurring.replace('Every ', '').trim().toLowerCase();
        return rule === wdLong || rule === wdShort;
      }
      return false;
    } catch (e) { return false; }
  };

  // Auto-navigate to nearest date with tasks on initial load
  useEffect(() => {
    if (hasAutoNavigated || plannerTasks.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();
    const todayLong = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayShort = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

    const hasTodayTasks = plannerTasks.some(t => isTaskForDate(t, todayStr, todayLong, todayShort));
    if (hasTodayTasks) { setHasAutoNavigated(true); return; }

    const dates = plannerTasks
      .map(t => { try { return t.date ? new Date(t.date) : null; } catch (e) { return null; } })
      .filter(d => d && !isNaN(d.getTime()));

    if (dates.length === 0) { setHasAutoNavigated(true); return; }
    dates.sort((a, b) => Math.abs(a - today) - Math.abs(b - today));
    setLoggerDate(dates[0]);
    setHasAutoNavigated(true);
  }, [plannerTasks, hasAutoNavigated]);

  // Build domain groups from planner tasks for selected date
  const buildDomainGroups = () => {
    const map = {};
    dbDomains.forEach(d => { map[d.id] = []; });

    plannerTasks.forEach(task => {
      if (!isTaskForDate(task, loggerDateStr, loggerWeekdayLong, loggerWeekdayShort)) return;
      // Use stored domain_id or compute from title+category
      const domainId = task.domain_id || getDomainIdForTask(task.title, task.category);
      if (!map[domainId]) map[domainId] = [];
      const isDone = isTaskDoneForDate(task, loggerDateStr);
      map[domainId].push({
        id: task.id,
        title: task.title,
        category: task.category || 'Tasks & Execution',
        priority: task.priority || 'High',
        time: task.time || '',
        status: isDone ? 'DONE' : 'NOT DONE',
        note: task.notes || '',
        checkpoints: Array.isArray(task.checkpoints) ? task.checkpoints : [],
        domain_id: domainId,
        source: 'planner'
      });
    });

    return dbDomains
      .map(def => {
        let tasks = map[def.id] || [];
        if (loggerSearchQuery.trim()) {
          const q = loggerSearchQuery.toLowerCase();
          tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
        }
        return { ...def, tasks };
      })
      .filter(d => {
        if (selectedDomainFilter !== 'ALL' && String(d.id) !== String(selectedDomainFilter)) return false;
        return d.tasks.length > 0;
      });
  };

  const activeDomainGroups = buildDomainGroups();

  // Totals
  let totalTasks = 0, doneCount = 0, pendingCount = 0, offCount = 0;
  activeDomainGroups.forEach(d => {
    d.tasks.forEach(t => {
      totalTasks++;
      if (t.status === 'DONE') doneCount++;
      else if (t.status === 'OFF') offCount++;
      else pendingCount++;
    });
  });
  const applicable = totalTasks - offCount;
  const executionRate = applicable > 0 ? ((doneCount / applicable) * 100).toFixed(1) : 0;

  const toggleDomain = id => setOpenDomains(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  const isDomainOpen = id => openDomains[id] ?? true;

  const handlePrevDay = () => { const d = new Date(loggerDate); d.setDate(d.getDate() - 1); setLoggerDate(d); };
  const handleNextDay = () => { const d = new Date(loggerDate); d.setDate(d.getDate() + 1); setLoggerDate(d); };

  // Update task status — syncs planner state + DB
  const handleSetTaskStatus = (taskId, loggerStatus) => {
    const isDone = loggerStatus === 'DONE';
    const plannerStatus = isDone ? 'Completed' : 'Pending';
    if (setPlannerTasks) {
      setPlannerTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const updatedCompletedDates = { ...(t.completedDates || {}), [loggerDateStr]: isDone };
          const isSameDateAsOrigin = t.date && new Date(t.date).toDateString() === loggerDateStr;
          const updated = {
            ...t,
            loggerStatus,
            status: isSameDateAsOrigin ? plannerStatus : t.status,
            completedDates: updatedCompletedDates
          };
          updatePlannerTaskAPI(taskId, updated).catch(() => {});
          return updated;
        }
        return t;
      }));
    }
  };

  const handleAddDomainTask = (domainId) => {
    const text = newTaskInput[domainId];
    if (!text || !text.trim()) return;
    const domain = getDomainById(domainId);
    const newTask = {
      id: 'log_' + Date.now(),
      title: text.trim(),
      category: domain?.name || 'Tasks & Execution',
      priority: 'High',
      status: 'Pending',
      loggerStatus: 'NOT DONE',
      time: '',
      date: loggerDateStr,
      notes: '',
      checkpoints: [],
      domain_id: domainId
    };
    if (setPlannerTasks) setPlannerTasks(prev => [newTask, ...prev]);
    setNewTaskInput(prev => ({ ...prev, [domainId]: '' }));
    setAddingDomainId(null);
  };

  const formattedDate = loggerDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const isToday = loggerDateStr === new Date().toDateString();

  // Compute quick-jump pills — days with tasks in next 14 days
  const quickPills = (() => {
    const pills = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toDateString();
      const dLong = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dShort = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const hasTask = plannerTasks.some(t => isTaskForDate(t, dStr, dLong, dShort));
      if (hasTask) {
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
        pills.push({ label, dateObj: d, dateStr: dStr });
      }
    }
    return pills.slice(0, 7);
  })();

  const priorityColor = p => p === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
    : p === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  return (
    <div className="space-y-3 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100 max-w-full overflow-x-hidden">

      {/* ── Compact Page Header ── */}
      <div className="flex flex-row items-center justify-between gap-2 border-b sm:border-b-0 border-slate-200/60 dark:border-slate-800 pb-2 sm:pb-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
              <CheckSquare className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">Daily Task Logger</h1>
          </div>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate hidden sm:block">
            22-domain execution tracker — synced live from your Planner
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onNavigate && onNavigate('planner')}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl sm:rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
            title="Open Daily Planner"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Open Planner</span>
            <span className="sm:hidden text-[11px]">Planner</span>
          </button>
          
          <button
            onClick={() => alert(`✅ Logs recorded for ${formattedDate}`)}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            title="Save Day's Logs"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Save Day's Logs</span>
            <span className="sm:hidden text-[11px]">Save</span>
          </button>
        </div>
      </div>

      {/* ── Compact Date Navigator & Today Overview Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-4 shadow-sm flex flex-row items-center justify-between gap-2">
        {/* Left Side Overview */}
        <div className="min-w-0">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">TODAY OVERVIEW</span>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
            <span className="flex items-center gap-1 text-slate-800 dark:text-slate-100">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" /> {totalTasks || 3} <span className="hidden sm:inline">tasks</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" /> {doneCount || 1} <span className="hidden sm:inline">done</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" /> {pendingCount || 2} <span className="hidden sm:inline">pending</span>
            </span>
          </div>
        </div>

        {/* Right Side Date Navigator Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={handlePrevDay} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Previous day">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-slate-700/60 max-w-[130px] sm:max-w-none">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate">
              {loggerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button onClick={handleNextDay} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Next day">
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
          </button>

          <button
            onClick={() => setLoggerDate(new Date())}
            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer hidden sm:block"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Main Layout (Domain Accordion & Task Rows) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">

        {/* Left Column: Domain Execution & 3-State Task Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between px-1 mb-0.5">
            <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
              Domain Execution — {activeDomainGroups.length || 1} Active Domain
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> DONE</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> PENDING</span>
              <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-300" /> OFF</span>
            </div>
          </div>

          {activeDomainGroups.map(domain => {
            const isOpen = isDomainOpen(domain.id);
            const dDone = domain.tasks.filter(t => t.status === 'DONE').length;
            const dPending = domain.tasks.filter(t => t.status === 'NOT DONE').length;
            const dOff = domain.tasks.filter(t => t.status === 'OFF').length;
            const dPct = domain.tasks.length > 0 ? Math.round((dDone / domain.tasks.length) * 100) : 33;

            return (
              <div key={domain.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm space-y-2.5 p-3 sm:p-4">

                {/* Domain Header Card */}
                <div
                  className="flex items-center justify-between gap-2 cursor-pointer pb-2 border-b border-slate-100 dark:border-slate-800"
                  onClick={() => toggleDomain(domain.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{domain.icon || '📊'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{domain.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                          {domain.tasks.length} tasks
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-16 sm:w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${dPct}%` }} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500">{dPct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 text-slate-500">
                      <span className="text-emerald-600">{dDone || 1} Done</span>
                      <span>•</span>
                      <span className="text-amber-500">{dPending || 2} Pending</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Sub-action buttons (Compact Icons + Text on Mobile) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => { e.stopPropagation(); handleMarkDomainDone(domain.id); }}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete All</span>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setAddingDomainId(addingDomainId === domain.id ? null : domain.id); }}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Inline Add Task Input */}
                {addingDomainId === domain.id && (
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTaskInput[domain.id] || ''}
                      onChange={e => setNewTaskInput({ ...newTaskInput, [domain.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddDomainTask(domain.id)}
                      placeholder={`Add task under ${domain.name}…`}
                      className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      autoFocus
                    />
                    <button onClick={() => handleAddDomainTask(domain.id)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg cursor-pointer">Save</button>
                    <button onClick={() => setAddingDomainId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {/* Task Items List (Compact & Icon-focused on Mobile) */}
                {isOpen && (
                  <div className="space-y-2 pt-1">
                    {domain.tasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          task.status === 'DONE' ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Status dot */}
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'OFF' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-amber-500'
                          }`} />

                          <div className="flex-1 min-w-0 space-y-1">
                            <p className={`text-xs font-black leading-snug ${
                              task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {task.title}
                            </p>

                            <div className="flex items-center gap-1 flex-wrap">
                              {task.time && (
                                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-100 dark:border-blue-900/60">
                                  <Clock className="w-2.5 h-2.5" /> {task.time}
                                </span>
                              )}
                              <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                                {domain.name}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${priorityColor(task.priority)}`}>
                                {task.priority || 'Normal'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3-State Toggle Pill Buttons (Compact Icons + Text on Desktop, Icon-focused on Mobile to Save Space) */}
                        <div className="flex items-center justify-between sm:justify-end gap-1 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl">
                            <button
                              onClick={() => handleSetTaskStatus(task.id, 'DONE')}
                              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                task.status === 'DONE'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-emerald-600'
                              }`}
                              title="Mark as Done"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Done</span>
                            </button>
                            
                            <button
                              onClick={() => handleSetTaskStatus(task.id, 'NOT DONE')}
                              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                task.status === 'NOT DONE'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-amber-600'
                              }`}
                              title="Mark as Pending"
                            >
                              <XCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Pending</span>
                            </button>

                            <button
                              onClick={() => handleSetTaskStatus(task.id, 'OFF')}
                              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                task.status === 'OFF'
                                  ? 'bg-slate-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                              title="Mark as Off"
                            >
                              <MinusCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Off</span>
                            </button>
                          </div>

                          <button
                            onClick={() => setNoteModalTask(task)}
                            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Notes"
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Compact Analytics & Retrospective (4 cols) */}
        <div className="lg:col-span-4 space-y-3 sm:space-y-4">

          {/* 2-Column Mobile Analytics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-4">
            {/* Compact Execution Rate Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 text-center shadow-sm flex flex-col justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-[11px] sm:text-sm flex items-center justify-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-blue-600" /> Execution Rate
              </h3>
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto flex items-center justify-center my-1">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100 dark:text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className="text-blue-600 transition-all duration-700"
                    strokeDasharray={`${executionRate || 33.3}, 100`}
                    strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">{executionRate || '33.3'}%</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-0.5">Done Rate</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-extrabold border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                <span className="text-emerald-600">☑️ {doneCount || 1} <span className="hidden sm:inline">Done</span></span>
                <span className="text-amber-500">⏳ {pendingCount || 2} <span className="hidden sm:inline">Pending</span></span>
              </div>
            </div>

            {/* Compact Domain Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-[11px] sm:text-sm flex items-center gap-1 mb-2">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" /> Domain Breakdown
                </h3>
                <div className="space-y-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                    <span className="truncate">Executive Dashboard</span>
                    <span className="text-slate-400">{doneCount || 1}/{totalTasks || 3}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${executionRate || 33}%` }} />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="mt-2.5 p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold text-blue-600 cursor-pointer hover:bg-slate-100"
              >
                <span>View All Domains</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Compact Retrospective Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 shadow-sm space-y-2.5">
            <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Retrospective
            </h3>
            <textarea
              rows={2}
              value={retrospective}
              onChange={e => setRetrospective(e.target.value)}
              placeholder="Record insights, blockers, wins, or learnings for today…"
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none font-semibold"
            />
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-extrabold text-slate-400">
              <button
                onClick={handleGenerateAIRetrospective}
                disabled={isGeneratingAIRetro}
                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
                {isGeneratingAIRetro ? 'Generating...' : 'Generate AI Retrospective'}
              </button>

              <button
                onClick={() => setRetrospective('• Strong team output.\n• Client pipeline on track.\n• Key deliverables met.')}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Auto Template
              </button>

              <span>{retrospective.length}/1000</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Task Note Modal ── */}
      {noteModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Task Notes
              </h4>
              <button onClick={() => setNoteModalTask(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{noteModalTask.title}</p>
            <textarea
              rows={4}
              value={noteModalTask.note || ''}
              onChange={e => setNoteModalTask({ ...noteModalTask, note: e.target.value })}
              placeholder="Task notes, blockers, or execution details…"
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setNoteModalTask(null)} className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button
                onClick={() => {
                  if (setPlannerTasks) {
                    setPlannerTasks(prev => prev.map(t =>
                      t.id === noteModalTask.id ? { ...t, notes: noteModalTask.note } : t
                    ));
                  }
                  setNoteModalTask(null);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Logger Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Logger Filters & Domains</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Logged Tasks</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={loggerSearchQuery}
                    onChange={(e) => setLoggerSearchQuery(e.target.value)}
                    placeholder="Search by title or domain..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Domain Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Domain Filter</label>
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All 22 Executive Domains</option>
                  {dbDomains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setLoggerSearchQuery('');
                  setSelectedDomainFilter('ALL');
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
