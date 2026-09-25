import React, { useState, useMemo, useEffect } from 'react';
import {
  Utensils,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  Copy,
  CheckCheck,
  Bell,
  X,
  Layers,
  Scale,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { WEEKLY_DIET_PLAN } from '../../data/weeklyDietData';
import { sendSystemNotification, triggerPhoneVibration } from '../../utils/notificationService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Non-food routine titles that must never appear in an ingredients list
const NON_FOOD_KEYWORDS = [
  'wake up',
  'exercise',
  'yoga',
  'walking',
  'sleep',
  'wind down',
  'no food after 6 pm',
  'next day ingredients',
  'fasting',
  'meditation'
];

export const isFoodMealItem = (item) => {
  if (!item || !item.taskTitle) return false;
  const titleLower = item.taskTitle.trim().toLowerCase();

  // Exclude non-food routine items
  if (NON_FOOD_KEYWORDS.some(kw => titleLower === kw || titleLower.startsWith(kw))) {
    return false;
  }

  // Exclude Preparation category (e.g. Next Day Ingredients summary task)
  if (item.category === 'Preparation' || item.category === 'Routine' || item.category === 'Sleep' || item.category === 'Exercise') {
    return false;
  }

  // Allowed food categories
  const foodCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Nutrition'];
  if (foodCategories.includes(item.category)) {
    return true;
  }

  // Check if description has food/drink keywords
  const desc = (item.description || '').toLowerCase();
  const foodKeywords = ['water', 'seeds', 'tea', 'lemon', 'almonds', 'walnuts', 'milk', 'curd', 'dal', 'fruit', 'ghee', 'oil', 'soup', 'paneer', 'oats', 'chana'];
  if (foodKeywords.some(kw => desc.includes(kw))) {
    return true;
  }

  return false;
};

// Parse individual ingredient string into { name, quantity, note, raw }
export const parseIngredient = (str) => {
  if (!str) return null;
  let clean = str.trim().replace(/^[-*•]\s*/, '').replace(/\.$/, '');
  if (!clean || clean.length < 2) return null;

  // Extract soaking / prep instructions
  let note = '';
  const soakMatch = clean.match(/(?:,\s*|\s+)(soaked\s*[^;]*)/i);
  if (soakMatch) {
    note = soakMatch[1].trim();
    clean = clean.replace(soakMatch[0], '').trim();
  }

  // Check for optional
  if (/\boptional\b/i.test(clean)) {
    note = note ? `${note}, optional` : 'optional';
    clean = clean.replace(/\boptional\b/i, '').trim();
  }

  let name = clean;
  let quantity = '';

  // Pattern with parentheses e.g. "pumpkin seeds 1 tbsp (10 g)" or "Whole-wheat flour 90 g (3 rotis)"
  const parenPattern = /^(.*?)\s+(\d+(?:[–\-\/.]\d+)?\s*(?:g|ml|tbsp|tsp|cup|piece|pieces|slice|slices|cloves)?\s*\([^)]+\))$/i;
  // Pattern with unit e.g. "80 g", "250 ml", "1 medium", "2 halves", "1 tsp", "2 rotis", "1 inch"
  const unitPattern = /^(.*?)\s+(\d+(?:[–\-\/.]\d+)?\s*(?:g|ml|tbsp|tsp|halves|medium|large|small|pinch|pinches|cup|cups|piece|pieces|slice|slices|cloves|bowl|bowls|inch|rotis))$/i;
  // Fraction pattern e.g. "½ tsp", "¼ tsp", "½ lemon", "1½ tbsp"
  const fracPattern = /^(.*?)\s+((?:\d+\s*)?[½¼¾]\s*(?:tsp|tbsp|lemon|cup|bowl)?(?:\s*\([^)]+\))?)$/i;
  // Plain number at end e.g. "Almonds 5", "walnuts 2"
  const plainNumPattern = /^(.*?)\s+(\d+)$/;

  let match = clean.match(parenPattern);
  if (!match) match = clean.match(unitPattern);
  if (!match) match = clean.match(fracPattern);
  if (!match) match = clean.match(plainNumPattern);

  if (match && match[1].trim()) {
    name = match[1].trim();
    quantity = match[2].trim();
    if (/^\d+$/.test(quantity)) {
      quantity = `${quantity} pcs`;
    }
  } else if (clean.toLowerCase() === 'salt' || clean.toLowerCase().includes('salt & pepper')) {
    name = clean;
    quantity = 'To taste';
  }

  // Clean up any trailing commas, dashes or prepositions
  name = name.replace(/[,–\-]+$/, '').trim();
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name: formattedName,
    quantity: quantity || 'As needed',
    note: note,
    raw: str.trim()
  };
};

export default function NextDayIngredientsModal({
  isOpen,
  onClose,
  initialTargetDay = null,
  initialMealId = null
}) {
  // Determine tomorrow's day by default (1 day before prep)
  const defaultTargetDay = useMemo(() => {
    if (initialTargetDay && DAYS_OF_WEEK.includes(initialTargetDay)) {
      return initialTargetDay;
    }
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  }, [initialTargetDay]);

  const realTodayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const [selectedDay, setSelectedDay] = useState(defaultTargetDay);
  const [selectedMealId, setSelectedMealId] = useState('all'); // 'all' or meal.id
  const [viewMode, setViewMode] = useState('meal'); // 'meal' or 'consolidated'
  const [checkedItems, setCheckedItems] = useState({});
  const [copied, setCopied] = useState(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialTargetDay && DAYS_OF_WEEK.includes(initialTargetDay)) {
        setSelectedDay(initialTargetDay);
      }
      if (initialMealId) {
        setSelectedMealId(initialMealId);
      } else {
        setSelectedMealId('all');
      }
    }
  }, [isOpen, initialTargetDay, initialMealId]);

  // Retrieve strictly FOOD & MEAL items for the selected target day (no "Wake Up", "Sleep", "Exercise")
  const foodMeals = useMemo(() => {
    return WEEKLY_DIET_PLAN.filter(
      item => item.day === selectedDay && isFoodMealItem(item)
    );
  }, [selectedDay]);

  // Parse each meal's ingredients
  const parsedMeals = useMemo(() => {
    return foodMeals.map(meal => {
      const rawText = meal.description || '';
      const parts = rawText.split(';').map(p => p.trim()).filter(Boolean);
      const ingredients = parts.map(parseIngredient).filter(Boolean);

      // Icon & short display tag
      let icon = '🍳';
      let tag = meal.category;
      const lowerTitle = (meal.taskTitle || '').toLowerCase();

      if (lowerTitle.includes('detox') || lowerTitle.includes('water')) {
        icon = '💧';
        tag = 'Detox';
      } else if (lowerTitle.includes('nut') || lowerTitle.includes('seed')) {
        icon = '🥜';
        tag = 'Nuts';
      } else if (meal.category === 'Breakfast') {
        icon = '🍳';
        tag = 'Breakfast';
      } else if (meal.category === 'Lunch') {
        icon = '🥗';
        tag = 'Lunch';
      } else if (meal.category === 'Dinner') {
        icon = '🍲';
        tag = 'Dinner';
      } else if (lowerTitle.includes('night') || lowerTitle.includes('bedtime')) {
        icon = '🌙';
        tag = 'Bedtime';
      } else {
        icon = '🍎';
        tag = 'Snack';
      }

      return {
        ...meal,
        ingredients,
        icon,
        tag
      };
    });
  }, [foodMeals]);

  // Reset meal selection if selected meal does not belong to new day
  useEffect(() => {
    if (selectedMealId !== 'all') {
      const existsInDay = parsedMeals.some(m => m.id === selectedMealId);
      if (!existsInDay) {
        setSelectedMealId('all');
      }
    }
  }, [selectedDay, parsedMeals, selectedMealId]);

  // Active meals to display based on selectedMealId
  const displayedMeals = useMemo(() => {
    if (selectedMealId === 'all') return parsedMeals;
    return parsedMeals.filter(m => m.id === selectedMealId);
  }, [parsedMeals, selectedMealId]);

  // Currently active single meal object (if a specific meal is selected)
  const activeMealObj = useMemo(() => {
    if (selectedMealId === 'all') return null;
    return parsedMeals.find(m => m.id === selectedMealId) || null;
  }, [parsedMeals, selectedMealId]);

  // Overnight soaking ingredients for the day
  const overnightSoakList = useMemo(() => {
    const list = [];
    parsedMeals.forEach(meal => {
      meal.ingredients.forEach(ing => {
        const isSoak = (ing.note && ing.note.toLowerCase().includes('soak')) ||
                       (ing.raw && ing.raw.toLowerCase().includes('soak'));
        if (isSoak) {
          list.push({
            ...ing,
            mealTitle: meal.taskTitle,
            mealTime: meal.timeFormatted
          });
        }
      });
    });
    return list;
  }, [parsedMeals]);

  // Consolidated unique ingredients list for shopping/pantry view
  const consolidatedIngredients = useMemo(() => {
    const map = new Map();
    displayedMeals.forEach(meal => {
      meal.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (map.has(key)) {
          const existing = map.get(key);
          map.set(key, {
            ...existing,
            meals: `${existing.meals}, ${meal.timeFormatted}`,
            quantity: existing.quantity && existing.quantity !== 'As needed'
              ? `${existing.quantity} + ${ing.quantity}`
              : ing.quantity
          });
        } else {
          map.set(key, {
            id: `cons_${meal.id}_${key}`,
            name: ing.name,
            quantity: ing.quantity,
            note: ing.note,
            meals: `${meal.timeFormatted} (${meal.taskTitle})`
          });
        }
      });
    });
    return Array.from(map.values());
  }, [displayedMeals]);

  const toggleCheck = (id) => {
    setCheckedItems(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      triggerPhoneVibration([30]);
      return updated;
    });
  };

  const handleCopyClipboard = () => {
    let text = `🥕 INGREDIENTS (${selectedDay})\n`;

    if (activeMealObj) {
      text += `Meal: [${activeMealObj.timeFormatted}] ${activeMealObj.taskTitle}\n\n`;
      activeMealObj.ingredients.forEach(ing => {
        text += `• ${ing.name}: ${ing.quantity}${ing.note ? ` (${ing.note})` : ''}\n`;
      });
    } else {
      text += `Total Meals: ${displayedMeals.length}\n\n`;
      displayedMeals.forEach(meal => {
        text += `[${meal.timeFormatted}] ${meal.taskTitle}:\n`;
        meal.ingredients.forEach(ing => {
          text += `  • ${ing.name}: ${ing.quantity}${ing.note ? ` (${ing.note})` : ''}\n`;
        });
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerPhoneVibration([80, 40, 80]);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendTestNotification = () => {
    const title = activeMealObj
      ? `🥕 ${activeMealObj.taskTitle} (${selectedDay})`
      : `🥕 ${selectedDay}'s Ingredients (${displayedMeals.length} Meals)`;

    const body = activeMealObj
      ? activeMealObj.ingredients.map(i => `${i.name}: ${i.quantity}`).join(', ')
      : `${consolidatedIngredients.length} ingredients ready with exact weights!`;

    sendSystemNotification(title, {
      body,
      tag: `prep-${Date.now()}`
    });
    alert(`🔔 Ingredients reminder sent to phone!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      {/* Mobile Bottom Sheet Drawer / Desktop Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        
        {/* Mobile Top Drag Indicator */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Minimalist Top Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  Ingredients & Weights
                </h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Prep
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {selectedDay} • {activeMealObj ? activeMealObj.taskTitle : `${displayedMeals.length} Meals`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer shrink-0 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 1. COMPACT 7-DAY SEGMENTED SELECTOR (Mobile Touch-Optimized) ── */}
        <div className="grid grid-cols-7 gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0 select-none">
          {DAYS_OF_WEEK.map(day => {
            const isSelected = selectedDay === day;
            const isTomorrow = defaultTargetDay === day;
            const isToday = realTodayName === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-1.5 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 font-bold'
                }`}
              >
                <span className="text-[11px] font-black">{day.slice(0, 3)}</span>
                {isTomorrow ? (
                  <span className={`text-[8px] leading-none font-extrabold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Tmrw
                  </span>
                ) : isToday ? (
                  <span className={`text-[8px] leading-none font-extrabold mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'}`}>
                    Today
                  </span>
                ) : (
                  <span className="text-[8px] leading-none opacity-0">•</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 2. MEAL CHIPS SCROLLER (Clean, Minimalist Pills) ── */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar select-none">
          {/* All Meals Pill */}
          <button
            onClick={() => setSelectedMealId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer min-h-[36px] flex items-center gap-1 active:scale-95 ${
              selectedMealId === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>🍽️</span>
            <span>All ({parsedMeals.length})</span>
          </button>

          {/* Individual Meal Pills */}
          {parsedMeals.map(meal => {
            const isSelected = selectedMealId === meal.id;
            return (
              <button
                key={meal.id}
                onClick={() => setSelectedMealId(meal.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{meal.icon}</span>
                <span className="font-extrabold">{meal.tag}</span>
                <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {meal.timeFormatted.replace(' ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3. INGREDIENTS ONLY BODY (Minimalist & Touch-Optimized) ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-contain">

          {/* Sub-view toggle for All Meals */}
          {selectedMealId === 'all' && (
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl text-xs font-bold text-slate-500">
              <span className="px-2 font-black text-slate-700 dark:text-slate-200 text-[11px]">
                {displayedMeals.length} Meals Scheduled
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('meal')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                    viewMode === 'meal'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  By Meal
                </button>
                <button
                  onClick={() => setViewMode('consolidated')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                    viewMode === 'consolidated'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Combined ({consolidatedIngredients.length})
                </button>
              </div>
            </div>
          )}

          {/* Overnight Soaking Card (Minimalist Alert) */}
          {overnightSoakList.length > 0 && selectedMealId === 'all' && (
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
              <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-200 mb-1.5">
                <span className="flex items-center gap-1">
                  <span>🌙</span>
                  <span>Soak Tonight (8:00 PM):</span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                  {overnightSoakList.length} items
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {overnightSoakList.map((ing, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-amber-950 dark:text-amber-100 truncate">{ing.name}</span>
                    <span className="font-black text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md shrink-0">
                      {ing.quantity || 'Standard portion'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONSOLIDATED SHOPPING VIEW */}
          {selectedMealId === 'all' && viewMode === 'consolidated' ? (
            <div className="space-y-1.5">
              {consolidatedIngredients.map((ing) => {
                const isChecked = !!checkedItems[ing.id];
                return (
                  <div
                    key={ing.id}
                    onClick={() => toggleCheck(ing.id)}
                    className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer select-none active:scale-[0.99] ${
                      isChecked
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className={`font-bold block truncate ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {ing.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                          {ing.meals}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                      {ing.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MEAL-BY-MEAL INGREDIENTS VIEW */
            <div className="space-y-3">
              {displayedMeals.map(meal => (
                <div
                  key={meal.id}
                  className="rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 p-3 sm:p-3.5 shadow-2xs space-y-2.5"
                >
                  {/* Clean Meal Subheader */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{meal.icon}</span>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                        {meal.timeFormatted}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                        {meal.taskTitle}
                      </h4>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {meal.ingredients.length} items
                    </span>
                  </div>

                  {/* Clean Rows of Ingredients */}
                  <div className="space-y-1.5">
                    {meal.ingredients.map((ing, idx) => {
                      const checkKey = `${meal.id}_${idx}`;
                      const isChecked = !!checkedItems[checkKey];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(checkKey)}
                          className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-all cursor-pointer select-none active:scale-[0.99] ${
                            isChecked
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                              : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={`font-bold block truncate ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                {ing.name}
                              </span>
                              {ing.note && (
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 block truncate font-medium">
                                  {ing.note}
                                </span>
                              )}
                            </div>
                          </div>

                          {ing.quantity && (
                            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                              {ing.quantity}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. STICKY THUMB FOOTER (Mobile Bottom Navigation Safe) ── */}
        <div 
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none"
        >
          <button
            onClick={handleCopyClipboard}
            className="flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : activeMealObj ? 'Copy Meal Ingredients' : 'Copy All Ingredients'}</span>
          </button>

          <button
            onClick={handleSendTestNotification}
            className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
            title="Send reminder to phone"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="hidden xs:inline">Alert</span>
          </button>

          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
