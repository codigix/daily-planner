import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Clock, 
  Brain, 
  Lightbulb, 
  Target, 
  Search, 
  Send, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight, 
  FileText, 
  Mail, 
  BarChart2, 
  Video, 
  CheckSquare
} from 'lucide-react';

export default function AIExecutiveAssistantView({ onOpenAI }) {
  const [promptText, setPromptText] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: "Hello Ashwini! How can I assist you with your schedule, tasks, or executive insights today?" }
  ]);

  const handleSend = () => {
    if (!promptText.trim()) return;
    const msg = promptText;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setPromptText('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `I've processed your request regarding "${msg}". Your schedule is optimized and key actions have been queued.` 
      }]);
    }, 600);
  };

  const handleChipClick = (text) => {
    setPromptText(text);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Executive Assistant</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Your AI-powered assistant to boost productivity and make smarter decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything... Ctrl + K"
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <button 
            onClick={onOpenAI}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Ask AI</span>
          </button>

          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-purple-300 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Create with AI</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Tasks Automated</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">128</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 24% vs last month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Time Saved</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">18.4 hrs</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 18% vs last month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Decisions Supported</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">57</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 31% vs last month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Smart Suggestions</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">243</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 22% vs last month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">AI Accuracy Rate</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">92%</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 8% vs last month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Prompt Box & Assistant Status (Split 8 Cols / 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-base bg-gradient-to-br from-purple-50/60 to-indigo-50/60 dark:from-purple-950/20 border-purple-100 dark:border-purple-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👋</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Hello Ashwini! How can I assist you today?</h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything... (e.g., Summarize sales performance, Create meeting agenda, Analyze marketing ROI)"
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl shadow-md hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {[
              "📊 Sales performance summary",
              "📅 Today's schedule",
              "✉️ Draft client follow-up",
              "📈 Marketing ROI analysis",
              "✨ More suggestions"
            ].map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 text-[11px] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant Status */}
        <div className="lg:col-span-4 card-base flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
            <Bot className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">AI Assistant Status</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              I'm active and learning from your work to provide better insights and support.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Online
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: AI Insights, Smart Actions & Today's AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Insights For You (4 Cols) */}
        <div className="lg:col-span-4 card-base space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">AI Insights For You</h3>
            <button className="text-[10px] font-bold text-purple-600 hover:underline">View All</button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Sales conversion rate has improved by 18% this month.</span>
              <span className="text-emerald-700 font-bold block mt-0.5">Sales Insight</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Your marketing spend is 8.7% lower than last month, but ROI increased.</span>
              <span className="text-purple-700 font-bold block mt-0.5">Marketing Insight</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">The design team's productivity increased by 21%.</span>
              <span className="text-blue-700 font-bold block mt-0.5">Team Insight</span>
            </div>
          </div>
        </div>

        {/* Smart Actions Recommended (4 Cols) */}
        <div className="lg:col-span-4 card-base space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">Smart Actions (AI Recommended)</h3>
            <button className="text-[10px] font-bold text-purple-600 hover:underline">View All</button>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { text: 'Send follow-up email to 8 pending clients', desc: 'High priority leads need response.' },
              { text: 'Review 5 overdue tasks', desc: 'Tasks blocking project progress.' },
              { text: 'Prepare weekly sales report', desc: 'Auto-generate key metrics.' },
              { text: 'Optimize Google Ads budget', desc: 'Shift budget to top performers.' },
            ].map((sa, idx) => (
              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{sa.text}</span>
                  <span className="text-[9px] text-slate-400">{sa.desc}</span>
                </div>
                <button className="px-2 py-1 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-lg hover:bg-purple-100">
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Today's AI Summary (4 Cols) */}
        <div className="lg:col-span-4 card-base space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">Today's AI Summary</h3>
            <span className="text-[10px] font-bold text-slate-400">21 May 2025</span>
          </div>
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>5 Meetings</span>
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">Next: 11:00 AM - Project Review</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>12 Tasks</span>
              <span className="font-bold text-emerald-600 text-[11px]">6 Completed / 6 Pending</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>3 Follow-ups</span>
              <span className="font-bold text-amber-600 text-[11px]">2 High Priority</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>Pipeline Value</span>
              <span className="font-bold text-blue-600 text-[11px]">₹ 1,02,50,000</span>
            </div>
          </div>
          <button className="w-full text-center text-xs font-bold text-purple-600 hover:underline pt-1">
            View Full Summary
          </button>
        </div>
      </div>

      {/* Row 4: AI-Powered Tools Grid */}
      <div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-3">AI-Powered Tools</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { title: 'Content Generator', desc: 'Generate emails, proposals & more.', icon: FileText },
            { title: 'Smart Email Writer', desc: 'Write professional emails in seconds.', icon: Mail },
            { title: 'Report Builder', desc: 'Create reports with AI in just a click.', icon: BarChart2 },
            { title: 'Data Analyzer', desc: 'Analyze data and get smart insights.', icon: Zap },
            { title: 'Meeting Summarizer', desc: 'Summarize meetings and extract action items.', icon: Video },
            { title: 'Task Recommender', desc: 'Get AI recommendations to prioritize tasks.', icon: CheckSquare },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div key={idx} className="card-base p-3 space-y-2 hover:shadow-card cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">{tool.title}</div>
                <p className="text-[10px] text-slate-400 leading-tight">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
