import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundScreen() {
  const navigate = useNavigate();
  const { userRole, isLoggedIn } = useRecruitment();

  const handleReturn = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (userRole === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 dark:border-indigo-800/40 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-xl">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
          404
        </span>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The requested URL does not exist or has been moved. Please verify the link or return to your recruitment dashboard.
        </p>
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center space-x-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        <button
          onClick={handleReturn}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
