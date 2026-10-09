import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import LandingCursor from '../public/LandingCursor';
import { 
  Sparkles, Shield, User, Eye, EyeOff, ArrowRight, Zap, 
  Brain, ShieldCheck, UserPlus, LogIn, AlertCircle, KeyRound,
  CheckCircle2, ArrowLeft, Sun, Moon, Upload, FileText, Loader2,
  Lock, Mail
} from 'lucide-react';
import AreteLogo from '../ui/AreteLogo';

export default function LoginScreen({ mode, onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { theme, toggleTheme, login } = useRecruitment();
  const { smoothNavigate } = useSmoothNavigate();
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
      smoothNavigate('/register');
    } else if (newTab === 'forgot') {
      smoothNavigate('/forgot-password');
    } else {
      smoothNavigate('/login');
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

  // Micro-interactivity & animation states
  const isEmailValid = email.includes('@') && email.includes('.');
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1;
    return score;
  })();

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

    const displayName = user.name || (user.role === 'recruiter' ? 'SparkX Admin' : 'Candidate');
    setSuccessMsg(`Welcome back, ${displayName}! Authentication verified. Loading your workspace...`);
    
    // Smooth transition allowing the user to see verified authentication state
    setTimeout(() => {
      effectiveLogin(user);
      setLoading(false);
    }, 650);
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

    const displayName = user?.name || name.trim() || 'Candidate';
    setSuccessMsg(`Account created successfully! Welcome to SparkX, ${displayName}. Loading your workspace...`);

    setTimeout(() => {
      effectiveLogin(user);
      setLoading(false);
    }, 650);
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
    <div className="h-screen w-full max-w-full overflow-hidden flex flex-col lg:flex-row bg-[#FAF8F5] dark:bg-[#0F0E0D] text-[#1C130E] dark:text-stone-100 relative transition-colors duration-200 animate-page-enter">
      {/* Celestial Custom Reticle Cursor */}
      <LandingCursor />

      {/* ─── LEFT PANEL: Empirical Operating System Branding (Theme-Aware) ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 xl:w-1/2 h-full shrink-0 relative overflow-hidden p-8 xl:p-12 bg-gradient-to-br from-[#FAF8F5] via-[#F4EFEB] to-[#EAE4DC] dark:from-[#2B201A] dark:via-[#0F0E0D] dark:to-[#1B1310] text-[#1C130E] dark:text-stone-100 border-r border-[#E8DFD8] dark:border-[#423229] transition-colors duration-200">
        
        {/* Logo */}
        <div 
          onClick={() => smoothNavigate('/home')}
          className="relative z-10 cursor-pointer group active:scale-[0.98] transition-transform select-none"
          title="Return to ARETE Home"
        >
          <AreteLogo
            size="lg"
            subtitle="Enterprise Talent Intelligence"
          />
        </div>

        {/* Value Prop */}
        <div className="relative z-10 space-y-5 my-auto py-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-600/30 text-amber-950 dark:text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xs">
            <Zap className="w-3 h-3 text-[#C27803] dark:text-amber-400" />
            <span>AI Hiring Operating System</span>
          </div>
          
          <h1 className="text-3xl xl:text-4xl font-extrabold text-[#1C130E] dark:text-white leading-tight tracking-tight font-display">
            <span className="login-kinetic-title">Next-Gen Hiring.</span>
            <br />
            <span className="text-stone-600 dark:text-stone-300 font-medium">Zero Bias. </span>
            <span className="relative inline-block">
              <span className="login-telemetry-text font-bold">Empirical Telemetry.</span>
              <span className="block w-full login-telemetry-scanline mt-1.5" />
            </span>
          </h1>

          <p className="text-stone-600 dark:text-stone-400 text-xs xl:text-sm leading-relaxed max-w-md">
            Authoritative database authentication, 4-dimensional candidate state tracking, proctored integrity analysis, and structured compensation intelligence.
          </p>

          <div className="space-y-3 pt-2 max-w-md">
            {[
              { icon: Brain, text: 'Adaptive multi-category assessment with real-time sandbox execution and scenario evaluation', delay: '100ms' },
              { icon: ShieldCheck, text: 'Multi-signal integrity & proctoring telemetry audit ledger (gaze, audio, tab visibility)', delay: '200ms' },
              { icon: Zap, text: 'Automated 4-dimensional hiring workflow with compensation boundary verification', delay: '300ms' },
            ].map(({ icon: Icon, text, delay }, i) => (
              <div 
                key={i} 
                className="flex items-start space-x-3 text-xs text-stone-700 dark:text-stone-300 animate-fade-in-up"
                style={{ animationDelay: delay }}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-[#221E19] border border-amber-200/60 dark:border-[#2E2721] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs transition-colors">
                  <Icon className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                </div>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-xs text-stone-600 dark:text-stone-400 pt-4 border-t border-[#E8DFD8] dark:border-[#2E2721]">
          <ShieldCheck className="w-4 h-4 text-[#C27803] dark:text-amber-400 shrink-0" />
          <span>Fairness Protocol: Empirical AI telemetry flags; qualified recruiters decide.</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Dynamic Authentication Form ─── */}
      <div className="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden relative bg-[#FAF8F5] dark:bg-[#0F0E0D] transition-colors duration-200 flex flex-col">
        {/* Top Header Navigation Controls */}
        <header className="sticky top-0 z-30 w-full flex items-center justify-between lg:justify-end gap-2 px-5 sm:px-8 py-3 bg-[#FAF8F5]/95 dark:bg-[#0F0E0D]/95 border-b border-[#E8DFD8]/80 dark:border-[#423229] shrink-0">
          {/* Mobile Header Logo */}
          <div 
            onClick={() => smoothNavigate('/home')}
            className="lg:hidden cursor-pointer group active:scale-[0.98] transition-transform select-none"
            title="Return to ARETE Home"
          >
            <AreteLogo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => smoothNavigate('/home')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#423229] bg-white dark:bg-[#2B201A] text-stone-700 dark:text-stone-300 hover:text-[#C27803] dark:hover:text-amber-400 active:scale-[0.98] transition shadow-2xs text-xs font-semibold cursor-pointer"
              title="Back to ARETE Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[11px]">Back to Home</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#423229] bg-white dark:bg-[#2B201A] text-stone-700 dark:text-stone-300 hover:text-[#C27803] dark:hover:text-amber-400 active:scale-[0.98] transition shadow-2xs text-xs font-semibold cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#C27803]" />
                  <span className="text-[11px]">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Clean Form Body Container: start below sticky header with generous padding, never overflows upward */}
        <div className="flex-1 flex flex-col items-center justify-start py-6 sm:py-10 px-4 sm:px-6 w-full z-10">
          <div className={`w-full transition-all duration-200 ${tab === 'signup' ? 'max-w-xl xl:max-w-2xl' : 'max-w-md'}`}>

            {/* Auth Card Container — Solid Grounded Surface (No Excessive Blurry Halos) */}
            <div className="w-full bg-[#FDFBF7] dark:bg-[#1E1B17] border border-[#E8DFD8] dark:border-[#2E2721] rounded-2xl shadow-card dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-8 relative overflow-hidden transition-all duration-300 animate-modal-enter">
              {/* Top hairline accent sheen */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C27803] dark:via-amber-500 to-transparent" />

            {/* Sign In vs Sign Up Tabs (Hidden during forgot password) */}
            {tab !== 'forgot' ? (
              <div className="flex p-1 rounded-xl bg-[#F0EDE8] dark:bg-[#161311] border border-[#E8DFD8] dark:border-[#2E2721] w-full max-w-xs mb-6 mx-auto">
                <button
                  type="button"
                  onClick={() => switchToTab('signin')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-[#2A1B14] dark:bg-[#2A1B14] text-white dark:text-amber-400 border border-transparent dark:border-amber-500/40 shadow-sm shadow-[#2A1B14]/25 scale-[1.01]'
                      : 'text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-stone-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchToTab('signup')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-[#2A1B14] dark:bg-[#2A1B14] text-white dark:text-amber-400 border border-transparent dark:border-amber-500/40 shadow-sm shadow-[#2A1B14]/25 scale-[1.01]'
                      : 'text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-stone-200'
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
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-[#C27803] dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            )}

            {/* Heading */}
            <div className="text-center space-y-1 mb-6 w-full">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C130E] dark:text-white tracking-tight font-display">
                {tab === 'signin' && 'Sign in to ARETE'}
                {tab === 'signup' && 'Register New Account'}
                {tab === 'forgot' && (forgotStep === 1 ? 'Recover Password' : 'Set New Password')}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                {tab === 'signin' && 'Enter your email and password to access your account'}
                {tab === 'signup' && 'Create your account to start interviewing or managing talent pipelines'}
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
              <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-sm animate-modal-spring">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ─── TAB: SIGN IN ──────────────────────────────────────────────── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="w-full space-y-4">

                {/* Email field with Icon & Live Format Check Animation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                      Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                    </label>
                    {isEmailValid && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-scale-in">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Valid format</span>
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="your.name@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161311] border border-[#E8DFD8] dark:border-[#2E2721] focus:bg-[#FAF7F2] dark:focus:bg-[#1C1814] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Password field with Icon & Live Animated Strength Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                      Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchToTab('forgot')}
                      className="text-[11px] font-semibold text-[#C27803] dark:text-amber-400 hover:text-[#92400E] dark:hover:text-amber-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white dark:bg-[#161311] border border-[#E8DFD8] dark:border-[#2E2721] focus:bg-[#FAF7F2] dark:focus:bg-[#1C1814] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Password Integrity Meter Animation */}
                  {password && (
                    <div className="space-y-1 pt-1 animate-fade-in-up">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-stone-500 dark:text-stone-400 font-medium">Session Key Security</span>
                        <span className="font-semibold text-[#C27803] dark:text-amber-400">
                          {passwordStrength === 1 && 'Basic (6+ chars)'}
                          {passwordStrength === 2 && 'Good length'}
                          {passwordStrength === 3 && 'Strong key'}
                          {passwordStrength === 4 && 'Maximum Security'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                        {[1, 2, 3, 4].map((tier) => (
                          <div
                            key={tier}
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordStrength >= tier
                                ? tier === 1
                                  ? 'bg-[#B45309]'
                                  : tier === 2
                                  ? 'bg-[#C27803]'
                                  : tier === 3
                                  ? 'bg-[#D97706]'
                                  : 'bg-amber-400'
                                : 'opacity-0'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button with Specular Sheen */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative group w-full py-3 rounded-xl bg-gradient-to-r from-[#C27803] via-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#C27803] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 dark:shadow-black/50 transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 overflow-hidden"
                >
                  <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300 -z-10" />
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Authenticating Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchToTab('signup')}
                    className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-white transition cursor-pointer"
                  >
                    Don't have an account? <span className="font-bold underline text-[#C27803] dark:text-amber-400">Create Account</span>
                  </button>
                </div>

                {/* Security Trust Badges */}
                <div className="flex items-center justify-center gap-3 pt-4 mt-2 border-t border-[#E8DFD8] dark:border-[#2A2520] text-[10.5px] font-mono text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#C27803] dark:text-amber-400" />
                    <span>256-Bit TLS</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                    <span>SOC2 Certified</span>
                  </span>
                  <span>•</span>
                  <span>Anti-Tamper Telemetry</span>
                </div>
              </form>
            )}

          {/* ─── TAB: SIGN UP / REGISTER ──────────────────────────────────── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="w-full space-y-4">
              
              {/* Row 1: Full Name & Account Type side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                    Full Name <span className="text-[#C27803] dark:text-amber-400">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <User className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                    Account Type / Role *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                        role === 'candidate' 
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-950 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/30' 
                          : 'bg-white dark:bg-[#161311] border-[#E8DFD8] dark:border-[#2E2721] text-stone-600 dark:text-stone-400 hover:text-[#1C130E] dark:hover:text-white'
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
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/30' 
                          : 'bg-white dark:bg-[#161311] border-[#E8DFD8] dark:border-[#2E2721] text-stone-600 dark:text-stone-400 hover:text-[#1C130E] dark:hover:text-white'
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
                <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/40 dark:bg-[#161311] border border-amber-200/70 dark:border-[#2E2721]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1C130E] dark:text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                      <span>Upload Resume & Auto-Fill Profile</span>
                    </label>
                    <span className="text-[10px] text-[#C27803] dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/40">
                      AI Match Enabled
                    </span>
                  </div>

                  {/* Upload Dropzone */}
                  <label className="border-2 border-dashed border-amber-300/70 dark:border-amber-700/50 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition bg-white/80 dark:bg-[#1A1613] group">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.txt,.doc" 
                      onChange={handleResumeUpload} 
                      className="hidden" 
                    />
                    {isParsingResume ? (
                      <div className="flex items-center space-x-2 text-xs text-[#C27803] dark:text-amber-400 py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing resume & extracting skills...</span>
                      </div>
                    ) : resumeFileName ? (
                      <div className="flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold truncate max-w-[280px]">{resumeFileName}</span>
                        <span className="text-[10px] text-stone-400 underline ml-1">Change file</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2.5 py-1">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#C27803] dark:text-amber-400 group-hover:scale-110 transition shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">Click or drop resume (.pdf, .docx, .txt)</span>
                          <span className="text-[10px] text-stone-400">Extracts skills, experience & role automatically</span>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Candidate Extracted Details Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#1C130E] dark:text-stone-400 uppercase">Target Job Role</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={e => setJobRole(e.target.value)}
                        placeholder="e.g. AI / Full-Stack Engineer"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#1C130E] dark:text-stone-400 uppercase">Experience (Yrs)</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={experienceYears}
                        onChange={e => setExperienceYears(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#1C130E] dark:text-stone-400 uppercase">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={skillsString}
                      onChange={e => setSkillsString(e.target.value)}
                      placeholder="e.g. React, Python, FastAPI, PostgreSQL, PyTorch"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#1C130E] dark:text-stone-400 uppercase">Education</label>
                      <input
                        type="text"
                        value={education}
                        onChange={e => setEducation(e.target.value)}
                        placeholder="e.g. B.Tech / BS CS"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#1C130E] dark:text-stone-400 uppercase">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Key input for Recruiter Registration */}
              {role === 'recruiter' && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                  <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Admin Authorization Key *</span>
                    </span>
                    <span className="text-[10px] text-[#C27803] dark:text-amber-400 font-semibold">Security Restricted</span>
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={e => setAdminCode(e.target.value)}
                    required
                    placeholder="Enter authorized Recruiter Invite Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#14110F] border border-amber-300 dark:border-amber-700/50 text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] shadow-sm"
                  />
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                    Recruiter access is strictly restricted to HR administrators with an authorized Admin Key.
                  </p>
                </div>
              )}

              {/* Row: Email & Password side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                    Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="your.name@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                    Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
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
                className="relative group w-full py-3 rounded-xl bg-gradient-to-r from-[#C27803] via-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#C27803] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 dark:shadow-black/50 transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2 overflow-hidden"
              >
                <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300 -z-10" />
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Authorized Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchToTab('signin')}
                  className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-white transition cursor-pointer"
                >
                  Already have an account? <span className="font-bold underline text-[#C27803] dark:text-amber-400">Sign In</span>
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
                    <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                      Account Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      placeholder="e.g. candidate@sparkx.ai or admin@sparkx.ai"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-[#C27803] via-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#C27803] shadow-md shadow-[#C27803]/25 disabled:opacity-50 cursor-pointer"
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
                      className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-white transition inline-flex items-center space-x-1.5 cursor-pointer"
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
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#C27803] dark:text-amber-400 shrink-0" />
                        <span>Verification Code: <strong className="font-mono text-[#C27803] dark:text-amber-400 font-bold tracking-widest text-sm">{devCode}</strong></span>
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">Dispatched to inbox</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                        6-Digit Verification Code <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-[10px] font-semibold text-[#C27803] dark:text-amber-400 hover:text-[#92400E] dark:hover:text-amber-300 transition hover:underline disabled:opacity-50 cursor-pointer"
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
                      className="w-full px-4 py-2 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 transition shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                        New Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#1C130E] dark:text-stone-300 uppercase tracking-wider font-mono">
                        Confirm Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-type password"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#14110F] border border-[#E8DFD8] dark:border-[#2A2520] focus:bg-[#FAF7F2] dark:focus:bg-[#2B201A] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500 focus:ring-2 focus:ring-[#C27803]/20 dark:focus:ring-amber-500/20 shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-[#C27803] via-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#C27803] shadow-md shadow-[#C27803]/25 disabled:opacity-50 cursor-pointer"
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
                      className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-stone-200 transition inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Use different email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchToTab('signin')}
                      className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer"
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
    </div>
  </div>
  );
}