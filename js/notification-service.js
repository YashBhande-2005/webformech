(function () {
  const STORAGE_KEY = 'ump_notifications';

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function writeStore(notifications) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (_) {}
  }

  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = Math.max(0, now - new Date(timestamp).getTime());
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const NotificationService = {
    getAll() {
      return readStore();
    },
    getUnreadCount() {
      return readStore().filter(n => !n.read).length;
    },
    markAllAsRead() {
      const updated = readStore().map(n => ({ ...n, read: true }));
      writeStore(updated);
      return updated;
    },
    markAsRead(id) {
      const updated = readStore().map(n => (n.id === id ? { ...n, read: true } : n));
      writeStore(updated);
      return updated;
    },
    addNotifications(notifications) {
      const current = readStore();
      const withDefaults = notifications.map((n) => ({
        id: n.id || Date.now() + Math.floor(Math.random() * 1000),
        title: n.title || (n.serviceType ? `Request: ${n.serviceType}` : 'New Update'),
        message: n.message || n.description || 'You have a new notification',
        timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
        distance: n.distance,
        read: false
      }));
      const updated = [...withDefaults, ...current].slice(0, 100);
      writeStore(updated);
      try {
        const evt = new CustomEvent('newNotification', { detail: { notifications: withDefaults } });
        document.dispatchEvent(evt);
      } catch (_) {}
      return updated;
    },
    formatTimeAgo
  };

  window.NotificationService = NotificationService;

  if (window.notificationSystem && typeof window.notificationSystem.handleNewNotifications === 'function') {
    const original = window.notificationSystem.handleNewNotifications.bind(window.notificationSystem);
    window.notificationSystem.handleNewNotifications = function (notifications) {
      try { NotificationService.addNotifications(notifications || []); } catch (_) {}
      return original(notifications);
    };
  }
})();


