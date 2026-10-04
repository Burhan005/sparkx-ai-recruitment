import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundScreen() {
  const navigate = useNavigate();
  const { userRole, isLoggedIn } = useRecruitment();

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in-up">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/10 dark:bg-brand-950/40 border border-brand-500/20 dark:border-brand-800/40 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400 shadow-xl">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
          404
        </span>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-display">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          The requested URL does not exist or has been moved. Please verify the link or return to your recruitment destination.
        </p>
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 rounded-xl border border-stone-300/80 dark:border-[#2A2520] hover:bg-stone-100 dark:hover:bg-[#1A1714] text-stone-700 dark:text-stone-300 font-bold text-xs active:scale-[0.98] transition flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        <button
          onClick={handleReturn}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-brand-900/20 transition flex items-center space-x-2 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{isLoggedIn ? 'Return to Dashboard' : 'Return to Home'}</span>
        </button>
      </div>
    </div>
  );
}
