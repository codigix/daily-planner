import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Plus, 
  CheckSquare, 
  Users 
} from 'lucide-react';
import { triggerPhoneVibration } from '../../utils/notificationService';

export default function MobileBottomNav({ activeTab, setActiveTab, onOpenTaskModal }) {
  const navs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'action', label: 'Add', isAction: true },
    { id: 'logger', label: 'Tasks', icon: CheckSquare },
    { id: 'meetings', label: 'Meetings', icon: Users }
  ];

  const handleNavClick = (id) => {
    triggerPhoneVibration([25]);
    if (setActiveTab) setActiveTab(id);
  };

  const handleActionClick = () => {
    triggerPhoneVibration([35]);
    if (onOpenTaskModal) onOpenTaskModal();
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 pt-2 px-2 flex items-center justify-around shadow-2xl lg:hidden select-none transition-all"
    >
      {navs.map((item) => {
        if (item.isAction) {
          return (
            <button
              key={item.id}
              onClick={handleActionClick}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-90 transition-all -mt-5 cursor-pointer border-2 border-white dark:border-slate-900"
              title="Add New Priority Task"
              aria-label="Add New Task"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          );
        }

        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer active:scale-95 min-w-[56px] relative ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400 font-black' 
                : 'text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className="text-[10px] tracking-tight leading-none mt-0.5">{item.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5 animate-in zoom-in-50" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
