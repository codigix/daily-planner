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

import { 
  initialUser, 
  navItems, 
  initialPlannerTasks, 
  initialScheduleTimeline, 
  initialDomains, 
  initialMeetings, 
  initialClients 
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

import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';

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
  const [activeTab, setActiveTabState] = useState(() => getTabFromLocation());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Application Data States — planner tasks always loaded fresh from DB
  // Do NOT pre-load planner tasks from localStorage to avoid stale/duplicate data
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [scheduleTimeline, setScheduleTimeline] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(true);

  const [domains, setDomains] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);

  // Load from Express Backend API on Mount — DB is the canonical source
  useEffect(() => {
    async function initBackendData() {
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
    }
    initBackendData();
  }, []);

  // Sync planner tasks to localStorage as optional client cache (DB is authoritative)
  useEffect(() => {
    if (!plannerLoading) {
      localStorage.setItem('codigix_planner_tasks', JSON.stringify(plannerTasks));
    }
  }, [plannerTasks, plannerLoading]);

  useEffect(() => {
    localStorage.setItem('codigix_schedule_timeline', JSON.stringify(scheduleTimeline));
  }, [scheduleTimeline]);

  useEffect(() => {
    localStorage.setItem('codigix_domains', JSON.stringify(domains));
  }, [domains]);

  useEffect(() => {
    localStorage.setItem('codigix_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('codigix_clients', JSON.stringify(clients));
  }, [clients]);

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Handlers for adding new items with API calls
  const handleAddPlannerTask = async (newTask) => {
    setPlannerTasks(prev => [newTask, ...prev]);
    await createPlannerTaskAPI(newTask);
  };

  const handleAddMeeting = async (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    await createMeetingAPI(newMeeting);
  };

  const handleAddClient = async (newClient) => {
    setClients(prev => [newClient, ...prev]);
    await createClientAPI(newClient);
  };

  return (
    <div className={`min-h-screen bg-[#f4f6fa] dark:bg-slate-950 transition-colors duration-300 font-sans ${isDark ? 'dark text-slate-100' : 'text-slate-800'}`}>
      {/* Common Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isDark={isDark}
        toggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Common Header */}
      <Header
        user={initialUser}
        collapsed={collapsed}
        activeTab={activeTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onOpenAI={() => setActiveModal('ai')}
        onOpenModal={(type) => setActiveModal(type)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onNavigate={(tab) => setActiveTab(tab)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        plannerTasks={plannerTasks}
        meetings={meetings}
        clients={clients}
      />

      {/* Main Content Area */}
      <main className={`p-3 sm:p-6 transition-all duration-300 ml-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={initialUser}
              plannerTasks={plannerTasks}
              domains={domains}
              meetings={meetings}
              clients={clients}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAI={() => setActiveModal('ai')}
            />
          )}

          {activeTab === 'planner' && (
            <DailyPlannerView
              plannerTasks={plannerTasks}
              setPlannerTasks={setPlannerTasks}
              scheduleTimeline={scheduleTimeline}
              setScheduleTimeline={setScheduleTimeline}
              onOpenAI={() => setActiveModal('ai')}
              onAddTask={() => setActiveModal('task')}
              isLoading={plannerLoading}
            />
          )}

          {activeTab === 'logger' && (
            <DailyTaskLoggerView
              domains={domains}
              setDomains={setDomains}
              plannerTasks={plannerTasks}
              setPlannerTasks={setPlannerTasks}
              meetings={meetings}
              clients={clients}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingManagerView
              meetings={meetings}
              setMeetings={setMeetings}
              onScheduleMeeting={() => setActiveModal('meeting')}
              onOpenAI={() => setActiveModal('ai')}
            />
          )}

          {activeTab === 'followups' && (
            <ClientFollowupsView
              clients={clients}
              setClients={setClients}
              onAddFollowup={() => setActiveModal('client')}
              onOpenAI={() => setActiveModal('ai')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesKPIView 
              clients={clients}
              setClients={setClients}
              plannerTasks={plannerTasks}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'projects' && (
            <ProjectKPIView 
              plannerTasks={plannerTasks}
              clients={clients}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'team' && (
            <TeamPerformanceView 
              domains={domains}
              plannerTasks={plannerTasks}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'finance' && (
            <FinanceDashboardView 
              clients={clients}
              plannerTasks={plannerTasks}
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
              clients={clients}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIExecutiveAssistantView onOpenAI={() => setActiveModal('ai')} />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              plannerTasks={plannerTasks}
              meetings={meetings}
              clients={clients}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView 
              user={initialUser}
              plannerTasks={plannerTasks}
              meetings={meetings}
              clients={clients}
              domains={domains}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAI={() => setActiveModal('ai')} 
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView 
              plannerTasks={plannerTasks}
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
