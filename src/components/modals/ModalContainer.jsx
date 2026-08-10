import React, { useState } from 'react';
import { X, Sparkles, Send, CheckCircle2, Calendar, Clock, Video, Users, User, Key, Loader2 } from 'lucide-react';
import { callClaudeAPI, getStoredApiKey, saveApiKey } from '../../services/aiService';
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

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAddPlannerTask({
      id: Date.now().toString(),
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      status: 'Pending',
      time: '04:00 PM'
    });
    setTaskTitle('');
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

          {/* Add Task Modal */}
          {activeModal === 'task' && (
            <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Prepare proposal for client meeting"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md mt-2"
              >
                Add Task to Planner
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
