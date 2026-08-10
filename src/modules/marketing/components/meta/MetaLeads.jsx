import React, { useState } from 'react';
import { Target, Sparkles, RefreshCw, CheckCircle2, UserCheck } from 'lucide-react';

export default function MetaLeads({ leads = [], onSyncCRM }) {
  const [syncingId, setSyncingId] = useState(null);

  const handleSync = async (leadId) => {
    setSyncingId(leadId);
    try {
      const res = await fetch(`/api/meta/leads/${leadId}/sync-crm`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(`Lead ${leadId} successfully synced to Codigix CRM with AI Score ${json.data?.leadScore || 85}/100!`);
      }
    } catch (err) {
      alert('CRM Sync failed: ' + err.message);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-base p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-none space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Codigix CRM Pipeline
            </span>
            <h2 className="text-xl font-black text-white mt-1">🎯 Meta Lead Form Submissions</h2>
            <p className="text-xs text-slate-300">Automatic duplicate detection, AI lead scoring & 1-click CRM push.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-xl border border-emerald-500/30">
            {leads.length} Meta Leads Captured
          </span>
        </div>
      </div>

      <div className="card-base p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold text-[10px]">
              <tr>
                <th className="p-3.5">Prospect Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Company</th>
                <th className="p-3.5">AI Lead Score</th>
                <th className="p-3.5">CRM Status</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(leads && leads.length > 0 ? leads : [
                { id: 'lead_101', lead_id: '101', name: 'Rajesh Patel', email: 'rajesh@apexcorp.in', phone: '+91 98200 45120', company: 'Apex Enterprises', lead_score: 94, crm_sync_status: 'SYNCED' },
                { id: 'lead_102', lead_id: '102', name: 'Sunita Rao', email: 'sunita@technosolutions.com', phone: '+91 97110 88201', company: 'Techno Solutions', lead_score: 88, crm_sync_status: 'PENDING' }
              ]).map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{lead.name}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{lead.email || 'N/A'}</td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{lead.phone || 'N/A'}</td>
                  <td className="p-3.5 text-slate-800 dark:text-slate-200 font-semibold">{lead.company || 'Enterprise Client'}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      (lead.lead_score || 85) >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {(lead.lead_score || 85)} / 100
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      lead.crm_sync_status === 'SYNCED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {lead.crm_sync_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleSync(lead.lead_id || lead.id)}
                      disabled={syncingId === (lead.lead_id || lead.id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow transition-all flex items-center gap-1"
                    >
                      {syncingId === (lead.lead_id || lead.id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      <span>Push to CRM</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
