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
  Lock, Mail, Award, Check, Layers, Cpu, Compass
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

  // Micro-interactivity & validation indicators
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

    const displayName = user.name || (user.role === 'recruiter' ? 'ARETE Recruiter' : 'Candidate');
    setSuccessMsg(`Welcome back, ${displayName}. Credentials verified. Synchronizing session workspace...`);
    
    // Smooth transition allowing the user to observe verified authentication state
    setTimeout(() => {
      effectiveLogin(user);
      setLoading(false);
    }, 600);
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
      setError('Please provide your full legal name');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }
    if (role === 'recruiter' && !adminCode.trim()) {
      setError('Enterprise recruiter onboarding requires an authorized Admin Key');
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
    setSuccessMsg(`Account successfully established. Welcome to ARETE, ${displayName}. Loading console...`);

    setTimeout(() => {
      effectiveLogin(user);
      setLoading(false);
    }, 600);
  };

  // ─── Handle Forgot Password Step 1 (Request Verification Code) ────────────────
  const handleRequestResetCode = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail.trim()) {
      setError('Please specify your registered email address.');
      return;
    }

    setLoading(true);
    const { success, data, error: apiErr } = await api.forgotPassword(forgotEmail.trim());

    if (!success || apiErr) {
      setError(apiErr || 'Failed to dispatch verification code.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setForgotStep(2);
    setSuccessMsg(data?.message || 'A 6-digit cryptographic verification code has been dispatched.');
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
      setError(apiErr || 'Failed to dispatch a fresh verification code.');
      return;
    }

    setSuccessMsg('A fresh verification code has been generated and dispatched.');
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
      setError('Please provide the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password entries do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    const { success, error: apiErr } = await api.resetPassword(forgotEmail.trim(), resetCode.trim(), newPassword);

    if (!success || apiErr) {
      setError(apiErr || 'Failed to update credentials.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmail(forgotEmail.trim());
    setPassword(newPassword);
    switchToTab('signin');
    setSuccessMsg('Password updated successfully. You may now sign in with your new credentials.');
  };

  return (
    <div className="h-screen w-full max-w-full overflow-hidden flex flex-col lg:flex-row bg-[#FAF8F5] dark:bg-[#0F0E0D] text-[#1C130E] dark:text-[#EDE8E3] relative transition-colors duration-200 animate-page-enter">
      {/* Precision reticle cursor */}
      <LandingCursor />

      {/* ─── LEFT PANEL: Kinetic Luxury & Atmospheric Telemetry ─── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 xl:w-[46%] h-full shrink-0 relative overflow-hidden p-10 xl:p-14 bg-gradient-to-br from-[#FAF8F5] via-[#F4EFEB] to-[#EAE3D9] dark:from-[#1A1411] dark:via-[#0F0E0D] dark:to-[#16110E] text-[#1C130E] dark:text-[#EDE8E3] border-r border-[#E8DFD8] dark:border-[#382B22] transition-colors duration-200 select-none">
        
        {/* Floating Ambient Cosmic Plasma Energy Orbs (Rich Multi-layered Animation) */}
        <div className="absolute top-12 -left-12 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-amber-400/10 blur-3xl pointer-events-none animate-plasma-1" />
        <div className="absolute bottom-16 right-0 w-96 h-96 rounded-full bg-amber-600/10 dark:bg-amber-500/10 blur-3xl pointer-events-none animate-plasma-2" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(#C27803_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035] dark:opacity-[0.05] pointer-events-none" />

        {/* Top: Brand Wordmark & Emblem */}
        <div 
          onClick={() => smoothNavigate('/home')}
          className="relative z-10 cursor-pointer group active:scale-[0.99] transition-transform"
          title="Return to ARETE Home"
        >
          <AreteLogo
            size="lg"
            subtitle="Enterprise Talent Intelligence"
          />
        </div>

        {/* Middle: Brand Ethos, Kinetic Typography & Architectural Keystone Card */}
        <div className="relative z-10 space-y-7 my-auto py-4">
          
          {/* Animated Status Pill with Starburst & Pulse */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-600/30 text-amber-950 dark:text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider shadow-2xs backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400 animate-pulse" />
            <span>AI Talent Intelligence OS</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-sparkle-burst ml-0.5" />
          </div>
          
          {/* Kinetic Animated Headline with Telemetry Scanline */}
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#1C130E] dark:text-white leading-tight tracking-tight font-display">
              <span className="login-kinetic-title">Where Talent Meets</span>
              <br />
              <span className="relative inline-block mt-1">
                <span className="login-telemetry-text font-serif italic font-extrabold tracking-tight">Intelligence.</span>
                <span className="block w-full login-telemetry-scanline mt-2" />
              </span>
            </h1>

            <p className="text-stone-600 dark:text-stone-400 text-xs xl:text-sm leading-relaxed max-w-lg font-normal">
              Empirical skill verification, multi-signal integrity telemetry, and deterministic talent workflows designed for enterprise rigor.
            </p>
          </div>

          {/* Architectural Keystone: Deterministic Verification Matrix with Staggered Entrance Animations */}
          <div className="p-5 rounded-2xl bg-white/75 dark:bg-[#1A1411]/85 border border-[#E5DDD2] dark:border-[#382C22] shadow-[0_4px_24px_-4px_rgba(28,19,14,0.05)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xs space-y-3.5 max-w-lg">
            <div className="flex items-center justify-between border-b border-[#EFEAE2] dark:border-[#2C211A] pb-2.5">
              <span className="text-[10.5px] font-mono font-bold tracking-widest uppercase text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                <span>Deterministic Verification Matrix</span>
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-0.5">
              {[
                { 
                  title: 'Skill Evidence & Sandbox Execution', 
                  desc: 'Multi-category adaptive code analysis with empirical execution logs.', 
                  icon: Brain,
                  delay: '100ms'
                },
                { 
                  title: 'Multi-Signal Integrity Telemetry', 
                  desc: 'Continuous gaze, audio, and tamper-resistant audit verification.', 
                  icon: ShieldCheck,
                  delay: '220ms'
                },
                { 
                  title: 'Calibrated Parity & Zero Bias', 
                  desc: 'Objective rubric scoring removing subjective recruitment friction.', 
                  icon: Compass,
                  delay: '340ms'
                },
              ].map(({ title, desc, icon: Icon, delay }, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start space-x-3 text-xs group animate-fade-in-up"
                  style={{ animationDelay: delay }}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] dark:bg-[#251D18] border border-[#EAE3D9] dark:border-[#382C22] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-amber-400/60 group-hover:scale-105 transition-all shadow-2xs">
                    <Icon className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11.5px] font-semibold text-[#1C130E] dark:text-stone-200 leading-snug group-hover:text-[#C27803] dark:group-hover:text-amber-300 transition-colors">
                      {title}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Philosophical Anchor & Compliance */}
        <div className="relative z-10 pt-4 border-t border-[#E8DFD8] dark:border-[#2C211A] flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <span className="italic font-serif">
            ἀρετή — Fulfillment of purpose through excellence.
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
            SOC-2 Type II • ISO 27001
          </span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Dynamic Authentication Console ─── */}
      <div className="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden relative bg-[#FAF8F5] dark:bg-[#0F0E0D] transition-colors duration-200 flex flex-col">
        {/* Top Header Navigation Controls */}
        <header className="sticky top-0 z-30 w-full flex items-center justify-between lg:justify-end gap-3 px-6 sm:px-10 py-3.5 bg-[#FAF8F5]/90 dark:bg-[#0F0E0D]/90 backdrop-blur-md border-b border-[#E8DFD8]/80 dark:border-[#2C211A] shrink-0">
          {/* Mobile Header Logo */}
          <div 
            onClick={() => smoothNavigate('/home')}
            className="lg:hidden cursor-pointer group active:scale-[0.98] transition-transform select-none"
            title="Return to ARETE Home"
          >
            <AreteLogo size="sm" />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => smoothNavigate('/home')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-[#E0D7CE] dark:border-[#382B22] bg-white dark:bg-[#1E1713] text-stone-700 dark:text-stone-300 hover:text-[#C27803] dark:hover:text-amber-400 hover:border-amber-400/40 active:scale-[0.98] transition shadow-2xs text-xs font-medium cursor-pointer"
              title="Return to ARETE Public Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[11.5px]">Back to Home</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#E0D7CE] dark:border-[#382B22] bg-white dark:bg-[#1E1713] text-stone-700 dark:text-stone-300 hover:text-[#C27803] dark:hover:text-amber-400 hover:border-amber-400/40 active:scale-[0.98] transition shadow-2xs text-xs font-medium cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11.5px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#C27803]" />
                  <span className="text-[11.5px]">Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Form Body Container: start below sticky header with generous padding */}
        <div className="flex-1 flex flex-col items-center justify-start py-8 sm:py-12 px-5 sm:px-8 w-full z-10">
          <div className={`w-full transition-all duration-200 ${tab === 'signup' ? 'max-w-xl xl:max-w-2xl' : 'max-w-md'}`}>

            {/* Auth Card Container — Grounded Luxury Surface */}
            <div className="w-full bg-[#FDFBF7] dark:bg-[#181310] border border-[#E8DFD8] dark:border-[#382B22] rounded-2xl shadow-[0_16px_40px_-12px_rgba(28,19,14,0.06)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] p-7 sm:p-9 relative overflow-hidden transition-all duration-300 animate-modal-enter">
              {/* Top hairline champagne accent sheen */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C27803] dark:via-amber-500 to-transparent" />

              {/* Segmented Mode Selector: Sign In vs Create Account */}
              {tab !== 'forgot' ? (
                <div className="flex p-1 rounded-xl bg-[#F0EAE1] dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#2C211A] w-full max-w-xs mb-7 mx-auto">
                  <button
                    type="button"
                    onClick={() => switchToTab('signin')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      tab === 'signin'
                        ? 'bg-[#1C130E] dark:bg-[#2B201A] text-white dark:text-amber-300 shadow-sm border border-transparent dark:border-amber-500/30 scale-[1.01]'
                        : 'text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-stone-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchToTab('signup')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      tab === 'signup'
                        ? 'bg-[#1C130E] dark:bg-[#2B201A] text-white dark:text-amber-300 shadow-sm border border-transparent dark:border-amber-500/30 scale-[1.01]'
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
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-[#C27803] dark:hover:text-amber-300 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </button>
                </div>
              )}

              {/* Card Header & Title */}
              <div className="text-center space-y-1.5 mb-7 w-full">
                <h2 className="text-2xl sm:text-[1.75rem] font-serif font-bold text-[#1C130E] dark:text-white tracking-tight">
                  {tab === 'signin' && 'Sign in to ARETE'}
                  {tab === 'signup' && 'Create Your ARETE Account'}
                  {tab === 'forgot' && (forgotStep === 1 ? 'Recover Account Access' : 'Establish New Password')}
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  {tab === 'signin' && 'Enter your verified credentials to access your talent intelligence console.'}
                  {tab === 'signup' && 'Register your profile to participate in verified assessments or manage candidate pipelines.'}
                  {tab === 'forgot' && (forgotStep === 1 
                    ? 'Enter your registered email address to receive a secure 6-digit recovery code.' 
                    : 'Provide the cryptographic verification code to update your authentication password.')}
                </p>
              </div>

              {/* Feedback Messages */}
              {error && (
                <div className="w-full mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center space-x-2.5 shadow-2xs animate-fade-in-up">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="w-full mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center space-x-2.5 shadow-2xs animate-modal-spring">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ─── TAB: SIGN IN ──────────────────────────────────────────────── */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="w-full space-y-5">

                  {/* Email field with Icon & Live Format Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 tracking-wide">
                        Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      {isEmailValid && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-scale-in">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Format verified</span>
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
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Password field with Icon & Live Animated Security Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 tracking-wide">
                        Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => switchToTab('forgot')}
                        className="text-[11px] font-medium text-[#C27803] dark:text-amber-400 hover:text-[#92400E] dark:hover:text-amber-300 transition cursor-pointer"
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
                        className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
                        title={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="space-y-1 pt-1.5 animate-fade-in-up">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-stone-500 dark:text-stone-400">Entropy Score</span>
                          <span className="font-semibold text-[#C27803] dark:text-amber-400">
                            {passwordStrength === 1 && 'Basic (6+ chars)'}
                            {passwordStrength === 2 && 'Moderate length'}
                            {passwordStrength === 3 && 'High entropy'}
                            {passwordStrength === 4 && 'Enterprise-grade'}
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
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                  : 'opacity-0'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button Container with Explicit Breathing Room & Specular Shimmer */}
                  <div className="pt-3 sm:pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative group w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B45309] via-[#C27803] to-[#92400E] hover:from-[#92400E] hover:to-[#B45309] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 transition-all duration-300 active:scale-[0.99] cursor-pointer disabled:opacity-50 overflow-hidden"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                      <span className="relative z-10 flex items-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to Console</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchToTab('signup')}
                      className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-white transition cursor-pointer"
                    >
                      New to ARETE? <span className="font-semibold underline text-[#C27803] dark:text-amber-400">Establish Account</span>
                    </button>
                  </div>

                  {/* Security Assurance Marks */}
                  <div className="flex items-center justify-center gap-3 pt-4 mt-2 border-t border-[#EAE3D9] dark:border-[#2C211A] text-[10.5px] text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#C27803] dark:text-amber-400" />
                      <span>256-Bit TLS</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>SOC-2 Certified</span>
                    </span>
                    <span>•</span>
                    <span>Deterministic Audit Ledger</span>
                  </div>
                </form>
              )}

              {/* ─── TAB: SIGN UP / REGISTER ──────────────────────────────────── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="w-full space-y-5">
                  
                  {/* Account Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 tracking-wide">
                      Select Role & Console Type <span className="text-[#C27803] dark:text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('candidate')}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          role === 'candidate' 
                            ? 'bg-amber-50/80 dark:bg-[#201814] border-[#C27803] dark:border-amber-500/80 shadow-2xs ring-1 ring-[#C27803]/20' 
                            : 'bg-white dark:bg-[#120E0C] border-[#E5DDD2] dark:border-[#382B22] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <User className={`w-4 h-4 ${role === 'candidate' ? 'text-[#C27803] dark:text-amber-400' : 'text-stone-400'}`} />
                          {role === 'candidate' && (
                            <span className="w-2 h-2 rounded-full bg-[#C27803] dark:bg-amber-400" />
                          )}
                        </div>
                        <span className={`text-xs font-bold block ${role === 'candidate' ? 'text-[#1C130E] dark:text-amber-300' : 'text-stone-800 dark:text-stone-200'}`}>
                          Candidate
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          Verified Skill Assessment
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('recruiter')}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          role === 'recruiter' 
                            ? 'bg-amber-50/80 dark:bg-[#201814] border-[#C27803] dark:border-amber-500/80 shadow-2xs ring-1 ring-[#C27803]/20' 
                            : 'bg-white dark:bg-[#120E0C] border-[#E5DDD2] dark:border-[#382B22] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Shield className={`w-4 h-4 ${role === 'recruiter' ? 'text-[#C27803] dark:text-amber-400' : 'text-stone-400'}`} />
                          {role === 'recruiter' && (
                            <span className="w-2 h-2 rounded-full bg-[#C27803] dark:bg-amber-400" />
                          )}
                        </div>
                        <span className={`text-xs font-bold block ${role === 'recruiter' ? 'text-[#1C130E] dark:text-amber-300' : 'text-stone-800 dark:text-stone-200'}`}>
                          Recruiter (Admin)
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">
                          Enterprise Talent Console
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Full Name & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        Full Legal Name <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center group">
                        <User className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          placeholder="e.g. Dr. Rajesh Kumar"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        Phone Number {role === 'candidate' ? '(Optional)' : ''}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                      />
                    </div>
                  </div>

                  {/* Candidate Resume Upload Section */}
                  {role === 'candidate' && (
                    <div className="space-y-3 p-4 rounded-xl bg-[#FAF6F0] dark:bg-[#16110E] border border-[#E5DDD2] dark:border-[#382B22]">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#1C130E] dark:text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                          <span>Candidate Profile & Resume Autocomplete</span>
                        </label>
                        <span className="text-[10px] text-[#C27803] dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/40">
                          AI Parsing Ready
                        </span>
                      </div>

                      {/* Upload Dropzone */}
                      <label className="border border-dashed border-[#C27803]/60 dark:border-amber-600/50 hover:border-[#C27803] dark:hover:border-amber-400 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition bg-white/70 dark:bg-[#1C1511] group">
                        <input 
                          type="file" 
                          accept=".pdf,.docx,.txt,.doc" 
                          onChange={handleResumeUpload} 
                          className="hidden" 
                        />
                        {isParsingResume ? (
                          <div className="flex items-center space-x-2 text-xs text-[#C27803] dark:text-amber-400 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Extracting candidate skills and background...</span>
                          </div>
                        ) : resumeFileName ? (
                          <div className="flex items-center space-x-2 text-xs text-[#1C130E] dark:text-amber-300 py-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold truncate max-w-[280px]">{resumeFileName}</span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 underline ml-1">Replace</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 flex items-center justify-center text-[#C27803] dark:text-amber-400 group-hover:scale-105 transition shrink-0">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">Click or drop resume (.pdf, .docx, .txt)</span>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400">Extracts skills, years of experience, and role automatically</span>
                            </div>
                          </div>
                        )}
                      </label>

                      {/* Candidate Extracted Details Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">Target Role</label>
                          <input
                            type="text"
                            value={jobRole}
                            onChange={e => setJobRole(e.target.value)}
                            placeholder="e.g. AI / Full-Stack Engineer"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 shadow-2xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">Years of Experience</label>
                          <input
                            type="number"
                            min="0"
                            max="40"
                            step="0.5"
                            value={experienceYears}
                            onChange={e => setExperienceYears(e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">Primary Skills (comma-separated)</label>
                        <input
                          type="text"
                          value={skillsString}
                          onChange={e => setSkillsString(e.target.value)}
                          placeholder="e.g. React, Python, FastAPI, PostgreSQL, PyTorch"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">Education Background</label>
                        <input
                          type="text"
                          value={education}
                          onChange={e => setEducation(e.target.value)}
                          placeholder="e.g. B.Tech / BS in Computer Science"
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 shadow-2xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Admin Key input for Recruiter Registration */}
                  {role === 'recruiter' && (
                    <div className="space-y-2 p-4 rounded-xl bg-amber-50/70 dark:bg-[#201814] border border-amber-300/80 dark:border-amber-700/50">
                      <label className="text-[11px] font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                          <span>Enterprise Admin Authorization Key *</span>
                        </span>
                        <span className="text-[10px] text-[#C27803] dark:text-amber-400 font-semibold">Security Gated</span>
                      </label>
                      <input
                        type="password"
                        value={adminCode}
                        onChange={e => setAdminCode(e.target.value)}
                        required
                        placeholder="Enter authorized Recruiter Invite Key"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-amber-300 dark:border-amber-700/50 text-[#1C130E] dark:text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#C27803] shadow-2xs"
                      />
                      <p className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-tight">
                        Recruiter console access requires an organizational administrative key provisioned by ARETE.
                      </p>
                    </div>
                  )}

                  {/* Email & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                      </label>
                      <div className="relative flex items-center group">
                        <Mail className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="name@company.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
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
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
                          title={showPw ? 'Hide password' : 'Show password'}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Complete Registration Button Container */}
                  <div className="pt-3 sm:pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative group w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B45309] via-[#C27803] to-[#92400E] hover:from-[#92400E] hover:to-[#B45309] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 transition-all duration-300 active:scale-[0.99] cursor-pointer disabled:opacity-50 overflow-hidden"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                      <span className="relative z-10 flex items-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Establishing Verified Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Establish ARETE Account</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchToTab('signin')}
                      className="text-xs text-stone-600 hover:text-[#1C130E] dark:text-stone-400 dark:hover:text-white transition cursor-pointer"
                    >
                      Already registered? <span className="font-semibold underline text-[#C27803] dark:text-amber-400">Sign In</span>
                    </button>
                  </div>

                </form>
              )}

              {/* ─── TAB: FORGOT PASSWORD ──────────────────────────────────────── */}
              {tab === 'forgot' && (
                <div className="w-full space-y-5">
                  
                  {/* Step 1: Request Code */}
                  {forgotStep === 1 ? (
                    <form onSubmit={handleRequestResetCode} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                          Registered Email Address <span className="text-[#C27803] dark:text-amber-400">*</span>
                        </label>
                        <div className="relative flex items-center group">
                          <Mail className="absolute left-3.5 w-4 h-4 text-stone-400 group-focus-within:text-[#C27803] dark:group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                            placeholder="candidate@arete.ai or recruiter@arete.ai"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs transition-all"
                          />
                        </div>
                      </div>

                      <div className="pt-3 sm:pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-[#B45309] via-[#C27803] to-[#92400E] hover:from-[#92400E] hover:to-[#B45309] shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                        >
                          {loading ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Dispatching Cryptographic Code...</span>
                            </div>
                          ) : (
                            <>
                              <KeyRound className="w-4 h-4" />
                              <span>Send 6-Digit Recovery Code</span>
                            </>
                          )}
                        </button>
                      </div>

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
                    <form onSubmit={handleConfirmResetPassword} className="space-y-5">
                      
                      {/* Development Verification Code Preview Helper (Preserved for seamless workflow) */}
                      {devCode && (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/80 dark:bg-[#201814] border border-amber-300 dark:border-amber-700/50 text-xs text-amber-950 dark:text-amber-200 shadow-2xs animate-fade-in-up">
                          <div className="flex items-center space-x-2.5">
                            <Sparkles className="w-4 h-4 text-[#C27803] dark:text-amber-400 shrink-0" />
                            <span>Verification Code: <strong className="font-mono text-[#C27803] dark:text-amber-400 font-bold tracking-widest text-sm">{devCode}</strong></span>
                          </div>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">Dispatched</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                            6-Digit Verification Code <span className="text-[#C27803] dark:text-amber-400">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-[10.5px] font-medium text-[#C27803] dark:text-amber-400 hover:underline disabled:opacity-50 cursor-pointer"
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
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white font-mono text-center tracking-[0.3em] text-lg focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 transition shadow-2xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                            New Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPw ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              required
                              placeholder="Min 6 characters"
                              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPw(p => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition cursor-pointer"
                              title={showNewPw ? 'Hide password' : 'Show password'}
                            >
                              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                            Confirm Password <span className="text-[#C27803] dark:text-amber-400">*</span>
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter password"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#120E0C] border border-[#E5DDD2] dark:border-[#382B22] focus:bg-[#FAF8F5] dark:focus:bg-[#1A1411] text-[#1C130E] dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-[#C27803] dark:focus:border-amber-500/80 focus:ring-2 focus:ring-[#C27803]/15 dark:focus:ring-amber-500/20 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="pt-3 sm:pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition flex items-center justify-center space-x-2 bg-gradient-to-r from-[#B45309] via-[#C27803] to-[#92400E] hover:from-[#92400E] hover:to-[#B45309] shadow-md shadow-[#C27803]/25 hover:shadow-xl hover:shadow-[#C27803]/35 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Update Password & Complete Sign In</span>
                            </>
                          )}
                        </button>
                      </div>

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