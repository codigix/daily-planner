import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Apple,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Bell,
  BellRing,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  Droplet,
  Dumbbell,
  Moon,
  Info,
  Check,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Bookmark,
  Coffee,
  CheckSquare,
  Volume2,
  ShoppingCart,
  Copy,
  Send,
  CheckCheck,
  Search,
  BookOpen,
  Activity
} from 'lucide-react';
import {
  WEEKLY_DIET_PLAN,
  NEXT_DAY_PREP_CHECKLIST,
  DIET_IMPORT_NOTES
} from '../../data/weeklyDietData';
import {
  updateDietStatusAPI,
  syncDietToPlannerAPI
} from '../../services/api';
import { sendSystemNotification, requestNotificationPermission, showNotificationToast } from '../../utils/notificationService';
import { deduplicateTasks, deduplicateTimeline } from '../../utils/plannerDeduplication';
import NextDayIngredientsModal from './NextDayIngredientsModal';

// Audio chime helper using Web Audio API (smooth notification tone)
function playDietChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    // AudioContext might be blocked until user interacts
  }
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyDietManager({
  plannerTasks = [],
  setPlannerTasks,
  setScheduleTimeline,
  onOpenTaskModal
}) {
  // ── 1. IDENTIFY CURRENT DAY ──
  const realTodayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const [selectedDay, setSelectedDay] = useState(realTodayName);
  const [selectedMealForModal, setSelectedMealForModal] = useState(null);
  const [skipModalItem, setSkipModalItem] = useState(null);
  const [skipReason, setSkipReason] = useState('Eating Out');
  const [rescheduleModalItem, setRescheduleModalItem] = useState(null);
  const [rescheduleNewTime, setRescheduleNewTime] = useState('');
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  const [showNextDayModal, setShowNextDayModal] = useState(false);
  const [ingredientsModalMealId, setIngredientsModalMealId] = useState(null);
  const [ingredientsModalDay, setIngredientsModalDay] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [toastMessage, setToastMessage] = useState(null);
  const [activeInAppReminder, setActiveInAppReminder] = useState(null);

  // ── NEXT DAY INGREDIENTS PREPARATION CHECKLIST STATE ──
  // Key format: `${prepDay}` -> array of checked ingredient strings
  const [prepCheckedItems, setPrepCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('codigix_diet_prep_checklist_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('codigix_diet_prep_checklist_v1', JSON.stringify(prepCheckedItems));
    } catch (e) {
      console.warn('Failed to save prep checklist to localStorage:', e);
    }
  }, [prepCheckedItems]);

  const togglePrepItem = (prepDay, ingredient) => {
    setPrepCheckedItems(prev => {
      const currentList = prev[prepDay] || [];
      const exists = currentList.includes(ingredient);
      const updated = exists ? currentList.filter(i => i !== ingredient) : [...currentList, ingredient];
      return { ...prev, [prepDay]: updated };
    });
  };

  const resetPrepItems = (prepDay) => {
    setPrepCheckedItems(prev => ({ ...prev, [prepDay]: [] }));
    showToast(`Reset checklist for ${prepDay}`);
  };

  // ── PERSISTENT COMPLETION STATE ──
  // Key format: `${day}_${itemId}` -> { status: 'completed'|'skipped'|'rescheduled', skipReason, rescheduledTime, timestamp }
  const [completions, setCompletions] = useState(() => {
    try {
      const saved = localStorage.getItem('codigix_diet_completions_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Save to localStorage whenever completions change
  useEffect(() => {
    try {
      localStorage.setItem('codigix_diet_completions_v2', JSON.stringify(completions));
    } catch (e) {
      console.warn('Failed to save diet completions to localStorage:', e);
    }
  }, [completions]);

  // Request browser notification permission
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      playDietChime();
      sendSystemNotification('Diet & Task Notifications Active 🥗', {
        body: 'You will receive reminders before each and every task, plus 8:00 PM next-day grocery & prep alerts! Tap to open details.',
        tag: 'diet-welcome'
      });
      showToast('Notifications enabled successfully!');
    } else {
      alert('Notification permissions are required to receive lead-time alerts on your mobile phone.');
    }
  };

  // Immediate Test Notification & Phone Vibration
  const handleTestNotification = async () => {
    let granted = notificationPermissionGranted;
    if (!granted) {
      granted = await requestNotificationPermission();
      setNotificationPermissionGranted(granted);
    }
    const testItem = nextUpcomingDietItem || dayDietItems[0] || WEEKLY_DIET_PLAN[0];
    playDietChime();
    const testIngs = testItem.description ? testItem.description.split(';').map(s => s.trim()).filter(Boolean) : [];
    const testIngPreview = testIngs.length > 0 ? `\n🥗 Ingredients: ${testIngs.slice(0, 3).join(', ')}${testIngs.length > 3 ? '...' : ''}` : '';

    sendSystemNotification(testItem.taskTitle, {
      body: testItem.timeFormatted || testItem.time,
      mealId: testItem.id,
      day: testItem.day,
      tag: 'test-reminder-' + Date.now()
    });
    setActiveInAppReminder({ item: testItem, minutesLeft: 5 });
    showToast('Sent test notification! Tap it or the top banner to open details.');
  };

  // Instant trigger to send Next-Day Prep Alert to mobile phone
  const handleSendNextDayPrepNotification = async (targetPrep) => {
    let granted = notificationPermissionGranted;
    if (!granted) {
      granted = await requestNotificationPermission();
      setNotificationPermissionGranted(granted);
    }
    playDietChime();
    sendSystemNotification(`🛒 8:00 PM Prep: Tomorrow's Ingredients (${targetPrep.forNextDay})`, {
      body: `Pantry items needed for ${targetPrep.forNextDay}:\n${targetPrep.ingredients}\nTap to open detailed prep checklist.`,
      tag: `next-day-prep-${targetPrep.prepDay}`,
      type: 'nextDayPrep',
      prepDay: targetPrep.prepDay
    });
    showToast(`Sent ${targetPrep.forNextDay}'s ingredient prep alert to your phone!`);
  };

  // Copy grocery & ingredient prep checklist to clipboard (formatted for WhatsApp)
  const handleCopyPrepIngredients = (targetPrep) => {
    const items = targetPrep.ingredients.split(';').map(s => s.trim()).filter(Boolean);
    const checked = prepCheckedItems[targetPrep.prepDay] || [];
    const readyCount = checked.filter(c => items.includes(c)).length;

    const text = `🛒 *Next-Day Meal Prep & Grocery List (${targetPrep.forNextDay})*\n` +
      `📅 Preparation Day: ${targetPrep.prepDay} (8:00 PM Routine)\n` +
      `📊 Progress: ${readyCount}/${items.length} Ready\n\n` +
      `*Ingredients to Check & Soak:*\n` +
      items.map(item => `${checked.includes(item) ? '✅' : '⬜'} ${item}`).join('\n') +
      `\n\n_Generated from Daily Planner Weekly Diet Plan_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${targetPrep.forNextDay}'s ingredients checklist to clipboard for WhatsApp!`);
    }
  };

  // ── REAL-TIME MOBILE NOTIFICATION & REMINDER RUNNER ──
  // Checks scheduled meal times every 20 seconds.
  // Sends notification (with vibration & sound) 10 min before meals or 5 min before routine tasks, and at scheduled time.
  // Also triggers the official 8:00 PM Next Day Preparation & Ingredients alert.
  useEffect(() => {
    const firedReminders = new Set();

    const checkDietReminders = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const currentTotalMins = currentHours * 60 + currentMins;

      // Filter diet items for today
      const todayItems = WEEKLY_DIET_PLAN.filter(item => item.day === realTodayName);

      todayItems.forEach(item => {
        const key = `${realTodayName}_${item.id}`;
        // If already completed or skipped, skip reminder
        if (completions[key]?.status === 'completed' || completions[key]?.status === 'skipped') {
          return;
        }

        const [h, m] = item.time.split(':').map(Number);
        const itemTotalMins = h * 60 + m;
        const diff = itemTotalMins - currentTotalMins;

        const reminderLead = item.reminderMinutesBefore || 10;
        const reminderLeadKey = `${key}_lead_${reminderLead}`;
        const reminderExactKey = `${key}_exact`;

        // Extract ingredients list for notification preview
        const ingList = item.description ? item.description.split(';').map(s => s.trim()).filter(Boolean) : [];
        const ingPreview = ingList.length > 0 ? `\n🥗 Ingredients: ${ingList.slice(0, 3).join(', ')}${ingList.length > 3 ? '...' : ''}` : '';

        // 1. Lead-time reminder window (within reminderLead and reminderLead - 4 mins)
        // Strictly displays task heading only and time only
        const isLeadWindow = diff <= reminderLead && diff >= Math.max(1, reminderLead - 4);
        if (isLeadWindow && !firedReminders.has(reminderLeadKey)) {
          firedReminders.add(reminderLeadKey);
          sendSystemNotification(item.taskTitle, {
            body: item.timeFormatted || item.time,
            mealId: item.id,
            day: realTodayName,
            tag: `diet-lead-${item.id}`
          });
          setActiveInAppReminder({ item, minutesLeft: diff > 0 ? diff : reminderLead });
        }

        // 2. Exact-time reminder window (0 to -15 mins)
        // Strictly displays task heading only and time only
        const isExactWindow = diff <= 0 && diff >= -15;
        if (isExactWindow && !firedReminders.has(reminderExactKey)) {
          firedReminders.add(reminderExactKey);
          sendSystemNotification(item.taskTitle, {
            body: item.timeFormatted || item.time,
            mealId: item.id,
            day: realTodayName,
            tag: `diet-exact-${item.id}`
          });
          setActiveInAppReminder({ item, minutesLeft: 0 });
        }
      });

      // 3. Official 8:00 PM (20:00) Next Day Ingredients Prep Alert
      const todayPrep = NEXT_DAY_PREP_CHECKLIST[realTodayName];
      if (todayPrep) {
        const prepTotalMins = 20 * 60; // 20:00 = 1200 mins
        const prepDiff = prepTotalMins - currentTotalMins;
        const prepKey = `${realTodayName}_prep_2000`;
        const isPrepWindow = prepDiff <= 0 && prepDiff >= -25;

        if (isPrepWindow && !firedReminders.has(prepKey)) {
          firedReminders.add(prepKey);
          sendSystemNotification(`🛒 8:00 PM: Prepare Tomorrow's Ingredients (${todayPrep.forNextDay})!`, {
            body: `Pantry checklist for ${todayPrep.forNextDay}:\n${todayPrep.ingredients.slice(0, 110)}...\nTap to check off ready items!`,
            tag: `diet-prep-${realTodayName}`,
            type: 'nextDayPrep',
            prepDay: realTodayName
          });
        }
      }
    };

    checkDietReminders();
    const interval = setInterval(checkDietReminders, 20000);
    return () => clearInterval(interval);
  }, [realTodayName, completions]);

  // ── DEEP LINK & NOTIFICATION TAP TO OPEN DETAILED POPUP ──
  useEffect(() => {
    // 1. Check URL parameters (?openDietMealId=...&openDay=... or ?openNextDayPrep=1)
    const params = new URLSearchParams(window.location.search);
    const openDietMealId = params.get('openDietMealId');
    const openDay = params.get('openDay');
    const openNextDayPrep = params.get('openNextDayPrep');

    if (openNextDayPrep) {
      setShowNextDayModal(true);
    }

    if (openDietMealId) {
      if (openDay && openDay !== selectedDay) {
        setSelectedDay(openDay);
      }
      const targetMeal = WEEKLY_DIET_PLAN.find(m => String(m.id) === String(openDietMealId));
      if (targetMeal) {
        setSelectedMealForModal(targetMeal);
      }
    }

    // 2. Listen to postMessage from Service Worker when user taps the notification on their mobile phone
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_TASK_CLICKED') {
        const { mealId, day, type } = event.data;
        if (type === 'nextDayPrep') {
          setShowNextDayModal(true);
        } else if (mealId) {
          if (day) setSelectedDay(day);
          const targetMeal = WEEKLY_DIET_PLAN.find(m => String(m.id) === String(mealId));
          if (targetMeal) {
            setSelectedMealForModal(targetMeal);
          }
        }
      }
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [selectedDay]);

  const showToast = (msg, type = 'success') => {
    showNotificationToast({
      title: msg,
      type,
      duration: 3500
    });
  };

  // ── 2. LOAD TODAY'S DIET ITEMS ──
  const dayDietItems = useMemo(() => {
    return WEEKLY_DIET_PLAN.filter(item => item.day === selectedDay);
  }, [selectedDay]);

  // ── FILTER & SEARCH STATE FOR DIET ITEMS ──
  const [dietFilter, setDietFilter] = useState('All');
  const [dietSearchQuery, setDietSearchQuery] = useState('');

  // ── FILTERED DIET ITEMS & FILTER COUNTS ──
  const dietFilterCounts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let meals = 0;
    let snacks = 0;
    let routine = 0;

    dayDietItems.forEach(item => {
      const isDone = completions[`${selectedDay}_${item.id}`]?.status === 'completed';
      if (isDone) completed++;
      else pending++;

      if (['Breakfast', 'Lunch', 'Dinner'].includes(item.category)) meals++;
      else if (['Snack', 'Nutrition', 'Hydration'].includes(item.category)) snacks++;
      else if (['Health', 'Exercise', 'Routine', 'Sleep', 'Preparation'].includes(item.category)) routine++;
    });

    return {
      all: dayDietItems.length,
      pending,
      completed,
      meals,
      snacks,
      routine
    };
  }, [dayDietItems, completions, selectedDay]);

  const filteredDietItems = useMemo(() => {
    return dayDietItems.filter(item => {
      if (dietSearchQuery.trim()) {
        const q = dietSearchQuery.toLowerCase();
        const matchTitle = item.taskTitle && item.taskTitle.toLowerCase().includes(q);
        const matchDesc = item.description && item.description.toLowerCase().includes(q);
        const matchCat = item.category && item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      const key = `${selectedDay}_${item.id}`;
      const state = completions[key] || {};
      const isDone = state.status === 'completed';

      if (dietFilter === 'Pending') return !isDone;
      if (dietFilter === 'Completed') return isDone;
      if (dietFilter === 'Meals') return ['Breakfast', 'Lunch', 'Dinner'].includes(item.category);
      if (dietFilter === 'Snacks') return ['Snack', 'Nutrition', 'Hydration'].includes(item.category);
      if (dietFilter === 'Routine') return ['Health', 'Exercise', 'Routine', 'Sleep', 'Preparation'].includes(item.category);

      return true;
    });
  }, [dayDietItems, dietFilter, dietSearchQuery, completions, selectedDay]);

  // Weekday dates map for current week (Monday to Sunday)
  const weekDayDates = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - distanceToMonday);

    const map = {};
    DAYS_OF_WEEK.forEach((dayName, idx) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      map[dayName] = {
        dateNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        dateStr: d.toDateString()
      };
    });
    return map;
  }, []);

  // ── 8. CALCULATE DAILY HEALTH SCORE ──
  // Score formula:
  // Meals (Breakfast, Lunch, Dinner): up to 40 pts
  // Hydration & Detox: up to 20 pts
  // Exercise & Physical Activity: up to 20 pts
  // Routine & Rest (No food after 6 PM, Sleep, Wind Down): up to 20 pts
  const dailyHealthScore = useMemo(() => {
    let score = 0;
    const requiredItems = dayDietItems.filter(i => i.completionRequired);
    if (requiredItems.length === 0) return 100;

    let mealTotal = 0;
    let mealDone = 0;
    let hydroTotal = 0;
    let hydroDone = 0;
    let exerTotal = 0;
    let exerDone = 0;
    let routineTotal = 0;
    let routineDone = 0;

    dayDietItems.forEach(item => {
      const state = completions[`${selectedDay}_${item.id}`];
      const isDone = state && state.status === 'completed';

      if (['Breakfast', 'Lunch', 'Dinner'].includes(item.category)) {
        mealTotal += 1;
        if (isDone) mealDone += 1;
      } else if (['Hydration', 'Nutrition'].includes(item.category) && (item.taskTitle.toLowerCase().includes('water') || item.taskTitle.toLowerCase().includes('drink') || item.category === 'Hydration')) {
        hydroTotal += 1;
        if (isDone) hydroDone += 1;
      } else if (item.category === 'Exercise') {
        exerTotal += 1;
        if (isDone) exerDone += 1;
      } else {
        routineTotal += 1;
        if (isDone) routineDone += 1;
      }
    });

    const mealPts = mealTotal > 0 ? (mealDone / mealTotal) * 40 : 40;
    const hydroPts = hydroTotal > 0 ? (hydroDone / hydroTotal) * 20 : 20;
    const exerPts = exerTotal > 0 ? (exerDone / exerTotal) * 20 : 20;
    const routinePts = routineTotal > 0 ? (routineDone / routineTotal) * 20 : 20;

    score = Math.round(mealPts + hydroPts + exerPts + routinePts);
    return Math.min(100, Math.max(0, score));
  }, [dayDietItems, completions, selectedDay]);

  // ── 9. CALCULATE WEEKLY PROGRESS ──
  const weeklyProgress = useMemo(() => {
    const daysData = DAYS_OF_WEEK.map(day => {
      const itemsForDay = WEEKLY_DIET_PLAN.filter(i => i.day === day && i.completionRequired);
      const doneCount = itemsForDay.filter(i => {
        const state = completions[`${day}_${i.id}`];
        return state && state.status === 'completed';
      }).length;
      const rate = itemsForDay.length > 0 ? Math.round((doneCount / itemsForDay.length) * 100) : 0;
      return {
        day,
        total: itemsForDay.length,
        done: doneCount,
        rate
      };
    });

    const totalRequired = daysData.reduce((acc, d) => acc + d.total, 0);
    const totalDone = daysData.reduce((acc, d) => acc + d.done, 0);
    const overallRate = totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;

    // Consecutive streak calculation
    let streak = 0;
    const dayIndexMap = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
    const todayIdx = dayIndexMap[realTodayName] || 0;
    for (let i = todayIdx; i >= 0; i--) {
      if (daysData[i].done > 0) {
        streak += 1;
      } else {
        break;
      }
    }

    return {
      daysData,
      overallRate,
      streak,
      totalDone,
      totalRequired
    };
  }, [completions, realTodayName]);

  // ── 5. SCHEDULE & NEXT UPCOMING MEAL TICKER ──
  const nextUpcomingDietItem = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const todayItems = WEEKLY_DIET_PLAN.filter(i => i.day === realTodayName);
    let nextItem = null;
    let minDiff = Infinity;

    todayItems.forEach(item => {
      const [h, m] = item.time.split(':').map(Number);
      const itemMins = h * 60 + m;
      const diff = itemMins - currentMins;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextItem = { ...item, diffMins: diff };
      }
    });

    return nextItem;
  }, [realTodayName]);

  // ── 4. GENERATE DAILY PLANNER TASKS ──
  const handleSyncToPlanner = async () => {
    setIsSyncing(true);
    try {
      const todayDateStr = new Date().toDateString();
      const res = await syncDietToPlannerAPI(dayDietItems, todayDateStr, selectedDay);

      if (res && res.tasks) {
        const normalizeTitle = s => (s || '').trim().toLowerCase().replace(/\[🥗\s*diet\]\s*/i, '');
        const syncedTitles = new Set(res.tasks.map(t => normalizeTitle(t.title)));
        const syncedIds = new Set(res.tasks.map(t => t.id));

        // Update plannerTasks: remove any previous duplicate entries for this day and insert updated tasks
        setPlannerTasks(prev => {
          const filtered = prev.filter(t => {
            if (syncedIds.has(t.id)) return false;
            const isDiet = (t.title && t.title.includes('[🥗 Diet]')) || String(t.id).startsWith('diet_');
            if (isDiet && (t.targetDay === selectedDay || t.date === todayDateStr)) {
              if (syncedTitles.has(normalizeTitle(t.title))) return false;
            }
            return true;
          });
          return deduplicateTasks([...res.tasks, ...filtered]);
        });

        if (setScheduleTimeline && res.timeline) {
          const syncedTlIds = new Set(res.timeline.map(tl => tl.id));
          const syncedTlTitles = new Set(res.timeline.map(tl => tl.title.trim().toLowerCase()));

          setScheduleTimeline(prev => {
            const filteredTl = prev.filter(tl => {
              if (syncedTlIds.has(tl.id)) return false;
              if (String(tl.id).startsWith('diet_tl_') && tl.date === todayDateStr) {
                if (syncedTlTitles.has(tl.title.trim().toLowerCase())) return false;
              }
              return true;
            });
            return deduplicateTimeline([...res.timeline, ...filteredTl]);
          });
        }

        showToast(`🎉 Updated ${res.tasks.length} Diet Tasks for ${selectedDay} (Zero Duplicates)!`);
      } else {
        showToast(`✅ Synced Diet Tasks for ${selectedDay}!`);
      }
    } catch (err) {
      console.warn('Sync error:', err);
      showToast('Synced to local state!');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── 7. USER COMPLETES / SKIPS / RESCHEDULES ──
  const handleComplete = async (item) => {
    const key = `${selectedDay}_${item.id}`;
    const isAlreadyDone = completions[key]?.status === 'completed';
    const newStatus = isAlreadyDone ? 'pending' : 'completed';

    const newCompletions = {
      ...completions,
      [key]: {
        taskId: item.id,
        day: selectedDay,
        status: newStatus,
        timestamp: new Date().toISOString()
      }
    };
    setCompletions(newCompletions);

    if (newStatus === 'completed') {
      playDietChime();
      showToast(`✨ Completed: ${item.taskTitle}! +Health Score`);
    }

    // Sync status to backend
    updateDietStatusAPI({
      taskId: item.id,
      day: selectedDay,
      status: newStatus,
      timestamp: new Date().toISOString()
    }).catch(() => {});
  };

  const handleOpenSkipModal = (item) => {
    setSkipModalItem(item);
    setSkipReason('Eating Out');
  };

  const handleConfirmSkip = () => {
    if (!skipModalItem) return;
    const key = `${selectedDay}_${skipModalItem.id}`;
    const newCompletions = {
      ...completions,
      [key]: {
        taskId: skipModalItem.id,
        day: selectedDay,
        status: 'skipped',
        skipReason,
        timestamp: new Date().toISOString()
      }
    };
    setCompletions(newCompletions);
    updateDietStatusAPI({
      taskId: skipModalItem.id,
      day: selectedDay,
      status: 'skipped',
      skipReason,
      timestamp: new Date().toISOString()
    }).catch(() => {});

    showToast(`Skipped: ${skipModalItem.taskTitle} (${skipReason})`);
    setSkipModalItem(null);
  };

  const handleOpenRescheduleModal = (item) => {
    setRescheduleModalItem(item);
    setRescheduleNewTime(item.timeFormatted || item.time);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleModalItem) return;
    const key = `${selectedDay}_${rescheduleModalItem.id}`;
    const newCompletions = {
      ...completions,
      [key]: {
        taskId: rescheduleModalItem.id,
        day: selectedDay,
        status: 'rescheduled',
        rescheduledTime: rescheduleNewTime,
        timestamp: new Date().toISOString()
      }
    };
    setCompletions(newCompletions);
    updateDietStatusAPI({
      taskId: rescheduleModalItem.id,
      day: selectedDay,
      status: 'rescheduled',
      rescheduledTime: rescheduleNewTime,
      timestamp: new Date().toISOString()
    }).catch(() => {});

    showToast(`Rescheduled to ${rescheduleNewTime}`);
    setRescheduleModalItem(null);
  };

  // Helper for category styling & badges
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'Breakfast':
        return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: '🍳' };
      case 'Lunch':
        return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: '🍱' };
      case 'Dinner':
        return { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', icon: '🥗' };
      case 'Nutrition':
        return { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', icon: '🌱' };
      case 'Hydration':
        return { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', icon: '💧' };
      case 'Exercise':
        return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', icon: '🏃' };
      case 'Snack':
        return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: '🍎' };
      case 'Preparation':
        return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: '🛒' };
      case 'Sleep':
        return { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', icon: '😴' };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', icon: '⚡' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-28 sm:pb-10">


      {/* ── ACTIVE IN-APP MOBILE REMINDER POPUP BANNER ── */}
      {activeInAppReminder && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 border border-amber-300/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0 animate-bounce">⏰</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                  {activeInAppReminder.minutesLeft > 0 ? `In ${activeInAppReminder.minutesLeft}m` : 'RIGHT NOW'}
                </span>
                <span className="text-xs sm:text-sm font-black truncate">{activeInAppReminder.item.taskTitle}</span>
              </div>
              <p className="text-[11px] text-amber-100 truncate mt-0.5 font-medium">
                {activeInAppReminder.item.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setSelectedMealForModal(activeInAppReminder.item);
                setActiveInAppReminder(null);
              }}
              className="px-3 py-1.5 bg-white text-orange-950 rounded-xl text-xs font-black shadow-md hover:bg-amber-50 cursor-pointer active:scale-95"
            >
              Open Details 🔍
            </button>
            <button
              onClick={() => setActiveInAppReminder(null)}
              className="p-1 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── TOP HERO BANNER: Clean, Responsive PWA Header ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 text-white p-4 sm:p-6 shadow-xl shadow-emerald-950/15 border border-emerald-400/20">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-36 h-36 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Column: Title, Next Meal, Progress */}
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Utensils className="w-3 h-3 text-amber-300" />
                WEEKLY DIET & HEALTH PLAN
              </span>
              {realTodayName === selectedDay ? (
                <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black rounded-full text-[10px] flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-950" />
                  ACTIVE TODAY
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-400/30 rounded-full text-[10px] font-bold text-emerald-100">
                  {selectedDay} Schedule
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                {selectedDay}'s Nutrition & Routine
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-0.5">
                Calibrated meal timings, targeted ingredient prep & wellness tracking.
              </p>
            </div>

            {/* Next Meal & Daily Progress Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              {nextUpcomingDietItem && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 backdrop-blur-md rounded-xl text-xs font-bold text-emerald-100 border border-emerald-400/30 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
                  <span className="text-white/80">Next:</span>
                  <span className="text-white font-black truncate max-w-[160px] sm:max-w-[200px]">{nextUpcomingDietItem.taskTitle}</span>
                  <span className="text-amber-300 font-extrabold shrink-0">({nextUpcomingDietItem.diffMins}m)</span>
                </div>
              )}

              {/* Progress counter */}
              <div className="flex-1 bg-emerald-950/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-emerald-400/20 flex items-center justify-between gap-2 text-xs">
                <span className="text-emerald-100 font-bold truncate">
                  Completed: <span className="font-black text-white">{dayDietItems.filter(i => completions[`${selectedDay}_${i.id}`]?.status === 'completed').length}</span> of {dayDietItems.length}
                </span>
                <span className="font-black text-amber-300 shrink-0">
                  {dayDietItems.length > 0 ? Math.round((dayDietItems.filter(i => completions[`${selectedDay}_${i.id}`]?.status === 'completed').length / dayDietItems.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Health Score & Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0">
            {/* Health Score Pill */}
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3 sm:px-4 sm:py-2.5 flex items-center justify-between sm:justify-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                  Daily Health Score
                </div>
                <div className="text-[11px] text-white/80 font-semibold">
                  Nutritional Adherence
                </div>
              </div>
              <div className="px-3 py-1 bg-white text-emerald-950 rounded-xl text-lg sm:text-xl font-black shadow-md flex items-center gap-1">
                <span>{dailyHealthScore}</span>
                <span className="text-xs text-emerald-700 font-extrabold">/100</span>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setIngredientsModalDay(selectedDay);
                  setIngredientsModalMealId(null);
                  setShowNextDayModal(true);
                }}
                className="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">Ingredients Prep</span>
              </button>

              <button
                onClick={handleSyncToPlanner}
                disabled={isSyncing}
                className="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 text-white border border-emerald-400/40 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="whitespace-nowrap">{isSyncing ? 'Syncing...' : 'Sync Tasks'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. 7-DAY NAVIGATION: Responsive Grid with Dates & Status ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1.5 sm:p-2 rounded-2xl shadow-xs">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {DAYS_OF_WEEK.map(day => {
            const isSelected = selectedDay === day;
            const isToday = realTodayName === day;
            const dayItems = WEEKLY_DIET_PLAN.filter(i => i.day === day && i.completionRequired);
            const doneItems = dayItems.filter(i => completions[`${day}_${i.id}`]?.status === 'completed').length;
            const isAllDone = dayItems.length > 0 && doneItems === dayItems.length;
            const dateInfo = weekDayDates[day];

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[48px] sm:min-h-[58px] active:scale-95 relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-[10px] sm:text-xs font-black truncate">{day.slice(0, 3)}</span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-300' : 'bg-emerald-500 animate-pulse'}`} />
                  )}
                </div>

                {dateInfo && (
                  <span className={`text-[9px] sm:text-[10px] font-extrabold truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {dateInfo.monthNum}/{dateInfo.dateNum}
                  </span>
                )}

                <div className="text-[8px] sm:text-[9px] mt-0.5">
                  {isAllDone ? (
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300 mx-auto" />
                  ) : (
                    <span className={`truncate ${isSelected ? 'text-emerald-100 font-black' : 'text-slate-400 font-extrabold'}`}>
                      {doneItems}/{dayItems.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 9. WEEKLY PROGRESS & PREPARATION (Compact 3-Pill Bar on Mobile) ── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Compliance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Compliance</span>
          </div>
          <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {weeklyProgress.overallRate}%
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <span>🔥</span>
            <span className="truncate">Streak</span>
          </div>
          <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {weeklyProgress.streak} Days
          </div>
        </div>

        {/* 8 PM Prep Drawer Trigger */}
        <button
          onClick={() => setShowPrepChecklist(!showPrepChecklist)}
          className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center flex flex-col justify-center cursor-pointer transition-all active:scale-95"
        >
          <div className="text-[10px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center justify-center gap-1">
            <span>🛒</span>
            <span className="truncate">8 PM Prep</span>
          </div>
          <div className="text-xs font-black text-purple-950 dark:text-purple-100 mt-0.5 truncate">
            {showPrepChecklist ? 'Hide' : 'Checklist'}
          </div>
        </button>
      </div>

      {/* Expandable Next Day Prep Drawer with Interactive Checklist */}
      {showPrepChecklist && NEXT_DAY_PREP_CHECKLIST[selectedDay] && (() => {
        const prepData = NEXT_DAY_PREP_CHECKLIST[selectedDay];
        const items = prepData.ingredients.split(';').map(s => s.trim()).filter(Boolean);
        const checkedList = prepCheckedItems[selectedDay] || [];
        const readyCount = checkedList.filter(c => items.includes(c)).length;
        const progressPct = Math.round((readyCount / items.length) * 100);

        return (
          <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 dark:border-purple-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-purple-950 dark:text-purple-200">
                      {selectedDay} 8:00 PM Checklist for {prepData.forNextDay}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200/70 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                      {readyCount}/{items.length} Ready ({progressPct}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                    Tap any item to check off what you have in your fridge or bought for tomorrow.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                <button
                  onClick={() => handleSendNextDayPrepNotification(prepData)}
                  title="Send instant alert to phone"
                  className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Send Alert</span>
                </button>
                <button
                  onClick={() => handleCopyPrepIngredients(prepData)}
                  title="Copy formatted list for WhatsApp"
                  className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowNextDayModal(true)}
                  title="Open full screen modal"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Detailed Modal</span>
                </button>
                <button
                  onClick={() => setShowPrepChecklist(false)}
                  className="p-1.5 text-purple-400 hover:text-purple-700 cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Checklist Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {items.map((ing, i) => {
                const isChecked = checkedList.includes(ing);
                return (
                  <button
                    key={i}
                    onClick={() => togglePrepItem(selectedDay, ing)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                      isChecked
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 line-through opacity-85'
                        : 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/80 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                      isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span>{ing}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── 2 & 5. DIET ITEMS LIST WITH FILTERING, SEARCH & ZERO-DUPLICATION CARDS ── */}
      <div className="space-y-3.5">
        {/* Header Row: Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
              {selectedDay}'s Scheduled Diet Items ({dayDietItems.length})
            </h3>
            <span className="text-[11px] font-bold text-slate-400">• Chronological Flow</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-extrabold">
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
              {dayDietItems.filter(i => completions[`${selectedDay}_${i.id}`]?.status === 'completed').length} of {dayDietItems.length} Done
            </span>
          </div>
        </div>

        {/* Quick Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'All', label: 'All Items', count: dietFilterCounts.all },
              { id: 'Meals', label: '🍽️ Meals', count: dietFilterCounts.meals },
              { id: 'Snacks', label: '🍎 Snacks & Drinks', count: dietFilterCounts.snacks },
              { id: 'Routine', label: '🧘 Routine', count: dietFilterCounts.routine },
              { id: 'Pending', label: '⏳ Pending', count: dietFilterCounts.pending },
              { id: 'Completed', label: '✅ Done', count: dietFilterCounts.completed }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDietFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
                  dietFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  dietFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[210px] shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={dietSearchQuery}
              onChange={(e) => setDietSearchQuery(e.target.value)}
              placeholder="Search meal or ingredient..."
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {dietSearchQuery && (
              <button
                onClick={() => setDietSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Diet Cards Grid */}
        {filteredDietItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDietItems.map((item) => {
              const state = completions[`${selectedDay}_${item.id}`] || {};
              const isCompleted = state.status === 'completed';
              const isSkipped = state.status === 'skipped';
              const isRescheduled = state.status === 'rescheduled';
              const theme = getCategoryTheme(item.category);
              const isFoodItem = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Nutrition', 'Hydration'].includes(item.category);
              const itemsList = item.description ? item.description.split(';').map(s => s.trim()).filter(Boolean) : [];

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 relative ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                      : isSkipped
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Time Badge + Rescheduled + Category Badge + Lead Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base">{theme.icon}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{isRescheduled && state.rescheduledTime ? state.rescheduledTime : item.timeFormatted}</span>
                        </span>
                        {isRescheduled && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded text-[9px] font-black">
                            Rescheduled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${theme.bg} ${theme.text} ${theme.border}`}>
                          {item.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9px] font-bold flex items-center gap-0.5">
                          <Bell className="w-2.5 h-2.5" />
                          {item.reminderMinutesBefore}m
                        </span>
                      </div>
                    </div>

                    {/* Title & Clickable Recipe Modal Trigger */}
                    <div
                      onClick={() => setSelectedMealForModal(item)}
                      className="cursor-pointer group"
                    >
                      <h4 className={`text-sm sm:text-base font-black leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${
                        isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                      }`}>
                        {item.taskTitle}
                      </h4>

                      {/* Instructions / Preparation hint if available */}
                      {item.instructions && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium line-clamp-1 italic">
                          💡 {item.instructions}
                        </p>
                      )}
                    </div>

                    {/* Clean Ingredients or Routine Steps Badge List (No Duplicate Raw Text!) */}
                    {itemsList.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isFoodItem ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-700 dark:text-indigo-400'
                          }`}>
                            {isFoodItem ? <Utensils className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                            <span>{isFoodItem ? `Ingredients (${itemsList.length})` : `Activity Steps (${itemsList.length})`}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">Tap recipe for details</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {itemsList.slice(0, 6).map((step, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                isFoodItem
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60'
                                  : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60'
                              }`}
                            >
                              {step}
                            </span>
                          ))}
                          {itemsList.length > 6 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMealForModal(item);
                              }}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            >
                              +{itemsList.length - 6} more
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skip Reason Badge if skipped */}
                    {isSkipped && (
                      <div className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Skipped: {state.skipReason || 'Eating out'}</span>
                      </div>
                    )}
                  </div>

                  {/* Clean Bottom Action Strip */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setSelectedMealForModal(item)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">{isFoodItem ? 'Recipe & Prep' : 'Full Guide'}</span>
                      <span className="sm:hidden">{isFoodItem ? 'Recipe' : 'Guide'}</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>

                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenRescheduleModal(item)}
                        title="Reschedule time"
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer active:scale-90"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenSkipModal(item)}
                        title="Skip meal / routine"
                        className="px-2 py-1 min-h-[28px] sm:min-h-[32px] rounded-xl text-xs font-bold text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer active:scale-90 flex items-center"
                      >
                        Skip
                      </button>

                      <button
                        onClick={() => handleComplete(item)}
                        className={`px-2.5 sm:px-3 py-1.5 min-h-[32px] rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${isCompleted ? 'stroke-[3]' : ''}`} />
                        <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center p-6 space-y-2">
            <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No diet items found</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              {dietSearchQuery ? `No matches found for "${dietSearchQuery}". Try clearing search.` : `No items in this category.`}
            </p>
            {(dietSearchQuery || dietFilter !== 'All') && (
              <button
                onClick={() => {
                  setDietSearchQuery('');
                  setDietFilter('All');
                }}
                className="mt-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 5. INGREDIENTS & INSTRUCTIONS MODAL (Native Mobile Bottom Sheet on small screens) ── */}
      {selectedMealForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setSelectedMealForModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getCategoryTheme(selectedMealForModal.category).icon}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {selectedMealForModal.taskTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                    <span>{selectedMealForModal.day}</span>
                    <span>•</span>
                    <span>{selectedMealForModal.timeFormatted}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedMealForModal.category}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMealForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingredients Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                Ingredients & Quantities
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 space-y-1.5 border border-slate-100 dark:border-slate-700/80">
                {selectedMealForModal.description.split(';').map((ing, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{ing.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Instructions */}
            {selectedMealForModal.instructions && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  Preparation Instructions
                </h4>
                <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed border border-blue-100 dark:border-blue-900/50">
                  {selectedMealForModal.instructions}
                </div>
              </div>
            )}

            {/* Next Day Prep Reminder if applicable */}
            {selectedMealForModal.nextDayPrepReminder && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Bookmark className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Evening Prep Note:</span>
                  <span>{selectedMealForModal.nextDayPrepReminder}</span>
                </div>
              </div>
            )}

            {/* Notification details */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
              <span>🔔 Reminder: {selectedMealForModal.reminderMinutesBefore}m before</span>
              <span>🏷️ {selectedMealForModal.tags.join(', ')}</span>
            </div>

            {/* Modal Actions: Responsive thumb-friendly row */}
            <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedMealForModal(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-center min-h-[44px]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleComplete(selectedMealForModal);
                  setSelectedMealForModal(null);
                }}
                className="flex-2 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Mark as Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SKIP REASON MODAL (Native Mobile Bottom Sheet) ── */}
      {skipModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setSkipModalItem(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Skip {skipModalItem.taskTitle}?
              </h3>
              <button
                onClick={() => setSkipModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please choose a reason so your health and adherence analytics remain accurate:
            </p>

            <div className="space-y-2">
              {['Eating Out', 'Intermittent Fasting', 'Travelling / Meeting', 'Not Hungry / Full', 'Dietary Substitution'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setSkipReason(reason)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[42px] flex items-center justify-between active:scale-98 ${
                    skipReason === reason
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{reason}</span>
                  {skipReason === reason && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSkipModalItem(null)}
                className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-center min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer text-center min-h-[44px] active:scale-95"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. RESCHEDULE TIME MODAL (Native Mobile Bottom Sheet) ── */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setRescheduleModalItem(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            {/* Mobile Drag Indicator Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Reschedule {rescheduleModalItem.taskTitle}
              </h3>
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a new time for this meal or routine item:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['+15 min', '+30 min', '+1 hour'].map(shift => (
                <button
                  key={shift}
                  onClick={() => {
                    const [h, m] = rescheduleModalItem.time.split(':').map(Number);
                    const shiftMins = shift === '+15 min' ? 15 : shift === '+30 min' ? 30 : 60;
                    const newTotal = (h * 60 + m + shiftMins) % 1440;
                    const newH = Math.floor(newTotal / 60);
                    const newM = newTotal % 60;
                    const period = newH >= 12 ? 'PM' : 'AM';
                    const displayH = newH % 12 || 12;
                    const formatted = `${displayH < 10 ? '0' : ''}${displayH}:${newM < 10 ? '0' : ''}${newM} ${period}`;
                    setRescheduleNewTime(formatted);
                  }}
                  className="px-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-center min-h-[40px] active:scale-95"
                >
                  {shift}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Custom Time String</label>
              <input
                type="text"
                value={rescheduleNewTime}
                onChange={(e) => setRescheduleNewTime(e.target.value)}
                placeholder="e.g. 01:30 PM"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-center min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer text-center min-h-[44px] active:scale-95"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. NEXT DAY INGREDIENTS & 8:00 PM PREPARATION MODAL (With Weights & Quantities) ── */}
      <NextDayIngredientsModal
        isOpen={showNextDayModal}
        onClose={() => {
          setShowNextDayModal(false);
          setIngredientsModalMealId(null);
        }}
        initialTargetDay={ingredientsModalDay || selectedDay}
        initialMealId={ingredientsModalMealId}
      />
    </div>
  );
}
