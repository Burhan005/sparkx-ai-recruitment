import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — Component Exception Boundary with ARETE Theme Support
 * 
 * Catches unhandled React render-tree exceptions and provides a calm,
 * reassuring recovery screen with light and dark mode consistency.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ARETE UI ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0F0E0D] text-stone-900 dark:text-stone-100 flex items-center justify-center p-4 transition-colors">
          <div className="max-w-lg w-full bg-[#FDFBF7] dark:bg-[#161311] border border-[#E8E4DF] dark:border-[#2A2520] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
                Rendering Recovery
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                A temporary interface rendering exception was safely intercepted. Your persisted recruitment data in the database ledger remains intact.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-stone-100 dark:bg-[#0C0A09] rounded-xl border border-stone-200 dark:border-[#2A2520] text-left overflow-hidden">
                <p className="font-mono text-xs text-rose-600 dark:text-rose-400 break-words leading-relaxed">
                  {this.state.error?.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-[#24201D] hover:bg-stone-200 dark:hover:bg-[#36302A] text-stone-800 dark:text-stone-200 text-xs font-semibold border border-[#E8E4DF] dark:border-[#36302A] transition flex items-center space-x-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
