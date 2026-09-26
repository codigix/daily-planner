// Native System Web Notification & Audio Alert Utility for Mobile Phones & Desktop Browsers

// Reusable audio context with automatic user-gesture unlock for mobile iOS / Android
let sharedAudioCtx = null;
let audioUnlocked = false;

const initAudioUnlock = () => {
  if (typeof window === 'undefined' || audioUnlocked) return;
  
  const unlock = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        if (!sharedAudioCtx) {
          sharedAudioCtx = new AudioContextClass();
        }
        if (sharedAudioCtx.state === 'suspended') {
          sharedAudioCtx.resume();
        }
      }
      audioUnlocked = true;
    } catch (e) {
      // Audio context might remain locked
    }
  };

  ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlock, { once: true, passive: true });
  });
};

initAudioUnlock();

// Web Audio API Chime for audible alerts even on mobile phones
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    
    const audioCtx = sharedAudioCtx;
    const now = audioCtx.currentTime;
    
    // First high note (E5 - 659 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second resonant note (A5 - 880 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.warn('[Audio Alert] Sound playback warning:', e.message);
  }
};

// Phone physical vibration feedback (supported on Android Chrome & modern mobile web)
export const triggerPhoneVibration = (pattern = [300, 100, 300, 100, 400]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Vibration not supported
  }
};

// Check full capability of notification environment
export const checkNotificationSupport = () => {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unsupported', isSecure: false, hasServiceWorker: false };
  }
  const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'unsupported';
  const hasServiceWorker = 'serviceWorker' in navigator;

  return { supported, permission, isSecure, hasServiceWorker };
};

// Request Notification Permission with mobile feedback
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support system notifications.');
    return { granted: false, reason: 'unsupported' };
  }

  // Pre-unlock audio context on user click
  playNotificationChime();

  if (Notification.permission === 'granted') {
    return { granted: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, reason: 'denied', permission: 'denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted', permission };
  } catch (e) {
    console.error('Permission request failed:', e);
    return { granted: false, reason: 'error', error: e.message };
  }
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

// Send Rich Native System Notification optimized for PWA Mobile Phones & Desktop
export const sendSystemNotification = async (title, options = {}) => {
  // Always trigger sound & phone vibration for audio/haptic alert
  playNotificationChime();
  triggerPhoneVibration(options.vibrate || [300, 100, 300, 100, 400]);

  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch (e) {
        // user may dismiss prompt
      }
    }

    if (perm === 'granted') {
      const defaultOptions = {
        icon: '/app-icon.png',
        badge: '/app-icon.png',
        vibrate: [300, 100, 300, 100, 400],
        tag: options.tag || 'codigix-reminder-' + (options.taskId || options.mealId || Date.now()),
        renotify: true,
        requireInteraction: false,
        data: {
          taskId: options.taskId || null,
          mealId: options.mealId || null,
          day: options.day || null,
          url: options.url || '/planner',
          ...options.data
        },
        ...options
      };

      // ServiceWorker registration.showNotification is REQUIRED for PWA on Android and mobile background
      if ('serviceWorker' in navigator) {
        try {
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 2000))
          ]);
          if (registration && typeof registration.showNotification === 'function') {
            await registration.showNotification(title, defaultOptions);
            return;
          }
        } catch (e) {
          // Service worker timeout or failure, proceed to direct fallback
        }
      }

      // Direct Web Notification fallback (Desktop browser)
      try {
        new Notification(title, defaultOptions);
      } catch (err) {
        // Some mobile browsers forbid new Notification() without ServiceWorker
      }
    }
  } catch (err) {
    console.error('Error delivering native system notification:', err);
  }
};

// ── WhatsApp Direct Alert Link Generator ──
// Gives user an instant, 100% fail-safe way to receive or send task/diet alerts directly on WhatsApp mobile
export const openWhatsAppAlert = (message, phone = '') => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  return url;
};
