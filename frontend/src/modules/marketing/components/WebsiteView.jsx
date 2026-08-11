import React from 'react';
import { TrendingUp, Globe } from 'lucide-react';

export default function WebsiteView() {
  return (
    <div className="card-base p-6 space-y-3">
      <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <span>📈 Website Traffic & Organic Enquiries</span>
      </h2>
      <p className="text-xs text-slate-500">Google Analytics 4 & website contact form submission telemetry.</p>
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <span className="text-xs font-bold text-slate-500">GA4 Analytics Live • Monthly Traffic: 14,280 Unique Visitors</span>
      </div>
    </div>
  );
}
