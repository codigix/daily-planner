import React from 'react';
import { RefreshCw, Sparkles, Star, MessageSquare, MapPin, Globe } from 'lucide-react';

export default function GMBView({
  isGoogleConnected,
  googleData,
  isSyncingGoogle,
  handleSyncGoogle,
  handleConnectGoogleAccount,
  setShowGoogleTokenModal
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner & Actions */}
      <div className="card-base p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white border-none space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Google Business API v1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                ✓ Location Verified
              </span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>📍 Google Business Profile (GMB) Management Suite</span>
            </h2>
            <p className="text-xs text-slate-300">
              Full 13-Phase Synchronization Engine • Accounts, Locations, Reviews Inbox, Photos, Posts & Performance Telemetry
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleSyncGoogle}
              disabled={isSyncingGoogle}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
              <span>{isSyncingGoogle ? 'Syncing Engine...' : 'Sync GMB Telemetry'}</span>
            </button>

            <button
              onClick={handleConnectGoogleAccount}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Connect Google Business</span>
            </button>

            <button
              onClick={() => setShowGoogleTokenModal(true)}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
            >
              🔑 Access Token
            </button>
          </div>
        </div>
      </div>

      {/* GMB Locations & Performance Card */}
      <div className="card-base p-6 space-y-4 border-l-4 border-amber-600">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {googleData?.account?.profile_picture ? (
              <img 
                src={googleData.account.profile_picture} 
                alt="GMB Profile" 
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 shadow-sm shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-black text-lg flex items-center justify-center border border-amber-400 shadow-sm shrink-0">
                📍
              </div>
            )}
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                {isGoogleConnected ? 'Authenticated Google Business Profile' : 'Primary Location'}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
                {googleData?.locations?.[0]?.business_name || googleData?.account?.account_name || googleData?.account?.profile_name || 'Codigixinfotech pvtltd'}
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span>{googleData?.account?.email || 'codigixinfotechpvtltd@gmail.com'}</span>
                <span>•</span>
                <span>{googleData?.locations?.[0]?.phone || '+91 91127 06604'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-black rounded-xl border border-amber-300 dark:border-amber-800">
              {isGoogleConnected ? '✓ GMB Connected' : 'Demo Profile'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
