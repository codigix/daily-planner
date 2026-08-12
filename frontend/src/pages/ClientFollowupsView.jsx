import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Sparkles, Clock, AlertTriangle, CheckCircle2,
  Search, Filter, MoreVertical, Star, Phone, Mail, Building,
  Calendar, DollarSign, TrendingUp, Edit, ArrowRight, MessageSquare,
  X, Save, Trash2, CheckCircle, Sliders, ChevronDown, Check, User,
  Briefcase, Send, Target, Eye
} from 'lucide-react';
import { createClientAPI, updateClientAPI, deleteClientAPI } from '../services/api';
import DataTable from '../components/common/DataTable';

const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'Due Today', 'Overdue', 'Completed', 'Closed Won', 'Not Started'];
const CONTACT_TYPES = ['Call', 'Email', 'Meeting', 'LinkedIn', 'WhatsApp', 'In-Person'];
const INDUSTRIES = ['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Education', 'Retail', 'Logistics', 'Real Estate'];
const SOURCES = ['Direct Lead', 'Website', 'Referral', 'LinkedIn Campaign', 'Cold Outreach', 'Partner Network'];
const OWNERS = [
  { name: 'Ashwini K.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' },
  { name: 'Rahul S.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { name: 'Neha J.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80' },
  { name: 'Vikram P.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { name: 'Priya S.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }
];

// ── Add / Edit Followup Modal ──────────────────────────────────────────────
function FollowupFormModal({ open, onClose, onSave, initial = null }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    company: '', tagline: '', contactPerson: '', email: '', phone: '',
    industry: 'Technology', source: 'Direct Lead', expectedValue: '₹5,00,000',
    probability: 50, priority: 'Medium', status: 'Pending',
    owner: 'Ashwini K.', notes: '', lastContact: 'Today', lastContactType: 'Call',
    nextFollowup: '', nextFollowupType: 'Meeting'
  });

  useEffect(() => {
    if (initial) {
      setForm({
        company: initial.company || '',
        tagline: initial.tagline || '',
        contactPerson: initial.contactPerson || '',
        email: initial.email || '',
        phone: initial.phone || '',
        industry: initial.industry || 'Technology',
        source: initial.source || 'Direct Lead',
        expectedValue: initial.expectedValue || '₹5,00,000',
        probability: initial.probability !== undefined ? initial.probability : 50,
        priority: initial.priority || 'Medium',
        status: initial.status || 'Pending',
        owner: initial.owner || 'Ashwini K.',
        notes: initial.notes || '',
        lastContact: initial.lastContact || 'Today',
        lastContactType: initial.lastContactType || 'Call',
        nextFollowup: initial.nextFollowup || '',
        nextFollowupType: initial.nextFollowupType || 'Meeting'
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setForm({
        company: '', tagline: '', contactPerson: '', email: '', phone: '',
        industry: 'Technology', source: 'Direct Lead', expectedValue: '₹5,00,000',
        probability: 50, priority: 'Medium', status: 'Pending',
        owner: 'Ashwini K.', notes: '', lastContact: 'Today', lastContactType: 'Call',
        nextFollowup: tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        nextFollowupType: 'Meeting'
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.company.trim()) { alert('Please enter a company name.'); return; }
    if (!form.contactPerson.trim()) { alert('Please enter a contact person.'); return; }

    // Format expected value to have currency symbol
    let val = form.expectedValue.trim();
    if (val && !val.startsWith('₹') && !val.startsWith('$')) {
      val = '₹' + val;
    }

    const selectedOwner = OWNERS.find(o => o.name === form.owner) || OWNERS[0];

    onSave({
      ...(initial || {}),
      id: initial?.id || ('c' + Date.now()),
      company: form.company.trim(),
      tagline: form.tagline.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      industry: form.industry,
      source: form.source,
      expectedValue: val,
      probability: Number(form.probability),
      priority: form.priority,
      status: form.status,
      owner: form.owner,
      ownerAvatar: selectedOwner.avatar,
      notes: form.notes.trim(),
      lastContact: form.lastContact,
      lastContactType: form.lastContactType,
      nextFollowup: form.nextFollowup,
      nextFollowupType: form.nextFollowupType,
      starred: initial?.starred || false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <Users className="w-5 h-5 text-brand-600 shrink-0" />
            <span>{isEdit ? 'Edit Follow-up Record' : 'Add New Client Follow-up'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Company & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Company Name *</label>
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="e.g. Morya hospital" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Tagline / Services</label>
              <input type="text" value={form.tagline} onChange={e => set('tagline', e.target.value)}
                placeholder="e.g. health care services" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
          </div>

          {/* Contact Person & Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Contact Person *</label>
              <input type="text" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
                placeholder="e.g. Manager" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="info@codigix.com" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 00000" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium" />
            </div>
          </div>

          {/* Expected Value & Probability & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Expected Deal Value</label>
              <input type="text" value={form.expectedValue} onChange={e => set('expectedValue', e.target.value)}
                placeholder="₹20,000" className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Closing Prob ({form.probability}%)</label>
              <input type="range" min="0" max="100" step="5" value={form.probability} onChange={e => set('probability', e.target.value)}
                className="w-full accent-brand-600 mt-2" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-extrabold">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Industry & Source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Industry / Category</label>
              <select value={form.industry} onChange={e => set('industry', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-medium">
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">Lead Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-medium">
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all">
            {isEdit ? 'Save Changes' : 'Create Follow-up'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Default Mock Client Followups Data ─────────────────────────────────────
const INITIAL_CLIENTS = [
  {
    id: 'c1',
    company: 'Morya hospital',
    tagline: 'health care services',
    contactPerson: 'Manager',
    email: 'info@codigix.com',
    phone: '+91 98765 00000',
    industry: 'Marketing',
    source: 'CRM Integration',
    expectedValue: '₹20,000',
    probability: 0,
    priority: 'Medium',
    status: 'Pending',
    owner: 'Ashwini K.',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    notes: 'Discussed healthcare CRM integration proposal.',
    lastContact: 'Aug 7',
    lastContactType: 'Meeting',
    nextFollowup: 'Aug 14',
    nextFollowupType: 'Call',
    starred: true
  },
  {
    id: 'c2',
    company: 'SP tech',
    tagline: 'SP Tech erp',
    contactPerson: 'Rahul Verma',
    email: 'rahul@sptech.com',
    phone: '+91 98112 34567',
    industry: 'Technology',
    source: 'Website Lead',
    expectedValue: '₹2,50,000',
    probability: 45,
    priority: 'Medium',
    status: 'Due Today',
    owner: 'Rahul S.',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    notes: 'ERP module scope evaluation and commercial terms.',
    lastContact: 'Aug 3',
    lastContactType: 'Email',
    nextFollowup: 'Aug 10',
    nextFollowupType: 'Demo',
    starred: false
  },
  {
    id: 'c3',
    company: 'SP tech',
    tagline: 'SP Tech erp',
    contactPerson: 'Suresh Patel',
    email: 'suresh@sptech.com',
    phone: '+91 97223 88990',
    industry: 'Manufacturing',
    source: 'Referral',
    expectedValue: '₹2,50,000',
    probability: 60,
    priority: 'Medium',
    status: 'Pending',
    owner: 'Neha J.',
    ownerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    notes: 'Sent proposal documents along with sample ERP case studies.',
    lastContact: 'Jul 30',
    lastContactType: 'WhatsApp',
    nextFollowup: 'Aug 12',
    nextFollowupType: 'Meeting',
    starred: true
  }
];

export default function ClientFollowupsView({ onOpenAI }) {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_planner_client_followups');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [selectedClientId, setSelectedClientId] = useState(() => INITIAL_CLIENTS[0].id);
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('daily_planner_client_followups', JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  // Selected Client
  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  // Filtering
  const filteredClients = clients.filter(c => {
    if (activeTab === 'Pending' && c.status !== 'Pending') return false;
    if (activeTab === 'Completed' && c.status !== 'Completed' && c.status !== 'Closed Won') return false;
    if (activeTab === 'Starred' && !c.starred) return false;

    if (statusFilter !== 'All Status' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All Priority' && c.priority !== priorityFilter) return false;
    if (ownerFilter !== 'All Owners' && c.owner !== ownerFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const companyMatch = (c.company || '').toLowerCase().includes(q);
      const contactMatch = (c.contactPerson || '').toLowerCase().includes(q);
      const taglineMatch = (c.tagline || '').toLowerCase().includes(q);
      if (!companyMatch && !contactMatch && !taglineMatch) return false;
    }
    return true;
  });

  // KPI calculations
  const totalClients = clients.length;
  const pendingCount = clients.filter(c => c.status === 'Pending').length;
  const overdueCount = clients.filter(c => c.status === 'Overdue').length;
  const completedCount = clients.filter(c => c.status === 'Completed' || c.status === 'Closed Won').length;

  // Expected Value total calculation
  const totalRevenue = clients.reduce((acc, c) => {
    if (c.status === 'Cancelled' || c.status === 'Closed Lost') return acc;
    const cleanNum = Number(String(c.expectedValue || '0').replace(/[^0-9]/g, ''));
    return acc + (cleanNum || 0);
  }, 0);

  // Star toggle
  const toggleStar = (id, e) => {
    if (e) e.stopPropagation();
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, starred: !c.starred };
      updateClientAPI(id, { starred: updated.starred }).catch(() => { });
      return updated;
    }));
  };

  // Status updates
  const handleUpdateStatus = (clientId, status) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const updated = { ...c, status };
      updateClientAPI(clientId, { status }).catch(() => { });
      return updated;
    }));
  };

  // Probability updates via slider
  const handleProbabilityChange = (clientId, val) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const updated = { ...c, probability: Number(val) };
      updateClientAPI(clientId, { probability: updated.probability }).catch(() => { });
      return updated;
    }));
  };

  // Save client changes
  const handleSaveClient = async (clientData) => {
    if (editClient) {
      setClients(prev => prev.map(c => {
        if (c.id !== clientData.id) return c;
        updateClientAPI(clientData.id, clientData).catch(() => { });
        return clientData;
      }));
    } else {
      try {
        const result = await createClientAPI(clientData);
        setClients(prev => [result || clientData, ...prev]);
        setSelectedClientId((result || clientData).id);
      } catch (err) {
        setClients(prev => [clientData, ...prev]);
        setSelectedClientId(clientData.id);
      }
    }
    setEditClient(null);
  };

  // Delete followup record
  const handleDeleteClient = (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteClientAPI(id).catch(() => { });
    if (selectedClientId === id) setSelectedClientId(clients[0]?.id || '');
    setConfirmDeleteId(null);
  };

  const getPriorityStyle = (p) => {
    return p === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800'
      : p === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
  };

  const getStatusStyle = (s) => {
    return s === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      : s === 'Due Today' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
        : s === 'Overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
          : s === 'Completed' || s === 'Closed Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 lg:pb-12 text-slate-800 dark:text-slate-100">

      {/* ── Header Bar (Matches Screenshot Mobile App Header) ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">Client Follow-ups</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Track deals, pipeline values & follow-ups
            </p>
          </div>
        </div>

        {/* Top Header Action Pill Buttons (Square Icons on Mobile, Full Pills on Desktop) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setEditClient(null); setShowModal(true); }}
            className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl sm:rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            title="Add New Follow-up"
          >
            <Plus className="w-5 h-5 text-blue-600 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Add Follow-up</span>
          </button>
          <button
            onClick={onOpenAI}
            className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            title="AI CRM Insights"
          >
            <Sparkles className="w-5 h-5 text-white sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">AI CRM Insights</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Overview Cards (Matches Screenshot 4-Column Card Grid on Mobile) ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Card 1: Total Deals */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left justify-between">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mb-1">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="w-full">
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{totalClients}</div>
            <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5 truncate">Total Deals</div>
          </div>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left justify-between">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mb-1">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="w-full">
            <div className="text-xs sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">₹{totalRevenue ? (totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(2)}L` : totalRevenue.toLocaleString('en-IN')) : '0'}</div>
            <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5 truncate">Active Pipeline</div>
          </div>
        </div>

        {/* Card 3: Attention Needed */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left justify-between">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mb-1">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="w-full">
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{overdueCount || 0}</div>
            <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5 truncate">Attention Needed</div>
          </div>
        </div>

        {/* Card 4: Follow-ups Pending */}
        <div className="card-base p-2.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left justify-between">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mb-1">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="w-full">
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{pendingCount || 0}</div>
            <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-0.5 truncate">Follow-ups Pending</div>
          </div>
        </div>
      </div>

      {/* ── Desktop Controls Toolbar (Clean Alignment & Professional Layout) ── */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Left Side: Filter Tabs & Starred Toggle */}
        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'All', label: 'All' },
              { id: 'Pending', label: 'Pending', icon: Clock },
              { id: 'Completed', label: 'Completed', icon: CheckCircle2 },
              { id: 'Due Today', label: 'Due Today', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatusFilter('All Status'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Starred Deals Toggle Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'Starred' ? 'All' : 'Starred')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'Starred'
                ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'Starred' ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span>Starred</span>
          </button>
        </div>

        {/* Right Side: Priority Filter & Search Input */}
        <div className="flex items-center gap-2">
          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All Priority">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Search Box */}
          <div className="relative w-56 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, company..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Horizontal Tab Navigation Bar (Hidden on Mobile, Visible on Desktop) ── */}


      {/* ── Main Layout (2-Column Grid on Mobile, 12 Columns on Desktop - Matches Screenshot) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

        {/* ── Left Column: Deals List + Timeline + CRM Analytics ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Desktop Table View (lg:block - DataTable Component with Pagination & Skeleton Loader) */}
          <div className="hidden lg:block">
            <DataTable
              title="Deals & Client Follow-ups"
              columns={[
                {
                  key: 'company',
                  header: 'Company / Client',
                  sortable: true,
                  render: (client) => (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                        {client.company ? client.company[0].toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          {client.company}
                          <button onClick={(e) => toggleStar(client.id, e)} className="shrink-0 focus:outline-none">
                            <Star className={`w-3.5 h-3.5 ${client.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`} />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal truncate block">{client.tagline}</span>
                      </div>
                    </div>
                  )
                },
                { key: 'lastContact', header: 'Last Interaction', sortable: true, render: (c) => <span className="font-bold text-slate-800 dark:text-slate-200">{c.lastContact || 'None'}</span> },
                { key: 'nextFollowup', header: 'Next Action', sortable: true, render: (c) => <span className="font-bold text-slate-900 dark:text-white">{c.nextFollowup || 'Not Set'}</span> },
                {
                  key: 'priority',
                  header: 'Priority',
                  sortable: true,
                  render: (c) => (
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getPriorityStyle(c.priority)}`}>
                      {c.priority}
                    </span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  render: (c) => (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(c.status)}`}>
                      {c.status}
                    </span>
                  )
                },
                { key: 'probability', header: 'Closing Prob', sortable: true, render: (c) => <span className="font-bold text-slate-600 dark:text-slate-300">{c.probability || 0}%</span> },
                { key: 'expectedValue', header: 'Deal Value', sortable: true, render: (c) => <span className="font-bold text-slate-900 dark:text-white">{c.expectedValue || '₹0'}</span> },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: (c) => (
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditClient(c); setShowModal(true); }} className="p-1 text-slate-400 hover:text-blue-600" title="Edit Deal"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirmDeleteId(c.id)} className="p-1 text-slate-400 hover:text-rose-600" title="Delete Deal"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )
                }
              ]}
              data={filteredClients}
              defaultPageSize={5}
              searchable={false}
              onRowClick={(client) => setSelectedClientId(client.id)}
              actionButton={
                <button
                  onClick={() => { setEditClient(null); setShowModal(true); }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Follow-up
                </button>
              }
            />
          </div>

          {/* Mobile Deals Cards View (lg:hidden - Matches Screenshot Deal Cards) */}
          <div className="lg:hidden space-y-3">
            {filteredClients.map(client => {
              const isSelected = client.id === selectedClientId;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-sm ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                        {client.company ? client.company[0].toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{client.company}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{client.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {client.priority}
                      </span>
                    </div>
                  </div>

                  {/* Sub-bar: Date | Star | Value | Arrow */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.lastContact}</span>
                    </div>

                    <button onClick={(e) => toggleStar(client.id, e)} className="p-1">
                      <Star className={`w-3.5 h-3.5 ${client.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>

                    <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white">
                      <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{client.expectedValue || '₹20,000'}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interaction Timeline Section (Matches Screenshot) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">Interaction Timeline</h4>
              <button onClick={() => alert('Viewing all timeline activity logs!')} className="text-[11px] font-extrabold text-blue-600 hover:underline cursor-pointer">
                View All
              </button>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-1.5 pt-1">
              <div className="relative text-xs space-y-0.5">
                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-400 text-[10px] block">Today, 10:30 AM</span>
                <p className="font-extrabold text-slate-900 dark:text-white">Interaction logged</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Discussed contract details and scope requirements with customer contact person.</p>
              </div>

              <div className="relative text-xs space-y-0.5">
                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-bold text-slate-400 text-[10px] block">Yesterday, 04:15 PM</span>
                <p className="font-extrabold text-slate-900 dark:text-white">Email followup sent</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Sent proposal documents along with sample ERP case studies.</p>
              </div>
            </div>
          </div>

          {/* CRM Analytics Recommendation Card (Matches Screenshot) */}
          <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-4 rounded-2xl space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="font-extrabold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" /> CRM Analytics
              </span>
              <p className="text-[11px] text-purple-950/70 dark:text-purple-300/80 font-medium mt-1">
                Adjust deal closing probability and next contact dates dynamically. Gemini assistant monitors these metrics to score overall company revenue health.
              </p>
            </div>
            <button onClick={onOpenAI} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 text-purple-800 dark:text-purple-200 text-xs font-extrabold rounded-xl shrink-0 cursor-pointer self-start sm:self-auto transition-all">
              View Insights
            </button>
          </div>
        </div>

        {/* ── Right Column: Selected Lead Details Panel (Matches Screenshot) ── */}
        <div className="lg:col-span-4 space-y-4">
          {selectedClient ? (
            <>
              {/* Expected Revenue Banner (Gradient Blue Card Matching Screenshot) */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Deal Expected Value</span>
                  <div className="text-2xl font-black mt-0.5">{selectedClient.expectedValue || '₹20,000'}</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Selected Deal Details Card (Matches Screenshot Layout) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-black flex items-center justify-center text-sm shrink-0">
                    {selectedClient.company ? selectedClient.company[0].toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{selectedClient.company}</h4>
                    <span className="text-[11px] text-slate-400 font-medium truncate block">{selectedClient.tagline}</span>
                  </div>
                </div>

                {/* Contact & Deal Specs Info List */}
                <div className="space-y-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedClient.contactPerson || 'Manager'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-blue-600 truncate">{selectedClient.email || 'info@codigix.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedClient.phone || '+91 98765 00000'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedClient.industry || 'Marketing'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedClient.source || 'CRM Integration'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-extrabold ${getPriorityStyle(selectedClient.priority)}`}>
                      {selectedClient.priority}
                    </span>
                  </div>

                  {/* Closing Probability Slider Bar */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Closing Prob</span>
                      <span className="font-black text-slate-900 dark:text-white">{selectedClient.probability || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedClient.probability || 0}
                      onChange={e => handleProbabilityChange(selectedClient.id, e.target.value)}
                      className="w-full accent-blue-600 h-1.5 rounded-full cursor-pointer"
                    />
                  </div>

                  {/* Quick Action Pill Buttons Bar (Chat, Call, Email, More - Matches Screenshot) */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => alert(`Starting chat with ${selectedClient.company}`)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert(`Calling ${selectedClient.phone || '+91 98765 00000'}`)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button onClick={() => alert(`Sending email to ${selectedClient.email || 'info@codigix.com'}`)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditClient(selectedClient); setShowModal(true); }} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Deal Status Donut Analytics Box (Matches Screenshot) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Deal Status</h4>
                <div className="flex items-center gap-4">
                  {/* SVG Donut Ring */}
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-blue-500" strokeDasharray="30, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-amber-500" strokeDasharray="20, 100" strokeDashoffset="-30" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                  </div>

                  <div className="space-y-1 text-xs font-bold flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Pending
                      </span>
                      <span className="text-slate-900 dark:text-white">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Overdue
                      </span>
                      <span className="text-slate-900 dark:text-white">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Closed Won
                      </span>
                      <span className="text-slate-900 dark:text-white">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2 shadow-sm">
              <Users className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">No Lead Selected</h4>
              <p className="text-[11px] text-slate-400">Select a lead to view details.</p>
            </div>
          )}
        </div>

      </div>



      {/* ── Form Modal ── */}
      <FollowupFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditClient(null); }}
        onSave={handleSaveClient}
        initial={editClient}
      />

      {/* ── Confirm Delete Modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">Delete Follow-up Entry</p>
                <p className="text-xs text-slate-500">This will remove the lead from your pipeline logs.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-bold truncate">
              {clients.find(c => c.id === confirmDeleteId)?.company}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button onClick={() => handleDeleteClient(confirmDeleteId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Client Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Client Follow-up Filters</h3>
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Clients</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company or contact person..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Filter Options: Starred Deals */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Starred / Priority Deals</label>
                <button
                  onClick={() => setActiveTab(activeTab === 'Starred' ? 'All' : 'Starred')}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-between cursor-pointer transition-all ${activeTab === 'Starred'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Star className={`w-4 h-4 ${activeTab === 'Starred' ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <span>Show Starred Deals Only</span>
                  </span>
                  <span className="text-[10px] font-black uppercase">{activeTab === 'Starred' ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>

              {/* Owner Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Deal Owner</label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="All Owners">All Deal Owners</option>
                  {OWNERS.map((o) => (
                    <option key={o.name} value={o.name}>{o.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['All Priority', 'High', 'Medium', 'Low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all truncate ${priorityFilter === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Follow-up Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All Status', ...STATUSES].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all truncate ${statusFilter === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('All Priority');
                  setStatusFilter('All Status');
                  setActiveTab('All');
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

function Flame(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5Z" />
    </svg>
  );
}
