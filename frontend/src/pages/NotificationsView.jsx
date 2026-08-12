import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  CheckSquare,
  DollarSign,
  Share2,
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Trash2,
  X
} from 'lucide-react';
import { fetchNotificationsAPI, markNotificationsReadAPI } from '../services/api';
import { requestNotificationPermission, sendSystemNotification } from '../utils/notificationService';

export default function NotificationsView({ plannerTasks = [], onNavigate, onOpenAI }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'overdue', 'urgent', 'today', 'finance', 'system'
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Load real-time system notifications
  useEffect(() => {
    loadNotifications();
  }, [plannerTasks]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetchNotificationsAPI();
      if (res && res.success && res.notifications) {
        setNotifications(res.notifications);
      } else {
        // Fallback: Generate dynamically from plannerTasks prop if offline
        generateFallbackNotifications();
      }
    } catch (err) {
      console.error('Failed to fetch notifications API:', err);
      generateFallbackNotifications();
    } finally {
      setLoading(false);
    }
  }

  function generateFallbackNotifications() {
    const now = new Date();
    const generated = [];

    (plannerTasks || []).forEach((t) => {
      const isCompleted = t.status === 'Completed' || t.status === 'Done' || t.completed;
      const isHigh = t.priority === 'High' || t.priority === 'Urgent';

      let dueDate = t.dueDate ? new Date(t.dueDate) : (t.scheduled_time ? new Date(t.scheduled_time) : null);
      const isOverdue = !isCompleted && dueDate && dueDate < now;
      const isDueToday = !isCompleted && dueDate && dueDate.toDateString() === now.toDateString();

      if (isOverdue) {
        generated.push({
          id: `task_overdue_${t.id}`,
          type: 'task',
          category: 'overdue',
          severity: 'urgent',
          title: `Overdue Task: ${t.title}`,
          message: `Task is overdue since ${dueDate.toLocaleDateString('en-IN')}. Please prioritize completion.`,
          timestamp: t.created_at || new Date().toISOString(),
          unread: true,
          actionUrl: '/planner'
        });
      } else if (isHigh && !isCompleted) {
        generated.push({
          id: `task_urgent_${t.id}`,
          type: 'task',
          category: 'urgent',
          severity: 'warning',
          title: `High Priority Task: ${t.title}`,
          message: `High priority task pending in category "${t.category || 'General'}".`,
          timestamp: t.created_at || new Date().toISOString(),
          unread: true,
          actionUrl: '/planner'
        });
      } else if (isDueToday) {
        generated.push({
          id: `task_today_${t.id}`,
          type: 'task',
          category: 'today',
          severity: 'info',
          title: `Scheduled Today: ${t.title}`,
          message: `Task scheduled for execution today.`,
          timestamp: t.created_at || new Date().toISOString(),
          unread: false,
          actionUrl: '/planner'
        });
      }
    });

    setNotifications(generated);
  }

  // Handle Mark Single as Read
  const handleMarkAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    try {
      await markNotificationsReadAPI([id]);
    } catch (e) { }
  };

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markNotificationsReadAPI([], true);
    } catch (e) { }
  };

  // Handle Clear Notification
  const handleClear = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesCategory =
      selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;
  const overdueCount = notifications.filter((n) => n.category === 'overdue').length;
  const urgentCount = notifications.filter((n) => n.category === 'urgent').length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Top Header Card */}
      <div className="card-base border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Notifications Hub
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Notifications & Operational Alerts</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              Real-time overdue reminders, urgent execution items, finance invoices, and system updates.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  sendSystemNotification('System Push Notifications Active 🔔', {
                    body: 'You will receive real-time push alerts on Mobile & Desktop for tasks & meetings.'
                  });
                } else {
                  alert('Please allow notification permission in browser or mobile phone settings.');
                }
              }}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl sm:rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span>Enable Mobile Push</span>
            </button>

            <button
              onClick={handleMarkAllRead}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>Mark All Read</span>
            </button>

            <button
              onClick={loadNotifications}
              className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer"
              title="Refresh Notifications"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Category Switcher Tabs (Desktop: visible pills | Mobile: scrollable bar) */}
        <div className="hidden sm:flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Category:
          </span>
          {[
            { id: 'all', label: `All Alerts (${notifications.length})` },
            { id: 'overdue', label: `Overdue (${overdueCount})`, badgeColor: 'bg-rose-500' },
            { id: 'urgent', label: `Urgent (${urgentCount})`, badgeColor: 'bg-amber-500' },
            { id: 'today', label: "Today's Schedule" },
            { id: 'finance', label: 'Finance Invoices' },
            { id: 'system', label: 'System Alerts' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
            >
              {cat.badgeColor && (
                <span className={`w-2 h-2 rounded-full ${cat.badgeColor}`} />
              )}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar Input (Mobile & Desktop) */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search notifications or task titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Notifications List Cards */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredNotifications.map((item) => {
          let severityBg = 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50';
          let icon = <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;

          if (item.severity === 'urgent') {
            severityBg = 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50';
            icon = <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />;
          } else if (item.severity === 'warning') {
            severityBg = 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
            icon = <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />;
          } else if (item.severity === 'success') {
            severityBg = 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50';
            icon = <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />;
          }

          return (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${severityBg} ${item.unread ? 'border-l-4 border-l-blue-600 shadow-sm' : 'opacity-85'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0 mt-0.5">
                  {icon}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    {item.unread && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] sm:text-[9px] font-black uppercase">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                    {item.message}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                    {new Date(item.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800/50 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                {item.unread && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] sm:text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}

                <button
                  onClick={() => handleClear(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-all"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="card-base p-8 sm:p-12 text-center space-y-2.5">
            <div className="p-3 sm:p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">All Clear! No Pending Notifications</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 max-w-md mx-auto">
              Your tasks are up to date and all operational system alerts have been reviewed cleanly.
            </p>
          </div>
        )}
      </div>

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Notification Filters"
      >
        <Filter className="w-6 h-6 text-white" />
      </button>

      {/* ── Mobile Filters Drawer Modal ── */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Notification Filters</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Search Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Alerts</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or message..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Alert Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: `All Alerts (${notifications.length})` },
                    { id: 'overdue', label: `Overdue (${overdueCount})` },
                    { id: 'urgent', label: `Urgent (${urgentCount})` },
                    { id: 'today', label: "Today's Schedule" },
                    { id: 'finance', label: 'Finance Invoices' },
                    { id: 'system', label: 'System Alerts' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${selectedCategory === cat.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

