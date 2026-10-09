import React, { useEffect } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { Avatar } from '../ui/Primitives';
import { LogOut, ShieldAlert, X } from 'lucide-react';

export default function SignOutModal() {
  const {
    isLogoutModalOpen,
    cancelLogout,
    confirmLogout,
    currentUser,
    userRole
  } = useRecruitment();

  // Close modal on Escape key
  useEffect(() => {
    if (!isLogoutModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cancelLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutModalOpen, cancelLogout]);

  if (!isLogoutModalOpen) return null;

  const displayName = currentUser?.name || (userRole === 'recruiter' ? 'SparkX Admin' : 'Candidate');
  const displayEmail = currentUser?.email || (userRole === 'recruiter' ? 'admin@sparkx.ai' : 'candidate@sparkx.ai');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) cancelLogout();
      }}
    >
      <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#2B201A] border border-stone-300/80 dark:border-[#423229] rounded-2xl shadow-depth-elevated p-6 animate-modal-enter space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={cancelLogout}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="signout-modal-title"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 font-display tracking-tight"
            >
              Sign out of SparkX?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
              Are you sure you want to log out? You will need to sign back in to access your dashboard.
            </p>
          </div>
        </div>

        {/* Active Account Identity Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#12100E] border border-stone-200/90 dark:border-stone-800/90 shadow-2xs">
          <div className="relative">
            <Avatar name={displayName} size="md" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#12100E]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                {userRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
              </span>
            </div>
            <div className="text-[11px] text-stone-400 truncate mt-0.5 font-mono">
              {displayEmail}
            </div>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Active IDE sessions and live test results are saved to your profile.</span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={cancelLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-2xs transition active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-950/20 transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
