import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Video,
  Users,
  TrendingUp,
  Briefcase,
  UserCheck,
  DollarSign,
  PieChart,
  Bot,
  FileText,
  Bell,
  Settings,
  Menu,
  Sparkles,
  X,
  Sun,
  Moon
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Video,
  Users,
  TrendingUp,
  Briefcase,
  UserCheck,
  DollarSign,
  PieChart,
  Bot,
  FileText,
  Bell,
  Settings
};

export default function Sidebar({ activeTab, setActiveTab, navItems, collapsed, setCollapsed, isDark, toggleTheme, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-transform lg:transition-all duration-300 flex flex-col border-r ${collapsed ? 'lg:w-20' : 'lg:w-64'
          } ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
          } ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
          } shadow-2xl lg:shadow-sm select-none`}
      >
        {/* Brand Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800 shrink-0">
          <div
            onClick={() => {
              setActiveTab('dashboard');
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer overflow-hidden py-1"
          >
            {collapsed ? (
              <img src="/codigix-logo.svg" alt="Codigix" className="h-8 w-8 object-cover object-left" />
            ) : (
              <img src="/codigix-logo.svg" alt="Codigix Infotech" className="h-8 object-contain" />
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Close Drawer Button */}
          <button
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm transition-all duration-200 ${isActive
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 font-medium'
                  }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                    }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme Toggle (Dark & Light Mode) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${isDark
              ? 'bg-slate-800/90 hover:bg-slate-700/80 text-amber-300 border border-slate-700/80'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80'
              }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark and Light Mode"
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
              )}
              {!collapsed && (
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </div>

            {!collapsed && (
              <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${isDark ? 'bg-amber-400 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                }`}>
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
