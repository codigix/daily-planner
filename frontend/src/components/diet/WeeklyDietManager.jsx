import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  RotateCw,
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
  Activity,
  MoreVertical
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
import {
  sendSystemNotification,
  requestNotificationPermission,
  showNotificationToast,
  openWhatsAppAlert,
  checkNotificationSupport
} from '../../utils/notificationService';
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

function SwipeableDietCard({ item, state, theme, onToggleDone, onOpenModal }) {
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const touchStartRef = React.useRef({ x: 0, y: 0 });
  const touchDirectionRef = React.useRef(null);

  const isCompleted = state.status === 'completed';
  const isRescheduled = state.status === 'rescheduled';

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchDirectionRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const diffX = e.touches[0].clientX - touchStartRef.current.x;
    const diffY = e.touches[0].clientY - touchStartRef.current.y;

    if (!touchDirectionRef.current) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        touchDirectionRef.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
      }
    }

    if (touchDirectionRef.current === 'horizontal') {
      let currentX = diffX;
      if (Math.abs(diffX) > 70) {
        currentX = Math.sign(diffX) * (70 + (Math.abs(diffX) - 70) * 0.35);
      }
      setDragOffset(Math.max(-130, Math.min(130, currentX)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (touchDirectionRef.current === 'horizontal') {
      if (dragOffset < -55) {
        if (!isCompleted) {
          setIsExiting(true);
          setTimeout(() => {
            onToggleDone(item);
            setIsExiting(false);
          }, 300);
        } else {
          onToggleDone(item);
        }
      } else if (dragOffset > 55) {
        onOpenModal(item);
      }
    }
    setDragOffset(0);
  };

  const isLeftSwiping = dragOffset < -8;
  const isRightSwiping = dragOffset > 8;

  const formatTimeOnly = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.split('-')[0].trim();
  };

  const dotColor = theme.bg ? theme.bg.split(' ')[0].replace('-50', '-500') : 'bg-slate-500';

  return (
    <>
      {/* ── MOBILE VIEW: Swipeable Timeline Card ── */}
      <div className={`sm:hidden flex gap-3 w-full transition-all duration-300 relative ${isExiting ? 'opacity-0 !max-h-0 !p-0 !m-0 !border-0' : 'max-h-[800px] opacity-100'}`}>
        {/* Left Timeline Column */}
        <div className="w-16 shrink-0 relative flex flex-col items-end pt-3">
          <div className="text-[10px] font-black text-slate-800 dark:text-slate-200 text-right w-full pr-3">
            {formatTimeOnly(item.timeFormatted) || '12:00 PM'}
          </div>
          <div className={`w-2.5 h-2.5 rounded-full absolute top-[15px] right-0 translate-x-[4.5px] z-10 ${dotColor}`} />
          <div className="w-px bg-slate-200 dark:bg-slate-700/60 absolute top-[20px] bottom-[-20px] right-0 translate-x-[4px]" />
        </div>

        {/* Right Swipeable Card Wrapper */}
        <div className="flex-1 relative overflow-hidden rounded-xl select-none touch-pan-y transition-all">
           {/* Background Revealed Action: Right Swipe -> Details (Blue) */}
           <div className={`absolute inset-y-0 left-0 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-start pl-4 gap-2.5 transition-opacity ${isRightSwiping ? 'opacity-100' : 'opacity-0'}`}>
             <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
               <BookOpen className="w-4 h-4 text-white" />
             </div>
           </div>
     
           {/* Background Revealed Action: Left Swipe -> Toggle Done (Emerald) */}
           <div className={`absolute inset-y-0 right-0 w-full rounded-xl flex items-center justify-end pr-4 gap-2.5 transition-opacity ${isLeftSwiping ? 'opacity-100' : 'opacity-0'} ${isCompleted ? 'bg-amber-500' : 'bg-emerald-500'}`}>
             <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
               {isCompleted ? <RotateCcw className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
             </div>
           </div>
     
           {/* Main Foreground Card */}
           <div
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             style={{ transform: `translateX(${dragOffset}px)` }}
             className={`relative p-3 rounded-xl border flex gap-3 transition-all duration-200 cursor-pointer active:scale-[0.99] bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md ${isCompleted ? 'opacity-65 bg-slate-50 dark:bg-slate-900/40' : ''}`}
             onClick={() => onOpenModal(item)}
           >
             {/* Card Icon */}
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.bg} ${theme.text}`}>
               {theme.icon}
             </div>

             {/* Main Card Content */}
             <div className="flex-1 min-w-0 flex flex-col justify-center">
               <h4 className={`text-[14px] font-extrabold leading-tight break-words ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                 {item.taskTitle}
               </h4>
               
               {/* Instructions */}
               {item.instructions && !isCompleted && (
                 <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                   💡 {item.instructions}
                 </p>
               )}

               <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                 <span className={`px-2 py-0.5 rounded-md-lg text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                   {item.category}
                 </span>
                 {item.reminderMinutesBefore && (
                   <span className="flex items-center gap-1 px-2 py-0.5 rounded-md-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                     <Bell className="w-3 h-3" /> {item.reminderMinutesBefore}m
                   </span>
                 )}
               </div>

               <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-slate-500">
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {isRescheduled && state.rescheduledTime ? state.rescheduledTime : item.timeFormatted}</span>
               </div>
               
               {/* Ingredients / Steps if not completed */}
               {!isCompleted && item.description && (
                 (() => {
                   const rawItems = item.description.split(';').map(s => s.trim()).filter(Boolean);
                   const items = rawItems.filter(s => !['n/a', 'none', 'na', '-', '.', 'nil'].includes(s.toLowerCase()));
                   if (items.length === 0) return null;
                   
                   const displayItems = items.slice(0, 4);
                   const hasMore = items.length > 4;

                   return (
                     <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                       <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                         {displayItems.map((ing, i) => (
                           <li key={i} className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                             <span className={`w-1 h-1 rounded-full shrink-0 ${item.category === 'Nutrition' || item.category === 'Hydration' || item.category.includes('Meal') ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                             <span className="truncate">{ing}</span>
                           </li>
                         ))}
                         {hasMore && (
                           <li className="text-[10px] text-slate-400 font-bold italic flex items-center pl-2.5">
                             +{items.length - 4} more
                           </li>
                         )}
                       </ul>
                     </div>
                   );
                 })()
               )}
             </div>

             {/* Right Actions */}
             <div className="flex flex-col items-center justify-between shrink-0 py-0.5">
               <button onClick={(e) => { e.stopPropagation(); onOpenModal(item); }} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
                 <MoreVertical className="w-4 h-4" />
               </button>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsExiting(true);
                   setTimeout(() => {
                     onToggleDone(item);
                     setIsExiting(false);
                   }, 300);
                 }}
                 className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}
               >
                 {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW: Original Grid Card ── */}
      <div className={`hidden sm:flex p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 ${isCompleted ? 'opacity-60 scale-[0.98]' : 'scale-100'} ${theme.cardBorder || ''}`}>
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.bg} ${theme.text}`}>
            <span className="text-2xl">{theme.icon}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${theme.bg} ${theme.text} ${theme.border}`}>
                {item.category}
              </span>
              {item.reminderMinutesBefore && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  <Bell className="w-3 h-3" /> {item.reminderMinutesBefore}m
                </span>
              )}
              {item.completionRequired && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/50 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" /> Required
                </span>
              )}
            </div>

            <h4 className={`text-base font-black truncate leading-tight ${isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {item.taskTitle}
            </h4>

            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {isRescheduled && state.rescheduledTime ? state.rescheduledTime : item.timeFormatted}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Only show ingredients button if there's a description */}
          {item.description && (
            <button
              onClick={() => onOpenModal(item)}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 min-h-[32px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Ingredients</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <button
              onClick={() => onToggleDone(item)}
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
    </>
  );
}

export default function WeeklyDietManager({
  plannerTasks = [],
  setPlannerTasks,
  setScheduleTimeline,
  onOpenTaskModal,
  selectedPlannerDate
}) {
  // ── 1. IDENTIFY CURRENT DAY ──
  const realTodayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const [selectedDay, setSelectedDay] = useState(
    selectedPlannerDate ? selectedPlannerDate.toLocaleDateString('en-US', { weekday: 'long' }) : realTodayName
  );

  useEffect(() => {
    if (selectedPlannerDate) {
      setSelectedDay(selectedPlannerDate.toLocaleDateString('en-US', { weekday: 'long' }));
    }
  }, [selectedPlannerDate]);
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
  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);

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

  // Request browser notification permission with full mobile diagnostic
  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    const isGranted = res.granted || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
    setNotificationPermissionGranted(isGranted);

    if (isGranted) {
      playDietChime();
      sendSystemNotification('Mobile Alert Test Successful 🔔', {
        body: 'Audio chime, vibration, and push notifications are active on this device!',
        tag: 'diet-welcome-' + Date.now()
      });
      showToast('🎉 Mobile alerts & sounds enabled successfully!');
    } else if (res.reason === 'denied') {
      alert('⚠️ Notifications are blocked in your mobile browser settings. To receive alerts on your phone, open Browser Settings > Site Settings > Notifications and select "Allow".');
    } else if (res.reason === 'unsupported') {
      alert('⚠️ Tip: To receive push notifications on iOS or older Android, tap the "Install App" or "Add to Home Screen" button in your browser.');
    } else {
      showToast('Notification permission request processed.');
    }
  };

  // Immediate Test Notification, Vibration & Audio Chime
  const handleTestNotification = async () => {
    let granted = notificationPermissionGranted;
    if (!granted) {
      const res = await requestNotificationPermission();
      granted = res.granted || (typeof Notification !== 'undefined' && Notification.permission === 'granted');
      setNotificationPermissionGranted(granted);
    }
    const testItem = nextUpcomingDietItem || dayDietItems[0] || WEEKLY_DIET_PLAN[0];
    playDietChime();

    sendSystemNotification(`🔔 [Alert Test] ${testItem.taskTitle}`, {
      body: `Scheduled for ${testItem.timeFormatted || testItem.time} • Sound & Vibration active!`,
      mealId: testItem.id,
      day: testItem.day,
      tag: 'test-reminder-' + Date.now()
    });
    setActiveInAppReminder({ item: testItem, minutesLeft: 5 });
    showToast('🔔 Fired test alert to your device with chime & vibration!');
  };

  // Share today's schedule and 8:00 PM prep alert directly to WhatsApp
  const handleWhatsAppTodaySchedule = () => {
    const todayItems = WEEKLY_DIET_PLAN.filter(item => item.day === selectedDay);
    const completedCount = todayItems.filter(i => completions[`${selectedDay}_${i.id}`]?.status === 'completed').length;

    let text = `🥗 *Daily Planner – ${selectedDay}'s Diet & Wellness Schedule*\n`;
    text += `📊 Progress: ${completedCount}/${todayItems.length} Completed (Health Score: ${dailyHealthScore}/100)\n\n`;
    text += `*Schedule & Meal Alerts:*\n`;

    todayItems.forEach(item => {
      const isDone = completions[`${selectedDay}_${item.id}`]?.status === 'completed';
      const mark = isDone ? '✅' : '⏰';
      text += `${mark} *${item.timeFormatted || item.time}* - ${item.taskTitle}\n`;
      if (item.description) {
        text += `   📝 ${item.description.slice(0, 90)}${item.description.length > 90 ? '...' : ''}\n`;
      }
    });

    const todayPrep = NEXT_DAY_PREP_CHECKLIST[selectedDay];
    if (todayPrep) {
      text += `\n🛒 *8:00 PM Ingredient Preparation Alert:*\n`;
      text += `Next Day: ${todayPrep.forNextDay}\n`;
      text += `Pantry list: ${todayPrep.ingredients}\n`;
    }

    text += `\n_Generated from Codigix Daily Planner & Health OS_`;
    openWhatsAppAlert(text);
    showToast(`Opening WhatsApp with ${selectedDay}'s alert schedule!`);
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
      data: {
        type: 'nextDayPrep',
        day: targetPrep.prepDay
      }
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
            data: {
              type: 'nextDayPrep',
              day: realTodayName
            }
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
    const staticItems = WEEKLY_DIET_PLAN.filter(item => item.day === selectedDay);

    const dynamicWellnessTasks = plannerTasks.filter(t => {
      const isWellness = (t.title && t.title.toLowerCase().includes('[🥗 diet]')) || ['Breakfast', 'Lunch', 'Dinner', 'Nutrition', 'Hydration', 'Health', 'Exercise', 'Routine', 'Sleep', 'Preparation', 'Diet'].includes(t.category);
      if (!isWellness) return false;

      let belongsToDay = false;
      if (t.date) {
        try {
          const d = new Date(t.date);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          if (dayName === selectedDay) belongsToDay = true;
        } catch (e) { }
      }
      if (t.recurring && t.recurring !== 'None') {
        const r = t.recurring.toLowerCase();
        if (r === 'daily' || r === 'everyday') belongsToDay = true;
        else if (r === 'weekdays' && !['Saturday', 'Sunday'].includes(selectedDay)) belongsToDay = true;
        else if (r === 'weekends' && ['Saturday', 'Sunday'].includes(selectedDay)) belongsToDay = true;
        else if (r.includes(selectedDay.toLowerCase())) belongsToDay = true;
      }
      return belongsToDay;
    }).map(t => ({
      id: t.id,
      day: selectedDay,
      time: t.time || '12:00 PM',
      timeFormatted: t.time || '12:00 PM',
      category: t.category || 'Routine',
      taskTitle: t.title ? t.title.replace(/\[🥗\s*diet\]\s*/i, '') : 'Wellness Task',
      description: t.notes || '',
      completionRequired: true,
      isDynamic: true
    }));

    const combined = [...staticItems, ...dynamicWellnessTasks];
    const unique = [];
    const seenIds = new Set();
    const seenTitles = new Set();

    for (const item of combined) {
      const titleKey = item.taskTitle?.toLowerCase().trim() || '';
      if (!seenIds.has(item.id) && !seenTitles.has(titleKey)) {
        seenIds.add(item.id);
        seenTitles.add(titleKey);
        unique.push(item);
      }
    }
    return unique.sort((a, b) => {
      const parseTime = (timeStr) => {
        if (!timeStr) return 9999;

        // Match either 12-hour (e.g. 08:30 AM) or 24-hour (e.g. 08:30) format
        const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match12) {
          let h = parseInt(match12[1]);
          const m = parseInt(match12[2]);
          if (match12[3].toUpperCase() === 'PM' && h < 12) h += 12;
          if (match12[3].toUpperCase() === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        }

        const match24 = timeStr.match(/(\d+):(\d+)/);
        if (match24) {
          return parseInt(match24[1]) * 60 + parseInt(match24[2]);
        }

        return 9999;
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  }, [selectedDay, plannerTasks]);

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

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState({
      item,
      isNowCompleted: newStatus === 'completed',
    });

    undoTimerRef.current = setTimeout(() => {
      setUndoState(null);
    }, 5000);

    // Sync status to backend
    updateDietStatusAPI({
      taskId: item.id,
      day: selectedDay,
      status: newStatus,
      timestamp: new Date().toISOString()
    }).catch(() => { });
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
    }).catch(() => { });

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
    }).catch(() => { });

    showToast(`Rescheduled to ${rescheduleNewTime}`);
    setRescheduleModalItem(null);
  };

  // Helper for category styling & badges
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'Breakfast':
        return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: <Coffee className="w-4 h-4" /> };
      case 'Lunch':
        return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: <Utensils className="w-4 h-4" /> };
      case 'Dinner':
        return { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', icon: <Utensils className="w-4 h-4" /> };
      case 'Nutrition':
        return { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', icon: <Activity className="w-4 h-4" /> };
      case 'Hydration':
        return { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', icon: <Droplet className="w-4 h-4" /> };
      case 'Exercise':
        return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', icon: <Dumbbell className="w-4 h-4" /> };
      case 'Snack':
        return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: <Apple className="w-4 h-4" /> };
      case 'Preparation':
        return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: <ShoppingCart className="w-4 h-4" /> };
      case 'Sleep':
        return { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', icon: <Moon className="w-4 h-4" /> };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', icon: <Sparkles className="w-4 h-4" /> };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-28 sm:pb-10">


      {/* ── ACTIVE IN-APP MOBILE REMINDER POPUP BANNER ── */}
      {activeInAppReminder && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-3.5 sm:p-4 rounded-md shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 border border-amber-300/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 animate-bounce"><Clock className="w-6 h-6" /></span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0">
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
              className="px-3 py-1.5 bg-white text-orange-950 rounded-md text-xs font-black shadow-md hover:bg-amber-50 cursor-pointer active:scale-95 flex items-center gap-1"
            >
              Open Details <Search className="w-3 h-3" />
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

      {/* ── TOP HERO BANNER: Minimal Design ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 rounded-md shadow-xs">
        {/* Left: Quick Stats */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {selectedDay}'s Nutrition
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="text-emerald-600">Score: {dailyHealthScore}/100</span>
                <span>•</span>
                <span>{dayDietItems.filter(i => completions[`${selectedDay}_${i.id}`]?.status === 'completed').length}/{dayDietItems.length} Done</span>
              </div>
            </div>
          </div>

          {nextUpcomingDietItem && (
            <div className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Next: <span className="font-bold text-slate-700 dark:text-slate-300">{nextUpcomingDietItem.taskTitle}</span> ({nextUpcomingDietItem.diffMins}m)
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center w-full sm:w-auto">
          <button
            onClick={() => {
              setIngredientsModalDay(selectedDay);
              setIngredientsModalMealId(null);
              setShowNextDayModal(true);
            }}
            className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
            <span>Prep List</span>
          </button>

          <button
            onClick={handleSyncToPlanner}
            disabled={isSyncing}
            className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 text-emerald-700 border border-emerald-200/60 dark:border-emerald-800/60 rounded-md text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Planner'}</span>
          </button>
        </div>
      </div>

      {/* ── 9. WEEKLY PROGRESS & PREPARATION (Compact 3-Pill Bar on Mobile) ── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Compliance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-md shadow-xs text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Compliance</span>
          </div>
          <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {weeklyProgress.overallRate}%
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3 rounded-md shadow-xs text-center flex flex-col justify-center">
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
          className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 p-2.5 sm:p-3 rounded-md shadow-xs text-center flex flex-col justify-center cursor-pointer transition-all active:scale-95"
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
          <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-md space-y-3 animate-in fade-in zoom-in-95">
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
                  className="px-2.5 py-1.5 rounded-md bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Send Alert</span>
                </button>
                <button
                  onClick={() => handleCopyPrepIngredients(prepData)}
                  title="Copy formatted list for WhatsApp"
                  className="px-2.5 py-1.5 rounded-md bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowNextDayModal(true)}
                  title="Open full screen modal"
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
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
                    className={`px-2.5 py-1 rounded-md-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${isChecked
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 line-through opacity-85'
                      : 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/80 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                      }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] ${isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'
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

      {/* ── 2 & 5. DIET ITEMS LIST WITH MINIMAL DESIGN ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate">
              {selectedDay}'s Wellness & Diet
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black shrink-0">
              {dayDietItems.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={dietFilter}
              onChange={(e) => setDietFilter(e.target.value)}
              className="text-[11px] sm:text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="Pending">Pending</option>
              <option value="All">All Items</option>
              <option value="Completed">Done</option>
              <option value="Meals">Meals</option>
              <option value="Routine">Routine</option>
            </select>
          </div>
        </div>

        {/* Minimal Swipeable Diet Cards Grid */}
        {filteredDietItems.length > 0 ? (
          <div className="space-y-2.5">
            {filteredDietItems.map((item) => {
              const state = completions[`${selectedDay}_${item.id}`] || {};
              const theme = getCategoryTheme(item.category);
              return (
                <SwipeableDietCard
                  key={item.id}
                  item={item}
                  state={state}
                  theme={theme}
                  onToggleDone={handleComplete}
                  onOpenModal={setSelectedMealForModal}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
            <CheckCircle2 className="w-10 h-10 mb-2 opacity-40 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Wellness Tasks</p>
          </div>
        )}
      </div>

      {/* ── 5. INGREDIENTS & INSTRUCTIONS MODAL (Native Mobile Bottom Sheet on small screens) ── */}
      {selectedMealForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0" onClick={() => setSelectedMealForModal(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
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
                className="p-2 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingredients Breakdown */}
            {selectedMealForModal.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  Ingredients & Quantities
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-md p-3.5 space-y-1.5 border border-slate-100 dark:border-slate-700/80">
                  {selectedMealForModal.description.split(';').map((ing, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{ing.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preparation Instructions */}
            {selectedMealForModal.instructions && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  Preparation Instructions
                </h4>
                <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-md p-3.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed border border-blue-100 dark:border-blue-900/50">
                  {selectedMealForModal.instructions}
                </div>
              </div>
            )}

            {/* Next Day Prep Reminder if applicable */}
            {selectedMealForModal.nextDayPrepReminder && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-md border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Bookmark className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Evening Prep Note:</span>
                  <span>{selectedMealForModal.nextDayPrepReminder}</span>
                </div>
              </div>
            )}

            {/* Notification details */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
              <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Reminder: {selectedMealForModal.reminderMinutesBefore}m before</span>
              {selectedMealForModal.tags && selectedMealForModal.tags.length > 0 && (
                <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> {selectedMealForModal.tags.join(', ')}</span>
              )}
            </div>

            {/* Modal Actions: Responsive thumb-friendly row */}
            <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedMealForModal(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-center min-h-[44px]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleComplete(selectedMealForModal);
                  setSelectedMealForModal(null);
                }}
                className="flex-2 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95"
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
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-md shadow-2xl w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer min-h-[42px] flex items-center justify-between active:scale-98 ${skipReason === reason
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
                className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-center min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-md shadow-md cursor-pointer text-center min-h-[44px] active:scale-95"
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
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-md shadow-2xl w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
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
                  className="px-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer text-center min-h-[40px] active:scale-95"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-800 dark:text-white min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer text-center min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-md shadow-md cursor-pointer text-center min-h-[44px] active:scale-95"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Undo Toast ── */}
      {undoState && (
        <div className="fixed bottom-28 sm:bottom-10 left-3 right-3 sm:right-10 sm:left-auto sm:w-96 z-[9999] animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-3.5 bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${undoState.isNowCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
              >
                {undoState.isNowCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black truncate text-white">
                  {undoState.item.taskTitle}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate">
                  {undoState.isNowCompleted ? 'Marked as completed' : 'Marked as pending'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleComplete(undoState.item); // Toggle it back
                  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                  setUndoState(null);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                  setUndoState(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-md-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
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
