import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { 
  Sparkles, Shield, User, Eye, EyeOff, ArrowRight, Zap, 
  Brain, ShieldCheck, UserPlus, LogIn, AlertCircle, KeyRound,
  CheckCircle2, ArrowLeft, Sun, Moon, Upload, FileText, Loader2,
  Lock
} from 'lucide-react';

export default function LoginScreen({ mode, onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, login } = useRecruitment();
  const effectiveLogin = onLogin || login;

  // Determine current active tab from prop or route path
  const resolveTab = () => {
    if (mode) return mode;
    const path = location.pathname.toLowerCase();
    if (path.includes('register') || path.includes('signup')) return 'signup';
    if (path.includes('forgot')) return 'forgot';
    return 'signin';
  };

  const [tab, setTab] = useState(resolveTab);
  const [role, setRole] = useState('candidate'); // 'recruiter' | 'candidate'

  // Sync tab on route changes (e.g. browser back/forward or route clicks)
  useEffect(() => {
    setTab(resolveTab());
    setError('');
    setSuccessMsg('');
  }, [mode, location.pathname]);

  const switchToTab = (newTab) => {
    setError('');
    setSuccessMsg('');
    setTab(newTab);
    if (newTab === 'signup') {
      navigate('/register');
    } else if (newTab === 'forgot') {
      navigate('/forgot-password');
    } else {
      navigate('/login');
    }
  };

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Candidate Profile & Resume Upload Fields
  const [phone, setPhone] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skillsString, setSkillsString] = useState('');
  const [education, setEducation] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Forgot Password Fields
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Handle Sign In (Authenticates via POST /api/auth/login) ─────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const { user, error: apiErr } = await api.login(email.trim(), password);

    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }

    effectiveLogin(user);
    setLoading(false);
  };

  // ─── Handle Candidate Resume Parsing On The Fly ─────────────────────────────
  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    setIsParsingResume(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result || '';
      setResumeText(typeof text === 'string' ? text : '');
      
      // Smart tech skills extraction
      const commonSkills = [
        'Python', 'FastAPI', 'React', 'JavaScript', 'TypeScript', 'Node.js',
        'Next.js', 'PostgreSQL', 'SQL', 'MongoDB', 'PyTorch', 'TensorFlow',
        'Machine Learning', 'LangChain', 'Docker', 'Kubernetes', 'AWS',
        'System Design', 'Git', 'HTML', 'CSS', 'Tailwind CSS', 'C++', 'Java', 'Go'
      ];
      const foundSkills = commonSkills.filter(s => 
        new RegExp(`\\b${s.replace('+', '\\+')}\\b`, 'i').test(text)
      );
      if (foundSkills.length > 0) {
        setSkillsString(foundSkills.join(', '));
      } else if (!skillsString) {
        setSkillsString('Python, React, JavaScript, SQL');
      }

      // Guess experience
      const expMatch = text.match(/(\d+)\+?\s*years?(?:\s+of)?\s+experience/i) || text.match(/experience[:\s]+(\d+)/i);
      if (expMatch && expMatch[1]) {
        setExperienceYears(expMatch[1]);
      } else if (!experienceYears) {
        setExperienceYears('2');
      }

      // Guess role
      const roles = [
        'Full-Stack Engineer', 'Frontend Engineer', 'Backend Engineer', 
        'AI/ML Engineer', 'Data Scientist', 'DevOps Engineer', 
        'Software Engineer', 'Cloud Architect'
      ];
      const foundRole = roles.find(r => new RegExp(r, 'i').test(text));
      if (foundRole) {
        setJobRole(foundRole);
      } else if (!jobRole) {
        setJobRole('Software Engineer');
      }

      // Guess education
      const eduMatch = text.match(/(B\.?Tech|B\.?E\.?|B\.?S\.?|M\.?Tech|M\.?S\.?|MCA|Bachelor|Master)/i);
      if (eduMatch) {
        setEducation(`${eduMatch[1]} in Computer Science`);
      } else if (!education) {
        setEducation("Bachelor's in Computer Science / Engineering");
      }

      setIsParsingResume(false);
    };
    reader.onerror = () => {
      setIsParsingResume(false);
    };
    reader.readAsText(file);
  };

  // ─── Handle Sign Up / Register (Saves user to DB via POST /api/auth/register) ───
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (role === 'recruiter' && !adminCode.trim()) {
      setError('Recruiter registration requires an authorized Admin Key');
      return;
    }

    setLoading(true);

    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    const profileData = role === 'candidate' ? {
      phone: phone.trim() || null,
      jobRole: jobRole.trim() || (skills.length > 0 ? 'Full-Stack Developer' : null),
      experienceYears: Number(experienceYears || 0),
      skills: skills.length > 0 ? skills : ['React', 'JavaScript', 'Python'],
      education: education.trim() || 'B.Tech / Equivalent in CS or AI',
      resumeFilename: resumeFileName || null,
      resumeSummary: resumeSummary || (resumeFileName ? `Uploaded resume: ${resumeFileName}` : null),
      resumeText: resumeText || null,
    } : {};

    const { user, error: apiErr } = await api.register(
      name.trim(), 
      email.trim(), 
      password, 
      role, 
      adminCode.trim(), 
      profileData
    );

    if (apiErr) {
      setError(apiErr);
      setLoading(false);
      return;
    }

    effectiveLogin(user);
    setLoading(false);
  };

  // ─── Handle Forgot Password Step 1 (Request Verification Code) ────────────────
  const handleRequestResetCode = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    const { success, data, error: apiErr } = await api.forgotPassword(forgotEmail.trim());

    if (!success || apiErr) {
      setError(apiErr || 'Failed to dispatch reset code.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setForgotStep(2);
    setSuccessMsg(data?.message || 'Verification code dispatched to your email.');
    if (data?.dev_code) {
      setDevCode(data.dev_code);
      setResetCode(data.dev_code);
    }
  };

  // ─── Handle Resend Code in Step 2 ─────────────────────────────────────────────
  const handleResendCode = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    const { success, data, error: apiErr } = await api.forgotPassword(forgotEmail.trim());
    setLoading(false);

    if (!success || apiErr) {
      setError(apiErr || 'Failed to dispatch a new verification code.');
      return;
    }

    setSuccessMsg('A new 6-digit verification code has been dispatched.');
    if (data?.dev_code) {
      setDevCode(data.dev_code);
      setResetCode(data.dev_code);
    }
  };

  // ─── Handle Forgot Password Step 2 (Reset Password) ──────────────────────────
  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const { success, error: apiErr } = await api.resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);

    if (!success || apiErr) {
      setError(apiErr || 'Failed to reset password.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmail(forgotEmail.trim());
    setPassword(newPassword);
    switchToTab('signin');
    setSuccessMsg('Password reset successful! You can now sign in with your new password.');
  };

  return (
    <div className="h-screen w-full max-w-full overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      
      {/* ─── Top Floating Theme Switcher ─────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-40">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-sm hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* ─── LEFT PANEL: Branding & Value Pitch (Fixed half on lg) ─────────── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 xl:w-1/2 h-full shrink-0 relative overflow-hidden p-8 xl:p-12 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 text-white border-r border-indigo-950/50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight">SparkX AI</div>
            <div className="text-xs text-indigo-200 font-medium">Recruitment Intelligence Platform</div>
          </div>
        </div>

        {/* Value Prop */}
        <div className="relative z-10 space-y-6 my-auto py-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart India Hackathon 2026</span>
          </div>
          
          <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
            Next-Gen Hiring.<br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              Zero Bias. Live AI Telemetry.
            </span>
          </h1>

          <p className="text-indigo-100/80 text-xs xl:text-sm leading-relaxed max-w-md">
            Full database-backed authentication, adaptive video AI interviews, proctored telemetry, and evidence-based candidate dossiers.
          </p>

          <div className="space-y-3 pt-1 max-w-md">
            {[
              { icon: Brain, text: 'Adaptive AI cross-examination that dynamically adjusts to candidate answers in real time' },
              { icon: ShieldCheck, text: 'Multi-signal integrity & anti-cheating telemetry audit log (audio, gaze, tab switches)' },
              { icon: Zap, text: 'Instant resume parsing & automated competency matching in under 3 minutes' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start space-x-3 text-xs text-indigo-100/90">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-xs text-indigo-200/70 pt-4 border-t border-white/[0.08]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Fairness Protocol: AI flags & recommends; qualified human recruiters decide.</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Dynamic Authentication Form (Scrollable & Responsive) ─── */}
      <div className="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden relative bg-slate-50 dark:bg-[#070A12] transition-colors duration-300 flex flex-col items-center">
        
        {/* Inner container centered with my-auto so it never clips and scrolls smoothly */}
        <div className={`w-full my-auto py-8 sm:py-12 px-4 sm:px-8 flex flex-col items-center justify-center transition-all duration-300 ${tab === 'signup' ? 'max-w-xl xl:max-w-2xl' : 'max-w-md'}`}>

          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center space-x-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">SparkX AI</span>
          </div>

          {/* Sign In vs Sign Up Tabs (Hidden during forgot password) */}
          {tab !== 'forgot' ? (
            <div className="flex p-1 rounded-2xl bg-slate-200/90 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 w-full max-w-xs mb-6 shadow-sm">
              <button
                type="button"
                onClick={() => switchToTab('signin')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => switchToTab('signup')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mb-6 w-full">
              <button
                type="button"
                onClick={() => switchToTab('signin')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}

          {/* Heading */}
          <div className="text-center space-y-1 mb-5 w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {tab === 'signin' && 'Sign in to SparkX'}
              {tab === 'signup' && 'Register New Account'}
              {tab === 'forgot' && (forgotStep === 1 ? 'Recover Password' : 'Set New Password')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {tab === 'signin' && 'Enter your registered credentials to access your dashboard'}
              {tab === 'signup' && 'Create your account to start interviewing or hiring'}
              {tab === 'forgot' && (forgotStep === 1 
                ? 'Enter your registered email to receive a 6-digit recovery code' 
                : 'Enter the verification code and choose your new password')}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-700/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ─── TAB: SIGN IN ──────────────────────────────────────────────── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="w-full space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your.name@company.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => switchToTab('forgot')}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer pt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchToTab('signup')}
                  className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  Don't have an account? <span className="font-bold underline text-indigo-600 dark:text-indigo-400">Create Account</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── TAB: SIGN UP / REGISTER ──────────────────────────────────── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="w-full space-y-4">
              
              {/* Row 1: Full Name & Account Type side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Account Type / Role *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        role === 'candidate' 
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-600 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30' 
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Candidate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recruiter')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        role === 'recruiter' 
                          ? 'bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-950/80 dark:border-purple-600 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/30' 
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Recruiter (Admin)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidate Resume Upload Section */}
              {role === 'candidate' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Upload Resume & Auto-Fill Profile</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 border border-emerald-300/40">
                      AI Match Enabled
                    </span>
                  </div>

                  {/* Upload Dropzone */}
                  <label className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition bg-white/80 dark:bg-slate-900/60 group">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.txt,.doc" 
                      onChange={handleResumeUpload} 
                      className="hidden" 
                    />
                    {isParsingResume ? (
                      <div className="flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing resume & extracting skills...</span>
                      </div>
                    ) : resumeFileName ? (
                      <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300 py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold truncate max-w-[280px]">{resumeFileName}</span>
                        <span className="text-[10px] text-slate-400 underline ml-1">Change file</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2.5 py-1">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Click or drop resume (.pdf, .docx, .txt)</span>
                          <span className="text-[10px] text-slate-400">Extracts skills, experience & role automatically</span>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Candidate Extracted Details Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Target Job Role</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={e => setJobRole(e.target.value)}
                        placeholder="e.g. AI / Full-Stack Engineer"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Experience (Yrs)</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={experienceYears}
                        onChange={e => setExperienceYears(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={skillsString}
                      onChange={e => setSkillsString(e.target.value)}
                      placeholder="e.g. React, Python, FastAPI, PostgreSQL, PyTorch"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Education</label>
                      <input
                        type="text"
                        value={education}
                        onChange={e => setEducation(e.target.value)}
                        placeholder="e.g. B.Tech / BS CS"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Key input for Recruiter Registration */}
              {role === 'recruiter' && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
                  <label className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Admin Authorization Key *</span>
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Security Restricted</span>
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    required
                    placeholder="e.g. SPARKX-ADMIN-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700/50 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Recruiter access is strictly restricted to HR administrators with an authorized Admin Key.
                  </p>
                </div>
              )}

              {/* Row: Email & Password side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="your.name@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchToTab('signin')}
                  className="text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  Already have an account? <span className="font-bold underline text-indigo-600 dark:text-indigo-400">Sign In</span>
                </button>
              </div>

            </form>
          )}

          {/* ─── TAB: FORGOT PASSWORD ──────────────────────────────────────── */}
          {tab === 'forgot' && (
            <div className="w-full space-y-4">
              
              {/* Step 1: Request Code */}
              {forgotStep === 1 ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                      Account Email Address *
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      placeholder="e.g. candidate@sparkx.ai or admin@sparkx.ai"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Dispatching Verification Code...</span>
                      </div>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send 6-Digit Verification Code</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchToTab('signin')}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Return to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter Code and New Password */
                <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                  
                  {/* Development Verification Code Preview Helper */}
                  {devCode && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/60 text-xs text-indigo-700 dark:text-indigo-300 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" />
                        <span>Verification Code: <strong className="font-mono text-indigo-800 dark:text-cyan-300 font-bold tracking-widest text-sm">{devCode}</strong></span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Dispatched to inbox</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        6-Digit Verification Code *
                      </label>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Resend Code
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value.trim())}
                      required
                      placeholder="123456"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-type password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Update Password & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => { setForgotStep(1); setError(''); }}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Use different email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchToTab('signin')}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}