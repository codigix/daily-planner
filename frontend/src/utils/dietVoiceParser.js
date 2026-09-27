// Turns a spoken/typed sentence into diet item fields, e.g.
//   "Breakfast oats with milk and berries tomorrow at 7:30 am, remind me 15 minutes before"
//   "Evening walk every Tuesday at 6.30 pm for 30 minutes"
//   "Drink warm water every day at 6 am"
// Returns { fields, detected, notes } — `fields` only contains what was understood,
// `notes` explains assumptions so the user can double-check before saving.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'forty five': 45, sixty: 60
};

const CATEGORY_RULES = [
  ['Breakfast', /\bbreakfast\b/],
  ['Lunch', /\blunch\b/],
  ['Dinner', /\b(dinner|supper)\b/],
  ['Snack', /\bsnacks?\b/],
  ['Hydration', /\b(water|hydrat\w*|coconut water|juice|buttermilk|lassi)\b/],
  ['Exercise', /\b(walk\w*|run\w*|jog\w*|gym|yoga|workout|exercise|cycling|swim\w*|stretch\w*|pranayam\w*)\b/],
  ['Sleep', /\b(sleep|bed ?time|nap)\b/],
  ['Health', /\b(medicine|tablet|vitamin|supplement|meditat\w*|bp|sugar check|detox)\b/],
  ['Preparation', /\b(prep|prepare|soak\w*|marinate|grocer\w*)\b/],
  ['Routine', /\b(wake ?up|routine|journal\w*|plan\w* the day)\b/]
];
const MEAL_WORDS = /\b(breakfast|lunch|dinner|supper|snacks?)\b/g;

const pad = (n) => String(n).padStart(2, '0');
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function wordsToDigits(text) {
  let t = text;
  // longest first so "forty five" wins over "forty"
  Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).forEach((w) => {
    t = t.replace(new RegExp(`\\b${w}\\b`, 'g'), String(NUMBER_WORDS[w]));
  });
  return t;
}

export function parseDietSpeech(input, reference = new Date()) {
  const fields = {};
  const detected = [];
  const notes = [];
  if (!input || !input.trim()) return { fields, detected, notes };

  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  let text = ` ${wordsToDigits(input.toLowerCase())
    .replace(/[“”"]/g, '')
    .replace(/(\d)\s*[.:]\s*(\d{2})\b/g, '$1:$2')   // "7.30" / "7 : 30" → "7:30"
    .replace(/\b(\d{1,2}) ([0-5]\d)(?=\s*(?:a\.?m\.?|p\.?m\.?)(?:\W|$))/g, '$1:$2') // "9 30 am"
    .replace(/\b(at|by|around) (\d{1,2}) ([0-5]\d)\b/g, '$1 $2:$3')               // "at 9 30"
    .replace(/\ba\.?m\.?(?=\W|$)/g, 'am')
    .replace(/\bp\.?m\.?(?=\W|$)/g, 'pm')
    .replace(/\s+/g, ' ')
    .trim()} `;
  const remove = (re) => { text = text.replace(re, ' ').replace(/\s+/g, ' '); };

  // ── Instructions (explicit) ──
  let m = text.match(/\b(?:instructions?|how to make|method|note)\s*(?:is|are|:)?\s+(.+)$/);
  if (m) {
    fields.instructions = cap(m[1].trim().replace(/[.,]$/, ''));
    detected.push('instructions');
    remove(new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  // ── Reminder ──
  if ((m = text.match(/\b(?:no reminder|don'?t remind( me)?)\b/))) {
    fields.reminderMinutes = 0;
    detected.push('reminder');
    remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(?:remind(?: me)?|reminder|alert(?: me)?)\s*(?:of\s*|at\s*)?(\d{1,3})\s*(?:min(?:ute)?s?|mins?)\s*(?:before|early|earlier|prior)?\b/))
    || (m = text.match(/\b(\d{1,3})\s*(?:min(?:ute)?s?)\s*(?:before|early)\s*(?:reminder|alert)?\b/))) {
    fields.reminderMinutes = Math.min(240, parseInt(m[1], 10));
    detected.push('reminder');
    remove(new RegExp(m[0]));
  }

  // Durations ("for 30 minutes") are details, not times
  let duration = '';
  if ((m = text.match(/\bfor (\d{1,3}) ?(min(?:ute)?s?|hours?|hrs?)\b/))) {
    duration = `${m[1]} ${m[2].startsWith('h') ? 'hour' + (m[1] === '1' ? '' : 's') : 'min'}`;
    remove(new RegExp(m[0]));
  }

  // ── Repeat ──
  if ((m = text.match(/\b(every ?day|everyday|daily|each day)\b/))) {
    fields.repeat = 'daily';
    detected.push('repeat');
    remove(new RegExp(m[0]));
  } else if ((m = text.match(new RegExp(`\\b(?:every|each) (${WEEKDAYS.join('|')})\\b|\\bon (${WEEKDAYS.join('|')})s\\b`)))) {
    const dayName = cap(m[1] || m[2]);
    fields.repeat = 'weekly';
    fields.weekday = dayName;
    detected.push('repeat');
    remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(every week|weekly|each week)\b/))) {
    fields.repeat = 'weekly';
    detected.push('repeat');
    remove(new RegExp(m[0]));
  }

  // ── Date ──
  let date = null;
  if ((m = text.match(/\bday after tomorrow\b/))) {
    date = new Date(today); date.setDate(date.getDate() + 2); remove(/\bday after tomorrow\b/);
  } else if ((m = text.match(/\btomorrow\b/))) {
    date = new Date(today); date.setDate(date.getDate() + 1); remove(/\btomorrow\b/);
  } else if ((m = text.match(/\b(today|tonight|this (?:morning|afternoon|evening))\b/))) {
    date = new Date(today);
    if (m[1] === 'today') remove(/\btoday\b/);
    else if (m[1] === 'tonight') remove(/\btonight\b/);
  } else if ((m = text.match(new RegExp(`\\b(?:on |this |next )?(${WEEKDAYS.join('|')})\\b`)))) {
    const target = WEEKDAYS.indexOf(m[1]);
    let diff = (target - today.getDay() + 7) % 7;
    if (m[0].startsWith('next') && diff === 0) diff = 7;
    date = new Date(today); date.setDate(date.getDate() + diff);
    if (!fields.weekday) fields.weekday = cap(m[1]);
    remove(new RegExp(m[0]));
  } else if ((m = text.match(new RegExp(`\\b(?:on )?(\\d{1,2})(?:st|nd|rd|th)?(?: of)? (${MONTHS.join('|')})(?: (\\d{4}))?\\b`)))
    || (m = text.match(new RegExp(`\\b(?:on )?(${MONTHS.join('|')}) (\\d{1,2})(?:st|nd|rd|th)?(?:,? (\\d{4}))?\\b`)))) {
    const monthFirst = isNaN(parseInt(m[1], 10));
    const day = parseInt(monthFirst ? m[2] : m[1], 10);
    const month = MONTHS.indexOf(monthFirst ? m[1] : m[2]);
    let year = m[3] ? parseInt(m[3], 10) : today.getFullYear();
    let d = new Date(year, month, day);
    if (!m[3] && d < today) d = new Date(year + 1, month, day); // "5 January" in December → next year
    if (d.getDate() === day) date = d;
    remove(new RegExp(m[0]));
  } else if ((m = text.match(/\bon (\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/))) {
    const day = +m[1]; const month = +m[2] - 1;
    const year = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : today.getFullYear();
    const d = new Date(year, month, day);
    if (d.getDate() === day) date = d;
    remove(new RegExp(m[0]));
  }
  if (date) {
    fields.date = toYmd(date);
    detected.push('date');
    if (fields.repeat === 'weekly' && !fields.weekday) fields.weekday = cap(WEEKDAYS[date.getDay()]);
  }
  // Weekly on a named day: start from the next occurrence of that day
  if (fields.repeat === 'weekly' && fields.weekday && !date) {
    const diff = (WEEKDAYS.indexOf(fields.weekday.toLowerCase()) - today.getDay() + 7) % 7;
    const d = new Date(today); d.setDate(d.getDate() + diff);
    fields.date = toYmd(d);
  }

  // ── Category (before time, so meals can decide AM/PM) ──
  for (const [category, re] of CATEGORY_RULES) {
    if (re.test(text)) { fields.category = category; detected.push('type'); break; }
  }

  // ── Time ──
  let hour = null; let minute = 0; let meridiem = null;
  if ((m = text.match(/\b(noon|midday)\b/))) { hour = 12; meridiem = 'pm'; remove(new RegExp(m[0])); }
  else if ((m = text.match(/\bmidnight\b/))) { hour = 0; meridiem = 'am'; remove(/\bmidnight\b/); }
  else if ((m = text.match(/\b(?:at |by |around )?half past (\d{1,2})\s*(am|pm)?\b/))) {
    hour = +m[1]; minute = 30; meridiem = m[2] || null; remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(?:at |by |around )?quarter past (\d{1,2})\s*(am|pm)?\b/))) {
    hour = +m[1]; minute = 15; meridiem = m[2] || null; remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(?:at |by |around )?(\d{1,2}):(\d{2})\s*(am|pm)?\b/))) {
    hour = +m[1]; minute = +m[2]; meridiem = m[3] || null; remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(?:at |by |around )?(\d{1,2})\s*(am|pm)\b/))) {
    hour = +m[1]; meridiem = m[2]; remove(new RegExp(m[0]));
  } else if ((m = text.match(/\b(?:at|by|around) (\d{1,2})(?: o'?clock)?\b/))) {
    hour = +m[1]; remove(new RegExp(m[0]));
  }

  const partOfDay = (text.match(/\b(morning|afternoon|evening|night)\b/) || [])[1]
    || (/\btonight\b/.test(input.toLowerCase()) ? 'night' : null);

  if (hour !== null && hour <= 23 && minute <= 59) {
    if (meridiem) {
      if (hour > 12) meridiem = null; // "19 pm" → trust the 24h hour
      else {
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
      }
    } else if (hour <= 12) {
      // No am/pm: decide from context
      const pmContext = ['afternoon', 'evening', 'night'].includes(partOfDay)
        || ['Dinner', 'Sleep'].includes(fields.category)
        || (fields.category === 'Lunch' && hour <= 4)
        || (!partOfDay && hour >= 1 && hour <= 5);
      if (pmContext && hour < 12) {
        hour += 12;
        notes.push(`Assumed ${hour - 12}:${pad(minute)} PM — change it if you meant AM.`);
      } else if (!partOfDay && hour !== 12) {
        notes.push(`Assumed ${hour}:${pad(minute)} AM — change it if you meant PM.`);
      }
    }
    fields.time = `${pad(hour)}:${pad(minute)}`;
    detected.push('time');
  } else if (partOfDay || fields.category) {
    // No clock time said: suggest a sensible default
    const defaults = { Breakfast: '08:00', Lunch: '13:00', Dinner: '20:00', Snack: '17:00', Sleep: '22:30', morning: '07:00', afternoon: '14:00', evening: '18:30', night: '21:00' };
    const suggestion = defaults[fields.category] || defaults[partOfDay];
    if (suggestion) {
      fields.time = suggestion;
      notes.push(`No time heard — suggested ${suggestion}.`);
    }
  }
  remove(/\b(in the )?(morning|afternoon|evening|night)\b/);

  // ── Title & ingredients ──
  let rest = text
    .replace(/\b(add|create|schedule|set|log|please|i want to|i will|i'll|have|eat|drink|remind me to|reminder to|to my plan|to diet|in my diet|for me)\b/g, ' ')
    .replace(/\b(on|at|for|and|then)\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\-–:;\s]+|[,.\-–:;\s]+$/g, '');

  let description = '';
  if ((m = rest.match(/\b(?:ingredients?|with)\s*(?:are|is|:)?\s+(.+)$/))) {
    description = m[1]
      .split(/\s*(?:,|\band\b|\bplus\b)\s*/)
      .map((s) => s.trim().replace(/^[,.;]+|[,.;]+$/g, ''))
      .filter(Boolean)
      .map(cap)
      .join('; ');
    rest = rest.slice(0, m.index).trim();
  }

  // Drop leading meal word from the title when the rest is descriptive ("breakfast oats" → "Oats")
  let title = rest.replace(/^(for )?(breakfast|lunch|dinner|supper|snacks?)\b[\s:,-]*/, '').trim();
  if (!title) title = rest.trim();
  title = title.replace(/\s+/g, ' ').replace(/^[,.\-–:;\s]+|[,.\-–:;\s]+$/g, '');
  if (!title && fields.category) title = fields.category;
  if (title) {
    const withDuration = duration ? `${title} (${duration})` : title;
    fields.title = cap(withDuration).slice(0, 255);
    detected.push('title');
  }
  if (description) {
    fields.description = description;
    detected.push('ingredients');
  }

  if (!fields.repeat && fields.date) fields.repeat = 'once';
  if (!detected.includes('time') && !fields.time) notes.push('No time heard — please set the time.');
  if (!fields.date && fields.repeat !== 'daily') notes.push('No date heard — using the selected planner date.');
  MEAL_WORDS.lastIndex = 0;
  return { fields, detected, notes };
}

// ── Plan check: practical feedback on the item against the rest of that day ──
// `dayItems` are other items on the same date: [{ time: 'HH:MM', title, category }]
export function analyzeDietItem(item, dayItems = []) {
  const tips = [];
  if (!item.time) return tips;
  const [h, m] = item.time.split(':').map(Number);
  const mins = h * 60 + m;
  const isMeal = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(item.category);

  const toMins = (t) => { const [a, b] = String(t).split(':').map(Number); return a * 60 + b; };
  const others = dayItems.filter((o) => o.time && o.title && o.title.toLowerCase() !== (item.title || '').toLowerCase());

  const clash = others.find((o) => Math.abs(toMins(o.time) - mins) < 15);
  if (clash) tips.push({ level: 'warn', text: `Close to "${clash.title}" at ${clash.time} — consider spacing them out.` });

  const sameMeal = isMeal && ['Breakfast', 'Lunch', 'Dinner'].includes(item.category)
    && others.find((o) => o.category === item.category);
  if (sameMeal) tips.push({ level: 'info', text: `There is already a ${item.category.toLowerCase()} item ("${sameMeal.title}") on this day.` });

  if (item.category === 'Dinner' && mins >= 21 * 60) tips.push({ level: 'warn', text: 'Late dinner — eating 2–3 hours before sleep helps digestion.' });
  if (item.category === 'Breakfast' && mins >= 11 * 60) tips.push({ level: 'info', text: 'Breakfast after 11 AM — is this brunch? You could set Type to Lunch.' });
  if (item.category === 'Exercise' && others.some((o) => ['Breakfast', 'Lunch', 'Dinner'].includes(o.category) && mins - toMins(o.time) >= 0 && mins - toMins(o.time) < 60)) {
    tips.push({ level: 'info', text: 'Exercise within an hour after a meal — a light walk is fine, intense workouts are better later.' });
  }
  if (isMeal && !(item.description || '').trim()) tips.push({ level: 'info', text: 'Add ingredients with quantities (e.g. "Oats 40 g; milk 200 ml") to get a useful prep list.' });
  if (isMeal && (item.description || '').trim() && !/\d/.test(item.description)) tips.push({ level: 'info', text: 'Add quantities (grams, ml, pieces) so portions stay consistent.' });

  const meals = [...others.filter((o) => ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(o.category)), ...(isMeal ? [item] : [])]
    .map((o) => toMins(o.time)).sort((a, b) => a - b);
  for (let i = 1; i < meals.length; i++) {
    if (meals[i] - meals[i - 1] > 5 * 60) {
      const fmt = (x) => `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
      tips.push({ level: 'info', text: `More than 5 hours without food between ${fmt(meals[i - 1])} and ${fmt(meals[i])} — a small snack could help.` });
      break;
    }
  }
  if (item.category === 'Hydration' && !others.some((o) => o.category === 'Hydration')) {
    tips.push({ level: 'good', text: 'Good — this is your first hydration reminder for the day.' });
  }
  return tips;
}
