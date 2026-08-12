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
        className={`fixed top-0 left-0 z-50 h-screen transition-transform lg:transition-all duration-300 flex flex-col border-r ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'
        } shadow-lg lg:shadow-sm select-none`}
      >
        {/* Brand Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800 shrink-0">
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
                {!collapsed && item.badge !== undefined && (
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
      </aside>
    </>
  );
}
