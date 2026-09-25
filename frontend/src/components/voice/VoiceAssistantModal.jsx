import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  X,
  Volume2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Zap,
  Edit3,
  Flame,
  Check
} from 'lucide-react';
import { triggerPhoneVibration } from '../../utils/notificationService';
import { analyzeVoiceTaskAPI } from '../../services/api';

// Fallback high-speed local NLP parser
function localSpeechParser(speech, referenceDate) {
  const lower = speech.toLowerCase();
  let targetDate = new Date(referenceDate || new Date());
  let targetDay = 'Today';

  // 1. Date
  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
    targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else if (lower.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
    targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lower.includes(days[i])) {
        const todayDayIndex = targetDate.getDay();
        const diff = (i + 7 - todayDayIndex) % 7;
        targetDate.setDate(targetDate.getDate() + (diff === 0 ? 7 : diff));
        targetDay = days[i].charAt(0).toUpperCase() + days[i].slice(1);
        break;
      }
    }
  }

  // 2. Time
  let finalTime = '10:00 AM – 11:00 AM';
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i;
  const timeMatch = lower.match(timeRegex);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3].toLowerCase().startsWith('p') ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    const endHour = hour === 12 ? 1 : hour + 1;
    const pad = n => (n < 10 ? '0' + n : n);
    finalTime = `${pad(hour)}:${pad(min)} ${ampm} – ${pad(endHour)}:${pad(min)} ${ampm}`;
  } else if (lower.includes('morning')) {
    finalTime = '09:00 AM – 10:00 AM';
  } else if (lower.includes('afternoon') || lower.includes('noon')) {
    finalTime = '02:00 PM – 03:00 PM';
  } else if (lower.includes('evening')) {
    finalTime = '05:00 PM – 06:00 PM';
  } else if (lower.includes('night')) {
    finalTime = '08:30 PM – 09:15 PM';
  }

  // 3. Priority
  let priority = 'Medium';
  if (/\b(urgent|asap|critical|important|top priority|high priority|emergency|must)\b/i.test(lower)) {
    priority = 'High';
  } else if (/\b(later|whenever|low priority|minor|optional)\b/i.test(lower)) {
    priority = 'Low';
  }

  // 4. Category
  let category = 'Tasks & Execution';
  if (/\b(meeting|meet|sync|zoom|call|interview|discuss|alignment|team)\b/i.test(lower)) {
    category = 'Meetings';
  } else if (/\b(client|customer|sales|pitch|proposal|deal|contract|lead)\b/i.test(lower)) {
    category = 'Sales & Clients';
  } else if (/\b(diet|food|lunch|dinner|breakfast|snack|drink|water|workout|gym|yoga|exercise|health|sleep)\b/i.test(lower)) {
    category = 'Health';
  } else if (/\b(bug|code|deploy|frontend|backend|api|database|feature|release|git|test)\b/i.test(lower)) {
    category = 'Engineering';
  } else if (/\b(strategy|roadmap|kpi|review|growth|revenue|budget|finance|invoice)\b/i.test(lower)) {
    category = 'Strategy & Business Growth';
  }

  // 5. Clean Title
  let cleanTitle = speech
    .replace(/^(\s*can you|\s*please|\s*remind me to|\s*schedule a|\s*create a task for|\s*i want to|\s*i need to|\s*add a task to)\s*/i, '')
    .replace(/\b(tomorrow|today|day after tomorrow|yesterday)\b/gi, '')
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanTitle.length < 3) cleanTitle = speech.trim();
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // 6. Action Checkpoints
  const subParts = cleanTitle.split(/\b(?:and|then|also|after that)\b|,|;/i).map(s => s.trim()).filter(s => s.length > 3);
  let checkpoints = [];
  if (subParts.length > 1) {
    checkpoints = subParts.map(p => p.charAt(0).toUpperCase() + p.slice(1));
  } else {
    checkpoints = [
      `Align on scope for ${cleanTitle.slice(0, 30)}`,
      'Execute key deliverables',
      'Verify results and complete task'
    ];
  }

  return {
    title: cleanTitle,
    time: finalTime,
    date: targetDate.toDateString(),
    targetDay: targetDay,
    priority: priority,
    category: category,
    notes: `Voice input: "${speech}"`,
    checkpoints: checkpoints
  };
}

const SAMPLE_VOICE_COMMANDS = [
  "Schedule leadership team meeting tomorrow at 10 AM",
  "Urgent client sprint review at 3 PM to finalize budget",
  "Remind me to drink warm cumin lemon water at 6:30 AM",
  "Prepare Q3 financial growth presentation for stakeholders"
];

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  currentDate = new Date(),
  onTaskCreated
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedTask, setAnalyzedTask] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // When modal opens, auto-start listening
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      transcriptRef.current = '';
      setAnalyzedTask(null);
      setErrorMsg(null);
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
        triggerPhoneVibration([40]);
      };

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        transcriptRef.current = currentText;

        // Automatically trigger AI analysis when user pauses speaking for 1.3 seconds
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (currentText.trim().length > 3) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
            handleAnalyzeSpeech(currentText);
          }, 1300);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone permission blocked. Please allow mic access or type your task below.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Voice recognition: ${event.error}. You can also type below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        triggerPhoneVibration([30]);
        // If speech ended naturally and hasn't analyzed yet, auto-trigger analysis
        if (transcriptRef.current && transcriptRef.current.trim().length > 3 && !analyzedTask && !isAnalyzing) {
          handleAnalyzeSpeech(transcriptRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech start error:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim().length > 3) {
        handleAnalyzeSpeech(transcript);
      }
    } else {
      setAnalyzedTask(null);
      startListening();
    }
  };

  // Analyze the speech into an optimal structured task
  const handleAnalyzeSpeech = async (textToAnalyze) => {
    const speech = (textToAnalyze || transcript).trim();
    if (!speech) {
      setErrorMsg('Please speak or type a task first.');
      return;
    }

    stopListening();
    setIsAnalyzing(true);
    setErrorMsg(null);
    triggerPhoneVibration([40]);

    try {
      // 1. Call Backend AI Endpoint
      const res = await analyzeVoiceTaskAPI(
        speech,
        currentDate.toDateString(),
        currentDate.toLocaleDateString('en-US', { weekday: 'long' })
      );

      if (res && res.success && res.task) {
        setAnalyzedTask(res.task);
      } else {
        // Fallback to high-speed local NLP
        const fallback = localSpeechParser(speech, currentDate);
        setAnalyzedTask(fallback);
      }
    } catch (err) {
      console.warn('AI analysis API error, falling back to instant local NLP:', err);
      const fallback = localSpeechParser(speech, currentDate);
      setAnalyzedTask(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm & add structured task to planner
  const handleConfirmCreateTask = () => {
    if (!analyzedTask) return;

    triggerPhoneVibration([80, 50, 100]);
    if (onTaskCreated) {
      onTaskCreated(analyzedTask);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-label="Close voice assistant" />

      {/* Drawer on Mobile / Modal on Desktop */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  AI Voice Assistant
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  Smart Task
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                Speak naturally — AI extracts time, date, priority & subtasks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* ── 1. ACTIVE LISTENING & MICROPHONE SECTION ── */}
          <div className="flex flex-col items-center justify-center py-2 text-center space-y-3">
            
            {/* Glowing Microphone Button */}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-rose-500/10 animate-pulse" />
                </>
              )}

              <button
                onClick={handleToggleListen}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95 border-4 ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-300 dark:border-rose-400 shadow-rose-500/40 animate-pulse'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white border-white dark:border-slate-800 shadow-indigo-500/30 hover:scale-105'
                }`}
                title={isListening ? 'Tap to finish listening & analyze' : 'Tap to start speaking'}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10 animate-bounce" />
                ) : (
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
                )}
              </button>
            </div>

            {/* Listening Status & Waveform */}
            <div>
              {isListening ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 h-6">
                    <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-7 bg-rose-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:450ms]" />
                    <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:200ms]" />
                  </div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    Listening... Speak your task now
                  </span>
                  <p className="text-[10px] text-slate-400">Tap mic again when done speaking</p>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Structuring Best Task & Execution Plan...</span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    {analyzedTask ? 'Task Ready! Review below or speak again' : 'Tap the microphone to speak'}
                  </span>
                  <p className="text-[10px] text-slate-400">Say what you want to achieve, when and with who</p>
                </div>
              )}
            </div>
          </div>

          {/* ── 2. TRANSCRIPTION BOX ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>Spoken Transcript:</span>
              {transcript && (
                <button
                  onClick={() => {
                    setTranscript('');
                    setAnalyzedTask(null);
                  }}
                  className="text-slate-400 hover:text-rose-500 text-[10px] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words will appear here live... (You can also type here)"
                rows={2}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />

              {!isListening && transcript.trim().length > 2 && !analyzedTask && !isAnalyzing && (
                <button
                  onClick={() => handleAnalyzeSpeech(transcript)}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Analyze</span>
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ── 3. AI STRUCTURED TASK PREVIEW CARD ── */}
          {analyzedTask && (
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-blue-50/60 dark:from-slate-850 dark:via-slate-850 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 shadow-sm space-y-3 animate-in fade-in zoom-in-95">
              
              <div className="flex items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-2.5">
                <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  AI Structured Task
                </span>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  analyzedTask.priority === 'High'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : analyzedTask.priority === 'Low'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {analyzedTask.priority} Priority
                </span>
              </div>

              {/* Editable Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={analyzedTask.title}
                  onChange={(e) => setAnalyzedTask({ ...analyzedTask, title: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Metadata Badges: Date, Time & Category */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-indigo-500" /> Time
                  </span>
                  <input
                    type="text"
                    value={analyzedTask.time}
                    onChange={(e) => setAnalyzedTask({ ...analyzedTask, time: e.target.value })}
                    className="w-full text-[11px] font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none truncate"
                  />
                </div>

                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-indigo-500" /> Target Date
                  </span>
                  <div className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                    {analyzedTask.targetDay} ({analyzedTask.date ? new Date(analyzedTask.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'})
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800 space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 flex items-center gap-1">
                    🏷️ Category
                  </span>
                  <input
                    type="text"
                    value={analyzedTask.category}
                    onChange={(e) => setAnalyzedTask({ ...analyzedTask, category: e.target.value })}
                    className="w-full text-[11px] font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none truncate"
                  />
                </div>
              </div>

              {/* Action Checkpoints Generated by AI */}
              {analyzedTask.checkpoints && analyzedTask.checkpoints.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Subtasks / Action Checkpoints ({analyzedTask.checkpoints.length}):
                  </span>
                  <div className="space-y-1">
                    {analyzedTask.checkpoints.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="truncate flex-1">{typeof cp === 'string' ? cp : cp.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 4. SAMPLE VOICE COMMANDS HINT ── */}
          {!analyzedTask && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">
                Try saying something like:
              </span>
              <div className="space-y-1">
                {SAMPLE_VOICE_COMMANDS.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(cmd);
                      handleAnalyzeSpeech(cmd);
                    }}
                    className="w-full p-2 text-left bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span className="truncate">"{cmd}"</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY THUMB ACTION BAR ── */}
        <div 
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none"
        >
          {analyzedTask ? (
            <>
              <button
                onClick={handleConfirmCreateTask}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Create Best Task Now</span>
              </button>

              <button
                onClick={() => {
                  setAnalyzedTask(null);
                  startListening();
                }}
                className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
                title="Speak again"
              >
                <Mic className="w-3.5 h-3.5 text-indigo-500" />
                <span>Again</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleListen}
                className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? 'Stop & Analyze Task' : 'Start Speaking'}</span>
              </button>

              <button
                onClick={onClose}
                className="min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 shrink-0"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
