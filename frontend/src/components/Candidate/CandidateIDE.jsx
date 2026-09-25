import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
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

const RUNTIME_METADATA = {
  python: { label: 'Python 3', version: 'Python 3.11.8', monacoLang: 'python', engine: 'C-Python Sandbox', ext: '.py', isExecutable: true, tier: 'sandbox' },
  javascript: { label: 'JavaScript (Node.js)', version: 'Node.js v20.11.0 LTS', monacoLang: 'javascript', engine: 'V8 Isolated VM', ext: '.js', isExecutable: true, tier: 'sandbox' },
  typescript: { label: 'TypeScript', version: 'TypeScript 5.3.3', monacoLang: 'typescript', engine: 'Node.js / TSC', ext: '.ts', isExecutable: true, tier: 'sandbox' },
  sql: { label: 'SQL (Relational Engine)', version: 'SQLite 3.50 Native Sandbox', monacoLang: 'sql', engine: 'Relational Database Engine', ext: '.sql', isExecutable: true, tier: 'sandbox' },
  c: { label: 'C', version: 'C17 (Syntax Only)', monacoLang: 'c', engine: 'Manual Evaluation', ext: '.c', isExecutable: false, tier: 'syntax' },
  cpp: { label: 'C++', version: 'C++20 (Syntax Only)', monacoLang: 'cpp', engine: 'Manual Evaluation', ext: '.cpp', isExecutable: false, tier: 'syntax' },
  csharp: { label: 'C#', version: '.NET 8.0 (Syntax Only)', monacoLang: 'csharp', engine: 'Manual Evaluation', ext: '.cs', isExecutable: false, tier: 'syntax' },
  vb: { label: 'VB.NET', version: 'VB (Syntax Only)', monacoLang: 'vb', engine: 'Manual Evaluation', ext: '.vb', isExecutable: false, tier: 'syntax' },
  java: { label: 'Java', version: 'Java 17 (Syntax Only)', monacoLang: 'java', engine: 'Manual Evaluation', ext: '.java', isExecutable: false, tier: 'syntax' },
  go: { label: 'Go', version: 'Go 1.22 (Syntax Only)', monacoLang: 'go', engine: 'Manual Evaluation', ext: '.go', isExecutable: false, tier: 'syntax' },
  rust: { label: 'Rust', version: 'Rust 1.77 (Syntax Only)', monacoLang: 'rust', engine: 'Manual Evaluation', ext: '.rs', isExecutable: false, tier: 'syntax' },
  php: { label: 'PHP', version: 'PHP 8.3 (Syntax Only)', monacoLang: 'php', engine: 'Manual Evaluation', ext: '.php', isExecutable: false, tier: 'syntax' },
  ruby: { label: 'Ruby', version: 'Ruby 3.3 (Syntax Only)', monacoLang: 'ruby', engine: 'Manual Evaluation', ext: '.rb', isExecutable: false, tier: 'syntax' },
  kotlin: { label: 'Kotlin', version: 'Kotlin 1.9 (Syntax Only)', monacoLang: 'kotlin', engine: 'Manual Evaluation', ext: '.kt', isExecutable: false, tier: 'syntax' },
  swift: { label: 'Swift', version: 'Swift 5.10 (Syntax Only)', monacoLang: 'swift', engine: 'Manual Evaluation', ext: '.swift', isExecutable: false, tier: 'syntax' },
  mongodb: { label: 'MongoDB', version: 'MongoDB 7.0 (Syntax Only)', monacoLang: 'javascript', engine: 'Manual Evaluation', ext: '.js', isExecutable: false, tier: 'syntax' }
};

const DATABASE_ENGINES = [
  { id: 'postgresql', name: 'PostgreSQL', versions: ['15', '16', '17 (Latest Supported)'], defaultVersion: '17 (Latest Supported)' },
  { id: 'mysql', name: 'MySQL', versions: ['8.0', '8.4 (LTS)', '9.1 (Latest Supported)'], defaultVersion: '8.4 (LTS)' },
  { id: 'sqlserver', name: 'Microsoft SQL Server', versions: ['2019', '2022', '2022 CU14 (Latest Supported)'], defaultVersion: '2022' },
  { id: 'oracle', name: 'Oracle Database', versions: ['19c', '21c', '23ai (Latest Supported)'], defaultVersion: '23ai (Latest Supported)' },
  { id: 'sqlite', name: 'SQLite', versions: ['3.45 (Latest Supported)', '3.x'], defaultVersion: '3.45 (Latest Supported)' },
  { id: 'mariadb', name: 'MariaDB', versions: ['10.11 (LTS)', '11.4 (Latest Supported)'], defaultVersion: '11.4 (Latest Supported)' }
];

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
  const [activeConsoleTab, setActiveConsoleTab] = useState('tests'); // 'tests' | 'custom' | 'console'
  const [activeProblemTab, setActiveProblemTab] = useState('problem'); // 'problem' | 'schema'
  const [selectedDbEngine, setSelectedDbEngine] = useState('postgresql');
  const [selectedDbVersion, setSelectedDbVersion] = useState('17 (Latest Supported)');
  const [isCopiedSchema, setIsCopiedSchema] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [isExecutingCustom, setIsExecutingCustom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState('sparkx-dark');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(240); // px
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const ideContainerRef = useRef(null);
  const monacoRef = useRef(null);

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

    // SparkX Professional Dark Theme
    monaco.editor.defineTheme('sparkx-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60A5FA', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'E2E8F0' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: '38BDF8' },
        { token: 'type', foreground: 'A78BFA' },
        { token: 'function', foreground: '60A5FA' },
        { token: 'operator', foreground: 'F472B6' }
      ],
      colors: {
        'editor.background': '#080A10',
        'editor.foreground': '#E2E8F0',
        'editor.lineHighlightBackground': '#0E1322',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#4F6BFF',
        'editor.selectionBackground': '#1E293B',
        'editor.inactiveSelectionBackground': '#131A2B',
        'editorCursor.foreground': '#4F6BFF',
        'editorWhitespace.foreground': '#1E293B',
        'editorIndentGuide.background': '#1E293B',
        'editorIndentGuide.activeBackground': '#334155',
        'editorBracketMatch.background': '#1E293B',
        'editorBracketMatch.border': '#3851E0',
        'scrollbarSlider.background': '#1E293B80',
        'scrollbarSlider.hoverBackground': '#33415580',
        'scrollbarSlider.activeBackground': '#3851E080'
      }
    });

    // SparkX Clean High-Contrast Light Theme
    monaco.editor.defineTheme('sparkx-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4F46E5', fontStyle: 'bold' },
        { token: 'identifier', foreground: '0F172A' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: '0284C7' },
        { token: 'type', foreground: '7C3AED' },
        { token: 'function', foreground: '2563EB' }
      ],
      colors: {
        'editor.background': '#F8FAFC',
        'editor.foreground': '#0F172A',
        'editor.lineHighlightBackground': '#F1F5F9',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#4F46E5',
        'editor.selectionBackground': '#E0E7FF',
        'editorCursor.foreground': '#4F46E5',
        'editorIndentGuide.background': '#E2E8F0',
        'editorIndentGuide.activeBackground': '#CBD5E1'
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
    } else if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [code, storageDraftKey, isExecuting, onRunSampleTests, isFullscreen]);

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
    const starter = starterCodes[activeLangKey] || starterCodes['python'] || starterCodes['javascript'] || '// Write solution here\n';
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
      className={`flex flex-col bg-[#080A10] border border-slate-800 rounded-xl overflow-hidden shadow-card transition-all font-sans select-text ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full h-[calc(100vh-210px)] min-h-[520px] max-h-[920px]'
      }`}
    >
      {/* ─── Top Header & Toolbar ────────────────────────────────────── */}
      <div className="bg-[#0B0E18] px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 select-none">
        {/* Left: Task Identity & Runtime */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-subtle">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-100 tracking-tight">
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

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${currentRuntime.isExecutable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">{currentRuntime.version}</span>
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
          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-200">
            <FileCode className="w-3.5 h-3.5 text-brand-400" />
            <select
              value={activeLangKey}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              disabled={isReadOnly}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1 text-slate-200"
              title="Select Programming Language"
            >
              <optgroup label="Automated Test Sandbox" className="bg-slate-900 text-emerald-400 font-semibold">
                {supportedLanguages.filter(l => RUNTIME_METADATA[l]?.isExecutable).map((l) => (
                  <option key={l} value={l} className="bg-slate-900 text-slate-100 font-normal">
                    {RUNTIME_METADATA[l]?.label || l.toUpperCase()} (Sandbox)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Syntax & Submission Only" className="bg-slate-900 text-amber-400 font-semibold">
                {supportedLanguages.filter(l => !RUNTIME_METADATA[l]?.isExecutable).map((l) => (
                  <option key={l} value={l} className="bg-slate-900 text-slate-300 font-normal">
                    {RUNTIME_METADATA[l]?.label || l.toUpperCase()} (Manual Review)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Database Engine & Version Selector (Only when SQL is active AND challenge involves SQL/database schema) */}
          {activeLangKey === 'sql' && (schemaDdl || instructions?.toLowerCase().includes('sql') || taskTitle?.toLowerCase().includes('sql') || supportedLanguages.includes('sql')) && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-brand-500/30 text-xs text-brand-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
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
        <div className={`w-full ${leftPanelCollapsed ? 'md:w-[48px]' : 'md:w-[40%] lg:w-[36%]'} border-b md:border-b-0 md:border-r border-slate-800/90 bg-[#070A12]/80 flex flex-col overflow-hidden transition-all duration-200`}>
          {/* Sub-tab Navigation */}
          <div className="px-3 py-2 bg-[#070A12] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => { setActiveProblemTab('problem'); setLeftPanelCollapsed(false); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeProblemTab === 'problem' && !leftPanelCollapsed
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
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
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span className={leftPanelCollapsed ? 'hidden' : 'inline'}>Table Schema (DDL)</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="hidden md:block p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-[10px]"
              title={leftPanelCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {leftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 rotate-90" />}
            </button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-slate-300 text-xs ide-scrollbar">
              {/* Tab 1: Problem Statement View */}
              {activeProblemTab === 'problem' && (
                <>
                  {/* Instructions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Requirements & Overview</span>
                    </h3>
                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs bg-slate-900/70 p-4 rounded-xl border border-slate-800/90 shadow-inner">
                      {instructions}
                    </div>
                  </div>

                  {/* Function Signature */}
                  {functionSignatures && functionSignatures[activeLangKey] && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Target Signature ({currentRuntime.label})</span>
                      </h3>
                      <pre className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-xl font-mono-code text-[11px] text-emerald-300 overflow-x-auto">
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
                          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Example {idx + 1}</div>
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
                            <span className="text-indigo-400 font-bold">•</span>
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
                        <Database className="w-4 h-4 text-cyan-400" />
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
        <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden min-w-0">
          {/* Editor File Tab Header */}
          <div className="bg-[#070A12] px-4 py-1.5 border-b border-slate-800/90 flex items-center justify-between text-xs select-none">
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-[#0B0F19] border-t-2 border-indigo-500 border-x border-slate-800 text-slate-100 font-mono-code text-[11px] rounded-t flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>solution{currentRuntime.ext}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono-code">
              <span>UTF-8</span>
              <span>Spaces: 4</span>
              <span className="hidden sm:inline-block text-slate-500">{currentRuntime.engine}</span>
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
            className="h-2 bg-slate-900 hover:bg-indigo-600/50 cursor-row-resize flex items-center justify-center transition select-none group border-t border-slate-800"
            title="Drag to resize console"
          >
            <GripHorizontal className="w-4 h-3 text-slate-600 group-hover:text-brand-300" />
          </div>

          {/* Action Bar (Run Sample Tests & Console Tabs) */}
          <div className="bg-[#0B0E18] px-4 py-2 border-b border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center space-x-1.5">
              {/* Console Tabs */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('tests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeConsoleTab === 'tests'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200'
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
                    : 'text-slate-400 hover:text-slate-200'
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
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Diagnostics & Output</span>
              </button>
            </div>

            {/* Run Button with Keyboard Shortcut */}
            <div className="flex items-center space-x-2.5">
              <span className="hidden lg:inline-block text-[10px] text-slate-400 font-mono-code bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Ctrl + Enter
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveConsoleTab('tests');
                  onRunSampleTests && onRunSampleTests();
                }}
                disabled={isExecuting || isReadOnly}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isExecuting ? 'Running Sandbox...' : 'Run Sample Tests'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Execution Console */}
          <div
            style={{ height: `${consoleHeight}px` }}
            className="bg-[#070A12]/95 p-4 overflow-y-auto text-xs ide-scrollbar border-t border-slate-800/80"
          >
            {/* TAB 1: Sample Tests Results */}
            {activeConsoleTab === 'tests' && (
              <div className="space-y-3">
                {!sampleResults && !isExecuting && (
                  <div className="py-6 text-center text-slate-500 space-y-1.5">
                    <Terminal className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                    <p className="font-semibold text-xs text-slate-400">Ready to execute test suite</p>
                    <p className="text-[11px] text-slate-500">Click <strong>Run Sample Tests</strong> (or press Ctrl+Enter) to evaluate your implementation against visible test fixtures.</p>
                  </div>
                )}

                {isExecuting && (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2 text-indigo-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Executing code in {currentRuntime.version} sandbox...</span>
                  </div>
                )}

                {sampleResults && !isExecuting && (
                  <div className="space-y-2.5">
                    {/* Telemetry Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold flex items-center space-x-1.5 ${
                          sampleResults.every(r => r.passed) ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sampleResults.every(r => r.passed) ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{sampleResults.filter(r => r.passed).length}/{sampleResults.length} Sample Tests Passed</span>
                        </span>
                      </div>

                      {executionTelemetry && (
                        <div className="flex items-center space-x-3 text-slate-400 font-mono-code">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>{executionTelemetry.execution_ms ?? executionTelemetry.duration ?? '1.2'}ms</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Cpu className="w-3 h-3 text-cyan-400" />
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
                              <span className="font-bold text-slate-200">{tc.name || `Sample Test Case #${idx + 1}`}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{tc.duration || '1ms'}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                            <div>
                              <span className="text-slate-400">Input: </span>
                              <span className="text-slate-200">{tc.input || '(Default)'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Expected: </span>
                              <span className="text-slate-200">{tc.expected}</span>
                            </div>
                          </div>

                          {tc.actual && (
                            <div className="text-[10px] pt-1">
                              <span className="text-slate-400">Your Output: </span>
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
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Enter custom arguments below to verify your algorithm:</span>
                  <button
                    type="button"
                    onClick={handleCustomTestExecute}
                    disabled={isExecutingCustom || isReadOnly}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-md shadow-indigo-600/20"
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
                  className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl p-3 font-mono-code text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
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
