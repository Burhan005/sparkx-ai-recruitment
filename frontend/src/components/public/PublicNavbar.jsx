import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowRight, 
  LogIn, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Zap, 
  HelpCircle, 
  Mail,
  UserCheck
} from 'lucide-react';

import { useSmoothNavigate } from '../../context/PageTransitionContext';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isLoggedIn, userRole, logout } = useRecruitment();
  const { smoothNavigate } = useSmoothNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState('home');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const navContainerRef = useRef(null);
  const buttonRefs = useRef({});

  // Preload Auth chunk in background for instant transition
  const preloadAuth = useCallback(() => {
    import('../auth/LoginScreen');
  }, []);

  useEffect(() => {
    const timer = setTimeout(preloadAuth, 1200);
    return () => clearTimeout(timer);
  }, [preloadAuth]);

  // Monitor scroll for subtle shadow & backdrop enhancement
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-spy: automatically detect active section with document-level accuracy
  useEffect(() => {
    const sectionIds = ['home', 'about', 'features', 'how-it-works', 'contact'];
    const handleScrollSpy = () => {
      const scrollY = window.scrollY;

      // Top of page: always 'home'
      if (scrollY < 120) {
        setActiveId('home');
        return;
      }

      // Bottom of page: always 'contact'
      const isNearBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 70;
      if (isNearBottom) {
        setActiveId('contact');
        return;
      }

      const scrollPosition = scrollY + 200;
      let current = 'home';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const docTop = rect.top + scrollY;
          if (scrollPosition >= docTop) {
            current = id;
          }
        }
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, []);

  // Update sliding indicator position when activeId changes or window resizes
  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = buttonRefs.current[activeId];
      if (activeBtn && navContainerRef.current) {
        const containerRect = navContainerRef.current.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setIndicatorStyle({
          left: btnRect.left - containerRect.left,
          width: btnRect.width,
          opacity: 1
        });
      }
    };

    // Small delay to ensure DOM dimensions are ready
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeId]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Features', href: '#features', id: 'features' },
    { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (href, id) => {
    setIsMobileMenuOpen(false);
    setActiveId(id);
    if (location.pathname !== '/' && location.pathname !== '/home') {
      smoothNavigate('/home' + href);
      return;
    }
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b ${
        scrolled 
          ? 'bg-[#FAF8F5]/90 dark:bg-[#0F0E0D]/90 backdrop-blur-xl border-[#E8E4DF] dark:border-[#423229] shadow-subtle' 
          : 'bg-[#FAF8F5]/70 dark:bg-[#0F0E0D]/70 backdrop-blur-md border-transparent'
      }`}
    >
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* ── Left: Brand Identity & Monogram ── */}
          <div 
            onClick={() => {
              if (location.pathname !== '/' && location.pathname !== '/home') {
                smoothNavigate('/home');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0 active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-brand-500 transition-colors">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 dark:text-stone-100 font-display">
                  SparkX
                </span>
                <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                  AI OS
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-stone-500 dark:text-stone-400 font-medium tracking-tight">
                Recruitment Intelligence Platform
              </span>
            </div>
          </div>

          {/* ── Center: Desktop Navigation Links ── */}
          <nav 
            ref={navContainerRef}
            className="relative hidden md:flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-[#2B201A] border border-stone-300/70 dark:border-[#423229] backdrop-blur-sm shadow-inner"
          >
            {/* Sliding Active Pill Indicator with warm amber glow */}
            <span
              className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-[#382A22] border border-brand-500/30 dark:border-brand-500/50 shadow-sm shadow-brand-500/15 pointer-events-none transition-all duration-200 ease-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {navLinks.map((link) => {
              const isActive = activeId === link.id;
              return (
                <button
                  key={link.id}
                  ref={(el) => (buttonRefs.current[link.id] = el)}
                  onClick={() => handleNavClick(link.href, link.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer select-none active:scale-[0.99] flex items-center gap-1.5 ${
                    isActive
                      ? 'text-brand-900 dark:text-brand-300 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" />
                  )}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right: Auth Actions & Theme Switcher ── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 rounded-xl border border-stone-300/80 dark:border-[#423229] bg-white/80 dark:bg-[#2B201A] text-stone-700 dark:text-stone-300 hover:border-brand-500/50 hover:text-brand-600 dark:hover:text-brand-400 active:scale-[0.96] transition cursor-pointer shadow-2xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-brand-600" />
              )}
            </button>

            {/* Authenticated Fast-Track or Public Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => smoothNavigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold transition shadow-subtle cursor-pointer"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => logout(navigate)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300/80 dark:border-[#2A2520] bg-white/70 dark:bg-[#1A1714]/70 hover:bg-red-50/70 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 text-stone-700 dark:text-stone-300 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                  title="Sign Out"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => smoothNavigate('/login')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300/80 dark:border-[#2A2520] bg-white/70 dark:bg-[#1A1714]/70 hover:bg-white dark:hover:bg-[#231F1B] text-stone-700 dark:text-stone-300 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-400" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => smoothNavigate('/register')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold active:scale-[0.98] transition shadow-subtle cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl border border-stone-300/80 dark:border-[#2A2520] bg-white/80 dark:bg-[#1A1714]/80 text-stone-700 dark:text-stone-300 hover:text-brand-600 dark:hover:text-brand-400 active:scale-[0.96] transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ── Mobile Slide-down Menu ── */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E4DF] dark:border-[#423229] bg-[#FAF8F5]/98 dark:bg-[#0F0E0D]/98 backdrop-blur-2xl px-5 py-5 space-y-4 shadow-xl animate-fade-in-up">
          <div className="space-y-1">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-stone-400 px-2">Navigation</span>
            {navLinks.map((link) => {
              const isActive = activeId === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.href, link.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold active:scale-[0.99] transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/30 text-brand-700 dark:text-brand-300 font-bold'
                      : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2B201A]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-[#2A2520] flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    smoothNavigate(userRole === 'recruiter' ? '/recruiter' : '/jobs');
                  }}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-subtle cursor-pointer transition"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout(navigate);
                  }}
                  className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-[#2A2520] bg-white dark:bg-[#1A1714] text-red-600 dark:text-red-400 active:scale-[0.98] text-xs font-semibold text-center cursor-pointer transition hover:bg-red-50/60 dark:hover:bg-red-950/20"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    smoothNavigate('/login');
                  }}
                  className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-[#2A2520] bg-white dark:bg-[#1A1714] text-stone-800 dark:text-stone-200 active:scale-[0.98] text-xs font-semibold text-center cursor-pointer transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    smoothNavigate('/register');
                  }}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-subtle cursor-pointer transition"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
