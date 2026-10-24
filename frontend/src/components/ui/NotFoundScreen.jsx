import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { Compass, Home, ArrowLeft, Briefcase, LayoutDashboard, WifiOff, RefreshCw } from 'lucide-react';

/**
 * NotFoundScreen — Calm, Human-First 404 & Recovery Screen
 * 
 * Provides clear recovery options without technical blame:
 * - Checks network online status (so network drop isn't confused with missing route)
 * - Offers contextual return options tailored to the user's role (Recruiter vs Candidate vs Guest)
 * - Preserves light/dark theme consistency with warm ARETE tokens
 */
export default function NotFoundScreen() {
  const navigate = useNavigate();
  const { userRole, isLoggedIn } = useRecruitment();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReturn = () => {
    if (!isLoggedIn) {
      navigate('/home');
    } else if (userRole === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in-up selection:bg-brand-500/20">
      
      {/* Icon Badge */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-brand-950/40 border border-brand-500/20 dark:border-brand-800/40 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400 shadow-xl">
          {!isOnline ? (
            <WifiOff className="w-10 h-10 text-amber-500" />
          ) : (
            <Compass className="w-10 h-10 animate-spin-slow" />
          )}
        </div>
        <span className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md ${
          !isOnline ? 'bg-amber-600' : 'bg-rose-500'
        }`}>
          {!isOnline ? 'Offline' : '404'}
        </span>
      </div>

      {/* Narrative & Explanation */}
      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
          {!isOnline ? 'Connection Interrupted' : 'Page Not Located'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          {!isOnline
            ? 'Your device appears to have lost network connectivity. When your connection is restored, please reload or return to your destination.'
            : 'The resource or URL you requested could not be found. It may have moved or been updated. You can safely return to your previous page or workspace below.'}
        </p>
      </div>

      {/* Contextual Action Recovery Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-[#2A2520] hover:bg-stone-100 dark:hover:bg-[#1A1714] text-stone-700 dark:text-stone-300 font-bold text-xs active:scale-[0.98] transition flex items-center space-x-2 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        {!isOnline ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-amber-900/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReturn}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-brand-900/20 transition flex items-center space-x-2 cursor-pointer"
          >
            {!isLoggedIn ? (
              <>
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </>
            ) : userRole === 'recruiter' ? (
              <>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Recruiter Workspace</span>
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5" />
                <span>Explore Open Roles</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
