import React from 'react';
import { 
  Download, 
  X, 
  Check, 
  Laptop, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Zap, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function PWAInstallModal({ 
  isOpen, 
  onClose, 
  isInstallable, 
  isInstalled, 
  onInstall 
}) {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
        {/* Decorative Top Banner */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 flex flex-col justify-end overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-300" /> Desktop & Mobile App
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Download CODIGIX OS App
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {isInstalled ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                App Already Installed!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                CODIGIX EXECUTIVE OS is installed on your device. You can launch it anytime from your desktop or app drawer.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-md"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Access</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Launch natively without typing URL</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Standalone App</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dedicated window without browser tabs</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Secure & Fast</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hardware-accelerated performance</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Offline Shell</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Cached shell for offline access</p>
                  </div>
                </div>
              </div>

              {/* Install Action Area */}
              {isInstallable ? (
                <div className="pt-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Install CODIGIX OS Now (1-Click)
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Clicking install will add CODIGIX EXECUTIVE OS to your desktop / apps menu.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    How to install manually on your browser:
                  </div>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    <li><strong className="text-slate-800 dark:text-slate-100">Chrome / Edge (Desktop):</strong> Click the install icon <Download className="inline w-3.5 h-3.5 text-blue-500" /> in the address bar (top right).</li>
                    <li><strong className="text-slate-800 dark:text-slate-100">Chrome (Android):</strong> Tap menu (<strong>⋮</strong>) &gt; select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li><strong className="text-slate-800 dark:text-slate-100">Safari (iOS):</strong> Tap Share button <ExternalLink className="inline w-3.5 h-3.5 text-blue-500" /> &gt; select <strong>"Add to Home Screen"</strong>.</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
