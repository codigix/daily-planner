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
import { buildReminders, readDietCompletions } from './utils/reminderSchedule';
import { enablePush, syncReminderSchedule, importPushFiredKeys } from './utils/pushService';

import { Lock, LogIn } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { sendSystemNotification } from './utils/notificationService';
import { deduplicateTasks, deduplicateTimeline } from './utils/plannerDeduplication';

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
        Notification.requestPermission()
          .then((result) => {
            if (result === 'granted') window.dispatchEvent(new CustomEvent('app:push-permission-changed'));
          })
          .catch(() => { });
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

  // ── Reminders ──
  // buildReminders() is the single source of truth. While the app is open this
  // scheduler shows them (toast in foreground); the same list is uploaded to the
  // backend so Web Push delivers them on time when the PWA is closed or backgrounded.
  const [reminderInputsVersion, setReminderInputsVersion] = useState(0);
  const [pushVersion, setPushVersion] = useState(0);

  useEffect(() => {
    // Diet completions live in localStorage; WeeklyDietManager announces changes
    const bump = () => setReminderInputsVersion(v => v + 1);
    window.addEventListener('app:reminders-changed', bump);
    return () => window.removeEventListener('app:reminders-changed', bump);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkReminders = async () => {
      // Skip anything the service worker already showed while the app was closed
      await importPushFiredKeys();
      if (cancelled) return;
      const now = Date.now();
      buildReminders({ plannerTasks, customDietItems, completions: readDietCompletions(), days: 1 })
        .filter(r => r.fireAt <= now && now < r.expiresAt)
        .forEach(r => {
          sendSystemNotification(r.title, {
            body: r.body,
            taskId: r.taskId,
            mealId: r.mealId,
            day: r.day,
            type: r.type,
            url: r.url,
            tag: r.tag,
            toastType: r.toastType,
            dedupeKey: r.dedupeKey
          });
        });
    };

    checkReminders();
    const timerId = setInterval(checkReminders, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkReminders(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timerId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [plannerTasks, customDietItems, reminderInputsVersion]);

  // Register this device for Web Push once signed in with permission granted
  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) return;
    const tryEnablePush = async () => {
      if (Notification.permission !== 'granted') return;
      const res = await enablePush();
      if (res.ok) setPushVersion(v => v + 1);
      else console.info('[Push] Background notifications unavailable:', res.reason);
    };
    tryEnablePush();
    window.addEventListener('app:push-permission-changed', tryEnablePush);
    return () => window.removeEventListener('app:push-permission-changed', tryEnablePush);
  }, [user]);

  // Upload the next 2 days of reminders for Web Push: shortly after any change, right
  // when the app goes to the background, and hourly so the window keeps rolling
  useEffect(() => {
    if (!user) return;
    const sync = () => syncReminderSchedule(
      buildReminders({ plannerTasks, customDietItems, completions: readDietCompletions(), days: 2 })
    );
    const debounce = setTimeout(sync, 1500);
    const hourly = setInterval(sync, 60 * 60 * 1000);
    const onHidden = () => { if (document.visibilityState === 'hidden') sync(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      clearTimeout(debounce);
      clearInterval(hourly);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [user, plannerTasks, customDietItems, reminderInputsVersion, pushVersion]);

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
      } else if (event.data?.type === 'PUSH_REMINDER') {
        // A push arrived while the app is on screen: show it in-app (deduped with the local scheduler)
        const p = event.data.payload || {};
        sendSystemNotification(p.title || 'Reminder', {
          body: p.body,
          url: p.url,
          tag: p.tag,
          dedupeKey: p.dedupeKey
        });
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
