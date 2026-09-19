import React, { useState } from 'react';
import { api } from '../../services/api';
import { 
  Sparkles, Shield, User, Eye, EyeOff, ArrowRight, Zap, 
  Brain, ShieldCheck, UserPlus, LogIn, CheckCircle2, AlertCircle 
} from 'lucide-react';

const SEEDED_CREDENTIALS = {
  recruiter: { email: 'admin@sparkx.ai', password: 'sparkx2026' },
  candidate: { email: 'candidate@sparkx.ai', password: 'sparkx2026' },
};

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [role, setRole] = useState('recruiter'); // 'recruiter' | 'candidate'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Handle Sign In (Authenticates via POST /api/auth/login) ─────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, error: apiErr } = await api.login(email.trim(), password);

    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }

    onLogin(user);
    setLoading(false);
  };

  // ─── Handle Sign Up / Register (Saves user to DB via POST /api/auth/register) ───
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { user, error: apiErr } = await api.register(name.trim(), email.trim(), password, role);

    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }

    onLogin(user);
    setLoading(false);
  };

  // Quick Autofill for instant demo evaluation
  const autofillSeededAccount = (targetRole) => {
    const creds = SEEDED_CREDENTIALS[targetRole];
    setRole(targetRole);
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex overflow-hidden">
      
      {/* ─── LEFT PANEL: Branding & SIH Pitch ───────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white tracking-tight">SparkX AI</div>
            <div className="text-xs text-slate-400 font-medium">Recruitment Intelligence Platform</div>
          </div>
        </div>

        {/* Value Prop */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart India Hackathon 2026</span>
          </div>
          
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Next-Gen Hiring.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Zero Bias. Live AI Telemetry.
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Full database-backed authentication, adaptive video AI interviews, proctored telemetry, and evidence-based candidate dossiers.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { icon: Brain, text: 'Adaptive AI cross-examination that adjusts in real time' },
              { icon: ShieldCheck, text: 'Multi-signal integrity & anti-cheating telemetry audit log' },
              { icon: Zap, text: 'Instant resume parsing & competency matching in < 3 mins' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start space-x-3 text-xs text-slate-400">
                <div className="w-6 h-6 rounded-lg bg-indigo-900/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Fairness Protocol: AI flags & recommends; qualified humans decide.</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Dynamic Authentication Form ───────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white">SparkX AI</span>
        </div>

        <div className="w-full max-w-sm space-y-6">

          {/* Sign In vs Sign Up Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                tab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                tab === 'signup'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">
              {tab === 'signin' ? 'Sign in to SparkX' : 'Register New Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {tab === 'signin' 
                ? 'Enter your registered credentials below' 
                : 'Create your account to start interviewing or hiring'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
            
            {/* Name field for registration */}
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            )}

            {/* Role selector for registration */}
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Type / Role *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                      role === 'recruiter' 
                        ? 'bg-purple-950/80 border-purple-600 text-purple-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Recruiter (Admin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                      role === 'candidate' 
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Candidate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your.name@company.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-700/60 text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Autofill helper */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Demo Autofill (Seeded DB Accounts)</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>DB Live</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setTab('signin'); autofillSeededAccount('recruiter'); }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 text-left text-xs transition"
              >
                <div className="font-bold text-indigo-400">Admin Account</div>
                <div className="text-[10px] text-slate-400">admin@sparkx.ai</div>
              </button>

              <button
                type="button"
                onClick={() => { setTab('signin'); autofillSeededAccount('candidate'); }}
                className="p-2 rounded-lg bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 text-left text-xs transition"
              >
                <div className="font-bold text-emerald-400">Candidate Account</div>
                <div className="text-[10px] text-slate-400">candidate@sparkx.ai</div>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}