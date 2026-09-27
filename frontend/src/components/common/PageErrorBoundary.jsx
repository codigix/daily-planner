import React from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';

// Contains a crash to the current page so the header, sidebar and bottom nav keep working.
// App renders it with key={activeTab}, so switching tabs resets the error.
export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">This page couldn't load</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Something went wrong while showing this section. Your data is safe — try again, or go back to the dashboard.
        </p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />Try again
          </button>
          {this.props.onGoHome && (
            <button
              onClick={this.props.onGoHome}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-md flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }
}
