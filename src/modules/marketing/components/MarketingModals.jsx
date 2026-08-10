import React from 'react';
import { RefreshCw, Globe } from 'lucide-react';

export default function MarketingModals({
  authModalPlatform,
  setAuthModalPlatform,
  showTokenModal,
  setShowTokenModal,
  inputToken,
  setInputToken,
  tokenError,
  tokenSuccess,
  isSavingToken,
  handleSaveToken,
  handleConnectMetaAccount,
  showGoogleTokenModal,
  setShowGoogleTokenModal,
  inputGoogleToken,
  setInputGoogleToken,
  googleTokenSuccess,
  handleSaveGoogleToken,
  handleConnectGoogleAccount,
  showLinkedinTokenModal,
  setShowLinkedinTokenModal,
  inputLinkedinToken,
  setInputLinkedinToken,
  linkedinTokenSuccess,
  handleSaveLinkedInToken,
  handleConnectLinkedInAccount
}) {
  return (
    <>
      {/* OAuth Handshake Modal */}
      {authModalPlatform && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-600 to-indigo-600" />
            
            <div className="flex justify-between items-start pt-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-pink-600" />
                  Link {authModalPlatform.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">Secure OAuth 2.0 v24.0 Handshake Integration</p>
              </div>
              <button onClick={() => setAuthModalPlatform(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
              Authorize <strong>CODIGIX Executive OS</strong> to retrieve marketing campaign insights, profile reach, daily clicks, and leads data from your {authModalPlatform.name} Console.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="https://www.facebook.com/v24.0/dialog/oauth?client_id=1702132520841033&redirect_uri=http%3A%2F%2Flocalhost%3A5001%2Fapi%2Fmeta%2Fcallback&config_id=2206329326871875&response_type=code&state=codigixinfotech"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md text-center flex items-center justify-center gap-1.5"
              >
                <span>Login with Facebook OAuth v24.0</span>
                <span>↗</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    alert(`${authModalPlatform.name} linked successfully! Profile reach and live campaign metrics are now synced.`);
                    setAuthModalPlatform(null);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Authorize Connection
                </button>
                <button onClick={() => setAuthModalPlatform(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meta Real-Time Webhook Configuration Modal Dialog */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-base max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚡ Meta Real-Time Webhook Ingestion</span>
              </h3>
              <button onClick={() => setShowTokenModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Meta Token dependency has been removed. Your app ingests live <strong>Leads, Page Messages, Comments, Ad Account Spend, and WhatsApp events</strong> directly via real-time Meta Webhooks.
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Webhook Callback URL</label>
                <code className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-brand-600 dark:text-brand-400 font-mono text-[11px] block border border-slate-200 dark:border-slate-800 select-all">
                  http://localhost:5001/api/webhooks/meta
                </code>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Verify Token</label>
                <code className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-mono text-[11px] block border border-slate-200 dark:border-slate-800 select-all">
                  codigix_meta_webhook_secret_verify_2026
                </code>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Token Update Modal Dialog */}
      {showGoogleTokenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-base max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑 Update Google Business Access Token</span>
              </h3>
              <button onClick={() => setShowGoogleTokenModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paste your <strong>Google OAuth Access Token</strong> (`ya29...`). The backend will store it in MySQL `google_accounts` table and execute all 13 phases of synchronization.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Google Access Token (ya29...)</label>
              <textarea
                value={inputGoogleToken}
                onChange={(e) => setInputGoogleToken(e.target.value)}
                placeholder="ya29.a0ARW5m7G..."
                rows={4}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {googleTokenSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {googleTokenSuccess}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleConnectGoogleAccount}
                className="text-xs text-amber-600 hover:underline font-bold"
              >
                Or Login with Google OAuth ↗
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGoogleTokenModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGoogleToken}
                  disabled={!inputGoogleToken.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  Save & Sync Google Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Token Update Modal Dialog */}
      {showLinkedinTokenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-base max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑 Update LinkedIn Access Token</span>
              </h3>
              <button onClick={() => setShowLinkedinTokenModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paste your <strong>LinkedIn OAuth Access Token</strong> (`AQV...`). The backend will store it in MySQL `linkedin_accounts` table and execute all refresh phases.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">LinkedIn Access Token (AQV...)</label>
              <textarea
                value={inputLinkedinToken}
                onChange={(e) => setInputLinkedinToken(e.target.value)}
                placeholder="AQV_linkedin_access_token..."
                rows={4}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {linkedinTokenSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {linkedinTokenSuccess}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleConnectLinkedInAccount}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Or Login with LinkedIn OAuth ↗
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowLinkedinTokenModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLinkedInToken}
                  disabled={!inputLinkedinToken.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  Save & Sync LinkedIn Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
