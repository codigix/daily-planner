import React, { useState, useEffect } from 'react';
import {
  Video, Plus, Sparkles, Calendar, Clock, CheckCircle, Users,
  Search, X, MapPin, User, Edit, Trash2, MessageSquare,
  ChevronRight, CheckCircle2, Circle, AlertCircle, XCircle,
  Link2, Mic, FileText, Bell, MoreVertical, Save, Layers, Filter
} from 'lucide-react';
import { createMeetingAPI, updateMeetingAPI, deleteMeetingAPI } from '../services/api';

const MEETING_TYPES = ['Client', 'Internal', 'Project', 'Board', 'Sales', 'HR', 'Strategy'];
const MEETING_STATUSES = ['Upcoming', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Pending'];

const statusStyles = {
  Upcoming: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'In Progress': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  Pending: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const typeStyles = {
  Client: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30',
  Internal: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30',
  Project: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30',
  Board: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30',
  Sales: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30',
  HR: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30',
  Strategy: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30',
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-pink-500'
];

function AvatarBubble({ name, index }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className={`w-6 h-6 rounded-full ${color} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function getVideoCallUrl(m) {
  if (!m) return '';
  if (m.videoLink && (m.videoLink.startsWith('http://') || m.videoLink.startsWith('https://'))) {
    return m.videoLink;
  }
  if (m.location && (m.location.startsWith('http://') || m.location.startsWith('https://'))) {
    return m.location;
  }
  return '';
}

function hasTimeConflict(meeting, allMeetings) {
  if (!meeting || !meeting.date || !meeting.time || meeting.status === 'Cancelled') return false;
  return allMeetings.some(m =>
    m.id !== meeting.id &&
    m.date === meeting.date &&
    m.time === meeting.time &&
    m.status !== 'Cancelled'
  );
}

// ── Add / Edit Meeting Modal ───────────────────────────────────────────────
function MeetingFormModal({ open, onClose, onSave, initial = null }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: '', description: '', client: '', type: 'Client',
    status: 'Upcoming', time: '10:00 AM', duration: '45 min',
    date: new Date().toISOString().split('T')[0],
    location: '', videoLink: '', organizer: '', members: '',
    agenda: '', actionItems: ''
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        client: initial.client || '',
        type: initial.type || 'Client',
        status: initial.status || 'Upcoming',
        time: initial.time || '10:00 AM',
        duration: initial.duration || '45 min',
        date: initial.date || new Date().toISOString().split('T')[0],
        location: initial.location || '',
        videoLink: initial.videoLink || initial.video_link || '',
        organizer: initial.organizer || '',
        members: Array.isArray(initial.members) ? initial.members.join(', ') : (initial.members || ''),
        agenda: Array.isArray(initial.agenda) ? initial.agenda.map(a => a.text || a).join('\n') : '',
        actionItems: Array.isArray(initial.actionItems) ? initial.actionItems.map(a => a.text || a).join('\n') : ''
      });
    } else {
      setForm({
        title: '', description: '', client: '', type: 'Client',
        status: 'Upcoming', time: '10:00 AM', duration: '45 min',
        date: new Date().toISOString().split('T')[0],
        location: '', videoLink: '', organizer: '', members: '', agenda: '', actionItems: ''
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) { alert('Please enter a meeting title.'); return; }
    const membersArr = form.members.split(',').map(s => s.trim()).filter(Boolean);
    const agendaArr = form.agenda.split('\n').map(s => s.trim()).filter(Boolean)
      .map((text, i) => ({ id: `ag_${Date.now()}_${i}`, text, done: false }));
    const actionArr = form.actionItems.split('\n').map(s => s.trim()).filter(Boolean)
      .map((text, i) => ({ id: `ai_${Date.now()}_${i}`, text, done: false, owner: '' }));
    onSave({
      ...(initial || {}),
      id: initial?.id || ('m' + Date.now()),
      title: form.title.trim(),
      description: form.description.trim(),
      client: form.client.trim(),
      type: form.type,
      status: form.status,
      time: form.time,
      duration: form.duration,
      date: form.date,
      location: form.location.trim(),
      videoLink: form.videoLink.trim(),
      organizer: form.organizer.trim(),
      members: membersArr,
      agenda: agendaArr,
      actionItems: actionArr
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-600" />
            {isEdit ? 'Edit Meeting' : 'Schedule New Meeting'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Meeting Title *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Q3 Strategy Review" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief context or purpose of this meeting..." className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium resize-none" />
          </div>

          {/* Row: Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                {MEETING_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Date + Time + Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Time</label>
              <input type="time" value={
                (() => {
                  try {
                    const [t, ampm] = (form.time || '10:00 AM').split(' ');
                    let [h, m] = t.split(':').map(Number);
                    if (ampm === 'PM' && h !== 12) h += 12;
                    if (ampm === 'AM' && h === 12) h = 0;
                    return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
                  } catch { return '10:00'; }
                })()
              } onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                set('time', `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`);
              }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Duration</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium">
                {['15 min', '30 min', '45 min', '1 hr', '1.5 hr', '2 hr', '3 hr'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Video Call Link & Physical Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">🎥 Video Call Link (Meet/Zoom/Teams)</label>
              <input type="text" value={form.videoLink} onChange={e => set('videoLink', e.target.value)}
                placeholder="https://meet.google.com/xyz or Zoom URL" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">📍 Physical Room / Location</label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. Conference Room 3B" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
          </div>

          {/* Client & Organizer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Client / Company</label>
              <input type="text" value={form.client} onChange={e => set('client', e.target.value)}
                placeholder="e.g. Acme Corp" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Organizer</label>
              <input type="text" value={form.organizer} onChange={e => set('organizer', e.target.value)}
                placeholder="e.g. CEO Office" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Attendees (comma-separated)</label>
            <input type="text" value={form.members} onChange={e => set('members', e.target.value)}
              placeholder="e.g. Rahul S., Priya M., Dev K." className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
          </div>

          {/* Agenda */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Agenda (one item per line)</label>
            <textarea rows={3} value={form.agenda} onChange={e => set('agenda', e.target.value)}
              placeholder={"Sprint review\nBlockers discussion\nNext milestone planning"}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium resize-none" />
          </div>

          {/* Action Items */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Action Items (one per line)</label>
            <textarea rows={2} value={form.actionItems} onChange={e => set('actionItems', e.target.value)}
              placeholder={"Prepare status report\nShare updated roadmap"}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MeetingManagerView({ meetings = [], setMeetings, onScheduleMeeting, onOpenAI }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [inlineAgendaText, setInlineAgendaText] = useState('');
  const [inlineActionText, setInlineActionText] = useState('');

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) || null;

  // Auto-select first meeting
  useEffect(() => {
    if (!selectedMeetingId && meetings.length > 0) {
      setSelectedMeetingId(meetings[0].id);
    }
  }, [meetings]);

  const filteredMeetings = meetings.filter(m => {
    if (activeTab !== 'All' && m.status !== activeTab) return false;
    if (typeFilter !== 'All' && m.type !== typeFilter) return false;
    if (selectedDateFilter && m.date !== selectedDateFilter) return false;
    if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(m.client?.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const totalMeetings = meetings.length;
  const upcomingCount = meetings.filter(m => m.status === 'Upcoming' || m.status === 'Confirmed').length;
  const completedCount = meetings.filter(m => m.status === 'Completed').length;
  const cancelledCount = meetings.filter(m => m.status === 'Cancelled').length;

  const handleCopyMeetingSummary = (m) => {
    if (!m) return;
    const agendaText = (m.agenda || []).map(a => `• [${a.done ? 'x' : ' '}] ${a.text}`).join('\n') || 'None';
    const actionText = (m.actionItems || []).map(a => `• [${a.done ? 'x' : ' '}] ${a.text}${a.owner ? ` (@${a.owner})` : ''}`).join('\n') || 'None';
    const summary = `📌 MEETING SUMMARY: ${m.title}
📅 Date: ${m.date || 'TBD'}
⏰ Time: ${m.time} (${m.duration})
🏢 Type: ${m.type} | Status: ${m.status}
👥 Attendees: ${(m.members || []).join(', ') || 'N/A'}
${m.client ? `💼 Client: ${m.client}\n` : ''}${getVideoCallUrl(m) ? `🔗 Link: ${getVideoCallUrl(m)}\n` : ''}
📋 AGENDA:
${agendaText}

⚡ ACTION ITEMS:
${actionText}`;

    navigator.clipboard.writeText(summary).then(() => {
      alert('📋 Meeting summary copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard.');
    });
  };

  const handleAddInlineAgenda = (meetingId) => {
    if (!inlineAgendaText.trim()) return;
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      const newAg = { id: `ag_${Date.now()}`, text: inlineAgendaText.trim(), done: false };
      const updatedAgenda = [...(m.agenda || []), newAg];
      const updatedMeeting = { ...m, agenda: updatedAgenda };
      updateMeetingAPI(meetingId, { agenda: updatedAgenda }).catch(() => { });
      return updatedMeeting;
    }));
    setInlineAgendaText('');
  };

  const handleAddInlineActionItem = (meetingId) => {
    if (!inlineActionText.trim()) return;
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      const newAi = { id: `ai_${Date.now()}`, text: inlineActionText.trim(), done: false, owner: '' };
      const updatedItems = [...(m.actionItems || []), newAi];
      const updatedMeeting = { ...m, actionItems: updatedItems };
      updateMeetingAPI(meetingId, { actionItems: updatedItems }).catch(() => { });
      return updatedMeeting;
    }));
    setInlineActionText('');
  };

  const toggleAgendaItem = (meetingId, itemId) => {
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId || !Array.isArray(m.agenda)) return m;
      const updatedAgenda = m.agenda.map(a => a.id === itemId ? { ...a, done: !a.done } : a);
      const updatedMeeting = { ...m, agenda: updatedAgenda };
      updateMeetingAPI(meetingId, { agenda: updatedAgenda }).catch(() => { });
      return updatedMeeting;
    }));
  };

  const toggleActionItem = (meetingId, itemId) => {
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId || !Array.isArray(m.actionItems)) return m;
      const updatedItems = m.actionItems.map(a => a.id === itemId ? { ...a, done: !a.done } : a);
      const updatedMeeting = { ...m, actionItems: updatedItems };
      updateMeetingAPI(meetingId, { actionItems: updatedItems }).catch(() => { });
      return updatedMeeting;
    }));
  };

  const updateStatus = (meetingId, status) => {
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      const updatedMeeting = { ...m, status };
      updateMeetingAPI(meetingId, { status }).catch(() => { });
      return updatedMeeting;
    }));
  };

  const handleSaveMeeting = async (meetingData) => {
    if (editMeeting) {
      setMeetings(prev => prev.map(m => {
        if (m.id !== meetingData.id) return m;
        updateMeetingAPI(meetingData.id, meetingData).catch(() => { });
        return meetingData;
      }));
    } else {
      try {
        const result = await createMeetingAPI(meetingData);
        setMeetings(prev => [result || meetingData, ...prev]);
        setSelectedMeetingId((result || meetingData).id);
      } catch (e) {
        setMeetings(prev => [meetingData, ...prev]);
        setSelectedMeetingId(meetingData.id);
      }
    }
    setEditMeeting(null);
  };

  const handleDelete = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    deleteMeetingAPI(id).catch(() => { });
    if (selectedMeetingId === id) setSelectedMeetingId(meetings[0]?.id || '');
    setConfirmDeleteId(null);
  };

  // Build current week pills
  const weekPills = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = meetings.filter(m => m.date === dStr).length;
      const isToday = d.toDateString() === today.toDateString();
      return { d, dStr, count, isToday, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }), dateLabel: d.getDate() };
    });
  })();

  const TABS = ['Upcoming', 'Confirmed', 'Completed', 'Cancelled', 'All'];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100 max-w-full overflow-x-hidden">

      {/* ── Page Header (Matches Screenshot) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0">
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Meeting Manager</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Schedule, manage and track all meetings.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => { setEditMeeting(null); setShowForm(true); }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-blue-600 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Schedule</span>
          </button>

          <button
            onClick={onOpenAI}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards (Row of 4 Cards Side-by-Side on Mobile - Matches Screenshot) ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Total Meetings', value: totalMeetings, sub: 'Recorded', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50' },
          { label: 'Upcoming', value: upcomingCount, sub: 'Scheduled', icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/50' },
          { label: 'Completed', value: completedCount, sub: 'Conducted', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'Participants', value: meetings.reduce((s, m) => s + (m.members?.length || 1), 0), sub: 'Total Attendees', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-4 flex flex-col justify-between shadow-sm">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{kpi.label}</p>
              <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{kpi.value}</p>
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 truncate">{kpi.sub}</p>
            </div>
            <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center self-end mt-1`}>
              <kpi.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Tab Navigation Bar & Filters (Matches Screenshot) ── */}
      <div className="space-y-3 flex w-full justify-between">
        {/* Horizontal Tab Bar */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2.5 whitespace-nowrap transition-all border-b-2 cursor-pointer ${activeTab === tab ? 'border-blue-600 text-blue-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}>
              {tab}
              <span className="ml-1 text-[10px] font-black">
                ({tab === 'All' ? meetings.length : meetings.filter(m => m.status === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filter Controls Bar (Matches Screenshot) */}
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0">
            <option value="All">All Types</option>
            {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings, clients..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
          </div>

          <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 shrink-0 cursor-pointer" title="Filters">
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2 Main Cards Grid (2 Columns Side-by-Side on Mobile - Matches Screenshot) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-6">

        {/* Left Card: Meetings List Panel (Col 1 on Mobile, 8 Cols on Desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between p-4 sm:p-6 min-h-[320px]">
          {filteredMeetings.length === 0 ? (
            <div className="my-auto text-center space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <Video className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">No meetings found</h3>
              <p className="text-xs text-slate-400 px-2 max-w-xs mx-auto">
                {meetings.length === 0 ? 'Click "Schedule Meeting" to add your first meeting.' : 'Try adjusting your filters.'}
              </p>
              <button
                onClick={() => { setEditMeeting(null); setShowForm(true); }}
                className="mx-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Meeting
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Meeting Details</th>
                    <th className="p-3 hidden sm:table-cell">Attendees</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMeetings.map(meeting => {
                    const isSelected = meeting.id === selectedMeetingId;
                    const isConflict = hasTimeConflict(meeting, meetings);
                    const joinLink = getVideoCallUrl(meeting);
                    return (
                      <tr key={meeting.id} onClick={() => setSelectedMeetingId(meeting.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}>
                        <td className="p-3 whitespace-nowrap">
                          {meeting.date && (
                            <div className="text-[10px] font-bold text-slate-400 mb-0.5">
                              {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                            <span>{meeting.time}</span>
                            {isConflict && (
                              <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded border border-amber-300 shrink-0">
                                ⚠️
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 max-w-[140px] sm:max-w-[200px]">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate">{meeting.title}</p>
                          {meeting.client && <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 block truncate">{meeting.client}</span>}
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <div className="flex -space-x-1.5">
                            {(meeting.members || []).slice(0, 3).map((m, i) => (
                              <AvatarBubble key={i} name={m} index={i} />
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${statusStyles[meeting.status] || 'bg-slate-100 text-slate-600'}`}>
                            {meeting.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditMeeting(meeting); setShowForm(true); }}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(meeting.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Card: Selected Meeting Detail Panel (Col 2 on Mobile, 4 Cols on Desktop - Matches Screenshot) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between p-4 sm:p-6 min-h-[320px]">
          {selectedMeeting ? (
            <div className="space-y-4 my-auto">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">{selectedMeeting.title}</h3>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mt-0.5">{selectedMeeting.client || 'Internal'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${statusStyles[selectedMeeting.status] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedMeeting.status}
                </span>
              </div>

              <div className="space-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{selectedMeeting.date || 'Today'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{selectedMeeting.time} ({selectedMeeting.duration})</span>
                </div>
              </div>

              <button
                onClick={() => { setEditMeeting(selectedMeeting); setShowForm(true); }}
                className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-slate-50 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Meeting
              </button>
            </div>
          ) : (
            <div className="my-auto text-center space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">No Meeting Selected</h3>
              <p className="text-xs text-slate-400 px-2 max-w-xs mx-auto">
                Select a meeting from the list to view its details, agenda, and action items.
              </p>
              <button
                onClick={() => { setEditMeeting(null); setShowForm(true); }}
                className="mx-auto px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-blue-600 hover:bg-slate-50 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule Meeting
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Add / Edit Modal ── */}
      <MeetingFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditMeeting(null); }}
        onSave={handleSaveMeeting}
        initial={editMeeting}
      />

      {/* ── Delete Confirmation ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">Delete Meeting</p>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-medium">
              {meetings.find(m => m.id === confirmDeleteId)?.title}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Meeting Filters"
      >
        <Filter className="w-6 h-6 text-white" />
      </button>

      {/* ── Mobile Filters Drawer Modal ── */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Meeting Filters & Options</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Search Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Meetings</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, client, organizer..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Tab Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Meeting Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Upcoming', 'Completed', 'In Progress', 'All'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setActiveTab(status)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${activeTab === status
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Type Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Meeting Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['All', ...MEETING_TYPES].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all truncate ${typeFilter === type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('Upcoming');
                  setTypeFilter('All');
                  setSelectedDateFilter(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
