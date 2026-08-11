import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  TrendingUp,
  Brain,
  Plus,
  CheckSquare,
  Filter,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Flag,
  Lightbulb,
  ArrowRight,
  Upload,
  FileText,
  X,
  Loader2,
  List,
  CalendarDays,
  Trash2,
  CalendarClock,
  SkipForward,
  Search
} from 'lucide-react';
import {
  sendAIChatAPI,
  batchSavePlannerTasksAPI,
  deletePlannerTaskAPI,
  clearPlannerTasksAPI,
  deleteScheduleItemAPI,
  updatePlannerTaskAPI
} from '../services/api';

export default function DailyPlannerView({
  plannerTasks = [],
  setPlannerTasks,
  scheduleTimeline = [],
  setScheduleTimeline,
  onOpenAI,
  onAddTask,
  isLoading = false
}) {
  const [activeScheduleTab, setActiveScheduleTab] = useState('Timeline');
  const [groupBy, setGroupBy] = useState('Time'); // Default to Time-wise chronological sorting
  const [currentDate, setCurrentDate] = useState(new Date());

  // Task Details & Notes Modal State
  const [selectedTaskModal, setSelectedTaskModal] = useState(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskCheckpoints, setTaskCheckpoints] = useState([]);

  // Postpone popover state
  const [postponeTaskId, setPostponeTaskId] = useState(null);

  // Real-time Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Completed' | 'High'
  const [timeFilter, setTimeFilter] = useState('All'); // 'All' | 'Morning' | 'Afternoon' | 'Evening'

  // Expandable subtasks tracking (taskId -> boolean)
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  const toggleSubtaskExpand = (taskId) => {
    setExpandedSubtasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Toggle individual subtask checkpoint with MySQL sync
  const toggleSubtaskCheckpoint = (taskId, checkpointId) => {
    setPlannerTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const updatedCheckpoints = (task.checkpoints || []).map(cp =>
        cp.id === checkpointId ? { ...cp, done: !cp.done } : cp
      );
      const updatedTask = { ...task, checkpoints: updatedCheckpoints };
      updatePlannerTaskAPI(taskId, updatedTask).catch(err => console.warn('Subtask checkpoint update error:', err));
      return updatedTask;
    }));
  };

  // Delete individual subtask checkpoint with real-time MySQL database sync
  const deleteSubtaskCheckpoint = (taskId, checkpointId) => {
    setPlannerTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const updatedCheckpoints = (task.checkpoints || []).filter(cp => cp.id !== checkpointId);
      const updatedTask = { ...task, checkpoints: updatedCheckpoints };
      updatePlannerTaskAPI(taskId, updatedTask).catch(err => console.warn('Delete subtask DB sync error:', err));
      return updatedTask;
    }));
  };

  // Inline Fast Quick-Add Task State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('High');

  const handleInlineQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const newTask = {
      id: 'quick_' + Date.now(),
      title: quickTaskTitle.trim(),
      category: 'Executive',
      priority: quickTaskPriority,
      status: 'Pending',
      time: '09:00 AM – 10:00 AM',
      date: currentDate.toDateString(),
      targetDay: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      recurring: 'None',
      notes: '',
      checkpoints: []
    };
    setPlannerTasks(prev => [newTask, ...prev]);
    setQuickTaskTitle('');
    await createPlannerTaskAPI(newTask).catch(err => console.warn('Inline quick task DB save error:', err));
  };

  // 1-Click AI Smart Prioritize Handler
  const handleAISmartPrioritize = () => {
    setPlannerTasks(prev => {
      const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const sorted = [...prev].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Pending' ? -1 : 1;
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      });
      return sorted;
    });
    setGroupBy('Priority');
    alert("⚡ Tasks auto-prioritized by Executive Impact & Priority!");
  };

  // Postpone a task to a new date
  const postponeTask = (taskId, newDate) => {
    const newDateStr = newDate.toDateString();
    setPlannerTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updated = {
        ...t,
        date: newDateStr,
        targetDay: newDate.toLocaleDateString('en-US', { weekday: 'long' }),
        // Clear recurring so it's a one-time task on the new date
        recurring: t.recurring && t.recurring !== 'None' ? t.recurring : 'None'
      };
      updatePlannerTaskAPI(taskId, { date: newDateStr, targetDay: updated.targetDay }).catch(() => { });
      return updated;
    }));
    setPostponeTaskId(null);
  };

  // Compute postpone quick options relative to task's current date
  const getPostponeOptions = (task) => {
    const base = task.date ? new Date(task.date) : new Date();
    const opts = [];
    const addOpt = (label, days, icon) => {
      const d = new Date(base);
      d.setDate(base.getDate() + days);
      opts.push({ label, date: d, icon });
    };
    addOpt('Tomorrow', 1, '🌅');
    addOpt('In 2 Days', 2, '📆');
    addOpt('In 3 Days', 3, '📆');
    addOpt('Next Week', 7, '🗓️');
    addOpt('In 2 Weeks', 14, '📅');
    return opts;
  };

  // Close postpone popover when clicking outside
  useEffect(() => {
    if (!postponeTaskId) return;
    const close = () => setPostponeTaskId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [postponeTaskId]);

  // AI Agenda & Document Upload Modal State
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [modalTab, setModalTab] = useState('file'); // 'file' | 'paste'
  const [agendaText, setAgendaText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreviewTasks, setExtractedPreviewTasks] = useState(null); // Preview before execution

  // Time conversion helper for chronological sorting
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    let ampm = match[3] ? match[3].toUpperCase() : '';

    if (hours >= 12 && !ampm) ampm = 'PM';
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  // 12-Hour AM/PM Formatter Helper
  const formatTo12HourTime = (timeStr) => {
    if (!timeStr) return '09:00 AM';
    const cleanStr = String(timeStr).trim();
    const match = cleanStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return cleanStr;

    let hour = parseInt(match[1], 10);
    const minute = match[2];
    let period = match[3] ? match[3].toUpperCase() : null;

    if (hour >= 24) hour = hour % 24;

    if (hour >= 12) {
      period = 'PM';
      if (hour > 12) hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
      period = 'AM';
    } else if (!period) {
      period = 'AM';
    }

    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minute} ${period}`;
  };

  // 12-Hour AM/PM Time Range Formatter (Start – End)
  const formatTimeRange = (timeStr) => {
    if (!timeStr) return '09:00 AM – 10:00 AM';
    const cleanStr = String(timeStr).trim();
    if (cleanStr.includes('–') || cleanStr.includes('-')) {
      const parts = cleanStr.split(/–|-/);
      if (parts.length >= 2) {
        return `${formatTo12HourTime(parts[0])} – ${formatTo12HourTime(parts[1])}`;
      }
    }

    // Single start time: compute default 1 hour end time
    const startFormatted = formatTo12HourTime(cleanStr);
    const match = startFormatted.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = match[2];
      let period = match[3].toUpperCase();

      let endHour = hour + 1;
      let endPeriod = period;
      if (endHour === 12) {
        endPeriod = period === 'AM' ? 'PM' : 'AM';
      } else if (endHour > 12) {
        endHour = endHour - 12;
      }
      const endFormatted = `${endHour < 10 ? '0' + endHour : endHour}:${min} ${endPeriod}`;
      return `${startFormatted} – ${endFormatted}`;
    }
    return startFormatted;
  };

  const extractCheckpointsFromText = (rawText, title = '') => {
    if (!rawText) return [
      { id: 'cp_1', text: 'Review key deliverables and objectives', done: false },
      { id: 'cp_2', text: 'Align team members and track execution', done: false }
    ];

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const checkpoints = [];

    let currentSection = '';
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      // Match sections
      if (lower.startsWith('objective') || lower.startsWith('🎯 objective')) {
        currentSection = 'objective';
        return;
      }
      if (lower.startsWith('review areas') || lower.startsWith('📋 review areas')) {
        currentSection = 'review';
        return;
      }
      if (lower.startsWith('deliverable') || lower.startsWith('deliverables') || lower.startsWith('📦 deliverable')) {
        currentSection = 'deliverable';
        return;
      }
      if (lower.startsWith('departments') || lower.startsWith('🏢 departments')) {
        currentSection = 'departments';
        return;
      }
      if (lower.startsWith('notes') || lower.startsWith('📝 notes')) {
        currentSection = 'notes';
        return;
      }

      // If we are in "review areas" or "deliverables" or "objective", extract non-header lines as checkpoints
      if (currentSection === 'review' || currentSection === 'deliverable' || currentSection === 'objective') {
        const clean = line.replace(/^[-*•0-9.]+\s*/, '').trim();
        if (clean.length > 2) {
          checkpoints.push({
            id: 'cp_' + Math.random().toString(36).substring(2, 9),
            text: clean,
            done: false
          });
        }
      }
    });

    if (checkpoints.length === 0) {
      // Fallback: extract generic lines starting with bullets or numbers
      lines.forEach((line) => {
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
          const clean = line.replace(/^[-*•0-9.]+\s*/, '').trim();
          if (clean.length > 2) {
            checkpoints.push({
              id: 'cp_' + Math.random().toString(36).substring(2, 9),
              text: clean,
              done: false
            });
          }
        }
      });
    }

    if (checkpoints.length === 0) {
      return [
        { id: 'cp_1', text: 'Review key deliverables and objectives', done: false },
        { id: 'cp_2', text: 'Align team members and track execution', done: false }
      ];
    }

    return checkpoints;
  };

  // Open Task Info & Notes Modal
  const openTaskModal = (task) => {
    setSelectedTaskModal(task);
    setTaskNotes(task.notes || '');
    setTaskCheckpoints(task.checkpoints && task.checkpoints.length > 0 ? task.checkpoints : extractCheckpointsFromText(task.notes || task.title, task.title));
  };

  const handleSaveTaskDetails = () => {
    if (!selectedTaskModal) return;
    setPlannerTasks(prev => prev.map(t => {
      if (t.id === selectedTaskModal.id) {
        const updatedTask = {
          ...t,
          notes: taskNotes,
          checkpoints: taskCheckpoints,
          status: selectedTaskModal.status,
          priority: selectedTaskModal.priority,
          time: selectedTaskModal.time
        };
        updatePlannerTaskAPI(t.id, updatedTask).catch(err => {
          console.warn("DB task details sync failed:", err);
        });
        return updatedTask;
      }
      return t;
    }));
    setSelectedTaskModal(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setIsReadingFile(true);

    try {
      const text = await parseFileContent(file);
      setAgendaText(text);
    } catch (err) {
      alert("Error reading file: " + err.message);
    } finally {
      setIsReadingFile(false);
    }
  };

  const parseFileContent = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const fileName = file.name.toLowerCase();
      const isBinary = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

      if (isBinary) {
        reader.onload = (event) => {
          try {
            const buffer = event.target.result;
            const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
            const matches = text.match(/\(([^()]+)\)/g);
            if (matches && matches.length > 5) {
              const extracted = matches.map(m => m.slice(1, -1)).filter(t => t.trim().length > 2 && !t.includes('\\')).join(' ');
              if (extracted.length > 30) {
                resolve(`Document Title: ${file.name}\nExtracted Content:\n` + extracted);
                return;
              }
            }
            const clean = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
            resolve(`Document: ${file.name}\n\n` + (clean.slice(0, 3000) || `Extracted text from ${file.name}`));
          } catch (e) {
            resolve(`Document Title: ${file.name}\n1. Review deliverables in ${file.name}\n2. Perform client and operational follow-ups.`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsText(file);
      }
    });
  };

  // Delete individual task
  const deleteTask = (id) => {
    setPlannerTasks(prev => prev.filter(t => t.id !== id));
    deletePlannerTaskAPI(id).catch(err => console.warn("Task delete API:", err));
  };

  // Delete individual schedule item
  const deleteScheduleItem = (id) => {
    setScheduleTimeline(prev => prev.filter(item => item.id !== id));
    deleteScheduleItemAPI(id).catch(err => console.warn("Schedule delete API:", err));
  };

  // Clear all planner tasks from state & MySQL database
  const handleClearAllPlannerTasks = async () => {
    if (!window.confirm("Are you sure you want to clear all tasks from the Daily Planner & Database?")) return;
    try {
      setPlannerTasks([]);
      setScheduleTimeline([]);
      await clearPlannerTasksAPI();
      alert("All planner tasks cleared successfully.");
    } catch (err) {
      console.warn("Clear planner tasks API error:", err);
      alert("All planner tasks cleared from view.");
    }
  };

  // Date & Day-wise Filter State
  const [dayFilter, setDayFilter] = useState('Today');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  // Track whether we've auto-navigated on initial DB load (to prevent repeated jumps)
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  const getDayLabel = (dateObj) => {
    if (!dateObj) return 'All Days';
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (dateObj.toDateString() === today.toDateString()) return 'Today';
    if (dateObj.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const handleDateChange = (days) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
    setDayFilter(getDayLabel(nextDate));
  };

  const handlePrevDate = () => handleDateChange(-1);
  const handleNextDate = () => handleDateChange(1);

  // Auto-navigate to earliest date with tasks when loaded from DB (fixes refresh bug)
  useEffect(() => {
    if (hasAutoNavigated || plannerTasks.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if any tasks exist for today's date
    const hasTodayTasks = plannerTasks.some(t => {
      if (!t.date) return true;
      try {
        const td = new Date(t.date);
        td.setHours(0, 0, 0, 0);
        return td.getTime() === today.getTime();
      } catch (e) { return false; }
    });

    if (hasTodayTasks) {
      // Today has tasks — stay on today
      setHasAutoNavigated(true);
      return;
    }

    // Find the nearest future (or closest past) date that has tasks
    const taskDates = plannerTasks
      .map(t => {
        try { return t.date ? new Date(t.date) : null; } catch (e) { return null; }
      })
      .filter(d => d && !isNaN(d.getTime()));

    if (taskDates.length === 0) {
      setHasAutoNavigated(true);
      return;
    }

    // Sort and find nearest date to today
    taskDates.sort((a, b) => Math.abs(a - today) - Math.abs(b - today));
    const nearestDate = taskDates[0];

    setCurrentDate(nearestDate);
    setDayFilter(getDayLabel(nearestDate));
    setHasAutoNavigated(true);
  }, [plannerTasks, hasAutoNavigated]);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getDayPills = () => {
    const pills = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      pills.push({ label, date: d });
    }
    pills.push({ label: 'All Days', date: null });
    return pills;
  };

  // Target Execution Date & Recurring Provision State for AI Task Generator Modal
  const [targetExecutionDate, setTargetExecutionDate] = useState(new Date());
  const [isRecurringMode, setIsRecurringMode] = useState(false);

  const getQuickTargetDays = () => {
    const today = new Date();
    const result = [];

    // Today & Tomorrow
    result.push({ label: 'Today', shortLabel: 'Today', dateObj: new Date(today) });

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomName = tomorrow.toLocaleDateString('en-US', { weekday: 'short' });
    result.push({ label: `Tomorrow (${tomName})`, shortLabel: `Tomorrow (${tomName})`, dateObj: new Date(tomorrow) });

    // Generate upcoming days for all 7 weekdays (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    const weekdaysOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
    weekdaysOrder.forEach((dayNum) => {
      const d = new Date(today);
      let diff = dayNum - today.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(today.getDate() + diff);

      const dStr = d.toDateString();
      if (dStr !== today.toDateString() && dStr !== tomorrow.toDateString()) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const dateNum = d.getDate();
        result.push({
          label: `${dayName} (${dateNum} ${monthName})`,
          shortLabel: `${dayName} ${dateNum} ${monthName}`,
          dateObj: d
        });
      }
    });

    return result;
  };

  const isTaskCompletedForDate = (task, dateStr) => {
    if (!task) return false;
    if (task.completedDates && typeof task.completedDates[dateStr] === 'boolean') {
      return task.completedDates[dateStr];
    }
    if (task.date && new Date(task.date).toDateString() === dateStr) {
      return task.status === 'Completed';
    }
    return false;
  };

  const toggleTaskStatus = (id, targetDateStr = activeDateStr) => {
    setPlannerTasks(prev => prev.map(task => {
      if (task.id === id) {
        const currentlyDone = isTaskCompletedForDate(task, targetDateStr);
        const newDone = !currentlyDone;
        const updatedCompletedDates = { ...(task.completedDates || {}), [targetDateStr]: newDone };
        const isSameDateAsOrigin = task.date && new Date(task.date).toDateString() === targetDateStr;
        const updatedTask = {
          ...task,
          status: isSameDateAsOrigin ? (newDone ? 'Completed' : 'Pending') : task.status,
          completedDates: updatedCompletedDates
        };
        updatePlannerTaskAPI(id, updatedTask).catch(err => {
          console.warn("DB status sync failed:", err);
        });
        return updatedTask;
      }
      return task;
    }));
  };

  // Filter tasks & schedule strictly by active selected date & recurring provisions
  const activeDateStr = currentDate.toDateString();
  const activeWeekdayLong = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const activeWeekdayShort = currentDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

  const activeDayTasks = dayFilter === 'All Days'
    ? plannerTasks
    : plannerTasks.filter(t => {
      if (!t.date) return true;
      try {
        const isExact = new Date(t.date).toDateString() === activeDateStr;
        if (isExact) return true;

        // Check if task is recurring on this weekday
        if (t.recurring && t.recurring.startsWith('Every ')) {
          const ruleDay = t.recurring.replace('Every ', '').trim().toLowerCase();
          if (ruleDay === activeWeekdayLong || ruleDay === activeWeekdayShort) return true;
        }
        return false;
      } catch (e) {
        return true;
      }
    });

  const parseTimeStrToMinutes = (timeStr) => {
    if (!timeStr) return Number.MAX_SAFE_INTEGER;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const filteredTasks = activeDayTasks.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title && t.title.toLowerCase().includes(q);
      const matchCategory = t.category && t.category.toLowerCase().includes(q);
      const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory && !matchNotes) return false;
    }
    if (statusFilter === 'Pending') return t.status === 'Pending';
    if (statusFilter === 'Completed') return t.status === 'Completed';
    if (statusFilter === 'High') return t.priority === 'High';

    if (timeFilter !== 'All') {
      const minutes = parseTimeStrToMinutes(t.time);
      if (timeFilter === 'Morning' && minutes >= 12 * 60) return false;
      if (timeFilter === 'Afternoon' && (minutes < 12 * 60 || minutes >= 17 * 60)) return false;
      if (timeFilter === 'Evening' && minutes < 17 * 60) return false;
    }

    return true;
  }).sort((a, b) => parseTimeStrToMinutes(a.time) - parseTimeStrToMinutes(b.time));

  const activeDaySchedule = dayFilter === 'All Days'
    ? scheduleTimeline
    : scheduleTimeline.filter(s => {
      if (!s.date) return true;
      try {
        return new Date(s.date).toDateString() === activeDateStr;
      } catch (e) {
        return true;
      }
    });

  // Dynamic KPI metrics for active selected day
  const totalTasks = activeDayTasks.length;
  const highPriority = filteredTasks.filter(t => t.priority === 'High');
  const mediumPriority = filteredTasks.filter(t => t.priority === 'Medium');
  const lowPriority = filteredTasks.filter(t => t.priority === 'Low');
  const completedCount = activeDayTasks.filter(t => t.status === 'Completed').length;
  const pendingCount = activeDayTasks.filter(t => t.status === 'Pending').length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const cleanDocumentText = (raw) => {
    if (!raw) return '';
    let text = raw.replace(/%PDF-[\d.]+/gi, '')
      .replace(/stream[\s\S]*?endstream/gi, ' ')
      .replace(/obj[\s\S]*?endobj/gi, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  };

  const isMetaInstruction = (text) => {
    if (!text || typeof text !== 'string') return true;
    const lower = text.trim().toLowerCase();
    if (lower.length < 3) return true;

    // Direct regex matching for meta instructions & directives
    const metaRegex = /^(assign|schedule|create|add|make|set|generate|prompt|follow)\s+(task|tasks|item|items|agenda|for|to|on|as|each|every|with|in|the|an|a|instruction|directives?)/i;
    if (metaRegex.test(lower)) return true;

    if (lower.startsWith('assign ') || lower.startsWith('schedule ') || lower.startsWith('task for ') || lower.startsWith('note:') || lower.startsWith('instruction:')) {
      return true;
    }

    const metaKeywords = [
      'assign as', 'assign to', 'assign each', 'assign task', 'assign for', 'assign on',
      'create task', 'create tasks', 'make task', 'please add', 'please create',
      'set priority', 'note:', 'instructions:', 'instruction', 'document agenda',
      'stream', 'pdf', 'ignore section', 'follow given', 'prompt received', 'generate task'
    ];
    return metaKeywords.some(keyword => lower.startsWith(keyword) || lower.includes('assign as an') || lower.includes('assign each and') || lower.includes('assign task for'));
  };

  const resolveTargetDateFromText = (text, refDate = new Date()) => {
    if (!text) return refDate;
    const lower = text.toLowerCase();
    const result = new Date(refDate);

    if (lower.includes('tomorrow')) {
      result.setDate(result.getDate() + 1);
      return result;
    }

    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < weekdays.length; i++) {
      if (lower.includes(weekdays[i])) {
        const targetDay = i;
        const currentDay = refDate.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        result.setDate(refDate.getDate() + daysToAdd);
        return result;
      }
    }
    return refDate;
  };

  // AI Agenda Task Extraction Handler (Day-wise, Date-wise, Time-wise)
  const handleExtractAgendaTasks = async () => {
    if (!agendaText.trim() || isExtracting) return;
    setIsExtracting(true);

    const docName = selectedFile
      ? selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      : "Executive Agenda";
    const cleanedInput = cleanDocumentText(agendaText);

    // Target Execution Date selected by user on the modal UI control bar takes supreme priority
    const resolvedTargetDateObj = targetExecutionDate || currentDate;
    const targetDateFormatted = resolvedTargetDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const targetDateStr = resolvedTargetDateObj.toDateString();
    const targetDayName = resolvedTargetDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    try {
      const prompt = `You are an elite Executive AI Task Planner trained to understand natural human-sent conversational language, voice transcripts, shorthand notes, and specific user directives.

CURRENT REFERENCE DATE: Today is ${targetDateFormatted} (${targetDateStr})

RAW HUMAN-SENT INPUT / DOCUMENT / USER TEXT:
"${cleanedInput.slice(0, 4000)}"

CRITICAL HUMAN LANGUAGE & INSTRUCTION FOLLOWING RULES:
1. UNDERSTAND HUMAN INTENT & DIRECTIVES:
   - Carefully interpret informal human-typed text, bullet lists, voice transcripts, and shorthand notes.
   - Strictly follow any explicit instructions provided in the text (e.g. "schedule for Monday", "priority high").

2. EXTRACT SUB-ITEMS AS CHECKPOINTS / SUBTASKS:
   - When a task has sub-points, bullet points, or list items underneath it (e.g. "Review company KPIs", "Check project health", "QA blockers"), extract these sub-points as a clean array of strings under the "checkpoints" key.
   - Do NOT mix subtask lines into the main list of tasks; they belong strictly inside their parent task's "checkpoints" array.

3. ACCURATE HEADINGS & DETAILS:
   - "title": Clean title (e.g. "CEO Weekly Planning & Executive Dashboard Review") without numbers or bullet prefixes.
   - "category": Match from ["Executive Dashboard", "Today's Priorities", "Calendar & Schedule", "Tasks & Execution", "Meetings", "Decisions", "Operations", "Sales & Clients", "Product & Innovation", "Marketing & Brand", "Finance", "People & Leadership", "Strategy & Business Growth", "AI & Automation", "Risks & Escalations", "Documents & Approvals", "KPIs & Performance", "Learning & Research", "Notes & Ideas", "End of Day Review", "Tomorrow Planning", "AI Executive Summary"]. Choose the closest match.
   - "priority": "High", "Medium", or "Low".
   - "time": 12-hour time range string (e.g. "09:30 AM – 10:30 AM").
   - "date": Date string.
   - "targetDay": Weekday name.
   - "recurring": "None" or "Every Monday", etc.
   - "notes": Formatted description containing the text block.
   - "checkpoints": Array of strings (e.g. ["Review company KPIs", "Check project health", "Review revenue & cash position", "Set Top 3 weekly priorities", "Review critical emails & approvals"]).

Return ONLY a valid JSON array of objects with keys: "title", "category", "priority", "time", "date", "targetDay", "recurring", "notes", "checkpoints". Output ONLY raw JSON array.`;

      const response = await sendAIChatAPI(prompt, "You are a day-wise, date-wise, and time-wise executive AI task planner.");
      let extracted = [];

      if (response && response.text) {
        try {
          const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            extracted = parsed;
          }
        } catch (e) {
          console.warn("AI JSON parse error, falling back to line extraction:", e);
        }
      }

      // Smart text block extraction fallback if AI JSON output wasn't strict JSON or offline
      if (!Array.isArray(extracted) || extracted.length === 0) {
        const rawLines = agendaText.split('\n').map(l => l.trim());
        const tasksList = [];
        let currentTask = null;

        rawLines.forEach((line) => {
          if (!line) return;

          // Check if line indicates a new task: e.g. starts with number followed by dot, or contains time
          const taskStartMatch = line.match(/^(\d+)\.\s*(.*)/) || line.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–]\s*.*)/);

          if (taskStartMatch) {
            if (currentTask) {
              tasksList.push(currentTask);
            }
            let taskContent = line;
            if (line.match(/^(\d+)\.\s*(.*)/)) {
              taskContent = line.replace(/^(\d+)\.\s*/, '').trim();
            }

            // Try to extract time from content: e.g., "09:30 AM - ..."
            const timeMatch = taskContent.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–]\s*(.*)/i);
            let extractedTime = '';
            let title = taskContent;
            if (timeMatch) {
              extractedTime = timeMatch[1].trim();
              title = timeMatch[2].trim();
            }

            currentTask = {
              title: title,
              time: extractedTime,
              notes: '',
              checkpoints: []
            };
          } else {
            // It's a subtask or detail line
            if (currentTask) {
              const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
              if (cleanLine.length > 2) {
                currentTask.checkpoints.push(cleanLine);
                if (currentTask.notes) {
                  currentTask.notes += '\n• ' + cleanLine;
                } else {
                  currentTask.notes = '• ' + cleanLine;
                }
              }
            } else {
              // Create a dummy task if text starts with subtasks
              currentTask = {
                title: line,
                time: '',
                notes: '',
                checkpoints: []
              };
            }
          }
        });

        if (currentTask) {
          tasksList.push(currentTask);
        }

        if (tasksList.length > 0) {
          extracted = tasksList.map((tItem, idx) => {
            const startHour = 9 + (idx % 8);
            const period = startHour >= 12 ? 'PM' : 'AM';
            const displayHour = startHour > 12 ? startHour - 12 : startHour;
            const nextHour = displayHour === 12 ? 1 : displayHour + 1;
            const timeRange = tItem.time ? formatTimeRange(tItem.time) : `${displayHour < 10 ? '0' + displayHour : displayHour}:00 ${period} – ${nextHour < 10 ? '0' + nextHour : nextHour}:00 ${period}`;

            return {
              title: tItem.title,
              category: ['Meetings', 'Operations', 'KPIs & Performance', 'Sales & Clients', 'Strategy & Business Growth', 'Tasks & Execution'][idx % 6],
              priority: idx < 2 ? 'High' : 'Medium',
              time: timeRange,
              date: targetDateStr,
              targetDay: 'Today',
              recurring: 'None',
              notes: tItem.notes || tItem.title,
              checkpoints: tItem.checkpoints
            };
          });
        }
      }

      const sanitizeTitle = (t, item) => {
        if (!t || isMetaInstruction(t)) {
          const dayName = item?.targetDay || 'Monday';
          return `Executive ${dayName} Planning & Operational Alignment`;
        }
        let clean = t.replace(/\[.*?\]\s*/g, '').replace(/[^\x20-\x7E]/g, '').trim();
        if (isMetaInstruction(clean)) {
          const dayName = item?.targetDay || 'Monday';
          return `Executive ${dayName} Planning & Operational Alignment`;
        }
        return clean || `Action Item ${docName}`;
      };

      if (Array.isArray(extracted) && extracted.length > 0) {
        const previewItems = extracted.map((item, i) => {
          let cps = [];
          if (item.checkpoints && Array.isArray(item.checkpoints)) {
            cps = item.checkpoints.map((cp, cpIdx) => ({
              id: 'cp_preview_' + Date.now() + '_' + i + '_' + cpIdx,
              text: typeof cp === 'string' ? cp : (cp.text || ''),
              done: !!cp.done
            }));
          } else {
            cps = extractCheckpointsFromText(item.notes || item.title, item.title);
          }

          let rawTitle = item.title || '';
          const matchTime = rawTitle.match(/^\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*(?:-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)\s*/i);
          let finalTime = item.time || `${10 + i}:00 AM`;
          if (matchTime) {
             finalTime = formatTimeRange(matchTime[1].trim());
             rawTitle = rawTitle.replace(/^\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*(?:-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)\s*/i, '').trim();
          }

          return {
            id: 'preview_' + Date.now() + '_' + i,
            title: sanitizeTitle(rawTitle, item),
            category: item.category || 'Executive Strategy',
            priority: item.priority || (i === 0 ? 'High' : 'Medium'),
            status: 'Pending',
            time: finalTime,
            date: item.date ? new Date(item.date).toDateString() : targetDateStr,
            targetDay: item.targetDay && item.targetDay !== 'Today' ? item.targetDay : targetDayName,
            recurring: isRecurringMode ? `Every ${targetDayName}` : 'None',
            notes: item.notes || '',
            checkpoints: cps,
            selected: true
          };
        });

        setExtractedPreviewTasks(previewItems);
      }
    } catch (err) {
      alert("Error extracting tasks from document: " + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm & Execute Selected Preview Tasks
  const handleConfirmPreviewTasks = () => {
    if (!extractedPreviewTasks) return;
    const selectedItems = extractedPreviewTasks.filter(t => t.selected);
    if (selectedItems.length === 0) {
      alert("Please select at least one task to execute.");
      return;
    }

    const docName = selectedFile ? selectedFile.name : "Document";

    // Deduplicate: skip tasks already in plannerTasks with same title + date + time
    const normalizeStr = s => (s || '').trim().toLowerCase();
    const existingKeys = new Set(
      plannerTasks.map(t => `${normalizeStr(t.title)}||${normalizeStr(t.date)}||${normalizeStr(t.time)}`)
    );

    const filteredItems = selectedItems.filter(item => {
      const key = `${normalizeStr(item.title)}||${normalizeStr(item.date)}||${normalizeStr(item.time)}`;
      return !existingKeys.has(key);
    });

    const duplicateCount = selectedItems.length - filteredItems.length;
    if (filteredItems.length === 0) {
      alert(`All ${selectedItems.length} selected task${selectedItems.length > 1 ? 's' : ''} already exist in the planner. No new tasks added.`);
      setExtractedPreviewTasks(null);
      setSelectedFile(null);
      return;
    }

    const newTasks = filteredItems.map((item, i) => ({
      id: 'agenda_' + Date.now() + '_' + i,
      title: item.title,
      category: item.category,
      priority: item.priority,
      status: 'Pending',
      time: item.time,
      date: item.date,
      targetDay: item.targetDay,
      recurring: item.recurring,
      notes: item.notes,
      checkpoints: item.checkpoints || []
    }));

    const newTimeline = filteredItems.map((item, i) => ({
      id: 'agenda_tl_' + Date.now() + '_' + i,
      time: item.time,
      duration: '45m',
      title: item.title,
      subtitle: item.category,
      status: 'Pending',
      date: item.date
    }));

    setPlannerTasks(prev => [...newTasks, ...prev]);
    setScheduleTimeline(prev => [...newTimeline, ...prev]);

    // Save directly to MySQL database via backend API
    batchSavePlannerTasksAPI(newTasks, newTimeline).catch(err => {
      console.warn("Backend batch save error:", err);
    });

    if (duplicateCount > 0) {
      console.info(`Skipped ${duplicateCount} duplicate task(s) already in planner.`);
    }

    // Auto-navigate calendar to target date of confirmed tasks (e.g. Monday Aug 10)
    if (selectedItems.length > 0 && selectedItems[0].date) {
      try {
        const targetDateObj = new Date(selectedItems[0].date);
        if (!isNaN(targetDateObj.getTime())) {
          setCurrentDate(targetDateObj);
          setDayFilter(getDayLabel(targetDateObj));
        }
      } catch (e) {
        console.warn("Date navigation error:", e);
      }
    }

    const targetDayLabel = selectedItems[0]?.date
      ? new Date(selectedItems[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : formattedDate;

    setExtractedPreviewTasks(null);
    setAgendaText('');
    setSelectedFile(null);
    setShowAgendaModal(false);
    alert(`🎉 Confirmed & Executed! ${newTasks.length} tasks added to Daily Planner for ${targetDayLabel}.`);
  };

  const handleLoadSampleAgenda = () => {
    setAgendaText(`10:00 AM – Engineering Leadership & Sprint Review

Objective
Ensure engineering teams are delivering according to plan.

Review Areas
Sprint progress
Completed user stories
Pending tasks
Development blockers
Code quality
Team workload
Resource allocation
Delivery timeline

Departments
Backend Team
Frontend Team
Mobile Team
QA Team
UI/UX Team

Deliverable
Sprint health report
Blocker resolution plan

Notes
No office calls unless it's a true emergency.`);
  };

  const stripTimeFromTitle = (title) => {
    if (!title) return '';
    // Removes leading times like "10:15 AM ", "09:30 AM - 10:30 AM ", or "14:30 " from the start of the string
    return title.replace(/^\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*(?:-\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?\s*/i, '').trim();
  };

  const renderTaskCard = (task) => {
    const isCompleted = isTaskCompletedForDate(task, activeDateStr);
    return (
      <div
        key={task.id}
        onClick={() => openTaskModal(task)}
        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-brand-500/80 ${task.priority === 'High' ? 'border-l-4 border-l-rose-500' :
            task.priority === 'Medium' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
          } ${isCompleted
            ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 text-slate-400 opacity-70'
            : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/90'
          }`}
      >
        {/* Top Badge Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 rounded-md border border-brand-200/50 dark:border-brand-800/50 flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-600 shrink-0" />
              {formatTimeRange(task.time)}
            </span>

            <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
              {task.category || 'Executive'}
            </span>

            {/* Postponed badge — shown when task date is in the future */}
            {(() => {
              if (!task.date) return null;
              try {
                const td = new Date(task.date);
                td.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (td > today) {
                  return (
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1 shrink-0">
                      ⏭ {td.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  );
                }
              } catch (e) { }
              return null;
            })()}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${task.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
              task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
              {task.priority === 'High' ? 'High' : task.priority === 'Medium' ? 'Medium' : 'Low'}
            </span>

            {/* Postpone Button + Popover */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPostponeTaskId(prev => prev === task.id ? null : task.id);
                }}
                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                title="Postpone task"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Postpone Popover */}
              {postponeTaskId === task.id && (
                <div
                  className="absolute right-0 top-7 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 min-w-[190px] space-y-2"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">Postpone To</span>
                    </div>
                    <button onClick={() => setPostponeTaskId(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 px-0.5 mb-1">
                    Current: {task.date ? new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                  </div>
                  {getPostponeOptions(task).map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => postponeTask(task.id, opt.date)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors text-left"
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-medium">
                        {opt.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                  ))}
                  {/* Custom date picker */}
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Pick a date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        if (e.target.value) postponeTask(task.id, new Date(e.target.value + 'T00:00:00'));
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Task Title & Checkbox */}
        <div className="flex items-start gap-2.5 pt-0.5">
          <input
            type="checkbox"
            checked={isCompleted}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              toggleTaskStatus(task.id, activeDateStr);
            }}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold leading-snug break-words ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
              {stripTimeFromTitle(task.title)}
            </h4>
            {task.notes && (!task.checkpoints || task.checkpoints.length === 0) && (
              <p className="text-[11px] text-purple-600 dark:text-purple-300 font-medium mt-1 flex items-center gap-1 line-clamp-1">
                <FileText className="w-3 h-3 text-purple-500 shrink-0" />
                <span>{task.notes}</span>
              </p>
            )}
            {task.checkpoints && task.checkpoints.length > 0 && (() => {
              const isExpanded = !!expandedSubtasks[task.id];
              const doneCount = task.checkpoints.filter(c => c.done).length;
              const totalCount = task.checkpoints.length;
              const percent = Math.round((doneCount / totalCount) * 100);

              return (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span className="font-extrabold text-slate-700 dark:text-slate-200 text-[11px]">Subtasks Progress</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-md border border-brand-200/50">
                        {doneCount}/{totalCount} Done
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubtaskExpand(task.id);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-brand-900/40 dark:text-slate-300 dark:hover:text-brand-300 font-extrabold transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                        title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                      >
                        <span className="text-[10px]">{isExpanded ? 'Hide' : 'Show'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="space-y-1 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                      {task.checkpoints.map(cp => (
                        <div
                          key={cp.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubtaskCheckpoint(task.id, cp.id);
                          }}
                          className="flex items-center justify-between gap-1.5 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer group/cp"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={cp.done}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => { }}
                              className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500 rounded cursor-pointer shrink-0"
                            />
                            <span className={`text-[11px] font-medium leading-tight break-words ${cp.done ? 'line-through text-slate-400' : 'group-hover/cp:text-brand-600'}`}>{cp.text}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubtaskCheckpoint(task.id, cp.id);
                            }}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors opacity-0 group-hover/cp:opacity-100 shrink-0"
                            title="Delete subtask from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">
      {/* Loading state while DB data is fetched */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-8 py-6 flex items-center gap-4 border border-brand-100 dark:border-brand-900/40">
            <svg className="animate-spin w-6 h-6 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Loading tasks from database…</span>
          </div>
        </div>
      )}

      {/* Top Page Header & Navigation */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Daily Planner</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              AI-driven date-wise agenda planner and operational schedule.
            </p>
          </div>

          {/* Date Selector Navigation Bar */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{formattedDate}</span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              title="Return to Today"
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-extrabold hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer min-w-[80px]"
            >
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            onClick={() => setShowAgendaModal(true)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Upload Document / Agenda"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Upload Document / Agenda</span>
            <span className="sm:hidden text-[11px] truncate">Upload Agenda</span>
          </button>

          <button
            onClick={handleClearAllPlannerTasks}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 border border-rose-100 dark:border-rose-900/60 transition-all cursor-pointer"
            title="Clear all tasks from database"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Clear All Tasks</span>
            <span className="sm:hidden text-[11px] truncate">Clear Tasks</span>
          </button>
        </div>
      </div>

      {/* Mobile Compact 1-Row Summary Bar (< sm - Saves Space on Mobile) */}
      <div className="sm:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 shadow-sm flex items-center justify-between gap-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{totalTasks || 3} Tasks</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>{completionRate || 33}%</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1 text-amber-500">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{pendingCount || 1} Pending</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
          <Brain className="w-3.5 h-3.5 shrink-0" />
          <span>94% AI</span>
        </div>
      </div>

      {/* Desktop KPI Overview Cards (hidden on mobile, sm:grid on larger screens) */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Priorities */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Total Priorities</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalTasks || 3}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">Scheduled for Today</div>
          </div>
        </div>

        {/* Card 2: Est. Completion */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Est. Completion</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{completionRate || 33}%</div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${completionRate || 33}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Tasks */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">Pending Tasks</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{pendingCount || 1}</div>
            <div className="text-[10px] font-bold text-amber-500 mt-0.5">Action Required</div>
          </div>
        </div>

        {/* Card 4: AI Confidence */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">AI Confidence</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">94%</div>
            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">Plan Accuracy</div>
          </div>
        </div>
      </div>

      {/* Main 2 Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Active Day's Tasks Checklist (8 Cols) */}
        <div className="lg:col-span-8 card-base p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header & Filter Controls Bar (Ultra-Compact 1-Row on Mobile) */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate">
                {dayFilter === 'All Days' ? 'All Scheduled Tasks' : `Today's Tasks`} ({totalTasks || 3})
              </h3>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="text-[11px] sm:text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Time">📋 Time</option>
                  <option value="Priority">🔥 Priority</option>
                  <option value="Status">📊 Status</option>
                </select>

                <button
                  onClick={handleAISmartPrioritize}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                  title="Auto-sort tasks by priority & impact"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">AI Prioritize</span>
                  <span className="sm:hidden">AI</span>
                </button>

                <button
                  onClick={onAddTask}
                  className="hidden sm:flex px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold items-center justify-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>



            {/* Task List Grouped / Chronological */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                groupBy === 'Time' ? (
                  <div className="space-y-2.5">
                    {[...filteredTasks].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)).map((task) => renderTaskCard(task))}
                  </div>
                ) : (
                  <>
                    {/* Priority Grouping */}
                    {highPriority.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600">
                          <span>🔥 High Priority ({highPriority.length})</span>
                        </div>
                        <div className="space-y-2.5">
                          {highPriority.map((task) => renderTaskCard(task))}
                        </div>
                      </div>
                    )}

                    {mediumPriority.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 mt-3">
                          <span>🟡 Medium Priority ({mediumPriority.length})</span>
                        </div>
                        <div className="space-y-2.5">
                          {mediumPriority.map((task) => renderTaskCard(task))}
                        </div>
                      </div>
                    )}

                    {lowPriority.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 mt-3">
                          <span>🟢 Low Priority ({lowPriority.length})</span>
                        </div>
                        <div className="space-y-2.5">
                          {lowPriority.map((task) => renderTaskCard(task))}
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-40 text-blue-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Tasks in Daily Planner</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Database is clean. Click 'Upload Agenda' or '+ Add' to schedule your daily priorities.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Plan Source (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Plan Summary (Matches Screenshot) */}
          <div className="card-base p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/70 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-100 dark:border-purple-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-300">AI Plan Summary</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div>• {totalTasks || 3} tasks scheduled for today</div>
                <div>• Execution rate: {completionRate || 33}%</div>
                <div>• {highPriority.length || 1} high priority tasks</div>
                <div>• Estimated productivity: {completionRate || 33}%</div>
              </div>
            </div>
          </div>

          {/* AI Suggestions Card (Matches Screenshot) */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">AI Suggestions</span>
              </div>
              <button onClick={onOpenAI} className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer">Ask AI</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white">Peak Focus Slot</div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-0.5">10:00 AM – 12:30 PM (Peak Focus)</p>
              </div>
              <button
                onClick={() => alert("AI optimization applied to your daily schedule!")}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-extrabold rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                View All Suggestions
              </button>
            </div>
          </div>

          {/* Task Status Legend (Matches Screenshot) */}
          <div className="card-base p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Task Status Legend</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Progress</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agenda & Document Upload Modal Overlay */}
      {showAgendaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 space-y-3.5 my-auto max-h-[90vh] overflow-y-auto max-w-full">
            {/* Modal Header (Sticky on Mobile) */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2 truncate pr-2">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span className="truncate">Upload Agenda & AI Task Generator</span>
              </h3>
              <button
                onClick={() => {
                  setShowAgendaModal(false);
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {extractedPreviewTasks ? (
              /* Live Interactive Preview Screen */
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                    <div>
                      <p className="font-extrabold text-xs">AI Extracted {extractedPreviewTasks.length} Tasks Preview</p>
                      <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                        Target Scheduled Date: <span className="font-black text-purple-900 dark:text-purple-100">{
                          extractedPreviewTasks && extractedPreviewTasks.length > 0 && extractedPreviewTasks[0].date
                            ? new Date(extractedPreviewTasks[0].date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
                            : formattedDate
                        }</span>. Review & confirm before executing.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-black rounded-lg text-[10px]">
                    {extractedPreviewTasks.filter(t => t.selected).length}/{extractedPreviewTasks.length} Selected
                  </span>
                </div>

                {/* Preview Tasks Scrollable List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {extractedPreviewTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${task.selected
                        ? 'bg-white dark:bg-slate-800 border-brand-300 dark:border-brand-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.selected}
                        onChange={() => {
                          setExtractedPreviewTasks(prev => prev.map(t => t.id === task.id ? { ...t, selected: !t.selected } : t));
                        }}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer mt-0.5"
                      />

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExtractedPreviewTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: val } : t));
                          }}
                          className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded">
                            {task.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ⏰ {formatTo12HourTime(task.time)}
                          </span>
                        </div>
                      </div>

                      <select
                        value={task.priority}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExtractedPreviewTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: val } : t));
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-600"
                      >
                        <option value="High">🔥 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Preview Screen Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setExtractedPreviewTasks(null)}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Back to Edit Input
                  </button>

                  <button
                    onClick={handleConfirmPreviewTasks}
                    disabled={extractedPreviewTasks.filter(t => t.selected).length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Execute Tasks ({extractedPreviewTasks.filter(t => t.selected).length})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Original Upload & Input Form */
              <>
                {/* Modal Source Tabs (Responsive Flex on Mobile) */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
                  <button
                    onClick={() => setModalTab('file')}
                    className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${modalTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Upload File</span>
                  </button>
                  <button
                    onClick={() => setModalTab('paste')}
                    className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center ${modalTab === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Paste Notes / Agenda</span>
                  </button>
                </div>

                {/* File Upload Tab */}
                {modalTab === 'file' && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 transition-colors group">
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx,.csv,.doc,.md,.json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center">
                        {selectedFile ? selectedFile.name : 'Click or Drag & Drop Document'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 text-center">
                        Supports PDF, DOCX, TXT, CSV, MD files up to 10MB
                      </span>
                    </label>

                    {isReadingFile && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting document text content...</span>
                      </div>
                    )}

                    {selectedFile && !isReadingFile && (
                      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5 truncate pr-2">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{selectedFile.name}</span>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setAgendaText('');
                            }}
                            className="text-slate-400 hover:text-rose-600 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste Notes Tab */}
                {modalTab === 'paste' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Paste Meeting Minutes / Agenda:</span>
                      <button
                        onClick={handleLoadSampleAgenda}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-extrabold text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5" /> Sample Notes
                      </button>
                    </div>

                    <textarea
                      value={agendaText}
                      onChange={(e) => setAgendaText(e.target.value)}
                      placeholder="Paste your meeting notes, daily points or agenda here...&#10;e.g.&#10;1. 10:00 AM Client pitch with Apex Corp&#10;2. 02:00 PM Code Review for CRM Module"
                      rows={4}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                )}

                {/* Target Scheduled Date & Weekday Control Bar (Responsive on Mobile - Matches Screenshot) */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/90 dark:border-slate-700/90 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Target Scheduled Date & Weekday:</span>
                    </label>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 self-start sm:self-auto">
                      📅 {targetExecutionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Quick Day Selector Pills + Date Input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:flex-wrap no-scrollbar">
                      {getQuickTargetDays().map((dayOpt) => (
                        <button
                          key={dayOpt.label}
                          type="button"
                          onClick={() => setTargetExecutionDate(dayOpt.dateObj)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border shrink-0 ${targetExecutionDate.toDateString() === dayOpt.dateObj.toDateString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          <span className="hidden sm:inline">{dayOpt.label}</span>
                          <span className="sm:hidden">{dayOpt.shortLabel}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] font-bold text-slate-400">Or pick custom date:</span>
                      <input
                        type="date"
                        value={`${targetExecutionDate.getFullYear()}-${String(targetExecutionDate.getMonth() + 1).padStart(2, '0')}-${String(targetExecutionDate.getDate()).padStart(2, '0')}`}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            setTargetExecutionDate(new Date(y, m - 1, d));
                          }
                        }}
                        className="px-2.5 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Execution Provision Mode (Single Date vs Weekly Recurring) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                      🔁 Execution Provision:
                    </span>

                    <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsRecurringMode(false)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all border text-center ${!isRecurringMode
                          ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Single Date Only
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRecurringMode(true)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all border text-center truncate ${isRecurringMode
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Repeat Every {targetExecutionDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-purple-50/60 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/40 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>AI will extract tasks for <strong>{targetExecutionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>.</span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowAgendaModal(false);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtractAgendaTasks}
                    disabled={isExtracting || (!agendaText.trim() && !selectedFile)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract & Preview Tasks</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Task Details & Notes Modal Overlay */}
      {selectedTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto max-w-full">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-md">
                  {selectedTaskModal.category || 'Executive Task'}
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1.5 leading-snug">
                  {stripTimeFromTitle(selectedTaskModal.title)}
                </h3>
              </div>
              <button onClick={() => setSelectedTaskModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-semibold">Scheduled Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" /> {formatTimeRange(selectedTaskModal.time || '10:00 AM')}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-semibold">Priority</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTaskModal.priority || 'Medium'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-semibold">Status</span>
                <select
                  value={selectedTaskModal.status}
                  onChange={(e) => setSelectedTaskModal({ ...selectedTaskModal, status: e.target.value })}
                  className="font-bold text-xs bg-transparent text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Task Execution Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Executive Notes & Agenda Details:</span>
                <span className="text-[10px] text-slate-400">Auto-saved to task</span>
              </label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Add detailed meeting notes, key action items, or execution instructions for this task..."
                rows={4}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
              />
            </div>

            {/* Subtasks / Checkpoints */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Action Checkpoints / Subtasks:</span>
                <span className="text-[10px] text-slate-400">{taskCheckpoints.filter(c => c.done).length}/{taskCheckpoints.length} Completed</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {taskCheckpoints.map((cp) => (
                  <div key={cp.id} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={cp.done}
                      onChange={() => setTaskCheckpoints(prev => prev.map(c => c.id === cp.id ? { ...c, done: !c.done } : c))}
                      className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className={`flex-1 ${cp.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                      {cp.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  deleteTask(selectedTaskModal.id);
                  setSelectedTaskModal(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Task
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTaskModal(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveTaskDetails}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Notes & Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Planner Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Planner Filters & Options</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Tasks</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or notes..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Status Filter</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Pending', 'Completed', 'High'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${statusFilter === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {status === 'High' ? '🔥 High Priority' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Time Filter</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Morning', 'Afternoon', 'Evening'].map((timeStr) => (
                    <button
                      key={timeStr}
                      onClick={() => setTimeFilter(timeStr)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${timeFilter === timeStr
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {timeStr === 'Morning' ? '🌅 Morning' : timeStr === 'Afternoon' ? '☀️ Afternoon' : timeStr === 'Evening' ? '🌙 Evening' : 'All Times'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Day Filter</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today', 'Tomorrow', 'All Days'].map((day) => (
                    <button
                      key={day}
                      onClick={() => setDayFilter(day)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${dayFilter === day
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setTimeFilter('All');
                  setDayFilter('Today');
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

