import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileBottomNav from './components/layout/MobileBottomNav';
import DashboardView from './pages/DashboardView';
import DailyPlannerView from './pages/DailyPlannerView';
import DailyTaskLoggerView from './pages/DailyTaskLoggerView';
import MeetingManagerView from './pages/MeetingManagerView';
import ClientFollowupsView from './pages/ClientFollowupsView';
import SalesKPIView from './pages/SalesKPIView';
import ProjectKPIView from './pages/ProjectKPIView';
import MarketingDashboardView from './pages/MarketingDashboardView';
import TeamPerformanceView from './pages/TeamPerformanceView';
import FinanceDashboardView from './pages/FinanceDashboardView';
import CreateQuotationView from './pages/CreateQuotationView';
import AIExecutiveAssistantView from './pages/AIExecutiveAssistantView';
import ReportsView from './pages/ReportsView';
import ProfileView from './pages/ProfileView';
import NotificationsView from './pages/NotificationsView';
import GenericModuleView from './pages/GenericModuleView';
import ModalContainer from './components/modals/ModalContainer';
import NotificationToaster from './components/common/NotificationToaster';
import PageErrorBoundary from './components/common/PageErrorBoundary';
import PWAInstallModal from './components/modals/PWAInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';

import {
  navItems
} from './data/mockData';

import {
  getPlannerAPI,
  createPlannerTaskAPI,
  getDomainsAPI,
  getMeetingsAPI,
  createMeetingAPI,
  getClientsAPI,
  createClientAPI,
  getDietItemsAPI
} from './services/api';
import { customItemsForDate } from './utils/dietItems';

import { Lock, LogIn } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { sendSystemNotification } from './utils/notificationService';
import { deduplicateTasks, deduplicateTimeline } from './utils/plannerDeduplication';
import { WEEKLY_DIET_PLAN, NEXT_DAY_PREP_CHECKLIST } from './data/weeklyDietData';

const normalizeTab = (rawTab) => {
  if (!rawTab) return 'dashboard';
  const clean = rawTab.toLowerCase().replace(/^\/+|^#+/, '');
  if (clean === 'clients') return 'followups';
  if (clean === 'ai') return 'ai-assistant';
  const validTabs = [
    'dashboard', 'planner', 'logger', 'meetings', 'followups',
    'sales', 'projects', 'team', 'finance', 'create-quotation', 'marketing', 'ai-assistant', 'reports', 'profile', 'notifications', 'settings'
  ];
  return validTabs.includes(clean) ? clean : 'dashboard';
};

const getTabFromLocation = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) return normalizeTab(hash);
  const path = window.location.pathname.replace('/', '');
  if (path) return normalizeTab(path);
  return 'dashboard';
};

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTabState] = useState(() => getTabFromLocation());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [activeModal, setActiveModal] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [customDietItems, setCustomDietItems] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const setActiveTab = (tab) => {
    const norm = normalizeTab(tab);
    setActiveTabState(norm);
    const targetPath = norm === 'dashboard' ? '/' : `/${norm}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: norm }, '', targetPath);
    }
  };

  // Sync state on Browser Back / Forward & URL change
  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Proactively request native system notification permission on first user interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const askForNotificationPermission = () => {
        Notification.requestPermission().catch(() => { });
      };
      window.addEventListener('click', askForNotificationPermission, { once: true, passive: true });
      window.addEventListener('touchstart', askForNotificationPermission, { once: true, passive: true });
      return () => {
        window.removeEventListener('click', askForNotificationPermission);
        window.removeEventListener('touchstart', askForNotificationPermission);
      };
    }
  }, []);

  // Application Data States — loaded per authenticated user account
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [scheduleTimeline, setScheduleTimeline] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(true);

  const [domains, setDomains] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);

  // Load from Express Backend API per authenticated user — DB is the canonical source
  useEffect(() => {
    async function initBackendData() {
      if (user) {
        setPlannerLoading(true);
        try {
          const pData = await getPlannerAPI();
          if (pData && Array.isArray(pData.plannerTasks)) {
            setPlannerTasks(deduplicateTasks(pData.plannerTasks));
            if (Array.isArray(pData.scheduleTimeline)) {
              setScheduleTimeline(deduplicateTimeline(pData.scheduleTimeline));
            }
          }
        } finally {
          setPlannerLoading(false);
        }
        const dData = await getDomainsAPI();
        if (dData && Array.isArray(dData.domains)) {
          setDomains(dData.domains);
        }
        const mData = await getMeetingsAPI();
        if (mData && Array.isArray(mData.meetings)) {
          setMeetings(mData.meetings);
        }
        const cData = await getClientsAPI();
        if (cData && Array.isArray(cData.clients)) {
          setClients(cData.clients);
        }
      } else {
        setPlannerTasks([]);
        setScheduleTimeline([]);
        setMeetings([]);
        setClients([]);
        setDomains([]);
        setPlannerLoading(false);
      }
    }
    initBackendData();
  }, [user?.id]);

  // Data passed down to views — if not logged in (user is null), display 0 data / empty state
  const displayPlannerTasks = user ? plannerTasks : [];
  const displayScheduleTimeline = user ? scheduleTimeline : [];
  const displayMeetings = user ? meetings : [];
  const displayClients = user ? clients : [];
  const displayDomains = user ? domains : [];

  // Dynamic navigation items with real badge counts
  const dynamicNavItems = navItems.map(item => {
    if (item.id === 'planner') {
      return { ...item, badge: displayPlannerTasks.length };
    }
    if (item.id === 'meetings') {
      return { ...item, badge: displayMeetings.length };
    }
    if (item.id === 'followups') {
      return { ...item, badge: displayClients.length };
    }
    if (item.id === 'notifications') {
      // Same unread count the header bell shows (0 hides the badge)
      return { ...item, badge: unreadNotifications || undefined };
    }
    return item;
  });

  // Dark mode effect with localStorage persistence
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Handlers for adding new items with API calls & native system notifications
  const handleAddPlannerTask = async (newTask) => {
    setPlannerTasks(prev => [newTask, ...prev]);
    await createPlannerTaskAPI(newTask);
    sendSystemNotification(`✅ Task added: ${newTask.title || 'New Task'}`, {
      body: newTask.time || '',
      tag: 'task-' + Date.now(),
      toastType: 'success'
    });
  };

  const handleAddMeeting = async (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    await createMeetingAPI(newMeeting);
    sendSystemNotification('Meeting Scheduled 📅', {
      body: `"${newMeeting.title || 'Meeting'}" with ${newMeeting.client || 'Client'}.`,
      tag: 'meeting-' + Date.now(),
      url: '/meetings',
      toastType: 'success'
    });
  };

  const handleAddClient = async (newClient) => {
    setClients(prev => [newClient, ...prev]);
    await createClientAPI(newClient);
    sendSystemNotification('Client Follow-up Logged 🤝', {
      body: `${newClient.name || 'Client'} added to Follow-ups.`,
      tag: 'client-' + Date.now(),
      url: '/followups',
      toastType: 'success'
    });
  };

  // ── Global Real-Time Background Notification Runner ──
  // The single scheduler for task & diet reminders, active on every tab.
  // Every alert carries a dedupeKey, so it fires once per day even if this effect
  // restarts (task list changes) or the page reloads inside a reminder window.
  useEffect(() => {
    const parseStartMinutes = (timeStr) => {
      if (!timeStr) return null;
      // "09:45 AM – 10:45 AM" → use the start of the range
      const startPart = String(timeStr).split('–')[0].split(' - ')[0].trim();
      const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const isTaskDoneForDate = (task, dateStr) => {
      if (task.completedDates && typeof task.completedDates[dateStr] === 'boolean') {
        return task.completedDates[dateStr];
      }
      return task.status === 'Completed' || task.status === 'Done' || !!task.completed;
    };

    const isTaskForDate = (task, dateStr) => {
      if (!task.date) return true; // undated tasks are daily routines
      const d = new Date(task.date);
      return isNaN(d.getTime()) ? true : d.toDateString() === dateStr;
    };

    const checkGlobalReminders = () => {
      const now = new Date();
      const todayStr = now.toDateString();
      const todayDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();

      // 1. Weekly Diet Plan items for today
      let completions = {};
      try {
        const saved = localStorage.getItem('codigix_diet_completions_v2');
        if (saved) completions = JSON.parse(saved);
      } catch (e) { }

      const todaysDietItems = [
        ...WEEKLY_DIET_PLAN.filter(item => item.day === todayDayName),
        ...customItemsForDate(customDietItems, now)
      ];
      todaysDietItems.forEach(item => {
        const status = completions[`${todayDayName}_${item.id}`]?.status;
        if (status === 'completed' || status === 'skipped') return;

        const itemMins = parseStartMinutes(item.time);
        if (itemMins === null) return;
        const diff = itemMins - currentTotalMins;
        const reminderLead = item.reminderMinutesBefore || 10;
        const dietUrl = `/planner?openDietMealId=${item.id}&openDay=${todayDayName}`;

        if (diff <= reminderLead && diff >= 1) {
          sendSystemNotification(item.taskTitle, {
            body: `In ${diff} min • ${item.timeFormatted || item.time}`,
            mealId: item.id,
            day: todayDayName,
            url: dietUrl,
            tag: `diet-lead-${item.id}`,
            dedupeKey: `diet-lead-${todayStr}-${item.id}`
          });
        }

        if (diff <= 0 && diff >= -15) {
          sendSystemNotification(`🔔 NOW: ${item.taskTitle}`, {
            body: item.timeFormatted || item.time,
            mealId: item.id,
            day: todayDayName,
            url: dietUrl,
            tag: `diet-exact-${item.id}`,
            dedupeKey: `diet-exact-${todayStr}-${item.id}`
          });
        }
      });

      // 2. 8:00 PM Next Day Ingredients Prep Alert
      const todayPrep = NEXT_DAY_PREP_CHECKLIST[todayDayName];
      const prepDiff = 20 * 60 - currentTotalMins;
      if (todayPrep && prepDiff <= 0 && prepDiff >= -30) {
        sendSystemNotification(`🛒 8:00 PM: Prepare Tomorrow's Ingredients (${todayPrep.forNextDay})`, {
          body: `Pantry checklist for ${todayPrep.forNextDay} is ready — tap to open.`,
          tag: `diet-prep-${todayDayName}`,
          type: 'nextDayPrep',
          day: todayDayName,
          url: `/planner?openNextDayPrep=1&openDay=${todayDayName}`,
          toastType: 'warning',
          dedupeKey: `prep-${todayStr}`
        });
      }

      // 3. Planner tasks scheduled for today: 5 min before, at start, then every
      //    5 min while still pending (up to 3 hours)
      (plannerTasks || []).forEach(t => {
        if (!isTaskForDate(t, todayStr) || isTaskDoneForDate(t, todayStr)) return;
        const taskMins = parseStartMinutes(t.time || t.scheduled_time);
        if (taskMins === null) return;
        const diff = taskMins - currentTotalMins;
        const base = {
          body: t.time || t.scheduled_time,
          taskId: t.id,
          url: `/planner?openTaskId=${t.id}`
        };

        if (diff <= 5 && diff >= 1) {
          sendSystemNotification(`⏰ Starting in ${diff} min: ${t.title}`, {
            ...base,
            tag: `task-${t.id}`,
            dedupeKey: `task-lead-${todayStr}-${t.id}`
          });
        } else if (diff <= 0 && diff >= -2) {
          sendSystemNotification(`📋 Now: ${t.title}`, {
            ...base,
            tag: `task-${t.id}`,
            dedupeKey: `task-exact-${todayStr}-${t.id}`
          });
        } else if (diff < -2 && diff >= -180) {
          const bucket = Math.floor(Math.abs(diff) / 5) * 5;
          if (bucket >= 5) {
            sendSystemNotification(`⚠️ Still pending: ${t.title}`, {
              ...base,
              tag: `task-${t.id}`,
              toastType: 'warning',
              dedupeKey: `task-overdue-${todayStr}-${t.id}-${bucket}`
            });
          }
        }
      });
    };

    checkGlobalReminders();
    const timerId = setInterval(checkGlobalReminders, 20000);
    return () => clearInterval(timerId);
  }, [plannerTasks, customDietItems]);

  // User-added diet items feed the reminder scheduler; reload whenever they change
  useEffect(() => {
    if (!user) {
      setCustomDietItems([]);
      return;
    }
    const loadDietItems = async () => {
      const res = await getDietItemsAPI();
      if (res.ok && Array.isArray(res.data.items)) setCustomDietItems(res.data.items);
    };
    loadDietItems();
    window.addEventListener('app:diet-items-changed', loadDietItems);
    return () => window.removeEventListener('app:diet-items-changed', loadDietItems);
  }, [user]);

  // Open the screen a notification points at (toast tap or native notification tap).
  // The query string (e.g. ?openTaskId=12) is left in the URL for the target view to
  // consume; views also listen for `app:deeplink` in case they are already mounted.
  const openNotificationTarget = (url = '/planner') => {
    let target;
    try {
      target = new URL(url, window.location.origin);
    } catch (e) {
      target = new URL('/planner', window.location.origin);
    }
    const tab = normalizeTab(target.pathname.replace(/^\//, '') || 'dashboard');
    window.history.pushState({ tab }, '', target.pathname + target.search);
    setActiveTabState(tab);
    window.dispatchEvent(new CustomEvent('app:deeplink'));
  };

  // Native notification taps are relayed by the service worker as postMessage
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const handleSWMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_TASK_CLICKED') {
        openNotificationTarget(event.data.url || '/planner');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verifying OS Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fa] dark:bg-[#070a12] transition-colors duration-300 font-sans ${isDark ? 'dark text-slate-100' : 'text-slate-800'}`}>
      {/* Common Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={dynamicNavItems}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isDark={isDark}
        toggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Common Header */}
      <Header
        user={user}
        collapsed={collapsed}
        activeTab={activeTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onOpenAI={() => setActiveModal('ai')}
        onOpenModal={(type) => setActiveModal(type)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenPWAInstall={() => setShowPWAInstallModal(true)}
        onUnreadCountChange={setUnreadNotifications}
        isPWAInstalled={isInstalled}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        plannerTasks={displayPlannerTasks}
        meetings={displayMeetings}
        clients={displayClients}
      />

      {/* Main Content Area — Require Login to Access All Sidebar Views */}
      <main className={`p-3 sm:p-6 pb-24 lg:pb-8 transition-all duration-300 ml-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {!user ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

                <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Authentication Required</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    To access the Executive OS dashboard, track planner tasks, schedule meetings, and manage company resources, please sign in.
                  </p>
                </div>

                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-[#E60023] hover:bg-[#CC001F] text-white font-extrabold text-xs rounded-md shadow-lg shadow-red-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>Sign In to Executive OS</span>
                </button>
              </div>
            </div>
          ) : (
            <PageErrorBoundary key={activeTab} onGoHome={() => setActiveTab('dashboard')}>
              {activeTab === 'dashboard' && (
                <DashboardView
                  user={user}
                  plannerTasks={displayPlannerTasks}
                  domains={displayDomains}
                  meetings={displayMeetings}
                  clients={displayClients}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'planner' && (
                <DailyPlannerView
                  plannerTasks={displayPlannerTasks}
                  setPlannerTasks={setPlannerTasks}
                  scheduleTimeline={displayScheduleTimeline}
                  setScheduleTimeline={setScheduleTimeline}
                  onOpenAI={() => setActiveModal('ai')}
                  onAddTask={() => setActiveModal('task')}
                  onOpenModal={(type) => setActiveModal(type)}
                  isLoading={plannerLoading}
                />
              )}

              {activeTab === 'logger' && (
                <DailyTaskLoggerView
                  domains={displayDomains}
                  setDomains={setDomains}
                  plannerTasks={displayPlannerTasks}
                  setPlannerTasks={setPlannerTasks}
                  meetings={displayMeetings}
                  clients={displayClients}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'meetings' && (
                <MeetingManagerView
                  meetings={displayMeetings}
                  setMeetings={setMeetings}
                  onScheduleMeeting={() => setActiveModal('meeting')}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'followups' && (
                <ClientFollowupsView
                  clients={displayClients}
                  setClients={setClients}
                  onAddFollowup={() => setActiveModal('client')}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'sales' && (
                <SalesKPIView
                  clients={displayClients}
                  setClients={setClients}
                  plannerTasks={displayPlannerTasks}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectKPIView
                  plannerTasks={displayPlannerTasks}
                  clients={displayClients}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'team' && (
                <TeamPerformanceView
                  domains={displayDomains}
                  plannerTasks={displayPlannerTasks}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'finance' && (
                <FinanceDashboardView
                  clients={displayClients}
                  plannerTasks={displayPlannerTasks}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'create-quotation' && (
                <CreateQuotationView
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'marketing' && (
                <MarketingDashboardView
                  clients={displayClients}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'ai-assistant' && (
                <AIExecutiveAssistantView
                  user={user}
                  plannerTasks={displayPlannerTasks}
                  meetings={displayMeetings}
                  clients={displayClients}
                  domains={displayDomains}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  plannerTasks={displayPlannerTasks}
                  meetings={displayMeetings}
                  clients={displayClients}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  user={user}
                  plannerTasks={displayPlannerTasks}
                  meetings={displayMeetings}
                  clients={displayClients}
                  domains={displayDomains}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView
                  plannerTasks={displayPlannerTasks}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}

              {!['dashboard', 'planner', 'logger', 'meetings', 'followups', 'sales', 'projects', 'team', 'finance', 'create-quotation', 'marketing', 'ai-assistant', 'reports', 'profile', 'notifications'].includes(activeTab) && (
                <GenericModuleView
                  moduleId={activeTab}
                  onOpenAI={() => setActiveModal('ai')}
                />
              )}
            </PageErrorBoundary>
          )}
        </div>
      </main>

      {/* In-app alert toasts (reminders, confirmations) */}
      <NotificationToaster onNavigate={openNotificationTarget} />

      {/* Modals Container */}
      <ModalContainer
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onAddPlannerTask={handleAddPlannerTask}
        onAddMeeting={handleAddMeeting}
        onAddClient={handleAddClient}
      />

      {/* Authentication Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* PWA Download / Installation Modal */}
      <PWAInstallModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={promptInstall}
      />

      {/* Floating Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTaskModal={() => setActiveModal('task')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
