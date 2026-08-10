import React from 'react';
import { ShieldCheck, RefreshCw, Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Key } from 'lucide-react';

export default function MetaSettings({
  isMetaConnected,
  metaStatus,
  handleConnectMetaAccount,
  setShowTokenModal,
  handleManualSync,
  isSyncing
}) {
  const currentStatus = metaStatus?.status || (isMetaConnected ? 'CONNECTED' : 'REAUTH_REQUIRED');

  // Status Styling Map
  const statusConfig = {
    CONNECTED: {
      label: '🟢 Meta Connected',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      description: 'Healthy. Meta OAuth 2.0 authorization active with valid 60-day long-lived token.',
      buttonText: 'Reconnect Meta',
      buttonClass: 'bg-blue-600 hover:bg-blue-700'
    },
    TOKEN_EXPIRING: {
      label: '🟠 Meta authorization needs renewal soon',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      description: `Token approaching expiry (${metaStatus?.daysRemaining || 5} days remaining). Renew authorization before expiry.`,
      buttonText: 'Renew Authorization Now',
      buttonClass: 'bg-amber-600 hover:bg-amber-700'
    },
    TOKEN_EXPIRED: {
      label: '🔴 Meta authorization expired',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      description: 'User access token has expired. Re-authenticate via Meta OAuth to restore real-time telemetry sync.',
      buttonText: 'Reconnect Meta',
      buttonClass: 'bg-rose-600 hover:bg-rose-700 animate-pulse'
    },
    REAUTH_REQUIRED: {
      label: '🔴 Meta re-authorization required',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      description: 'OAuth token revoked or permissions modified. Re-authorization required.',
      buttonText: 'Reconnect Meta',
      buttonClass: 'bg-rose-600 hover:bg-rose-700'
    },
    DISCONNECTED: {
      label: '⚪ Meta Disconnected',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      description: 'No active Meta Business connection. Authorize to start multi-asset telemetry synchronization.',
      buttonText: 'Connect Meta Account',
      buttonClass: 'bg-blue-600 hover:bg-blue-700'
    },
    SYNC_ERROR: {
      label: '🟡 Meta Sync Engine Notice',
      badgeClass: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
      description: 'Active connection exists but background engine experienced minor sync notice. Re-try manual sync.',
      buttonText: 'Retry Sync Engine',
      buttonClass: 'bg-amber-600 hover:bg-amber-700'
    }
  };

  const statusInfo = statusConfig[currentStatus] || statusConfig.CONNECTED;

  return (
    <div className="space-y-6">
      <div className="card-base p-6 space-y-4 border-l-4 border-blue-600">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Phase 5 — Token Monitoring Model</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Connection Health & Settings</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Production status monitoring, token lifetime inspection, and AES-256 encrypted credential management.</p>
          </div>
          <span className={`px-3.5 py-1.5 text-xs font-black rounded-xl border shadow-sm ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Status Callout Banner */}
        <div className={`p-4 rounded-2xl border text-xs space-y-2 flex items-start gap-3 ${statusInfo.badgeClass}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{statusInfo.label}</h4>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{statusInfo.description}</p>
          </div>
          {(currentStatus === 'TOKEN_EXPIRED' || currentStatus === 'REAUTH_REQUIRED' || currentStatus === 'TOKEN_EXPIRING' || currentStatus === 'DISCONNECTED') && (
            <button
              onClick={handleConnectMetaAccount}
              className={`px-4 py-2 text-white font-black rounded-xl text-xs shadow-md transition-all shrink-0 ${statusInfo.buttonClass}`}
            >
              {statusInfo.buttonText}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Secure OAuth 2.0 Authorization</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connect your Meta Business Manager portfolio to grant permissions for Facebook Pages, Instagram Professional Accounts, WhatsApp Cloud API, and Meta Ad Accounts.
            </p>
            <button
              onClick={handleConnectMetaAccount}
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connect with Meta OAuth v24.0</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-black text-slate-900 dark:text-white">Access Token Management</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Update 60-day long-lived User Access Token manually if permissions change or re-authorization is needed. Tokens are encrypted using AES-256-GCM.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowTokenModal(true)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
              >
                🔑 Update Access Token
              </button>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
