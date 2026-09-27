import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Save, AlertCircle, Calendar, Clock, Repeat, Bell, Mic, MicOff, Wand2, Check, Lightbulb, AlertTriangle, ThumbsUp } from 'lucide-react';
import { createDietItemAPI, updateDietItemAPI } from '../../services/api';
import { DIET_CATEGORIES, toYmd, weekdayOf } from '../../utils/dietItems';
import { parseDietSpeech, analyzeDietItem } from '../../utils/dietVoiceParser';

const SpeechRecognitionImpl = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const DETECTED_LABELS = {
  title: 'Title', type: 'Type', date: 'Date', time: 'Time', repeat: 'Repeat',
  reminder: 'Reminder', ingredients: 'Ingredients', instructions: 'Instructions'
};

const TIP_STYLE = {
  warn: { icon: AlertTriangle, cls: 'text-amber-700 dark:text-amber-300' },
  info: { icon: Lightbulb, cls: 'text-slate-600 dark:text-slate-300' },
  good: { icon: ThumbsUp, cls: 'text-emerald-700 dark:text-emerald-300' }
};

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

const emptyForm = (date) => ({
  title: '',
  category: 'Breakfast',
  date: toYmd(date || new Date()),
  time: '08:00',
  repeat: 'once',
  reminderMinutes: 10,
  description: '',
  instructions: ''
});

const fromItem = (item, fallbackDate) => ({
  title: item.title,
  category: item.category,
  // Weekly/daily items have no stored date; show the planner's date for context
  date: item.date || toYmd(fallbackDate || new Date()),
  time: item.time,
  repeat: item.repeat,
  reminderMinutes: item.reminderMinutes,
  description: item.description || '',
  instructions: item.instructions || ''
});

const inputClass =
  'w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 min-h-[44px]';
const labelClass = 'text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1';

export default function DietItemFormModal({ open, onClose, editItem = null, defaultDate, onSaved, dayItemsFor }) {
  const [form, setForm] = useState(() => emptyForm(defaultDate));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Voice / quick-text entry
  const [speech, setSpeech] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(editItem ? fromItem(editItem, defaultDate) : emptyForm(defaultDate));
    setErrors([]);
    setSpeech('');
    setInterim('');
    setAnalysis(null);
    setVoiceError('');
  }, [open, editItem, defaultDate]);

  // Stop the microphone when the dialog closes or unmounts
  useEffect(() => {
    if (!open && recognitionRef.current) recognitionRef.current.abort();
    return () => recognitionRef.current?.abort();
  }, [open]);

  // Live plan check against other items on the same day
  const tips = useMemo(() => {
    if (!open || !form.time) return [];
    const others = (dayItemsFor?.(form.date) || []).filter((o) => !editItem || o.id !== editItem.id);
    return analyzeDietItem({ ...form, title: form.title.trim() }, others);
  }, [open, form, dayItemsFor, editItem]);

  if (!open) return null;

  const applySpeech = (text) => {
    const reference = defaultDate || new Date();
    const result = parseDietSpeech(text, reference);
    const f = result.fields;
    setForm((prev) => ({
      ...prev,
      ...(f.title && { title: f.title }),
      ...(f.category && { category: DIET_CATEGORIES.includes(f.category) ? f.category : prev.category }),
      ...(f.date && { date: f.date }),
      ...(f.time && { time: f.time }),
      ...(f.repeat && { repeat: f.repeat }),
      ...(f.reminderMinutes !== undefined && { reminderMinutes: f.reminderMinutes }),
      ...(f.description && { description: f.description }),
      ...(f.instructions && { instructions: f.instructions })
    }));
    setAnalysis(result);
    setErrors([]);
  };

  const startListening = () => {
    setVoiceError('');
    if (!SpeechRecognitionImpl) {
      setVoiceError('Voice input is not supported in this browser — use Chrome, Edge or Safari, or type below.');
      return;
    }
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let finalText = '';
    recognition.onresult = (event) => {
      let live = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else live += chunk;
      }
      setInterim(live);
      if (finalText) setSpeech(finalText.trim());
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access is blocked. Allow it in the browser address bar and try again.',
        'service-not-allowed': 'Microphone access is blocked. Allow it in the browser address bar and try again.',
        'no-speech': "Didn't hear anything — tap the mic and speak again.",
        'audio-capture': 'No microphone found on this device.',
        network: 'Voice recognition needs an internet connection.'
      };
      if (event.error !== 'aborted') setVoiceError(messages[event.error] || 'Voice input stopped. Try again or type below.');
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
      if (finalText.trim()) applySpeech(finalText.trim());
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const stopListening = () => recognitionRef.current?.stop();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const buildPayload = () => {
    const [y, m, d] = form.date.split('-').map(Number);
    const day = form.date ? weekdayOf(new Date(y, m - 1, d)) : null;
    return {
      title: form.title.trim(),
      category: form.category,
      time: form.time,
      repeat: form.repeat,
      date: form.repeat === 'daily' ? null : form.date,
      day: form.repeat === 'weekly' ? day : null,
      reminderMinutes: Number(form.reminderMinutes),
      description: form.description.trim(),
      instructions: form.instructions.trim()
    };
  };

  const save = async (addAnother) => {
    const payload = buildPayload();
    const localErrors = [];
    if (!payload.title) localErrors.push('Title is required');
    if (!payload.time) localErrors.push('Time is required');
    if (payload.repeat !== 'daily' && !form.date) localErrors.push('Date is required');
    if (localErrors.length) {
      setErrors(localErrors);
      return;
    }

    setSaving(true);
    const res = editItem ? await updateDietItemAPI(editItem.id, payload) : await createDietItemAPI(payload);
    setSaving(false);

    if (!res.ok) {
      setErrors(res.data.errors || [res.data.error || 'Could not save the item']);
      return;
    }
    onSaved?.(res.data.item, editItem ? 'updated' : 'created');
    if (addAnother && !editItem) {
      // Keep date, type and repeat for quick entry of the next item
      setForm((f) => ({ ...f, title: '', description: '', instructions: '' }));
      setErrors([]);
    } else {
      onClose();
    }
  };

  const selectedWeekday = (() => {
    if (!form.date) return '';
    const [y, m, d] = form.date.split('-').map(Number);
    return weekdayOf(new Date(y, m - 1, d));
  })();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <form
        onSubmit={(e) => { e.preventDefault(); save(false); }}
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200"
      >
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {editItem ? 'Edit diet item' : 'Add diet item'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Meal, drink, workout or routine with its date and time.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!editItem && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <button type="button" onClick={listening ? stopListening : startListening}
                  aria-label={listening ? 'Stop listening' : 'Speak the diet item'}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-sm ${listening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {listening ? 'Listening… speak now' : 'Speak or type the item'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    e.g. “Breakfast oats with milk and berries tomorrow at 7:30 am, remind me 15 minutes before”
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  value={listening && interim ? interim : speech}
                  onChange={(e) => setSpeech(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (speech.trim()) applySpeech(speech); } }}
                  placeholder="Evening walk every Tuesday at 6:30 pm for 30 minutes"
                  aria-label="Describe the diet item"
                  className={`${inputClass} flex-1 bg-white dark:bg-slate-900`}
                />
                <button type="button" disabled={!speech.trim() || listening} onClick={() => applySpeech(speech)}
                  className="px-3 rounded-md text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 min-h-[44px] shrink-0">
                  <Wand2 className="w-4 h-4" />Fill
                </button>
              </div>

              {voiceError && (
                <p role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{voiceError}
                </p>
              )}

              {analysis && (
                <div className="space-y-1.5" aria-live="polite">
                  <div className="flex flex-wrap gap-1">
                    {analysis.detected.length === 0 && (
                      <span className="text-[11px] font-semibold text-slate-500">Couldn't pick out any details — try including a time and what to eat.</span>
                    )}
                    {analysis.detected.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />{DETECTED_LABELS[d]}
                      </span>
                    ))}
                  </div>
                  {analysis.notes.map((n) => (
                    <p key={n} className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">{n}</p>
                  ))}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Check the fields below, then save.</p>
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div role="alert" className="p-3 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold space-y-0.5">
              {errors.map((e) => (
                <div key={e} className="flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{e}</div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="diet-title" className={labelClass}>Title *</label>
            <input id="diet-title" autoFocus value={form.title} onChange={set('title')} maxLength={255}
              placeholder="e.g. Oats with berries" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="diet-type" className={labelClass}>Type</label>
              <select id="diet-type" value={form.category} onChange={set('category')} className={inputClass}>
                {DIET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="diet-reminder" className={labelClass}><Bell className="w-3 h-3" />Reminder</label>
              <select id="diet-reminder" value={form.reminderMinutes} onChange={set('reminderMinutes')} className={inputClass}>
                {/* Include a spoken/edited value such as 20 that isn't a preset */}
                {[...new Set([...REMINDER_OPTIONS, Number(form.reminderMinutes)])].sort((a, b) => a - b).map((m) => (
                  <option key={m} value={m}>{m === 0 ? 'At the time' : `${m} min before`}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className={labelClass}><Repeat className="w-3 h-3" />Repeat</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md" role="radiogroup" aria-label="Repeat">
              {[['once', 'One time'], ['weekly', 'Weekly'], ['daily', 'Daily']].map(([value, label]) => (
                <button key={value} type="button" role="radio" aria-checked={form.repeat === value}
                  onClick={() => setForm((f) => ({ ...f, repeat: value }))}
                  className={`py-2 rounded text-xs font-extrabold transition-colors cursor-pointer ${form.repeat === value
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="diet-date" className={labelClass}><Calendar className="w-3 h-3" />{form.repeat === 'weekly' ? 'Starting week of' : 'Date'}{form.repeat !== 'daily' && ' *'}</label>
              <input id="diet-date" type="date" value={form.date} onChange={set('date')} disabled={form.repeat === 'daily'}
                className={`${inputClass} disabled:opacity-50`} />
            </div>
            <div>
              <label htmlFor="diet-time" className={labelClass}><Clock className="w-3 h-3" />Time *</label>
              <input id="diet-time" type="time" value={form.time} onChange={set('time')} className={inputClass} />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 -mt-2">
            {form.repeat === 'once' && selectedWeekday && `Happens once on ${selectedWeekday}.`}
            {form.repeat === 'weekly' && selectedWeekday && `Repeats every ${selectedWeekday}.`}
            {form.repeat === 'daily' && 'Repeats every day.'}
          </p>

          <div>
            <label htmlFor="diet-desc" className={labelClass}>Ingredients / details</label>
            <textarea id="diet-desc" rows={2} value={form.description} onChange={set('description')}
              placeholder="Oats 40 g; milk 200 ml; berries ½ cup" className={`${inputClass} resize-y`} />
          </div>

          <div>
            <label htmlFor="diet-instr" className={labelClass}>Instructions</label>
            <textarea id="diet-instr" rows={2} value={form.instructions} onChange={set('instructions')}
              placeholder="How to prepare or do it" className={`${inputClass} resize-y`} />
          </div>

          {tips.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan check</p>
              {tips.map((t) => {
                const style = TIP_STYLE[t.level] || TIP_STYLE.info;
                const Icon = style.icon;
                return (
                  <p key={t.text} className={`text-xs font-semibold flex items-start gap-1.5 ${style.cls}`}>
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />{t.text}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="hidden sm:block px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer min-h-[44px]">
            Cancel
          </button>
          {!editItem && (
            <button type="button" disabled={saving} onClick={() => save(true)}
              className="px-4 py-2.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 rounded-md cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Plus className="w-4 h-4" /><span className="sm:hidden">Save + next</span><span className="hidden sm:inline">Save & add another</span>
            </button>
          )}
          <button type="submit" disabled={saving}
            className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-md shadow-md cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 ${editItem ? 'col-span-2' : ''}`}>
            <Save className="w-4 h-4" />{saving ? 'Saving…' : editItem ? 'Save changes' : 'Save item'}
          </button>
        </div>
      </form>
    </div>
  );
}
