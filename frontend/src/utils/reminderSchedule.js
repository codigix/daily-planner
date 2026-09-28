// Single source of truth for task & diet reminders.
// Used by the in-app scheduler (App.jsx) while the app is open, and uploaded to the
// backend so Web Push can deliver the same reminders while the PWA is closed.
// Each reminder: { dedupeKey, fireAt, expiresAt (epoch ms), title, body, url, tag,
//                  toastType, taskId?, mealId?, day?, type? }
import { WEEKLY_DIET_PLAN, NEXT_DAY_PREP_CHECKLIST } from '../data/weeklyDietData';
import { customItemsForDate } from './dietItems';

const MIN = 60000;
const TASK_LEAD_MIN = 5;
const OVERDUE_EVERY_MIN = 15;   // nudges while a task is still pending…
const OVERDUE_FOR_MIN = 120;    // …for up to 2 hours after its start

export function parseStartMinutes(timeStr) {
  if (!timeStr) return null;
  // "09:45 AM – 10:45 AM" → start of the range
  const startPart = String(timeStr).split('–')[0].split(' - ')[0].trim();
  const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

const atMinutes = (day, mins) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, mins).getTime();

function isTaskForDate(task, dateStr) {
  if (!task.date) return true; // undated tasks are daily routines
  const d = new Date(task.date);
  return isNaN(d.getTime()) ? true : d.toDateString() === dateStr;
}

function isTaskDoneForDate(task, dateStr) {
  if (task.completedDates && typeof task.completedDates[dateStr] === 'boolean') {
    return task.completedDates[dateStr];
  }
  return task.status === 'Completed' || task.status === 'Done' || !!task.completed;
}

// Diet completions are keyed "<Weekday>_<itemId>"; only count them if they were
// recorded on that calendar date (otherwise last week's tick would silence this week)
function isDietDone(completions, dayName, itemId, dateStr) {
  const c = completions[`${dayName}_${itemId}`];
  if (!c || (c.status !== 'completed' && c.status !== 'skipped')) return false;
  if (!c.timestamp) return true;
  return new Date(c.timestamp).toDateString() === dateStr;
}

export function buildReminders({ plannerTasks = [], customDietItems = [], completions = {}, from = new Date(), days = 2 } = {}) {
  const reminders = [];
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const dateStr = day.toDateString();
    const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Diet plan (built-in weekly plan + user-added items)
    const dietItems = [
      ...WEEKLY_DIET_PLAN.filter((item) => item.day === dayName),
      ...customItemsForDate(customDietItems, day)
    ];
    dietItems.forEach((item) => {
      if (isDietDone(completions, dayName, item.id, dateStr)) return;
      const mins = parseStartMinutes(item.time);
      if (mins === null) return;
      const start = atMinutes(day, mins);
      const lead = item.reminderMinutesBefore ?? 10;
      const url = `/planner?openDietMealId=${item.id}&openDay=${dayName}`;
      const shared = { mealId: item.id, day: dayName, url };

      if (lead > 0) {
        reminders.push({
          ...shared,
          dedupeKey: `diet-lead-${dateStr}-${item.id}`,
          fireAt: start - lead * MIN,
          expiresAt: start,
          title: item.taskTitle,
          body: `In ${lead} min • ${item.timeFormatted || item.time}`,
          tag: `diet-${item.id}`
        });
      }
      reminders.push({
        ...shared,
        dedupeKey: `diet-exact-${dateStr}-${item.id}`,
        fireAt: start,
        expiresAt: start + 15 * MIN,
        title: `🔔 NOW: ${item.taskTitle}`,
        body: item.timeFormatted || item.time,
        tag: `diet-${item.id}`
      });
    });

    // 2. 8:00 PM prep for the next day's ingredients
    const prep = NEXT_DAY_PREP_CHECKLIST[dayName];
    if (prep) {
      const at = atMinutes(day, 20 * 60);
      reminders.push({
        dedupeKey: `prep-${dateStr}`,
        fireAt: at,
        expiresAt: at + 30 * MIN,
        title: `🛒 8:00 PM: Prepare Tomorrow's Ingredients (${prep.forNextDay})`,
        body: `Pantry checklist for ${prep.forNextDay} is ready — tap to open.`,
        url: `/planner?openNextDayPrep=1&openDay=${dayName}`,
        tag: `diet-prep-${dayName}`,
        type: 'nextDayPrep',
        day: dayName,
        toastType: 'warning'
      });
    }

    // 3. Planner tasks: 5 min before, at start, then every 15 min while pending (2 h)
    plannerTasks.forEach((t) => {
      if (!isTaskForDate(t, dateStr) || isTaskDoneForDate(t, dateStr)) return;
      const mins = parseStartMinutes(t.time || t.scheduled_time);
      if (mins === null) return;
      const start = atMinutes(day, mins);
      const shared = {
        body: t.time || t.scheduled_time,
        taskId: t.id,
        url: `/planner?openTaskId=${t.id}`,
        tag: `task-${t.id}`
      };

      reminders.push({
        ...shared,
        dedupeKey: `task-lead-${dateStr}-${t.id}`,
        fireAt: start - TASK_LEAD_MIN * MIN,
        expiresAt: start,
        title: `⏰ Starting in ${TASK_LEAD_MIN} min: ${t.title}`
      });
      reminders.push({
        ...shared,
        dedupeKey: `task-exact-${dateStr}-${t.id}`,
        fireAt: start,
        expiresAt: start + 10 * MIN,
        title: `📋 Now: ${t.title}`
      });
      for (let late = OVERDUE_EVERY_MIN; late <= OVERDUE_FOR_MIN; late += OVERDUE_EVERY_MIN) {
        reminders.push({
          ...shared,
          dedupeKey: `task-overdue-${dateStr}-${t.id}-${late}`,
          fireAt: start + late * MIN,
          expiresAt: start + (late + OVERDUE_EVERY_MIN) * MIN,
          title: `⚠️ Still pending (${late} min): ${t.title}`,
          toastType: 'warning'
        });
      }
    });
  }

  return reminders.sort((a, b) => a.fireAt - b.fireAt);
}

export function readDietCompletions() {
  try {
    return JSON.parse(localStorage.getItem('codigix_diet_completions_v2') || '{}') || {};
  } catch (e) {
    return {};
  }
}
