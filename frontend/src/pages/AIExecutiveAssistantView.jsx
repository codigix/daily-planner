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

export default function AIExecutiveAssistantView({ 
  user, 
  plannerTasks = [], 
  meetings = [], 
  clients = [], 
  domains = [], 
  onOpenAI 
}) {
  const [promptText, setPromptText] = useState('');
  const userName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `Hello ${userName}! How can I assist you with your schedule, tasks, or executive insights today?` }
  ]);

  // Real Database Telemetry Computations
  const completedTasks = plannerTasks.filter(t => t.completed);
  const pendingTasks = plannerTasks.filter(t => !t.completed);
  const timeSavedHrs = (completedTasks.length * 0.75).toFixed(1);
  const totalWorkspaceItems = plannerTasks.length + meetings.length + clients.length;
  const accuracyRate = plannerTasks.length > 0 ? Math.round((completedTasks.length / plannerTasks.length) * 100) : 100;

  const totalPipelineVal = clients.reduce((acc, c) => {
    const val = parseInt(String(c.expectedValue || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const highPriorityClients = clients.filter(c => c.priority === 'High' || c.starred);
  const upcomingMeetings = meetings.filter(m => m.status !== 'Completed' && m.status !== 'Cancelled');
  const nextMeeting = upcomingMeetings[0] || meetings[0];
  const currentDateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleSend = () => {
    if (!promptText.trim()) return;
    const msg = promptText;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setPromptText('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `I've processed your request regarding "${msg}". Your schedule is synchronized with your active database.` 
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

          <button onClick={onOpenAI} className="px-4 py-2 bg-white dark:bg-slate-800 border border-purple-300 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Create with AI</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards Row (Real Database Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Tasks Completed</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedTasks.length}</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {plannerTasks.length} Total Tasks
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Time Saved</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{timeSavedHrs} hrs</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> Based on Completed Tasks
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Client Pipeline</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{clients.length}</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {highPriorityClients.length} High Priority
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Tracked Items</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalWorkspaceItems}</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> Live Database Records
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
        </div>

        <div className="card-base flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Completion Rate</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{accuracyRate}%</div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> Real Execution Score
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
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Hello {userName}! How can I assist you today?</h2>
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
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 text-[11px] transition-colors cursor-pointer"
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Online & Synced
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
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {completedTasks.length} of {plannerTasks.length} daily tasks have been completed successfully.
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">Execution Insight</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {clients.length} active clients in pipeline with {highPriorityClients.length} marked high priority.
              </span>
              <span className="text-purple-700 dark:text-purple-400 font-bold block mt-0.5">Sales Pipeline Insight</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                {meetings.length} scheduled meetings currently listed on your calendar.
              </span>
              <span className="text-blue-700 dark:text-blue-400 font-bold block mt-0.5">Meeting Insight</span>
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
              { text: `Follow-up with ${highPriorityClients.length || clients.length} client leads`, desc: 'Priority follow-ups pending response.' },
              { text: `Complete ${pendingTasks.length} pending planner tasks`, desc: 'Outstanding daily planner items.' },
              { text: `Review ${upcomingMeetings.length} upcoming meetings`, desc: 'Prepare agendas and action items.' },
              { text: `Export executive report summary`, desc: 'Compile workspace analytics.' },
            ].map((sa, idx) => (
              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{sa.text}</span>
                  <span className="text-[9px] text-slate-400">{sa.desc}</span>
                </div>
                <button onClick={onOpenAI} className="px-2 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] rounded-lg hover:bg-purple-100 cursor-pointer">
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
            <span className="text-[10px] font-bold text-slate-400">{currentDateStr}</span>
          </div>
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>{meetings.length} Meetings</span>
              <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                {nextMeeting ? `Next: ${nextMeeting.time || ''} - ${nextMeeting.title}` : 'No upcoming meetings'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>{plannerTasks.length} Tasks</span>
              <span className="font-bold text-emerald-600 text-[11px]">{completedTasks.length} Completed / {pendingTasks.length} Pending</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>{clients.length} Follow-ups</span>
              <span className="font-bold text-amber-600 text-[11px]">{highPriorityClients.length} High Priority</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span>Pipeline Value</span>
              <span className="font-bold text-blue-600 text-[11px]">
                {totalPipelineVal > 0 ? `₹ ${totalPipelineVal.toLocaleString('en-IN')}` : '₹ 0'}
              </span>
            </div>
          </div>
          <button onClick={onOpenAI} className="w-full text-center text-xs font-bold text-purple-600 hover:underline pt-1 cursor-pointer">
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
