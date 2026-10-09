import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import { 
  Search, 
  Briefcase, 
  Users, 
  Video, 
  Code2, 
  ShieldAlert, 
  TrendingUp, 
  FileText, 
  Sun, 
  Moon, 
  RefreshCw, 
  Cpu, 
  LogOut, 
  Plus, 
  ArrowRight,
  Sparkles,
  Command,
  X
} from 'lucide-react';

export default function CommandMenu({ isOpen, onClose, onOpenAIConfig }) {
  const navigate = useNavigate();
  const { smoothNavigate } = useSmoothNavigate();
  const { 
    candidates = [], 
    jobs = [], 
    userRole, 
    currentUser, 
    theme, 
    toggleTheme, 
    syncWithDatabase, 
    logout,
    requestLogout,
    setSelectedCandidate,
    setActiveJobId
  } = useRecruitment();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    } else if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Keyboard listener for Escape and Tab Focus Trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && isOpen && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll('input, button:not([disabled])');
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable items based on real application state
  const navItems = userRole === 'recruiter' ? [
    { id: 'nav-recruiter', label: 'Recruiter Command Center', icon: Briefcase, category: 'Navigation', action: () => smoothNavigate('/recruiter') },
    { id: 'nav-pipeline', label: 'Candidate Pipeline', icon: Users, category: 'Navigation', action: () => smoothNavigate('/recruiter') },
    { id: 'nav-telemetry', label: 'Integrity Telemetry HUD', icon: ShieldAlert, category: 'Navigation', action: () => smoothNavigate('/recruiter/proctor') },
  ] : [
    { id: 'nav-jobs', label: 'Browse Job Catalog', icon: Briefcase, category: 'Navigation', action: () => smoothNavigate('/jobs') },
    { id: 'nav-my-apps', label: 'My Applications & Status', icon: FileText, category: 'Navigation', action: () => smoothNavigate('/my-applications') },
    { id: 'nav-interview', label: 'AI Adaptive Interview', icon: Video, category: 'Navigation', action: () => smoothNavigate('/interview') },
    { id: 'nav-assessment', label: 'Technical Assessment IDE', icon: Code2, category: 'Navigation', action: () => smoothNavigate('/assessment') },
    { id: 'nav-skillgap', label: 'Skill Gap Analysis', icon: TrendingUp, category: 'Navigation', action: () => smoothNavigate('/skill-gap') },
  ];

  // Candidates matching query
  const candidateItems = (userRole === 'recruiter' ? candidates : []).filter(c => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return c.name?.toLowerCase().includes(q) || 
           c.email?.toLowerCase().includes(q) ||
           c.skills?.some(s => s.toLowerCase().includes(q));
  }).slice(0, 5).map(c => ({
    id: `cand-${c.id}`,
    label: `${c.name} — ${c.jobTitle || 'Candidate'}`,
    subLabel: `Match: ${c.matchScore}% • Stage: ${c.stage || c.status}`,
    icon: Users,
    category: 'Candidates',
    action: () => {
      setSelectedCandidate(c);
      smoothNavigate(`/recruiter/candidates/${c.id}`);
    }
  }));

  // Jobs matching query
  const jobItems = jobs.filter(j => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return j.title?.toLowerCase().includes(q) ||
           j.department?.toLowerCase().includes(q) ||
           j.location?.toLowerCase().includes(q);
  }).slice(0, 4).map(j => ({
    id: `job-${j.id}`,
    label: `${j.title}`,
    subLabel: `${j.department} • ${j.location} • ${j.type}`,
    icon: Briefcase,
    category: 'Jobs',
    action: () => {
      setActiveJobId(j.id);
      if (userRole === 'recruiter') {
        smoothNavigate(`/recruiter/jobs/${j.id}`);
      } else {
        smoothNavigate(`/jobs/${j.id}`);
      }
    }
  }));

  // Actions
  const actionItems = [
    {
      id: 'act-theme',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Preferences',
      action: () => toggleTheme()
    },
    {
      id: 'act-sync',
      label: 'Force Sync with Database',
      icon: RefreshCw,
      category: 'System',
      action: async () => {
        await syncWithDatabase(false);
      }
    },
    {
      id: 'act-ai',
      label: 'AI Model Configuration & Key Status',
      icon: Cpu,
      category: 'Preferences',
      action: () => {
        if (onOpenAIConfig) onOpenAIConfig();
      }
    },
    {
      id: 'act-logout',
      label: 'Sign Out of Session',
      icon: LogOut,
      category: 'Account',
      action: () => {
        onClose();
        if (requestLogout) requestLogout(navigate);
        else logout(navigate);
      }
    }
  ];

  // Filter all items by query
  const allFiltered = query.trim() ? [
    ...candidateItems,
    ...jobItems,
    ...navItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase())),
    ...actionItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
  ] : [
    ...navItems,
    ...actionItems
  ];

  // Key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFiltered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allFiltered.length) % Math.max(1, allFiltered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allFiltered[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Palette Container */}
      <div 
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="SparkX Command Menu"
        className="relative w-full max-w-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-popover overflow-hidden z-10 animate-modal-enter"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-stone-200 dark:border-[#2A2520] gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, candidates, roles..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            aria-label="Command search input"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-subtle">
            ESC
          </kbd>
        </div>

        {/* Results List - overflow-x-hidden strictly enforced to eliminate root cause scrollbars */}
        <div className="max-h-80 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {allFiltered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or records found for "{query}".
            </div>
          ) : (
            allFiltered.map((item, idx) => {
              const Icon = item.icon || Sparkles;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full max-w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 gap-2 active:scale-[0.98] cursor-pointer ${
                    isSelected 
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-medium' 
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 truncate">
                      <div className="text-xs sm:text-sm font-semibold truncate">{item.label}</div>
                      {item.subLabel && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.subLabel}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] uppercase font-mono tracking-[0.08em] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Command className="w-3 h-3" />
            <span>SparkX Command OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
