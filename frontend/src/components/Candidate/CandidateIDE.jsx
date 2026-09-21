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
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

const RUNTIME_METADATA = {
  c: { label: 'C', version: 'GCC 11.4 (C17)', monacoLang: 'c', engine: 'Native GCC' },
  cpp: { label: 'C++', version: 'GCC 11.4 (C++20)', monacoLang: 'cpp', engine: 'Native GCC' },
  csharp: { label: 'C#', version: '.NET 8.0 (C# 12)', monacoLang: 'csharp', engine: 'Roslyn / CLR' },
  vb: { label: 'VB.NET', version: '.NET 8.0 (VB)', monacoLang: 'vb', engine: 'CLR Engine' },
  java: { label: 'Java', version: 'OpenJDK 17 LTS', monacoLang: 'java', engine: 'JVM' },
  python: { label: 'Python', version: 'Python 3.11.8', monacoLang: 'python', engine: 'C-Python Sandbox' },
  javascript: { label: 'JavaScript (Node.js)', version: 'Node.js v20.11.0 LTS', monacoLang: 'javascript', engine: 'V8 Isolated VM' },
  typescript: { label: 'TypeScript', version: 'TypeScript 5.3.3', monacoLang: 'typescript', engine: 'Node.js / TSC' },
  go: { label: 'Go', version: 'Go 1.22 LTS', monacoLang: 'go', engine: 'Go Runtime' },
  rust: { label: 'Rust', version: 'Rust 1.77 (Edition 2021)', monacoLang: 'rust', engine: 'LLVM Backend' },
  php: { label: 'PHP', version: 'PHP 8.3 CLI', monacoLang: 'php', engine: 'Zend Engine' },
  ruby: { label: 'Ruby', version: 'Ruby 3.3.0', monacoLang: 'ruby', engine: 'YARV VM' },
  kotlin: { label: 'Kotlin', version: 'Kotlin 1.9.22', monacoLang: 'kotlin', engine: 'Kotlin / JVM' },
  swift: { label: 'Swift', version: 'Swift 5.10', monacoLang: 'swift', engine: 'Swift LLVM' },
  sql: { label: 'SQL (Relational Engine)', version: 'SQLite 3.50 Native Sandbox', monacoLang: 'sql', engine: 'Relational Database Engine' },
  mongodb: { label: 'MongoDB (NoSQL)', version: 'MongoDB 7.0 / MQL', monacoLang: 'javascript', engine: 'Document Aggregation Pipeline' }
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
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(240); // px
  const ideContainerRef = useRef(null);

  const activeLangKey = language?.toLowerCase() || 'python';
  const currentRuntime = RUNTIME_METADATA[activeLangKey] || {
    label: activeLangKey.toUpperCase(),
    version: `${activeLangKey.toUpperCase()} Runtime`,
    monacoLang: activeLangKey,
    engine: 'Sandbox Engine'
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
    }, 1500);
    return () => clearTimeout(timer);
  }, [code, storageDraftKey, isReadOnly]);

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
      if (res?.all_passed) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.warn('Custom test error:', err);
    } finally {
      setIsExecutingCustom(false);
    }
  };

  return (
    <div
      ref={ideContainerRef}
      className={`flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full min-h-[700px] h-[780px]'
      }`}
    >
      {/* Top Header & Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Task Identity & Runtime */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                <span>{taskTitle || 'Technical Challenge'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  difficulty === 'Senior'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {difficulty}
                </span>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono">{currentRuntime.version}</span>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={activeLangKey}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              disabled={isReadOnly}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-2 text-slate-200"
            >
              {supportedLanguages.map((l) => (
                <option key={l} value={l} className="bg-slate-900 text-slate-200">
                  {RUNTIME_METADATA[l]?.label || l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Database Engine & Version Selector (When SQL is active) */}
          {activeLangKey === 'sql' && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-500/30 text-xs text-indigo-300">
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
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-200"
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
            onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition"
            title="Toggle Editor Theme"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Auto-save Status */}
          {lastSavedTime && (
            <span className="hidden md:inline-flex items-center space-x-1 text-[11px] text-slate-500">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Draft saved {lastSavedTime}</span>
            </span>
          )}

          {/* Reset Code */}
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

            {isResetConfirmOpen && (
              <div className="absolute right-0 mt-2 w-56 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 space-y-2">
                <p className="text-[11px] text-slate-300 font-medium">
                  Reset code to original starter template? Current edits will be cleared.
                </p>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left (Problem Statement) & Right (Monaco Editor + Console) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL: Problem Specification & Schema Viewer */}
        <div className="w-full md:w-[42%] lg:w-[38%] border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 flex flex-col overflow-hidden">
          {/* Sub-tab Navigation when SQL or schemaDdl is present */}
          {(activeLangKey === 'sql' || schemaDdl) && (
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveProblemTab('problem')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeProblemTab === 'problem'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Problem Statement</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveProblemTab('schema')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeProblemTab === 'schema'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Table Schema (DDL)</span>
              </button>
            </div>
          )}

          {/* Tab 1: Problem Statement View */}
          {activeProblemTab === 'problem' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-slate-300 text-xs custom-scrollbar">
              {/* Instructions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Problem Statement</span>
                </h3>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 shadow-inner">
                  {instructions}
                </div>
              </div>

              {/* Examples */}
              {examples && examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Examples
                  </h3>
                  {examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="text-[10px] font-bold text-indigo-400 uppercase">Example {idx + 1}</div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400 select-none">Input: </span>
                          <span className="text-emerald-300">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 select-none">Output: </span>
                          <span className="text-cyan-300">{ex.output}</span>
                        </div>
                      </div>
                      {ex.explanation && (
                        <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 font-sans">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {constraints && constraints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Constraints & Limits
                  </h3>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                    {constraints.map((c, idx) => (
                      <li key={idx} className="flex items-center space-x-2 bg-slate-900/40 px-2.5 py-1 rounded-md border border-slate-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Function Signature Specification */}
              {functionSignatures && functionSignatures[activeLangKey] && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Required Signature ({currentRuntime.label})
                  </h3>
                  <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                    {functionSignatures[activeLangKey]}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Database Schema (DDL) View */}
          {activeProblemTab === 'schema' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-slate-300 text-xs custom-scrollbar">
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>Database Engine: {DATABASE_ENGINES.find(d => d.id === selectedDbEngine)?.name || 'PostgreSQL'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
                    v{selectedDbVersion}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tables and seed records are provisioned in an isolated in-memory sandbox. Write your query against the catalog structure below.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Schema DDL & Sample Data</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const ddlText = schemaDdl || `-- Default Relational Schema\nCREATE TABLE departments (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL\n);\n\nCREATE TABLE employees (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL,\n    department_id INTEGER,\n    salary INTEGER NOT NULL,\n    status TEXT NOT NULL\n);`;
                      navigator.clipboard.writeText(ddlText);
                      setIsCopiedSchema(true);
                      setTimeout(() => setIsCopiedSchema(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center space-x-1 border border-slate-700"
                  >
                    {isCopiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedSchema ? 'Copied' : 'Copy DDL'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed shadow-inner max-h-[380px]">
                  {schemaDdl || `-- Relational Schema: departments & employees\nCREATE TABLE departments (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL\n);\n\nCREATE TABLE employees (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL,\n    department_id INTEGER,\n    salary INTEGER NOT NULL,\n    status TEXT NOT NULL,\n    FOREIGN KEY (department_id) REFERENCES departments(id)\n);\n\nINSERT INTO departments (id, name) VALUES\n(1, 'Engineering'), (2, 'Sales'), (3, 'Finance');\n\nINSERT INTO employees (id, name, department_id, salary, status) VALUES\n(101, 'Alice Chen', 1, 125000, 'Active'),\n(102, 'Bob Smith', 1, 95000, 'Active'),\n(103, 'Carol Danvers', 1, 140000, 'Active'),\n(104, 'David Miller', 2, 75000, 'Active'),\n(105, 'Emma Wilson', 2, 85000, 'Active'),\n(106, 'Frank Wright', 3, 90000, 'Terminated'),\n(107, 'Grace Hopper', 3, 115000, 'Active');`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Monaco Editor (Top) & Test Runner Console (Bottom) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-[280px] relative overflow-hidden">
            <Editor
              height="100%"
              language={currentRuntime.monacoLang}
              value={code}
              onChange={(val) => onCodeChange && onCodeChange(val || '')}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: isReadOnly,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </div>

          {/* Action Bar (Run Sample Tests & Run Custom Test) */}
          <div className="bg-slate-950 px-4 py-2 border-t border-b border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              {/* Console Tabs */}
              <button
                type="button"
                onClick={() => setActiveConsoleTab('tests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  activeConsoleTab === 'tests'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sample Tests</span>
                {sampleResults && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
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
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Diagnostics & Logs</span>
              </button>
            </div>

            {/* Run Buttons */}
            <div className="flex items-center space-x-2">
              <span className="hidden lg:inline-block text-[10px] text-slate-500 font-mono">
                Shortcut: Ctrl+Enter
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveConsoleTab('tests');
                  onRunSampleTests && onRunSampleTests();
                }}
                disabled={isExecuting || isReadOnly}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isExecuting ? 'Running Sandbox...' : 'Run Sample Tests'}</span>
              </button>
            </div>
          </div>

          {/* BOTTOM DRAWER / CONSOLE */}
          <div
            style={{ height: `${consoleHeight}px` }}
            className="bg-slate-950/95 p-4 overflow-y-auto border-t border-slate-800 text-xs custom-scrollbar"
          >
            {/* TAB 1: Sample Tests Results */}
            {activeConsoleTab === 'tests' && (
              <div className="space-y-3">
                {!sampleResults && !isExecuting && (
                  <div className="py-6 text-center text-slate-500 space-y-1">
                    <Terminal className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                    <p className="font-medium text-xs">No execution results yet</p>
                    <p className="text-[11px]">Click <strong>Run Sample Tests</strong> (or press Ctrl+Enter) to verify against visible sample assertions.</p>
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
                    {/* Summary Telemetry */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold flex items-center space-x-1 ${
                          sampleResults.every(r => r.passed) ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sampleResults.every(r => r.passed) ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{sampleResults.filter(r => r.passed).length}/{sampleResults.length} Sample Tests Passed</span>
                        </span>
                      </div>

                      {executionTelemetry && (
                        <div className="flex items-center space-x-3 text-slate-400 font-mono">
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
                          className={`p-3 rounded-xl border font-mono text-[11px] transition ${
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
                              <span className={tc.passed ? 'text-emerald-300' : 'text-rose-400'}>{tc.actual}</span>
                            </div>
                          )}

                          {tc.error && (
                            <div className="text-[10px] text-rose-400 mt-1.5 p-1.5 rounded bg-rose-950/40 border border-rose-500/20">
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
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center space-x-1"
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
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 resize-none shadow-inner"
                />

                {customResult && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-[11px]">
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

            {/* TAB 3: Execution Output & Diagnostics Console */}
            {activeConsoleTab === 'console' && (
              <div className="font-mono text-[11px] leading-relaxed space-y-1">
                <div className="text-slate-500 pb-1 border-b border-slate-800 text-[10px] flex items-center justify-between">
                  <span>SANDBOX STDOUT / STDERR STREAM</span>
                  <span>{currentRuntime.version}</span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap">
                  {consoleOutput || '> Sandbox initialized. Ready for code execution.'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
