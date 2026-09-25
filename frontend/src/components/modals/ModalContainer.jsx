import React, { useState, useRef } from 'react';
import { X, Sparkles, Send, CheckCircle2, Calendar, Clock, Video, Users, User, Key, Loader2, Mic, MicOff, Check } from 'lucide-react';
import { callClaudeAPI, getStoredApiKey, saveApiKey } from '../../services/aiService';
import { analyzeVoiceTaskAPI } from '../../services/api';
import { triggerPhoneVibration } from '../../utils/notificationService';
import ProjectQuotationCalculatorModal from './ProjectQuotationCalculatorModal';

export default function ModalContainer({ 
  activeModal, 
  onClose, 
  onAddPlannerTask, 
  onAddMeeting, 
  onAddClient 
}) {
  if (!activeModal) return null;

  if (activeModal === 'calculator') {
    return <ProjectQuotationCalculatorModal isOpen={true} onClose={onClose} />;
  }

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Client & Pitching');
  const [taskPriority, setTaskPriority] = useState('High');
  const [taskTime, setTaskTime] = useState('10:00 AM – 11:00 AM');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskCheckpoints, setTaskCheckpoints] = useState([]);

  // Voice Assistant inside Task Creation Modal
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceAnalyzing, setIsVoiceAnalyzing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState('');
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingClient, setMeetingClient] = useState('');
  const [meetingType, setMeetingType] = useState('Client');

  const [clientCompany, setClientCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientValue, setClientValue] = useState('');
  const [clientPriority, setClientPriority] = useState('High');

  // AI Dialog & API Key state
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    { role: 'assistant', text: "Hello Ashwini! I am your CODIGIX Executive AI Assistant (Gemini AI). How can I optimize your schedule, follow-ups, or revenue targets today?" }
  ]);

  const handleSaveApiKey = () => {
    saveApiKey(apiKeyInput);
    setShowKeyInput(false);
    alert("Gemini / AI Key saved successfully!");
  };

  const parseSpeechLocally = (speech) => {
    const lower = speech.toLowerCase();
    let priority = 'Medium';
    if (/\b(urgent|asap|critical|important|top priority|high priority|emergency|must)\b/i.test(lower)) {
      priority = 'High';
    } else if (/\b(later|whenever|low priority|minor|optional)\b/i.test(lower)) {
      priority = 'Low';
    }

    let category = 'Daily Execution';
    if (/\b(meeting|meet|sync|zoom|call|interview|discuss)\b/i.test(lower)) {
      category = 'Client & Pitching';
    } else if (/\b(client|customer|sales|pitch|proposal|deal|contract|lead)\b/i.test(lower)) {
      category = 'Client & Pitching';
    } else if (/\b(bug|code|deploy|frontend|backend|api|database|feature|release|ops|pipeline)\b/i.test(lower)) {
      category = 'Ops & Pipeline';
    } else if (/\b(strategy|roadmap|kpi|systems|architecture)\b/i.test(lower)) {
      category = 'Systems & Strategy';
    } else if (/\b(finance|revenue|budget|invoice|governance|tax)\b/i.test(lower)) {
      category = 'Finance & Governance';
    } else if (/\b(marketing|growth|campaign|social|seo)\b/i.test(lower)) {
      category = 'Growth & Marketing';
    }

    let cleanTitle = speech
      .replace(/^(\s*can you|\s*please|\s*remind me to|\s*schedule a|\s*create a task for|\s*i want to|\s*i need to|\s*add a task to)\s*/i, '')
      .replace(/\b(tomorrow|today|day after tomorrow|yesterday)\b/gi, '')
      .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanTitle.length < 3) cleanTitle = speech.trim();
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    return {
      title: cleanTitle,
      priority,
      category,
      time: '10:00 AM – 11:00 AM',
      notes: `Voice input: "${speech}"`,
      checkpoints: [
        { id: 'cp_1', text: `Execute key deliverables for ${cleanTitle.slice(0, 30)}`, done: false },
        { id: 'cp_2', text: 'Verify output and mark complete', done: false }
      ]
    };
  };

  const applyAnalyzedData = (taskObj, originalSpeech) => {
    if (!taskObj) return;
    if (taskObj.title) setTaskTitle(taskObj.title);
    if (taskObj.priority) setTaskPriority(taskObj.priority);
    if (taskObj.time) setTaskTime(taskObj.time);
    if (taskObj.notes) setTaskNotes(taskObj.notes);
    if (taskObj.checkpoints) {
      const cps = Array.isArray(taskObj.checkpoints) 
        ? taskObj.checkpoints.map((c, i) => typeof c === 'string' ? { id: 'cp_' + i, text: c, done: false } : c)
        : [];
      setTaskCheckpoints(cps);
    }

    if (taskObj.category) {
      const catLower = taskObj.category.toLowerCase();
      if (catLower.includes('client') || catLower.includes('pitch') || catLower.includes('sale') || catLower.includes('meeting')) {
        setTaskCategory('Client & Pitching');
      } else if (catLower.includes('ops') || catLower.includes('pipeline') || catLower.includes('code') || catLower.includes('eng')) {
        setTaskCategory('Ops & Pipeline');
      } else if (catLower.includes('system') || catLower.includes('strategy') || catLower.includes('plan')) {
        setTaskCategory('Systems & Strategy');
      } else if (catLower.includes('finance') || catLower.includes('budget') || catLower.includes('invoice')) {
        setTaskCategory('Finance & Governance');
      } else if (catLower.includes('growth') || catLower.includes('market') || catLower.includes('lead')) {
        setTaskCategory('Growth & Marketing');
      } else {
        setTaskCategory('Daily Execution');
      }
    }

    setVoiceSuccessMsg(`✨ AI autocorrected and populated best task!`);
    triggerPhoneVibration([60, 40, 60]);
  };

  const startVoice = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or type directly.");
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceListening(true);
        setVoiceSuccessMsg('');
        setVoiceTranscript('');
        transcriptRef.current = '';
        triggerPhoneVibration([40]);
      };

      rec.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setVoiceTranscript(text);
        transcriptRef.current = text;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (text.trim().length > 3) {
          silenceTimerRef.current = setTimeout(() => {
            stopVoice();
            analyzeAndAutocorrectTask(text);
          }, 1300);
        }
      };

      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
        triggerPhoneVibration([30]);
        if (transcriptRef.current && transcriptRef.current.trim().length > 3 && !isVoiceAnalyzing) {
          analyzeAndAutocorrectTask(transcriptRef.current);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn("Speech start error:", err);
      setIsVoiceListening(false);
    }
  };

  const stopVoice = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsVoiceListening(false);
  };

  const handleVoiceToggle = () => {
    if (isVoiceListening) {
      stopVoice();
      if (transcriptRef.current && transcriptRef.current.trim().length > 3) {
        analyzeAndAutocorrectTask(transcriptRef.current);
      }
    } else {
      startVoice();
    }
  };

  const analyzeAndAutocorrectTask = async (spokenText) => {
    const speech = spokenText.trim();
    if (!speech) return;
    setIsVoiceAnalyzing(true);
    stopVoice();

    try {
      const res = await analyzeVoiceTaskAPI(
        speech,
        new Date().toDateString(),
        new Date().toLocaleDateString('en-US', { weekday: 'long' })
      );

      if (res && res.success && res.task) {
        applyAnalyzedData(res.task, speech);
      } else {
        const parsed = parseSpeechLocally(speech);
        applyAnalyzedData(parsed, speech);
      }
    } catch (err) {
      const parsed = parseSpeechLocally(speech);
      applyAnalyzedData(parsed, speech);
    } finally {
      setIsVoiceAnalyzing(false);
    }
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAddPlannerTask({
      id: Date.now().toString(),
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      status: 'Pending',
      time: taskTime || '10:00 AM – 11:00 AM',
      notes: taskNotes || '',
      checkpoints: taskCheckpoints || []
    });
    setTaskTitle('');
    setTaskTime('10:00 AM – 11:00 AM');
    setTaskNotes('');
    setTaskCheckpoints([]);
    setVoiceTranscript('');
    setVoiceSuccessMsg('');
    onClose();
  };

  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    if (!meetingTitle) return;
    onAddMeeting({
      id: 'm' + Date.now(),
      time: '02:30 PM',
      duration: '45 min',
      title: meetingTitle,
      description: 'Scheduled via CODIGIX Executive OS',
      client: meetingClient || 'Client Team',
      type: meetingType,
      status: 'Upcoming',
      members: ['Ashwini K.']
    });
    setMeetingTitle('');
    onClose();
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!clientCompany) return;
    onAddClient({
      id: 'c' + Date.now(),
      company: clientCompany,
      tagline: 'New Lead Integration',
      lastContact: 'Today',
      lastContactType: 'Call',
      nextFollowup: '22 May 2025',
      nextFollowupType: 'Meeting',
      priority: clientPriority,
      status: 'Pending',
      owner: 'Ashwini K.',
      ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      probability: 75,
      expectedValue: clientValue ? `₹${clientValue}` : '₹10,00,000',
      contactPerson: clientContact || 'Manager',
      email: 'contact@client.com',
      phone: '+91 98765 00000',
      industry: 'Technology',
      source: 'Direct Lead',
      totalInteractions: 1,
      clientSince: 'Today',
      notes: 'Initial inquiry logged.'
    });
    setClientCompany('');
    onClose();
  };

  const handleAiSend = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    const userMsg = aiPrompt;
    setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      const responseText = await callClaudeAPI(userMsg);
      setAiChat(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'assistant', text: "Error connecting to Claude API. Please check your network or API Key settings." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            {activeModal === 'ai' && <><Sparkles className="w-5 h-5 text-purple-600" /> AI Executive Assistant (Gemini AI)</>}
            {activeModal === 'task' && <><Calendar className="w-5 h-5 text-blue-600" /> Add New Task</>}
            {activeModal === 'meeting' && <><Video className="w-5 h-5 text-blue-600" /> Schedule Meeting</>}
            {activeModal === 'client' && <><Users className="w-5 h-5 text-blue-600" /> Add Client Follow-up</>}
          </h3>
          
          <div className="flex items-center gap-2">
            {activeModal === 'ai' && (
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Configure Claude API Key"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* AI Assistant Modal */}
          {activeModal === 'ai' && (
            <div className="space-y-4">
              {showKeyInput && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-200 block">Configure Anthropic Claude API Key:</span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

              <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                {aiChat.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white font-medium rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex gap-2.5 items-center text-xs text-purple-600 font-bold p-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is generating response...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                  placeholder="Ask Gemini AI to optimize schedule, draft emails..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAiSend}
                  disabled={isAiLoading}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add Task Modal with Integrated Voice Assistant */}
          {activeModal === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-3.5 text-xs">
              {/* Voice Assistant Auto-Fill Card with Live Writing Bar */}
              <div className="p-3 sm:p-3.5 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-purple-50 dark:from-slate-800 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-indigo-950 dark:text-indigo-200 leading-tight truncate">
                        AI Voice Assistant Auto-Fill
                      </h4>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        Speak naturally — AI autocorrects & populates fields
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                      isVoiceListening
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? 'animate-bounce' : ''}`} />
                    <span>{isVoiceListening ? 'Listening...' : 'Speak'}</span>
                  </button>
                </div>

                {/* Live Writing Bar / Audio Waveform */}
                {(isVoiceListening || isVoiceAnalyzing || voiceTranscript) && (
                  <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                        {isVoiceListening && (
                          <div className="flex items-center gap-1 h-3.5">
                            <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1 h-3.5 bg-rose-500 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1 h-2.5 bg-rose-500 rounded-full animate-bounce [animation-delay:300ms]" />
                            <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:200ms]" />
                          </div>
                        )}
                        <span className="truncate">
                          {isVoiceListening
                            ? 'Writing bar (listening live)...'
                            : isVoiceAnalyzing
                            ? 'AI Autocorrecting & Structuring Best Task...'
                            : 'Voice Input:'}
                        </span>
                      </div>
                      {isVoiceAnalyzing && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-purple-600 dark:text-purple-400 animate-pulse shrink-0">
                          <Sparkles className="w-3 h-3 animate-spin" /> Autocorrecting
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-inner flex items-center justify-between gap-2">
                      <span className="truncate">{voiceTranscript || 'Speak what you want to achieve...'}</span>
                      {isVoiceListening && (
                        <span className="w-1.5 h-3.5 bg-indigo-600 animate-pulse shrink-0" />
                      )}
                    </div>
                  </div>
                )}

                {voiceSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{voiceSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Task Title with Inline Mic Trigger */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Task Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Prepare proposal for client meeting"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isVoiceListening
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 animate-pulse'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title="Speak to dictate task"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Client & Pitching">Client & Pitching</option>
                    <option value="Ops & Pipeline">Ops & Pipeline</option>
                    <option value="Systems & Strategy">Systems & Strategy</option>
                    <option value="Finance & Governance">Finance & Governance</option>
                    <option value="Daily Execution">Daily Execution</option>
                    <option value="Growth & Marketing">Growth & Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="High">🔥 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>

              {/* Time Range */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Scheduled Time Range</label>
                <input
                  type="text"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  placeholder="e.g. 10:00 AM – 11:00 AM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Add Task to Planner</span>
              </button>
            </form>
          )}

          {/* Schedule Meeting Modal */}
          {activeModal === 'meeting' && (
            <form onSubmit={handleMeetingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. ERP Module Sprint Review"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Client / Team</label>
                  <input
                    type="text"
                    value={meetingClient}
                    onChange={(e) => setMeetingClient(e.target.value)}
                    placeholder="e.g. ABC Pvt Ltd"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Client">Client</option>
                    <option value="Internal">Internal</option>
                    <option value="Project">Project</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md mt-2"
              >
                Schedule Meeting
              </button>
            </form>
          )}

          {/* Add Client Follow-up Modal */}
          {activeModal === 'client' && (
            <form onSubmit={handleClientSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g. Acme Tech Corp"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    placeholder="Mr. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Expected Deal Value (₹)</label>
                  <input
                    type="text"
                    value={clientValue}
                    onChange={(e) => setClientValue(e.target.value)}
                    placeholder="15,00,000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md mt-2"
              >
                Add Follow-up Entry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
