import React, { useState } from 'react';
import { Sparkles, Shield, User, Eye, EyeOff, ArrowRight, Zap, Brain, ShieldCheck } from 'lucide-react';

const CREDENTIALS = {
  recruiter: { email: 'admin@sparkx.ai', password: 'sparkx2026' },
  candidate: { email: 'candidate@sparkx.ai', password: 'sparkx2026' },
};

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('recruiter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const creds = CREDENTIALS[mode];
    if (email.trim() === creds.email && password === creds.password) {
      onLogin(mode);
    } else {
      setError('Invalid credentials. Use the hint below to autofill.');
    }
    setLoading(false);
  };

  const autofill = () => {
    setEmail(CREDENTIALS[mode].email);
    setPassword(CREDENTIALS[mode].password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex overflow-hidden">
      {/* LEFT: Branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-12 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white tracking-tight">SparkX AI</div>
            <div className="text-xs text-slate-400 font-medium">Recruitment Intelligence Platform</div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart India Hackathon 2026</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Hire Smarter.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              No Bias. Full Evidence.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            AI-powered adaptive interviews, real-time integrity monitoring, and evidence-based scorecards — built for fair hiring.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { icon: Brain, text: 'Adaptive AI cross-examination adjusting to each answer in real-time' },
              { icon: ShieldCheck, text: 'Proctored integrity telemetry with 4+ anti-cheating signals' },
              { icon: Zap, text: 'Instant resume parsing and competency matching in under 3 mins' },
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
          <span>AI flags and recommends — qualified humans make final decisions.</span>
        </div>
      </div>

      {/* RIGHT: Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="lg:hidden flex items-center space-x-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white">SparkX AI</span>
        </div>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to access your workspace</p>
          </div>
          {/* Role Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button type="button" onClick={() => { setMode('recruiter'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'recruiter' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
              <Shield className="w-3.5 h-3.5" /><span>Recruiter (Admin)</span>
            </button>
            <button type="button" onClick={() => { setMode('candidate'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'candidate' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:text-white'}`}>
              <User className="w-3.5 h-3.5" /><span>Candidate</span>
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder={CREDENTIALS[mode].email}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-300 text-xs font-semibold">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 ${mode === 'recruiter' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30'} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : (
                <><span>Sign in as {mode === 'recruiter' ? 'Admin' : 'Candidate'}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
          {/* Hint */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demo Credentials</p>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <div>Email: <span className="text-indigo-400">{CREDENTIALS[mode].email}</span></div>
              <div>Password: <span className="text-indigo-400">{CREDENTIALS[mode].password}</span></div>
            </div>
            <button type="button" onClick={autofill} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline transition">
              Autofill and sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}