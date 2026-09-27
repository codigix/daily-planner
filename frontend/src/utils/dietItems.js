// Helpers for user-created Diet & Wellness items (stored in the diet_items table).
// Server items look like: { id, date: 'YYYY-MM-DD'|null, day: 'Monday'|null,
//   repeat: 'once'|'weekly'|'daily', time: 'HH:MM', category, title, description,
//   instructions, reminderMinutes, source: 'manual'|'excel' }

export const DIET_CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Nutrition', 'Hydration',
  'Exercise', 'Health', 'Routine', 'Sleep', 'Preparation'
];

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const toYmd = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const weekdayOf = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

// Date of `dayName` in the Monday-to-Sunday week containing `reference`
export function dateForWeekday(dayName, reference = new Date()) {
  const ref = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const refIdx = (ref.getDay() + 6) % 7;
  const targetIdx = WEEK.indexOf(dayName);
  if (targetIdx < 0) return ref;
  ref.setDate(ref.getDate() + (targetIdx - refIdx));
  return ref;
}

export function formatTime12(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm || '';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function occursOn(item, date) {
  if (item.repeat === 'daily') return true;
  if (item.repeat === 'weekly') return item.day === weekdayOf(date);
  return item.date === toYmd(date);
}

export function repeatLabel(item) {
  if (item.repeat === 'daily') return 'Every day';
  if (item.repeat === 'weekly') return `Every ${item.day}`;
  if (!item.date) return 'One time';
  const [y, m, d] = item.date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Shape a server item like the built-in WEEKLY_DIET_PLAN entries so the existing
// cards, completion tracking, sync and reminders work unchanged.
export function toDietPlanItem(item, dayName) {
  return {
    id: item.id,
    day: dayName,
    time: item.time,
    timeFormatted: formatTime12(item.time),
    category: item.category,
    taskTitle: item.title,
    description: item.description,
    instructions: item.instructions,
    reminderType: 'Time Reminder',
    reminderMinutesBefore: item.reminderMinutes,
    completionRequired: true,
    nextDayPrepReminder: '',
    tags: [item.category, item.source === 'excel' ? 'Imported' : 'Custom'],
    isCustom: true,
    customItem: item
  };
}

export function customItemsForDate(items, date) {
  const dayName = weekdayOf(date);
  return (items || []).filter((it) => occursOn(it, date)).map((it) => toDietPlanItem(it, dayName));
}

// Read a File as base64 (without the data: prefix) for upload
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

// Tell other parts of the app (reminder scheduler) that custom items changed
export const notifyDietItemsChanged = () => window.dispatchEvent(new CustomEvent('app:diet-items-changed'));
