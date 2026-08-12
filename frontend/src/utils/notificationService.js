// Native System Web Notification Utility for Mobile & Desktop Browsers
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
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

export const sendSystemNotification = async (title, options = {}) => {
  if (!('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      const defaultOptions = {
        icon: '/codigix-logo.svg',
        badge: '/codigix-logo.svg',
        vibrate: [200, 100, 200],
        tag: options.tag || 'codigix-notification-' + Date.now(),
        renotify: true,
        ...options
      };

      // Try ServiceWorker notification first for mobile device background compatibility
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, defaultOptions);
            return;
          }
        } catch (e) {
          // Fallback to direct Web Notification API
        }
      }

      new Notification(title, defaultOptions);
    }
  } catch (err) {
    console.error('Error delivering native system notification:', err);
  }
};
