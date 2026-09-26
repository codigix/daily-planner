import React, { useState, useEffect, useRef } from 'react';
import { Clock, Bell, CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { subscribeNotificationToast } from '../../utils/notificationService';

/**
 * Premium Modern Notification Toaster
 * - Renders dynamic push-style notification toasts
 * - Designed for both Mobile (top safe area) and Desktop (top right)
 * - Shows strictly Heading + Time for tasks
 * - Features animated progress bar, glassmorphism, swipe/tap dismissal, and type styling
 */
export default function NotificationToaster({ onNavigate }) {
  const [toasts, setToasts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // 1. Subscribe via notification service pub-sub
    const unsubscribe = subscribeNotificationToast((newToast) => {
      setToasts((prev) => {
        // Prevent duplicate toasts by tag/id
        const filtered = prev.filter((t) => t.id !== newToast.id);
        // Keep maximum 3 toasts visible at once to avoid screen clutter
        return [newToast, ...filtered].slice(0, 3);
      });
    });

    // 2. Also listen for window CustomEvents
    const handleCustomEvent = (e) => {
      if (e.detail) {
        setToasts((prev) => {
          const filtered = prev.filter((t) => t.id !== e.detail.id);
          return [e.detail, ...filtered].slice(0, 3);
        });
      }
    };
    window.addEventListener('app:notification-toast', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('app:notification-toast', handleCustomEvent);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast) => {
    if (toast.url && onNavigate) {
      const target = toast.url.replace(/^\//, '');
      onNavigate(target || 'planner');
    }
    removeToast(toast.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[9999] top-3 sm:top-5 inset-x-3 sm:inset-x-auto sm:right-5 sm:w-[380px] flex flex-col gap-2.5 pointer-events-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role="region"
      aria-label="Notification Alerts"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          isPaused={isPaused}
          onDismiss={() => removeToast(toast.id)}
          onClick={() => handleToastClick(toast)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, isPaused, onDismiss, onClick }) {
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = 25; // 40fps progress update
    const timer = setInterval(() => {
      elapsedRef.current += interval;
      const remainingPct = Math.max(0, 100 - (elapsedRef.current / duration) * 100);
      setProgress(remainingPct);

      if (elapsedRef.current >= duration) {
        clearInterval(timer);
        onDismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, onDismiss]);

  const isTask = toast.type === 'task' || !toast.type;
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';

  // Accent styling based on alert type in LIGHT theme
  let accentBorder = 'border-blue-100 hover:border-blue-200 shadow-blue-500/10';
  let badgeColor = 'bg-blue-50 text-blue-600 border-blue-200/80';
  let glowColor = 'from-blue-50/70 to-indigo-50/40';
  let iconComponent = <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
  let progressBarBg = 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600';

  if (isSuccess) {
    accentBorder = 'border-emerald-100 hover:border-emerald-200 shadow-emerald-500/10';
    badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200/80';
    glowColor = 'from-emerald-50/70 to-teal-50/40';
    iconComponent = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
    progressBarBg = 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600';
  } else if (isError) {
    accentBorder = 'border-rose-100 hover:border-rose-200 shadow-rose-500/10';
    badgeColor = 'bg-rose-50 text-rose-600 border-rose-200/80';
    glowColor = 'from-rose-50/70 to-red-50/40';
    iconComponent = <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
    progressBarBg = 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600';
  } else if (isWarning) {
    accentBorder = 'border-amber-100 hover:border-amber-200 shadow-amber-500/10';
    badgeColor = 'bg-amber-50 text-amber-600 border-amber-200/80';
    glowColor = 'from-amber-50/70 to-orange-50/40';
    iconComponent = <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
    progressBarBg = 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600';
  }

  // Strictly heading only and time only for tasks
  const headingText = toast.title || 'Task Reminder';
  const timeText = toast.time || toast.body || '';

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-md bg-white/95 backdrop-blur-xl text-slate-900 border ${accentBorder} shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.06)] transition-all duration-300 animate-in slide-in-from-top-3 fade-in group cursor-pointer active:scale-[0.99]`}
      onClick={onClick}
    >
      {/* Subtle Light Glow Tint */}
      <div className={`absolute inset-0 bg-gradient-to-r ${glowColor} opacity-90 pointer-events-none`} />

      <div className="relative p-3.5 sm:p-4 flex items-center justify-between gap-3">
        {/* Left: Icon Badge & Content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2.5 rounded-md ${badgeColor} border shrink-0 flex items-center justify-center shadow-xs`}>
            {iconComponent}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            {/* Heading / Task Title Only */}
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug truncate">
              {headingText}
            </h4>

            {/* Time Only (for Tasks) or Message (for generic alerts) */}
            {isTask ? (
              timeText ? (
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-600">
                  <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">{timeText}</span>
                </div>
              ) : null
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
                {toast.body || toast.message || ''}
              </p>
            )}
          </div>
        </div>

        {/* Right: Dismiss button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md-lg hover:bg-slate-100 active:bg-slate-200 transition-all cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress countdown bar */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          className={`h-full ${progressBarBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
