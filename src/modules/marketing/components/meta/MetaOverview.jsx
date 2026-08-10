import React from 'react';
import {
  TrendingUp,
  Sparkles,
  BarChart2,
  Users,
  MessageSquare,
  DollarSign,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Timer,
  Activity,
  FileCode,
  AlertCircle,
  Database,
  RefreshCw,
  Settings,
  Shield,
  Cloud,
  Eye,
  ChevronRight
} from 'lucide-react';

export default function MetaOverview({
  portfolio,
  metrics,
  campaigns,
  leads,
  onNavigateTab
}) {
  const formatNum = (val) => {
    if (val === undefined || val === null) return '0';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Business Portfolio Dark Card Banner (Matches Screenshot Dark Portfolio Card) ── */}
      <div className="bg-black p-4 sm:p-6 text-white border-none rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                PHASE 4 — SYNCED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> CONNECTED
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5">
              {portfolio?.name || 'Codigix Business Portfolio'}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Auto Sync (Every 15 Mins) • Assets, Posts, Campaigns, Leads & Insights
            </p>
          </div>

          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Open Suite</span>
            <span>↗</span>
          </a>
        </div>

        {/* 6 Side-by-Side Telemetry Boxes (2 Rows of 3 Cols on Mobile) */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Last Sync</span>
            </div>
            <strong className="text-white font-black text-xs mt-1 truncate">08:25 PM</strong>
          </div>

          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Next Sync</span>
            </div>
            <strong className="text-emerald-400 font-black text-xs mt-1 truncate">13 mins</strong>
          </div>

          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Sync Duration</span>
            </div>
            <strong className="text-cyan-400 font-black text-xs mt-1 truncate">1.85s</strong>
          </div>

          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Records Created</span>
            </div>
            <strong className="text-emerald-400 font-black text-xs mt-1 truncate">+3 New</strong>
          </div>

          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <FileCode className="w-3 h-3 text-purple-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Records Updated</span>
            </div>
            <strong className="text-purple-400 font-black text-xs mt-1 truncate">18 Updated</strong>
          </div>

          <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-slate-400">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase truncate">Records Failed</span>
            </div>
            <strong className="text-slate-300 font-black text-xs mt-1 truncate">0 Failed</strong>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: 6 White KPI Cards Row (Matches Screenshot KPI Cards Row) ── */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible snap-x no-scrollbar pb-1">
        {/* Card 1: Followers */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Followers</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">20</div>
          <div className="flex items-center gap-1.5 text-[8px] font-extrabold mt-0.5">
            <span className="text-blue-600">f 2</span>
            <span className="text-pink-500">ig 9</span>
          </div>
        </div>

        {/* Card 2: Reach */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Reach</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">432</div>
          <div className="flex items-center gap-1.5 text-[8px] font-extrabold mt-0.5">
            <span className="text-blue-600">f 90</span>
            <span className="text-pink-500">ig 342</span>
          </div>
        </div>

        {/* Card 3: Engagement */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-1">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Engagement</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">5.6%</div>
          <div className="flex items-center gap-1.5 text-[8px] font-extrabold mt-0.5">
            <span className="text-blue-600">f 4.8%</span>
            <span className="text-pink-500">ig 6.4%</span>
          </div>
        </div>

        {/* Card 4: Meta Leads */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Leads</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">0</div>
          <span className="text-[8px] font-extrabold text-amber-600 block mt-0.5 truncate">Meta Leads</span>
        </div>

        {/* Card 5: Ad Spend */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Ad Spend</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">₹0</div>
          <span className="text-[8px] font-extrabold text-indigo-600 block mt-0.5 truncate">Total Spend</span>
        </div>

        {/* Card 6: Campaigns */}
        <div className="card-base p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between items-center text-center min-w-[105px] shrink-0 sm:min-w-0">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center mb-1">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 block truncate">Campaigns</span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">2</div>
          <span className="text-[8px] font-extrabold text-emerald-600 block mt-0.5 truncate">Active</span>
        </div>
      </div>

      {/* ── SECTION 2: 4 Dedicated Platform Cards Row (Matches Screenshot Platform Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Facebook */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                f
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Facebook</h4>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  Page Active
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-semibold text-slate-500 pt-1">
            <div className="flex justify-between"><span>Reach</span><strong className="text-slate-900 dark:text-white font-black">90</strong></div>
            <div className="flex justify-between"><span>Eng.</span><strong className="text-blue-600 font-black">4.8%</strong></div>
            <div className="flex justify-between"><span>Leads</span><strong className="text-slate-900 dark:text-white font-black">0</strong></div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('facebook')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer"
          >
            ➜
          </button>
        </div>

        {/* Card 2: Instagram */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                ig
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Instagram</h4>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300">
                  Business Active
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-semibold text-slate-500 pt-1">
            <div className="flex justify-between"><span>Reach</span><strong className="text-slate-900 dark:text-white font-black">342</strong></div>
            <div className="flex justify-between"><span>Eng.</span><strong className="text-pink-600 font-black">6.4%</strong></div>
            <div className="flex justify-between"><span>Leads</span><strong className="text-slate-900 dark:text-white font-black">0</strong></div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('instagram')}
            className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer"
          >
            ➜
          </button>
        </div>

        {/* Card 3: WhatsApp */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                wa
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">WhatsApp</h4>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Cloud API
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-semibold text-slate-500 pt-1">
            <div className="flex justify-between"><span>Conv.</span><strong className="text-emerald-600 font-black">4</strong></div>
            <div className="flex justify-between"><span>Leads</span><strong className="text-emerald-600 font-black">3</strong></div>
            <div className="flex justify-between"><span>Resp. Rate</span><strong className="text-emerald-600 font-black">94%</strong></div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('whatsapp')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer"
          >
            ➜
          </button>
        </div>

        {/* Card 4: Meta Ads */}
        <div className="card-base p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                ∞
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Meta Ads</h4>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                  Campaigns Active
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-[10px] font-semibold text-slate-500 pt-1">
            <div className="flex justify-between"><span>Spend</span><strong className="text-purple-600 font-black">₹0</strong></div>
            <div className="flex justify-between"><span>Clicks</span><strong className="text-slate-900 dark:text-white font-black">0</strong></div>
            <div className="flex justify-between"><span>Leads</span><strong className="text-slate-900 dark:text-white font-black">0</strong></div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('ads')}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer"
          >
            ➜
          </button>
        </div>
      </div>

      {/* ── SECTION 3: Platform Sync Pipeline Card (Matches Screenshot Pipeline) ── */}
      <div className="card-base p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">Platform Sync Pipeline</h3>
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
            Phase 1 & 2 Complete
          </span>
        </div>

        {/* Pipeline Nodes Row */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-2 text-center">
          {/* Node 1 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <Database className="w-4 h-4" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Data Collection</span>
            <span className="text-[8px] font-bold text-emerald-600">Live</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* Node 2 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <RefreshCw className="w-4 h-4" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Processing</span>
            <span className="text-[8px] font-bold text-emerald-600">Active</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* Node 3 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <Settings className="w-4 h-4" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Sync Engine</span>
            <span className="text-[8px] font-bold text-emerald-600">Running</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* Node 4 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <Shield className="w-4 h-4" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Validation</span>
            <span className="text-[8px] font-bold text-emerald-600">Verified</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* Node 5 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <Cloud className="w-4 h-4" />
              <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Storage</span>
            <span className="text-[8px] font-bold text-emerald-600">Synced</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* Node 6 */}
          <div className="flex flex-col items-center shrink-0 min-w-[65px]">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center relative mb-1">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Analytics</span>
            <span className="text-[8px] font-bold text-emerald-600">Live</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: AI Marketing Insight Banner (Matches Screenshot Banner) ── */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-purple-700 dark:text-purple-400">AI Marketing Insight</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5">
              Engagement rate is up by 12.4% this month. Increase ad spend on high-performing campaigns for better ROI.
            </p>
          </div>
        </div>

        <button className="px-3 py-1.5 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl text-[10px] font-extrabold flex items-center gap-1 shrink-0 shadow-sm hover:bg-purple-50 transition-all cursor-pointer">
          <span>View Insights</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
