import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useRecruitment } from '../../context/RecruitmentContext';
import {
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Save,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  FileCode,
  Code2,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  Loader2,
  Sliders,
  Database,
  Table,
  Copy,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  Zap,
  GripHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateDefaultStarter } from './benchmarkQuestions';

const RUNTIME_METADATA = {
  python: { label: 'Python 3', version: 'Python 3.11.8 (Judge0 / Sandbox)', monacoLang: 'python', engine: 'Judge0 / C-Python Sandbox', ext: '.py', isExecutable: true, tier: 'sandbox' },
  javascript: { label: 'JavaScript (Node.js)', version: 'Node.js v20.11.0 (Judge0)', monacoLang: 'javascript', engine: 'Judge0 / V8 Engine', ext: '.js', isExecutable: true, tier: 'sandbox' },
  typescript: { label: 'TypeScript', version: 'TypeScript 5.3.3 (Judge0)', monacoLang: 'typescript', engine: 'Judge0 / TSC', ext: '.ts', isExecutable: true, tier: 'sandbox' },
  java: { label: 'Java', version: 'Java 17 (OpenJDK / Judge0)', monacoLang: 'java', engine: 'Judge0 Execution Engine', ext: '.java', isExecutable: true, tier: 'sandbox' },
  cpp: { label: 'C++', version: 'C++20 (GCC / Judge0)', monacoLang: 'cpp', engine: 'Judge0 Execution Engine', ext: '.cpp', isExecutable: true, tier: 'sandbox' },
  c: { label: 'C', version: 'C17 (GCC / Judge0)', monacoLang: 'c', engine: 'Judge0 Execution Engine', ext: '.c', isExecutable: true, tier: 'sandbox' },
  csharp: { label: 'C#', version: '.NET 8.0 (Mono / Judge0)', monacoLang: 'csharp', engine: 'Judge0 Execution Engine', ext: '.cs', isExecutable: true, tier: 'sandbox' },
  go: { label: 'Go', version: 'Go 1.22 (Judge0)', monacoLang: 'go', engine: 'Judge0 Execution Engine', ext: '.go', isExecutable: true, tier: 'sandbox' },
  rust: { label: 'Rust', version: 'Rust 1.77 (Judge0)', monacoLang: 'rust', engine: 'Judge0 Execution Engine', ext: '.rs', isExecutable: true, tier: 'sandbox' },
  ruby: { label: 'Ruby', version: 'Ruby 3.3 (Judge0)', monacoLang: 'ruby', engine: 'Judge0 Execution Engine', ext: '.rb', isExecutable: true, tier: 'sandbox' },
  php: { label: 'PHP', version: 'PHP 8.3 (Judge0)', monacoLang: 'php', engine: 'Judge0 Execution Engine', ext: '.php', isExecutable: true, tier: 'sandbox' },
  kotlin: { label: 'Kotlin', version: 'Kotlin 1.9 (Judge0)', monacoLang: 'kotlin', engine: 'Judge0 Execution Engine', ext: '.kt', isExecutable: true, tier: 'sandbox' },
  swift: { label: 'Swift', version: 'Swift 5.10 (Judge0)', monacoLang: 'swift', engine: 'Judge0 Execution Engine', ext: '.swift', isExecutable: true, tier: 'sandbox' },
  sql: { label: 'SQL (Relational Engine)', version: 'SQLite 3.50 Native Sandbox', monacoLang: 'sql', engine: 'Relational Database Engine', ext: '.sql', isExecutable: true, tier: 'sandbox' },
  bash: { label: 'Bash / Shell', version: 'Bash 5.2 (POSIX Sandbox)', monacoLang: 'shell', engine: 'POSIX Sandbox', ext: '.sh', isExecutable: true, tier: 'sandbox' },
  vb: { label: 'VB.NET', version: 'VB (Syntax Only)', monacoLang: 'vb', engine: 'Manual Evaluation', ext: '.vb', isExecutable: false, tier: 'syntax' },
  mongodb: { label: 'MongoDB', version: 'MongoDB 7.0 (Syntax Only)', monacoLang: 'javascript', engine: 'Manual Evaluation', ext: '.js', isExecutable: false, tier: 'syntax' },
  terraform: { label: 'Terraform (HCL)', version: 'Terraform 1.7 (HCL Validator)', monacoLang: 'hcl', engine: 'HCL Security Linter', ext: '.tf', isExecutable: false, tier: 'syntax' },
  aws: { label: 'AWS CLI', version: 'AWS CLI v2.15 (Cloud Sandbox)', monacoLang: 'shell', engine: 'AWS STS Sandbox', ext: '.sh', isExecutable: false, tier: 'syntax' }
};

const DATABASE_ENGINES = [
  { id: 'postgresql', name: 'PostgreSQL', versions: ['15', '16', '17 (Latest Supported)'], defaultVersion: '17 (Latest Supported)' },
  { id: 'mysql', name: 'MySQL', versions: ['8.0', '8.4 (LTS)', '9.1 (Latest Supported)'], defaultVersion: '8.4 (LTS)' },
  { id: 'sqlserver', name: 'Microsoft SQL Server', versions: ['2019', '2022', '2022 CU14 (Latest Supported)'], defaultVersion: '2022' },
  { id: 'oracle', name: 'Oracle Database', versions: ['19c', '21c', '23ai (Latest Supported)'], defaultVersion: '23ai (Latest Supported)' },
  { id: 'sqlite', name: 'SQLite', versions: ['3.45 (Latest Supported)', '3.x'], defaultVersion: '3.45 (Latest Supported)' },
  { id: 'mariadb', name: 'MariaDB', versions: ['10.11 (LTS)', '11.4 (Latest Supported)'], defaultVersion: '11.4 (Latest Supported)' }
];

function formatInlineCodeAndBold(text) {
  if (!text) return '';
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 font-mono text-[11px] border border-brand-500/20 font-medium">
          {code}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      const bold = part.slice(2, -2);
      return <strong key={i} className="text-stone-100 font-semibold">{bold}</strong>;
    }
    return part;
  });
}

function FormattedProblemDescription({ rawText }) {
  if (!rawText) return null;

  const lines = rawText.split('\n');
  const sections = [];
  let currentSection = { title: null, items: [] };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.replace(/^###\s*/, '').replace(/:$/, ''), items: [] };
    } else if (trimmed.startsWith('## ')) {
      if (currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.replace(/^##\s*/, '').replace(/:$/, ''), items: [] };
    } else {
      currentSection.items.push(line);
    }
  });
  if (currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return (
    <div className="space-y-3.5">
      {sections.map((sec, sIdx) => {
        const titleLower = (sec.title || '').toLowerCase();
        let IconComp = Info;
        let iconColor = 'text-brand-400';

        if (titleLower.includes('function') || titleLower.includes('description')) {
          IconComp = FileCode;
          iconColor = 'text-brand-400';
        } else if (titleLower.includes('parameter')) {
          IconComp = Sliders;
          iconColor = 'text-indigo-400';
        } else if (titleLower.includes('return')) {
          IconComp = Zap;
          iconColor = 'text-emerald-400';
        } else if (titleLower.includes('example')) {
          IconComp = Sparkles;
          iconColor = 'text-amber-400';
        } else if (titleLower.includes('constraint')) {
          IconComp = ShieldCheck;
          iconColor = 'text-brand-400';
        }

        const validLines = sec.items.filter(l => l.trim().length > 0);
        if (!sec.title && validLines.length === 0) return null;

        return (
          <div key={sIdx} className="bg-[#161311] rounded-xl border border-[#2A2520] p-3.5 space-y-2.5 shadow-sm">
            {sec.title && (
              <div className="flex items-center space-x-2 pb-1.5 border-b border-[#231F1C]">
                <IconComp className={`w-3.5 h-3.5 ${iconColor}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-200">
                  {sec.title}
                </span>
              </div>
            )}
            
            <div className="space-y-2 text-xs leading-relaxed">
              {sec.items.map((line, lIdx) => {
                const trim = line.trim();
                if (!trim) return null;

                if (trim.startsWith('- ') || trim.startsWith('* ')) {
                  const content = trim.slice(2);
                  return (
                    <div key={lIdx} className="flex items-start space-x-2 pl-1 bg-[#12100E] p-2 rounded-lg border border-[#25201D]">
                      <span className="text-brand-400 font-bold leading-5">•</span>
                      <div className="flex-1 text-stone-300 leading-5">
                        {formatInlineCodeAndBold(content)}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="text-stone-300 font-sans leading-relaxed">
                    {formatInlineCodeAndBold(line)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CandidateIDE({
  taskId,
  taskTitle,
  difficulty = 'Mid-Level',
  instructions,
  examples = [],
  constraints = [],
  functionSignatures = {},
  supportedLanguages = ['python', 'javascript', 'typescript'],
  starterCodes = {},
  code,
  language = 'python',
  schemaDdl = '',
  sampleTestCases = [],
  onCodeChange,
  onLanguageChange,
  onRunSampleTests,
  onRunCustomTest,
  isExecuting = false,
  sampleResults = null,
  consoleOutput = '',
  executionTelemetry = null,
  isReadOnly = false,
  storageKeyPrefix = 'candidate_ide_draft'
}) {
  const { theme } = useRecruitment();
  const [activeConsoleTab, setActiveConsoleTab] = useState('tests'); // 'tests' | 'custom' | 'console'
  const [activeProblemTab, setActiveProblemTab] = useState('problem'); // 'problem' | 'schema'
  const [selectedDbEngine, setSelectedDbEngine] = useState('postgresql');
  const [selectedDbVersion, setSelectedDbVersion] = useState('17 (Latest Supported)');
  const [isCopiedSchema, setIsCopiedSchema] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [isExecutingCustom, setIsExecutingCustom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => (theme === 'light' ? 'sparkx-light' : 'sparkx-dark'));

  useEffect(() => {
    setEditorTheme(theme === 'light' ? 'sparkx-light' : 'sparkx-dark');
  }, [theme]);

  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(240); // px
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const ideContainerRef = useRef(null);
  const monacoRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Close custom language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isLangDropdownOpen]);

  const activeLangKey = language?.toLowerCase() || 'python';
  const currentRuntime = RUNTIME_METADATA[activeLangKey] || {
    label: activeLangKey.toUpperCase(),
    version: `${activeLangKey.toUpperCase()} Runtime`,
    monacoLang: activeLangKey,
    engine: 'Sandbox Engine',
    ext: '.txt'
  };

  // Draft Auto-Save in LocalStorage
  const storageDraftKey = `${storageKeyPrefix}_${taskId}_${activeLangKey}`;

  // Synchronize language if active language is not supported for this problem
  useEffect(() => {
    if (supportedLanguages && supportedLanguages.length > 0 && !supportedLanguages.includes(activeLangKey)) {
      if (onLanguageChange) {
        onLanguageChange(supportedLanguages[0]);
      }
    }
  }, [supportedLanguages, activeLangKey, onLanguageChange]);

  // Restore draft on initial mount or task/lang change if code is empty
  useEffect(() => {
    if (!code) {
      const saved = localStorage.getItem(storageDraftKey);
      if (saved && saved.trim()) {
        onCodeChange(saved);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [storageDraftKey]);

  // Periodic Auto-Save
  useEffect(() => {
    if (!code || isReadOnly) return;
    const timer = setTimeout(() => {
      localStorage.setItem(storageDraftKey, code);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
    return () => clearTimeout(timer);
  }, [code, storageDraftKey, isReadOnly]);

  // Define Custom SparkX Monaco Themes
  const handleEditorBeforeMount = (monaco) => {
    monacoRef.current = monaco;

    // SparkX Professional Dark Theme (Deep Espresso & Warm Graphite)
    monaco.editor.defineTheme('sparkx-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '78716C', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F59E0B', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'E7E5E4' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'type', foreground: 'E879F9' },
        { token: 'function', foreground: 'F59E0B' },
        { token: 'operator', foreground: 'FCD34D' }
      ],
      colors: {
        'editor.background': '#161310',
        'editor.foreground': '#E7E5E4',
        'editor.lineHighlightBackground': '#1E1B17',
        'editorLineNumber.foreground': '#78716C',
        'editorLineNumber.activeForeground': '#F59E0B',
        'editor.selectionBackground': '#452E1B',
        'editor.inactiveSelectionBackground': '#2E1E12',
        'editorCursor.foreground': '#F59E0B',
        'editorWhitespace.foreground': '#2A2520',
        'editorIndentGuide.background': '#1F1B18',
        'editorIndentGuide.activeBackground': '#3A332C',
        'editorBracketMatch.background': '#3A2716',
        'editorBracketMatch.border': '#F59E0B',
        'scrollbarSlider.background': '#2A252080',
        'scrollbarSlider.hoverBackground': '#3D352E80',
        'scrollbarSlider.activeBackground': '#F59E0B80'
      }
    });

    // SparkX Warm Parchment Light Theme (Editorial High Readability)
    monaco.editor.defineTheme('sparkx-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '78716C', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C27803', fontStyle: 'bold' },
        { token: 'identifier', foreground: '1C1917' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: '9333EA' },
        { token: 'function', foreground: 'B45309' },
        { token: 'operator', foreground: 'C27803' }
      ],
      colors: {
        'editor.background': '#FAF8F4',
        'editor.foreground': '#1C1917',
        'editor.lineHighlightBackground': '#F3EFEA',
        'editorLineNumber.foreground': '#A8A29E',
        'editorLineNumber.activeForeground': '#C27803',
        'editor.selectionBackground': '#FEF3C7',
        'editorCursor.foreground': '#C27803',
        'editorIndentGuide.background': '#E8E4DF',
        'editorIndentGuide.activeBackground': '#D6D1CA'
      }
    });
  };

  // Keyboard Shortcuts (Ctrl+Enter to Run, Ctrl+S to Save, Esc to exit Fullscreen)
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isExecuting && onRunSampleTests) {
        setActiveConsoleTab('tests');
        onRunSampleTests();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      localStorage.setItem(storageDraftKey, code);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else if (e.key === 'Escape') {
      if (isLangDropdownOpen) {
        setIsLangDropdownOpen(false);
      } else if (isFullscreen) {
        setIsFullscreen(false);
      }
    }
  }, [code, storageDraftKey, isExecuting, onRunSampleTests, isFullscreen, isLangDropdownOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Console Resizing Logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingConsole(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingConsole || !ideContainerRef.current) return;
      const containerRect = ideContainerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      if (newHeight >= 120 && newHeight <= 520) {
        setConsoleHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingConsole(false);
    };

    if (isDraggingConsole) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingConsole]);

  // Handle Reset to Starter Code
  const handleResetCode = () => {
    const cleanEntry = taskId ? taskId.replace(/^(hr_|lc_)/, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase()) : 'solve';
    const starter = starterCodes[activeLangKey] || generateDefaultStarter(activeLangKey, cleanEntry);
    onCodeChange(starter);
    localStorage.removeItem(storageDraftKey);
    setLastSavedTime(null);
    setIsResetConfirmOpen(false);
  };

  // Run Custom Test
  const handleCustomTestExecute = async () => {
    if (!onRunCustomTest || isExecutingCustom) return;
    setIsExecutingCustom(true);
    try {
      const res = await onRunCustomTest(customInput);
      setCustomResult(res);

    } catch (err) {
      console.warn('Custom test error:', err);
    } finally {
      setIsExecutingCustom(false);
    }
  };

  const handleCopySchema = () => {
    if (!schemaDdl) return;
    navigator.clipboard.writeText(schemaDdl);
    setIsCopiedSchema(true);
    setTimeout(() => setIsCopiedSchema(false), 2000);
  };

  return (
    <div
      ref={ideContainerRef}
      className={`flex flex-col bg-[#0C0A09] border border-[#2A2520] rounded-xl overflow-hidden shadow-card transition-all font-sans select-text ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full h-[calc(100vh-210px)] min-h-[520px] max-h-[920px]'
      }`}
    >
      {/* ─── Top Header & Toolbar ────────────────────────────────────── */}
      <div className="bg-[#14110F] px-3 sm:px-4 py-2 border-b border-[#2A2520] flex flex-wrap items-center justify-between gap-2.5 select-none">
        {/* Left: Task Identity & Runtime */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-subtle">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-100 tracking-tight font-display">
                  {taskTitle || 'Assessment Challenge'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  difficulty === 'Senior'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#1A1714] border border-[#2A2520] text-xs font-mono-code">
            <span className={`w-2 h-2 rounded-full ${currentRuntime.isExecutable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-stone-300">{currentRuntime.version}</span>
            <span className={`ml-1 px-1.5 py-0.2 text-[9px] font-semibold rounded uppercase ${
              currentRuntime.isExecutable 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {currentRuntime.isExecutable ? 'Sandbox' : 'Syntax Only'}
            </span>
          </div>
        </div>

        {/* Right: Controls (Language, Theme, AutoSave, Reset, Fullscreen) */}
        <div className="flex items-center space-x-2">
          {/* Custom Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => !isReadOnly && setIsLangDropdownOpen(prev => !prev)}
              disabled={isReadOnly}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all select-none ${
                isLangDropdownOpen
                  ? 'bg-[#231F1B] border-brand-500/60 text-white shadow-lg ring-1 ring-brand-500/25'
                  : 'bg-[#1A1714] hover:bg-[#231F1B] border-[#2A2520] hover:border-[#3D352E] text-stone-200'
              } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Select Programming Language"
            >
              <div className="flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span className="font-semibold text-stone-100">{currentRuntime.label || activeLangKey.toUpperCase()}</span>
                <span className="text-[10px] text-stone-400 font-mono px-1 py-0.2 rounded bg-[#0E0C0B] border border-[#2A2520]">
                  {currentRuntime.ext}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                  isLangDropdownOpen ? 'rotate-180 text-brand-400' : ''
                }`}
              />
            </button>

            {/* Floating Language Menu */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 z-50 rounded-xl bg-[#141210] border border-[#2D2824] shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in duration-150">
                <div className="p-2 border-b border-[#25201C] bg-[#191614] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-300">Choose Language Runtime</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                    Judge0 Engine
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin">
                  {/* Automated Test Sandbox Tier */}
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Automated Test Sandbox</span>
                  </div>
                  {supportedLanguages.filter(l => RUNTIME_METADATA[l]?.isExecutable).map((l) => {
                    const meta = RUNTIME_METADATA[l] || { label: l.toUpperCase(), ext: '' };
                    const isSelected = l === activeLangKey;
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          if (onLanguageChange) onLanguageChange(l);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-brand-500/15 text-brand-300 font-semibold border-l-2 border-brand-500'
                            : 'text-stone-300 hover:bg-[#201C18] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{meta.label}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{meta.ext}</span>
                        </div>
                        {isSelected ? (
                          <div className="flex items-center space-x-1 text-brand-400">
                            <span className="text-[10px] font-mono">Active</span>
                            <Check className="w-3.5 h-3.5 text-brand-400" />
                          </div>
                        ) : (
                          <span className="text-[9px] text-stone-500 font-mono">
                            {meta.version ? meta.version.split(' ')[0] : 'Ready'}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Syntax Only Tier (if any) */}
                  {supportedLanguages.filter(l => !RUNTIME_METADATA[l]?.isExecutable).length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center space-x-1.5 border-t border-[#25201C] mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Syntax & Review Only</span>
                      </div>
                      {supportedLanguages.filter(l => !RUNTIME_METADATA[l]?.isExecutable).map((l) => {
                        const meta = RUNTIME_METADATA[l] || { label: l.toUpperCase(), ext: '' };
                        const isSelected = l === activeLangKey;
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => {
                              if (onLanguageChange) onLanguageChange(l);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                              isSelected
                                ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                                : 'text-stone-400 hover:bg-[#201C18] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{meta.label}</span>
                              <span className="text-[10px] text-stone-500 font-mono">{meta.ext}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Database Engine & Version Selector (Only when SQL is active AND challenge involves SQL/database schema) */}
          {activeLangKey === 'sql' && (schemaDdl || instructions?.toLowerCase().includes('sql') || taskTitle?.toLowerCase().includes('sql') || supportedLanguages.includes('sql')) && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-brand-500/30 text-xs text-brand-300">
              <Database className="w-3.5 h-3.5 text-brand-400" />
              <select
                value={selectedDbEngine}
                onChange={(e) => {
                  const newDb = e.target.value;
                  setSelectedDbEngine(newDb);
                  const eng = DATABASE_ENGINES.find(d => d.id === newDb);
                  if (eng) setSelectedDbVersion(eng.defaultVersion);
                }}
                disabled={isReadOnly}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-200"
                title="Target Database Engine"
              >
                {DATABASE_ENGINES.map((db) => (
                  <option key={db.id} value={db.id} className="bg-slate-900 text-slate-200">
                    {db.name}
                  </option>
                ))}
              </select>
              <span className="text-slate-600 font-mono">/</span>
              <select
                value={selectedDbVersion}
                onChange={(e) => setSelectedDbVersion(e.target.value)}
                disabled={isReadOnly}
                className="bg-transparent text-[11px] font-mono focus:outline-none cursor-pointer text-slate-300"
                title="Database Version"
              >
                {(DATABASE_ENGINES.find(d => d.id === selectedDbEngine)?.versions || []).map((v) => (
                  <option key={v} value={v} className="bg-slate-900 text-slate-200">
                    v{v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setEditorTheme(editorTheme === 'sparkx-dark' ? 'sparkx-light' : 'sparkx-dark')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 text-xs transition"
            title={`Toggle Theme (Current: ${editorTheme === 'sparkx-dark' ? 'Dark' : 'Light'})`}
          >
            {editorTheme === 'sparkx-dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-brand-400" />}
          </button>

          {/* Auto-save Status Indicator */}
          {lastSavedTime && (
            <span className="hidden md:inline-flex items-center space-x-1 text-xs text-slate-400 font-medium">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved {lastSavedTime}</span>
            </span>
          )}

          {/* Reset Code Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              disabled={isReadOnly}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs transition flex items-center space-x-1"
              title="Reset Code to Starter Template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Reset Confirmation Modal */}
            {isResetConfirmOpen && (
              <div className="absolute right-0 mt-2 w-64 p-3.5 bg-slate-950 border border-slate-700 rounded-xl shadow-card z-50 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Code Reset</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reset code back to original template? Your unsaved modifications in {currentRuntime.label} will be discarded.
                </p>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                  >
                    Reset Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 text-xs transition"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Assessment Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── Main Split Layout: Left Problem Panel & Right Monaco/Console ─── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL: Problem Specification & Table Schema (DDL) */}
        <div className={`w-full ${leftPanelCollapsed ? 'md:w-[48px]' : 'md:w-[40%] lg:w-[36%]'} border-b md:border-b-0 md:border-r border-[#2A2520] bg-[#0F0E0D] flex flex-col overflow-hidden transition-all duration-200`}>
          {/* Sub-tab Navigation */}
          <div className="px-3 py-2 bg-[#14110F] border-b border-[#2A2520] flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => { setActiveProblemTab('problem'); setLeftPanelCollapsed(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeProblemTab === 'problem' && !leftPanelCollapsed
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span className={leftPanelCollapsed ? 'hidden' : 'inline'}>Problem</span>
              </button>

              {(activeLangKey === 'sql' || schemaDdl) && (
                <button
                  type="button"
                  onClick={() => { setActiveProblemTab('schema'); setLeftPanelCollapsed(false); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    activeProblemTab === 'schema' && !leftPanelCollapsed
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span className={leftPanelCollapsed ? 'hidden' : 'inline'}>Table Schema (DDL)</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="hidden md:block p-1 rounded hover:bg-[#1A1714] text-stone-500 hover:text-stone-300 text-[10px]"
              title={leftPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {leftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 rotate-90" />}
            </button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-stone-300 text-xs ide-scrollbar">
              {/* Tab 1: Problem Statement View */}
              {activeProblemTab === 'problem' && (
                <>
                  {/* Formatted Requirements & Overview */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Requirements & Overview</span>
                    </h3>
                    <FormattedProblemDescription rawText={instructions} />
                  </div>

                  {/* Function Signature */}
                  {functionSignatures && functionSignatures[activeLangKey] && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Target Signature ({currentRuntime.label})</span>
                      </h3>
                      <pre className="p-3 bg-[#161311] border border-[#2A2520] rounded-xl font-mono-code text-[11px] text-amber-300 overflow-x-auto">
                        {functionSignatures[activeLangKey]}
                      </pre>
                    </div>
                  )}

                  {/* Examples */}
                  {examples && examples.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Input / Output Examples
                      </h3>
                      {examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm"
                        >
                          <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Example {idx + 1}</div>
                          <div className="font-mono-code text-[11px] space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                            <div>
                              <span className="text-slate-400">Input: </span>
                              <span className="text-slate-100">{ex.input}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Output: </span>
                              <span className="text-emerald-300 font-bold">{ex.output}</span>
                            </div>
                          </div>
                          {ex.explanation && (
                            <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                              {ex.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {constraints && constraints.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Constraints & Invariants
                      </h3>
                      <ul className="space-y-1.5 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        {constraints.map((c, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                            <span className="text-brand-400 font-bold">•</span>
                            <span className="font-mono-code text-[11px]">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Table Schema (DDL) View */}
              {activeProblemTab === 'schema' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                        <Database className="w-4 h-4 text-brand-400" />
                        <span>Relational Table Definitions</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 pt-0.5">
                        Target Sandbox Engine: <strong className="text-slate-200">{selectedDbEngine.toUpperCase()} (SQLite 3.50 Driver)</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
                    >
                      {isCopiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                      <span>{isCopiedSchema ? 'Copied!' : 'Copy DDL'}</span>
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0B0F19]">
                    <pre className="p-4 font-mono-code text-[11px] text-slate-200 leading-relaxed overflow-x-auto whitespace-pre">
                      {schemaDdl || '-- No specific DDL defined for this challenge'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Monaco Code Editor + Bottom Console / Test Feedback */}
        <div className="flex-1 flex flex-col bg-[#0C0A09] overflow-hidden min-w-0">
          {/* Editor File Tab Header */}
          <div className="bg-[#14110F] px-4 py-1.5 border-b border-[#2A2520] flex items-center justify-between text-xs select-none">
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-[#1A1714] border-t-2 border-brand-500 border-x border-[#2A2520] text-stone-100 font-mono-code text-[11px] rounded-t flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-brand-400" />
                <span>solution{currentRuntime.ext}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-stone-400 font-mono-code">
              <span>UTF-8</span>
              <span>Spaces: 4</span>
              <span className="hidden sm:inline-block text-stone-500">{currentRuntime.engine}</span>
            </div>
          </div>

          {/* Monaco Code Editor Surface */}
          <div className="flex-1 min-h-[260px] relative overflow-hidden">
            <Editor
              height="100%"
              language={currentRuntime.monacoLang}
              value={code}
              onChange={(val) => onCodeChange && onCodeChange(val || '')}
              beforeMount={handleEditorBeforeMount}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 13.5,
                lineHeight: 22,
                letterSpacing: 0.2,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: isReadOnly,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 14, bottom: 14 },
                scrollbar: {
                  verticalScrollbarSize: 7,
                  horizontalScrollbarSize: 7
                }
              }}
            />
          </div>

          {/* Resizable Splitter Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="h-2 bg-[#14110F] hover:bg-brand-600/30 cursor-row-resize flex items-center justify-center transition select-none group border-t border-[#2A2520]"
            title="Drag to resize console"
          >
            <GripHorizontal className="w-4 h-3 text-stone-500 group-hover:text-brand-300" />
          </div>

          {/* Action Bar (Run Sample Tests & Console Tabs) */}
          <div className="bg-[#14110F] px-4 py-2 border-b border-[#2A2520] flex items-center justify-between select-none">
            <div className="flex items-center space-x-1.5">
              {/* Console Tabs */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('tests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeConsoleTab === 'tests'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sample Tests</span>
                {sampleResults && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    sampleResults.every(r => r.passed) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {sampleResults.filter(r => r.passed).length}/{sampleResults.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeConsoleTab === 'custom'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom Test</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveConsoleTab('console')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeConsoleTab === 'console'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Diagnostics & Output</span>
              </button>
            </div>

            {/* Run Button with Keyboard Shortcut */}
            <div className="flex items-center space-x-2.5">
              <span className="hidden lg:inline-block text-[10px] text-stone-400 font-mono-code bg-[#1A1714] px-2 py-0.5 rounded border border-[#2A2520]">
                Ctrl + Enter
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveConsoleTab('tests');
                  onRunSampleTests && onRunSampleTests();
                }}
                disabled={isExecuting || isReadOnly}
                className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isExecuting ? 'Running Sandbox...' : 'Run Sample Tests'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Execution Console */}
          <div
            style={{ height: `${consoleHeight}px` }}
            className="bg-[#0C0A09]/95 p-4 overflow-y-auto text-xs ide-scrollbar border-t border-[#2A2520]"
          >
            {/* TAB 1: Sample Tests Results */}
            {activeConsoleTab === 'tests' && (
              <div className="space-y-3">
                {!sampleResults && !isExecuting && (
                  <div className="py-6 text-center text-stone-500 space-y-1.5">
                    <Terminal className="w-6 h-6 mx-auto text-stone-600 mb-1" />
                    <p className="font-semibold text-xs text-stone-400">Ready to execute test suite</p>
                    <p className="text-[11px] text-stone-500">Click <strong>Run Sample Tests</strong> (or press Ctrl+Enter) to evaluate your implementation against visible test fixtures.</p>
                  </div>
                )}

                {isExecuting && (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2 text-amber-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Executing code in {currentRuntime.version} sandbox...</span>
                  </div>
                )}

                {sampleResults && !isExecuting && (
                  <div className="space-y-2.5">
                    {/* Telemetry Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#2A2520] text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold flex items-center space-x-1.5 ${
                          sampleResults.every(r => r.passed) ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sampleResults.every(r => r.passed) ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{sampleResults.filter(r => r.passed).length}/{sampleResults.length} Sample Tests Passed</span>
                        </span>
                      </div>

                      {executionTelemetry && (
                        <div className="flex items-center space-x-3 text-stone-400 font-mono-code">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{executionTelemetry.execution_ms ?? executionTelemetry.duration ?? '1.2'}ms</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Cpu className="w-3 h-3 text-amber-400" />
                            <span>{executionTelemetry.memory_mb ?? '24.5'}MB</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Test Case Cards */}
                    <div className="space-y-2">
                      {sampleResults.map((tc, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border font-mono-code text-[11px] transition ${
                            tc.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-sans mb-1.5">
                            <div className="flex items-center space-x-2">
                              {tc.passed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 uppercase">
                                  PASS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 uppercase">
                                  FAIL
                                </span>
                              )}
                              <span className="font-bold text-stone-200">{tc.name || `Sample Test Case #${idx + 1}`}</span>
                            </div>
                            <span className="text-[10px] text-stone-400">{tc.duration || '1ms'}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                            <div>
                              <span className="text-stone-400">Input: </span>
                              <span className="text-stone-200">{tc.input || '(Default)'}</span>
                            </div>
                            <div>
                              <span className="text-stone-400">Expected: </span>
                              <span className="text-stone-200">{tc.expected}</span>
                            </div>
                          </div>

                          {tc.actual && (
                            <div className="text-[10px] pt-1">
                              <span className="text-stone-400">Your Output: </span>
                              <span className={tc.passed ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>{tc.actual}</span>
                            </div>
                          )}

                          {tc.error && (
                            <div className="text-[10px] text-rose-400 mt-2 p-2 rounded bg-rose-950/40 border border-rose-500/20 whitespace-pre-wrap">
                              {tc.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Custom Test Runner */}
            {activeConsoleTab === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-stone-400 text-xs">
                  <span>Enter custom arguments below to verify your algorithm:</span>
                  <button
                    type="button"
                    onClick={handleCustomTestExecute}
                    disabled={isExecutingCustom || isReadOnly}
                    className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-md shadow-amber-950/20"
                  >
                    {isExecutingCustom ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>Run Custom Input</span>
                  </button>
                </div>

                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={'e.g. [{"level": "ERROR", "service": "auth"}] or [1, 2, 3]'}
                  rows={3}
                  className="w-full bg-[#14110F] border border-[#2A2520] rounded-xl p-3 font-mono-code text-xs text-stone-200 focus:outline-none focus:border-brand-500 resize-none shadow-inner"
                />

                {customResult && (
                  <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2 font-mono-code text-[11px]">
                    <div className="flex items-center justify-between text-xs font-sans pb-1 border-b border-slate-800">
                      <span className="font-bold text-slate-200">Custom Run Output</span>
                      <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
                        <span>Time: {customResult.execution_ms}ms</span>
                        <span>Memory: {customResult.memory_mb}MB</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Return Value: </span>
                      <span className="text-emerald-300 font-bold">{customResult.test_results?.[0]?.actual || '(None)'}</span>
                    </div>
                    {customResult.console_output && (
                      <pre className="text-slate-400 text-[10px] whitespace-pre-wrap">
                        {customResult.console_output}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Execution Diagnostics & Console Stream */}
            {activeConsoleTab === 'console' && (
              <div className="font-mono-code text-[11px] leading-relaxed space-y-1">
                <div className="text-slate-500 pb-1 border-b border-slate-800 text-[10px] flex items-center justify-between font-sans">
                  <span>SANDBOX STDOUT / STDERR STREAM</span>
                  <span>{currentRuntime.version}</span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap pt-1 font-mono-code">
                  {consoleOutput || '> Sandbox initialized. Ready for execution stream.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
