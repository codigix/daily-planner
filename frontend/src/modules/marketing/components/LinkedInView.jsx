import React from 'react';
import { RefreshCw, Sparkles, TrendingUp, Users, Activity, BarChart2 } from 'lucide-react';

export default function LinkedInView({
  isLinkedinConnected,
  linkedinData,
  isSyncingLinkedin,
  handleSyncLinkedIn,
  handleConnectLinkedInAccount,
  setShowLinkedinTokenModal
}) {
  return (
    <div className="space-y-6">
      {/* Header Banner & Actions */}
      <div className="card-base p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-none space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                LinkedIn REST API v2
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isLinkedinConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                {isLinkedinConnected ? '✓ LinkedIn Connected' : 'Awaiting Connection'}
              </span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>💼 LinkedIn Organization & Corporate Suite</span>
            </h2>
            <p className="text-xs text-slate-300">
              Manage Company Pages, Corporate Posts Feed, Follower Analytics, and B2B Engagement Insights
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleSyncLinkedIn}
              disabled={isSyncingLinkedin}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLinkedin ? 'animate-spin' : ''}`} />
              <span>{isSyncingLinkedin ? 'Syncing...' : 'Sync Live Telemetry'}</span>
            </button>

            <button
              onClick={handleConnectLinkedInAccount}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Connect LinkedIn Account</span>
            </button>

            <button
              onClick={() => setShowLinkedinTokenModal(true)}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
            >
              🔑 Access Token
            </button>
          </div>
        </div>

        {/* Performance Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Company Followers</span>
            <strong className="text-base font-black text-white">{(linkedinData?.metrics?.total_followers || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Impressions</span>
            <strong className="text-base font-black text-blue-400">{(linkedinData?.metrics?.total_impressions || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Post Clicks</span>
            <strong className="text-base font-black text-emerald-400">{(linkedinData?.metrics?.total_clicks || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Reactions / Likes</span>
            <strong className="text-base font-black text-amber-400">{(linkedinData?.metrics?.total_reactions || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Comments & Shares</span>
            <strong className="text-base font-black text-purple-400">{(linkedinData?.metrics?.total_comments || 0).toLocaleString()}</strong>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Avg Engagement</span>
            <strong className="text-base font-black text-emerald-300">{linkedinData?.metrics?.average_engagement_rate || '0.00%'}</strong>
          </div>
        </div>
      </div>

      {/* User & Company Profile Card */}
      <div className="card-base p-6 space-y-4 border-l-4 border-blue-600">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {linkedinData?.account?.profile_picture ? (
              <img
                src={linkedinData.account.profile_picture}
                alt="Profile"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center border border-blue-500 shadow-sm">
                {linkedinData?.account?.first_name ? linkedinData.account.first_name.charAt(0) : 'LI'}
              </div>
            )}
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">LinkedIn User Profile</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {linkedinData?.account ? `${linkedinData.account.first_name} ${linkedinData.account.last_name}` : 'Codigix Official Profile'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">URN: <span className="font-mono">{linkedinData?.account?.sub || 'urn:li:person:AQV...'}</span></p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black rounded-xl">
            {linkedinData?.account ? 'OAuth Verified' : 'Standard Profile'}
          </span>
        </div>
      </div>
    </div>
  );
}
