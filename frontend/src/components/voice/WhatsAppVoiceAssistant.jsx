import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Trash2,
  Sparkles,
  ChevronLeft,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { triggerPhoneVibration, playNotificationChime } from '../../utils/notificationService';
import { analyzeVoiceTaskAPI } from '../../services/api';

// Fallback high-speed local speech parser if backend is slow/offline
function parseSpeechToTask(speech, referenceDate) {
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
  } else if (lower.includes('afternoon')) {
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
  let category = 'Executive Strategy';
  if (/\b(meeting|meet|sync|zoom|call|interview|discuss)\b/i.test(lower)) {
    category = 'Meetings';
  } else if (/\b(client|customer|sales|pitch|proposal|deal)\b/i.test(lower)) {
    category = 'Sales & Clients';
  } else if (/\b(diet|food|lunch|dinner|breakfast|snack|drink|water|workout|yoga|exercise|health)\b/i.test(lower)) {
    category = 'Health';
  } else if (/\b(bug|code|deploy|frontend|backend|api|database|feature|release)\b/i.test(lower)) {
    category = 'Engineering';
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

  return {
    title: cleanTitle,
    time: finalTime,
    date: targetDate.toDateString(),
    targetDay: targetDay,
    priority: priority,
    category: category,
    notes: `Voice note: "${speech}"`,
    checkpoints: [
      `Review scope for ${cleanTitle.slice(0, 30)}`,
      'Execute primary action',
      'Verify completion'
    ]
  };
}

export default function WhatsAppVoiceAssistant({
  currentDate = new Date(),
  onTaskCreated,
  onOpenModalFallback
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const recognitionRef = useRef(null);
  const holdStartTimeRef = useRef(0);
  const touchStartXRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const transcriptRef = useRef('');
  const isCancelledRef = useRef(false);

  // Initialize Web Speech Recognition
  const initRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let liveText = '';
      for (let i = 0; i < event.results.length; i++) {
        liveText += event.results[i][0].transcript + ' ';
      }
      const trimmed = liveText.trim();
      transcriptRef.current = trimmed;
      setTranscript(trimmed);
    };

    recognition.onerror = (event) => {
      console.warn('[WhatsAppVoice] Speech error:', event.error);
    };

    return recognition;
  };

  // Start Hold Recording
  const startRecording = (clientX) => {
    holdStartTimeRef.current = Date.now();
    touchStartXRef.current = clientX;
    transcriptRef.current = '';
    isCancelledRef.current = false;
    setTranscript('');
    setIsCancelled(false);
    setDragOffset(0);
    setRecordingSeconds(0);
    setIsHolding(true);

    triggerPhoneVibration([50]);
    playNotificationChime();

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    // Start speech recognition
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      // Speech recognition might already be active
    }
  };

  // Slide to Cancel detection
  const handleDrag = (currentX) => {
    if (!isHolding || isProcessing) return;
    const diff = touchStartXRef.current - currentX;
    setDragOffset(Math.max(0, diff));

    if (diff > 80 && !isCancelledRef.current) {
      isCancelledRef.current = true;
      setIsCancelled(true);
      triggerPhoneVibration([80]);
    } else if (diff <= 80 && isCancelledRef.current) {
      isCancelledRef.current = false;
      setIsCancelled(false);
    }
  };

  // Release to Process
  const stopRecording = async () => {
    if (!isHolding) return;

    const duration = Date.now() - holdStartTimeRef.current;
    setIsHolding(false);
    clearInterval(timerIntervalRef.current);

    // Stop speech recognition
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (e) { }

    // Check if user just tapped (< 220ms)
    if (duration < 220) {
      if (onOpenModalFallback) {
        onOpenModalFallback();
      }
      return;
    }

    // Check if user swiped to cancel
    if (isCancelledRef.current) {
      triggerPhoneVibration([120]);
      setIsCancelled(false);
      setDragOffset(0);
      setTranscript('');
      return;
    }

    // Wait brief moment to finalize last interim transcript word
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 350));

    const finalSpeech = transcriptRef.current.trim();
    if (!finalSpeech || finalSpeech.length < 2) {
      setIsProcessing(false);
      triggerPhoneVibration([60]);
      return;
    }

    triggerPhoneVibration([40, 70]);

    try {
      const todayDateStr = currentDate.toDateString();
      const currentDayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Try AI analyze API
      let parsedTask = null;
      try {
        const aiRes = await analyzeVoiceTaskAPI(finalSpeech, todayDateStr, currentDayName);
        if (aiRes && aiRes.success && aiRes.task) {
          parsedTask = aiRes.task;
        }
      } catch (err) {
        // Local fallback
      }

      if (!parsedTask) {
        parsedTask = parseSpeechToTask(finalSpeech, currentDate);
      }

      if (onTaskCreated) {
        onTaskCreated(parsedTask);
      }
    } catch (err) {
      console.error('[WhatsAppVoice] Processing error:', err);
    } finally {
      setIsProcessing(false);
      setTranscript('');
      setRecordingSeconds(0);
      setDragOffset(0);
    }
  };

  // Touch Handlers for Mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startRecording(touch.clientX);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleDrag(touch.clientX);
  };

  const handleTouchEnd = () => {
    stopRecording();
  };

  // Mouse Handlers for Desktop testing
  const handleMouseDown = (e) => {
    startRecording(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isHolding) {
      handleDrag(e.clientX);
    }
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isHolding) stopRecording();
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [isHolding]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* ── WHATSAPP-STYLE LIVE AUDIO RECORDING OVERLAY (MOBILE HUD) ── */}
      {isHolding && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent backdrop-blur-md animate-in fade-in slide-in-from-bottom-6 select-none pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-900/95 border border-slate-700/80 rounded-md-3xl p-4 shadow-2xl space-y-3 pointer-events-auto">

            {/* Top Status & Soundwave Indicator */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isCancelled ? 'bg-rose-500' : 'bg-rose-500 animate-ping'}`} />
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  {isCancelled ? 'Release to Cancel' : 'Recording Task'}
                </span>
                <span className="px-2 py-0.5 rounded-md-lg bg-slate-800 text-slate-200 text-xs font-mono font-bold">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>

              {/* Soundwave Bouncing Bars */}
              {!isCancelled && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="w-1 h-7 bg-purple-500 rounded-full animate-bounce [animation-delay:100ms]" />
                  <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:250ms]" />
                </div>
              )}
            </div>

            {/* Live Real-Time Speech Preview */}
            <div className="p-3 rounded-md bg-slate-950/70 border border-slate-800/80 min-h-[44px] flex items-center">
              <p className="text-xs font-semibold text-slate-100 italic leading-relaxed truncate">
                {transcript ? `“${transcript}”` : 'Speak clearly (e.g., "Schedule client review tomorrow at 2 PM")...'}
              </p>
            </div>

            {/* Bottom Slide to Cancel & Release Action */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div
                className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isCancelled ? 'text-rose-400 scale-105' : 'text-slate-400'
                  }`}
                style={{ transform: `translateX(-${Math.min(dragOffset * 0.5, 30)}px)` }}
              >
                {isCancelled ? (
                  <>
                    <Trash2 className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span className="font-black text-rose-300">Slide to cancel (Release now)</span>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 animate-pulse" />
                    <span>Slide left to cancel</span>
                  </>
                )}
              </div>

              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Release to Create</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI PROCESSING LOADER HUD ── */}
      {isProcessing && (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4 pointer-events-none">
          <div className="max-w-md mx-auto bg-indigo-950/95 border border-indigo-500/50 text-white rounded-md p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-white">AI Autocorrecting & Scheduling Task...</h4>
                <p className="text-[10px] text-indigo-200 truncate">Extracting date, priority & checkpoints</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
          </div>
        </div>
      )}

      {/* ── FLOATING WHATSAPP-STYLE MIC BUTTON (MOBILE & TABLET) ── */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 select-none">
        <button
          type="button"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xl active:scale-95 border-2 border-white dark:border-slate-900 ${isHolding
            ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 scale-110 shadow-rose-600/40'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-600/35'
            }`}
          title="Hold to talk, release to create task (like WhatsApp)"
          aria-label="Hold to talk with voice AI"
        >
          {isHolding ? (
            <Mic className="w-6 h-6 animate-pulse" />
          ) : (
            <Mic className="w-6 h-6" />
          )}

          {/* Floating 'Hold to Talk' Pill Hint */}
          {!isHolding && !isProcessing && (
            <span className="absolute -top-6 right-0 px-2 py-0.5 bg-slate-900/90 text-white text-[9px] font-black rounded-full uppercase tracking-wider whitespace-nowrap border border-slate-700 shadow-md pointer-events-none">
              Hold to Talk
            </span>
          )}
        </button>
      </div>
    </>
  );
}
