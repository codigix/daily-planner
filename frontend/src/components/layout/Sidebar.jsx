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
  Sparkles
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
        className={`fixed top-0 left-0 z-50 h-screen transition-transform lg:transition-all duration-300 flex flex-col justify-between border-r ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
        } shadow-lg lg:shadow-sm select-none`}
      >
      {/* Brand Top Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer overflow-hidden py-1"
          >
            {collapsed ? (
              <img src="/codigix-logo.svg" alt="Codigix" className="h-8 w-8 object-cover object-left" />
            ) : (
              <img src="/codigix-logo.svg" alt="Codigix Infotech" className="h-8 object-contain" />
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 font-medium'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Executive OS Promo Widget */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-blue-50/80 to-indigo-50/80 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700/60 text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-wider text-blue-600 uppercase">
              CODIGIX EXECUTIVE OS
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2 font-medium">
              AI-Powered Productivity Suite
            </p>
            
            <div className="w-full py-3 bg-white/80 dark:bg-slate-900/50 rounded-xl px-2 flex items-center justify-center border border-white/60 shadow-inner">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  PRO
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
