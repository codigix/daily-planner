import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Plus, 
  CheckSquare, 
  Users 
} from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, onOpenTaskModal }) {
  const navs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'action', label: 'Add', isAction: true },
    { id: 'logger', label: 'Tasks', icon: CheckSquare },
    { id: 'meetings', label: 'Meetings', icon: Users }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 py-2 px-3 flex items-center justify-around shadow-2xl lg:hidden select-none">
      {navs.map((item) => {
        if (item.isAction) {
          return (
            <button
              key={item.id}
              onClick={() => onOpenTaskModal && onOpenTaskModal()}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-90 transition-transform -mt-5 cursor-pointer"
              title="Add New Priority Task"
            >
              <Plus className="w-6 h-6" />
            </button>
          );
        }

        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab && setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-all cursor-pointer ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400 font-black' 
                : 'text-slate-400 dark:text-slate-500 font-semibold hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
