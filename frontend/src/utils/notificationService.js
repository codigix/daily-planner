// Native System Web Notification & Audio Alert Utility for Mobile Phones & Desktop Browsers

// Web Audio API Chime for audible alerts even in silent/background modes
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    // First high note
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second resonant note
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio context may be restricted before first gesture
  }
};

// Phone physical vibration feedback (supported on Android Chrome & modern mobile web)
export const triggerPhoneVibration = (pattern = [300, 100, 300, 100, 400]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Vibration not supported or allowed
  }
};

// Request Notification Permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support system notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Permission request failed:', e);
      return false;
    }
  }

  return false;
};

// ── In-App Notification Toaster Event Bus ──
const toastListeners = new Set();

export const subscribeNotificationToast = (listener) => {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
};

export const showNotificationToast = (toast = {}) => {
  const item = {
    id: toast.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: toast.title || 'Notification',
    time: toast.time || toast.body || '',
    body: toast.body || '',
    type: toast.type || 'task',
    duration: toast.duration || 4500,
    taskId: toast.taskId || null,
    mealId: toast.mealId || null,
    url: toast.url || '/planner',
    createdAt: Date.now()
  };

  toastListeners.forEach((fn) => {
    try {
      fn(item);
    } catch (e) {
      console.error('Toast listener error:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:notification-toast', { detail: item }));
  }

  return item.id;
};

// Send Rich Notification optimized for Mobile Phones & Service Workers
export const sendSystemNotification = async (title, options = {}) => {
  // Always trigger sound & phone vibration regardless of notification display permission
  playNotificationChime();
  triggerPhoneVibration(options.vibrate || [300, 100, 300, 100, 400]);

  // Always display high-end in-app Notification Toaster banner
  showNotificationToast({
    title,
    time: options.body || '',
    body: options.body || '',
    type: options.type || 'task',
    taskId: options.taskId,
    mealId: options.mealId,
    url: options.url || '/planner',
    duration: options.duration || 5000
  });

  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      const defaultOptions = {
        icon: '/pwa-192x192.svg',
        badge: '/pwa-192x192.svg',
        vibrate: [300, 100, 300, 100, 400],
        tag: options.tag || 'codigix-reminder-' + (options.taskId || options.mealId || Date.now()),
        renotify: true,
        requireInteraction: true,
        data: {
          taskId: options.taskId || null,
          mealId: options.mealId || null,
          day: options.day || null,
          url: options.url || '/planner',
          ...options.data
        },
        ...options
      };

      // ServiceWorker notification is REQUIRED on mobile phones (Android PWA & mobile background)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, defaultOptions);
            return;
          }
        } catch (e) {
          console.warn('Service worker notification failed, trying direct notification:', e);
        }
      }

      // Direct Web Notification fallback
      new Notification(title, defaultOptions);
    }
  } catch (err) {
    console.error('Error delivering native system notification:', err);
  }
};

