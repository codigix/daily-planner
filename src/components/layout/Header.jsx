import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  User,
  Settings,
  X,
  Keyboard,
  Briefcase,
  Menu,
  LogOut, 
  LogIn, 
  UserPlus
} from 'lucide-react';
import { fetchNotificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Header({ 
  user: defaultUser, 
  collapsed, 
  activeTab, 
  isDark, 
  toggleTheme, 
  onOpenAI,
  onOpenModal,
  onOpenAuthModal,
  onNavigate,
  mobileOpen,
  setMobileOpen,
  plannerTasks = [],
  meetings = [],
  clients = []
}) {
  const { user: authUser, logout } = useAuth();
  const activeUser = authUser ? {
    name: authUser.fullName || authUser.email,
    role: authUser.role || 'Executive',
    avatar: authUser.avatarUrl || defaultUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    email: authUser.email
  } : defaultUser;

  // Dropdown & Modal States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const headerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowMobileSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format current live date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const [selectedDate, setSelectedDate] = useState(todayFormatted);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotificationsAPI().then(res => {
      if (res && res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    }).catch(console.error);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Live search filtering across tasks, meetings, and clients
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const taskMatches = plannerTasks
      .filter(t => (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(t => ({ type: 'Task', title: t.title, subtitle: t.category, tab: 'planner' }));
      
    const meetingMatches = meetings
      .filter(m => (m.title || '').toLowerCase().includes(q) || (m.client || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(m => ({ type: 'Meeting', title: m.title, subtitle: m.client, tab: 'meetings' }));

    const clientMatches = clients
      .filter(c => (c.company || '').toLowerCase().includes(q) || (c.contactPerson || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ type: 'Client', title: c.company, subtitle: c.contactPerson, tab: 'clients' }));

    setSearchResults([...taskMatches, ...meetingMatches, ...clientMatches]);
  }, [searchQuery, plannerTasks, meetings, clients]);

  return (
    <>
      <header 
        ref={headerRef}
        className={`sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between transition-all duration-300 ml-0 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Left Header Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen && setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            title="Toggle Mobile Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo & Name */}
          <div 
            onClick={() => onNavigate && onNavigate('dashboard')} 
            className="flex items-center gap-2 cursor-pointer lg:hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <span className="font-black text-base tracking-tighter">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs tracking-tight text-slate-900 dark:text-white leading-none">
                CODIGIX
              </span>
              <span className="text-[8px] font-extrabold tracking-widest text-blue-600 uppercase mt-0.5">
                INFOTECH
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:relative lg:block lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, meetings, clients..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 px-3 py-1">Search Results ({searchResults.length})</div>
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (onNavigate) onNavigate(item.tab);
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.subtitle}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => {
              setShowMobileSearch(!showMobileSearch);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Live Date Pill (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-100/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>{selectedDate}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Dark / Light Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* AI Assistant Quick Trigger (Desktop) */}
          <button
            onClick={onOpenAI}
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          {/* Notifications Hub Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
                setShowMobileSearch(false);
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                {unreadCount > 0 ? unreadCount : 6}
              </span>
            </button>

            {/* Notifications Dropdown Overlay */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Notifications</h4>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Mark read
                    </button>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        if (onNavigate) onNavigate('notifications');
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      View All ➜
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          setShowNotifications(false);
                          if (onNavigate) onNavigate('notifications');
                        }}
                        className={`p-2.5 rounded-xl text-xs flex gap-2.5 items-start justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all ${
                          n.unread ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.severity === 'urgent' ? 'bg-rose-500' : n.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="text-slate-900 dark:text-slate-100 font-extrabold text-xs">{n.title || n.text}</p>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-tight mt-0.5">{n.message || n.text}</p>
                            <span className="text-[10px] text-slate-400 font-normal mt-1 block">{n.time || new Date(n.timestamp || Date.now()).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-semibold">All notifications cleared</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Dropdown Toggle */}
          <div className="relative">
            <div 
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
                setShowMobileSearch(false);
              }}
              className="relative cursor-pointer shrink-0"
              title="Profile & Account Menu"
            >
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>

            {/* Profile Dropdown Overlay Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 space-y-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5">
                  <span className="font-black text-xs text-slate-900 dark:text-white block truncate">{activeUser.name}</span>
                  <span className="text-[10px] font-bold text-blue-600 block">{activeUser.role} Account</span>
                  {activeUser.email && (
                    <span className="text-[9px] text-slate-400 font-mono block truncate">{activeUser.email}</span>
                  )}
                </div>

                <div className="space-y-1 text-xs font-bold pt-1 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onNavigate) onNavigate('profile');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span>View Profile & Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenAI) onOpenAI();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>AI Executive Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (setShowHelpModal) setShowHelpModal(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Executive Guide & Shortcuts</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                  {authUser ? (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 font-black transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenAuthModal) onOpenAuthModal('login');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 rounded-xl flex items-center gap-2 font-black transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In / Register</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-lg lg:hidden animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, meetings, clients..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
              autoFocus
            />
            <button 
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            {searchResults.length > 0 && (
              <div className="mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 shadow-lg">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 px-2 py-0.5">Results ({searchResults.length})</div>
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (onNavigate) onNavigate(item.tab);
                      setShowMobileSearch(false);
                      setSearchQuery('');
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-600 rounded-full">{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help / Guide Overlay Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" /> CODIGIX OS Executive Guide
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">🤖 AI Executive Assistant:</span>
                Click <strong>"AI Assistant"</strong> in the top header or page views to chat for schedule optimization and business insights.
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-blue-600" /> Platform Shortcuts:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><strong>Search:</strong> Use top search bar</div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><strong>Theme:</strong> Sun / Moon icon</div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><strong>AI Assistant:</strong> Header button</div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><strong>Sidebar:</strong> Collapse arrow</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Got it, close guide
            </button>
          </div>
        </div>
      )}
    </>
  );
}
