import React from 'react';
import { 
  TrendingUp, 
  Briefcase, 
  UserCheck, 
  DollarSign, 
  PieChart, 
  Bot, 
  FileText, 
  Bell, 
  Settings,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart2
} from 'lucide-react';

const iconMap = {
  sales: TrendingUp,
  projects: Briefcase,
  team: UserCheck,
  finance: DollarSign,
  marketing: PieChart,
  'ai-assistant': Bot,
  reports: FileText,
  notifications: Bell,
  settings: Settings,
};

const moduleTitles = {
  sales: { title: "Sales KPI Dashboard", desc: "Track conversion rates, deals pipeline, and sales team target achievement." },
  projects: { title: "Project KPI Tracker", desc: "Monitor project timelines, sprint velocity, deliverables, and resource allocation." },
  team: { title: "Team Performance & Productivity", desc: "Analyze team member execution efficiency, completed tasks, and workload status." },
  finance: { title: "Finance & Cash Flow Dashboard", desc: "Real-time overview of revenue, monthly expenses, pending invoices, and net cash flow." },
  marketing: { title: "Marketing Analytics Dashboard", desc: "Campaign performance, lead generation sources, social media engagement, and ROI." },
  'ai-assistant': { title: "AI Executive Assistant", desc: "Your 24/7 AI-powered strategy advisor for task prioritization, insights, and automated planning." },
  reports: { title: "Executive Reports & Exports", desc: "Generate and download custom PDF/Excel reports for weekly, monthly, and quarterly reviews." },
  notifications: { title: "Notifications & System Alerts", desc: "Manage operational notifications, overdue task alerts, and team mention updates." },
  settings: { title: "System Preferences & Settings", desc: "Customize your workspace, domain task templates, integration keys, and user permissions." },
};

export default function GenericModuleView({ moduleId, onOpenAI }) {
  const IconComponent = iconMap[moduleId] || BarChart2;
  const info = moduleTitles[moduleId] || { title: "Module View", desc: "Executive analytics module" };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600">
              <IconComponent className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{info.title}</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {info.desc}
          </p>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all self-start"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Insight Analysis</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Score</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">94.8%</div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% this month
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Efficiency</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">100%</div>
            <span className="text-[11px] font-bold text-emerald-600 mt-0.5">On Schedule</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Workflows</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">16</div>
            <span className="text-[11px] font-bold text-slate-400 mt-0.5">Automated</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Confidence</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">98%</div>
            <span className="text-[11px] font-bold text-brand-600 mt-0.5">Optimal Execution</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Module Content */}
      <div className="card-base p-8 text-center space-y-4 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto">
          <IconComponent className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{info.title} Live Suite</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Integrated directly into <strong>CODIGIX EXECUTIVE OS</strong>. All real-time telemetry, logs, and schedule data synchronize seamlessly across Daily Planner, Task Logger, Meeting Manager, and Client Follow-ups.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button 
            onClick={onOpenAI}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Launch AI Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
