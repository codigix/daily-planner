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
  createClientAPI 
} from './services/api';

import { Lock, LogIn } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { sendSystemNotification } from './utils/notificationService';

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
  const [isDark, setIsDark] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
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
            setPlannerTasks(pData.plannerTasks);
            if (Array.isArray(pData.scheduleTimeline)) setScheduleTimeline(pData.scheduleTimeline);
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
      const pendingCount = displayPlannerTasks.filter(t => !t.completed).length;
      return { ...item, badge: pendingCount };
    }
    return item;
  });

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Handlers for adding new items with API calls & native system notifications
  const handleAddPlannerTask = async (newTask) => {
    setPlannerTasks(prev => [newTask, ...prev]);
    await createPlannerTaskAPI(newTask);
    sendSystemNotification('New Task Added 📋', {
      body: `"${newTask.title || 'Task'}" added to Daily Planner.`,
      tag: 'task-' + Date.now()
    });
  };

  const handleAddMeeting = async (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    await createMeetingAPI(newMeeting);
    sendSystemNotification('Meeting Scheduled 📅', {
      body: `"${newMeeting.title || 'Meeting'}" with ${newMeeting.client || 'Client'}.`,
      tag: 'meeting-' + Date.now()
    });
  };

  const handleAddClient = async (newClient) => {
    setClients(prev => [newClient, ...prev]);
    await createClientAPI(newClient);
    sendSystemNotification('Client Follow-up Logged 🤝', {
      body: `${newClient.name || 'Client'} added to Follow-ups.`,
      tag: 'client-' + Date.now()
    });
  };

  return (
    <div className={`min-h-screen bg-[#f4f6fa] dark:bg-slate-950 transition-colors duration-300 font-sans ${isDark ? 'dark text-slate-100' : 'text-slate-800'}`}>
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
        isPWAInstalled={isInstalled}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        plannerTasks={displayPlannerTasks}
        meetings={displayMeetings}
        clients={displayClients}
      />

      {/* Main Content Area — All Pages Accessible & Display 0/Empty State when Unauthenticated */}
      <main className={`p-3 sm:p-6 transition-all duration-300 ml-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
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
        </div>
      </main>

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
