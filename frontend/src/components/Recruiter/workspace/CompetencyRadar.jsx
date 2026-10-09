import React, { useState, useMemo } from 'react';
import { Target, CheckCircle2, TrendingUp, Info, Table, Layers, ArrowUpRight, AlertCircle, Sparkles } from 'lucide-react';

/**
 * CompetencyRadar
 * 
 * Interactive 6-axis SVG radar mesh comparing candidate evaluation
 * metrics against job benchmark requirements.
 * Vertical-stacked responsive architecture designed specifically for 5-col workspace grids.
 * High-contrast dark mode, interactive vertex hover, tactile micro-interactions, accessible table fallback.
 */
export default function CompetencyRadar({ candidate, job }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showTableFallback, setShowTableFallback] = useState(false);

  // Compute 6 grounded competency metrics from candidate records
  const axes = useMemo(() => {
    if (!candidate) return [];

    const scores = candidate.scores || {};
    const evalData = candidate.evaluation || {};

    // Authoritative raw metrics (strictly null/undefined if not evaluated)
    const rawMatch = candidate.matchScore ?? candidate.match_score ?? null;
    const rawExp = candidate.experienceYears ?? candidate.experience_years ?? 0;
    const rawIntegrity = candidate.integrityScore ?? candidate.integrity_score ?? null;

    // Technical & coding scores
    const rawTechnical = candidate.coding_score ?? candidate.codingScore ?? scores.technicalScore ?? scores.overall ?? null;
    const rawTroubleshooting = scores.troubleshootingScore ?? scores.troubleshooting ?? null;
    const rawArchitecture = evalData.systemDesignScore ?? scores.scenarioScore ?? scores.scenario ?? null;
    const rawCommunication = evalData.communicationScore ?? scores.communicationScore ?? scores.communication ?? null;

    return [
      {
        key: 'arch',
        label: 'System Design',
        shortLabel: 'Arch',
        evaluated: rawArchitecture !== null && rawArchitecture !== undefined,
        score: rawArchitecture !== null && rawArchitecture !== undefined ? Math.min(100, Math.max(0, Number(rawArchitecture))) : 0,
        benchmark: 80,
        description: 'Microservice design, high-availability architecture, schema modeling',
        evidence: rawArchitecture !== null && rawArchitecture !== undefined
          ? `Scenario score: ${Number(rawArchitecture)}%`
          : 'Pending Evaluation — Architecture scenario unevaluated'
      },
      {
        key: 'correctness',
        label: 'Code Correctness',
        shortLabel: 'Code',
        evaluated: rawTechnical !== null && rawTechnical !== undefined,
        score: rawTechnical !== null && rawTechnical !== undefined ? Math.min(100, Math.max(0, Number(rawTechnical))) : 0,
        benchmark: 85,
        description: 'Automated test suite passing rate, edge cases, error resilience',
        evidence: rawTechnical !== null && rawTechnical !== undefined
          ? (candidate.passed_test_cases != null && candidate.total_test_cases != null
              ? `Test pass rate: ${Number(rawTechnical)}% (${candidate.passed_test_cases}/${candidate.total_test_cases} passed)`
              : `Code score: ${Number(rawTechnical)}%`)
          : 'Pending Evaluation — Code assessment unevaluated'
      },
      {
        key: 'troubleshooting',
        label: 'Troubleshooting',
        shortLabel: 'Debug',
        evaluated: rawTroubleshooting !== null && rawTroubleshooting !== undefined,
        score: rawTroubleshooting !== null && rawTroubleshooting !== undefined ? Math.min(100, Math.max(0, Number(rawTroubleshooting))) : 0,
        benchmark: 75,
        description: 'Root cause isolation, log inspection, performance regression debugging',
        evidence: rawTroubleshooting !== null && rawTroubleshooting !== undefined
          ? `Diagnostic score: ${Number(rawTroubleshooting)}%`
          : 'Pending Evaluation — Troubleshooting unevaluated'
      },
      {
        key: 'domain',
        label: 'Domain Depth',
        shortLabel: 'Domain',
        evaluated: rawMatch !== null && rawMatch !== undefined,
        score: rawMatch !== null && rawMatch !== undefined ? Math.min(100, Math.max(0, Number(rawMatch))) : 0,
        benchmark: 78,
        description: 'Specialized framework proficiency and production toolchain depth',
        evidence: rawMatch !== null && rawMatch !== undefined
          ? `Algorithmic match: ${Number(rawMatch)}% (${rawExp} yrs relevant experience)`
          : 'Pending Evaluation — Resume match unevaluated'
      },
      {
        key: 'comms',
        label: 'Communication',
        shortLabel: 'Comms',
        evaluated: rawCommunication !== null && rawCommunication !== undefined,
        score: rawCommunication !== null && rawCommunication !== undefined ? Math.min(100, Math.max(0, Number(rawCommunication))) : 0,
        benchmark: 75,
        description: 'Technical synthesis, concise reasoning, architectural documentation',
        evidence: rawCommunication !== null && rawCommunication !== undefined
          ? `Interview transcript score: ${Number(rawCommunication)}%`
          : 'Pending Evaluation — Interview communication unevaluated'
      },
      {
        key: 'reliability',
        label: 'Integrity & SRE',
        shortLabel: 'Reliability',
        evaluated: rawIntegrity !== null && rawIntegrity !== undefined,
        score: rawIntegrity !== null && rawIntegrity !== undefined ? Math.min(100, Math.max(0, Number(rawIntegrity))) : 0,
        benchmark: 90,
        description: 'Proctor telemetry confidence, environment security, and operational consistency',
        evidence: rawIntegrity !== null && rawIntegrity !== undefined
          ? `${Number(rawIntegrity)}% integrity verification index`
          : 'Pending Evaluation — Proctoring telemetry unevaluated'
      },
    ];
  }, [candidate]);

  // Derived summary signals for evaluated telemetry state
  const evaluatedAxes = useMemo(() => {
    return axes.filter(a => a.evaluated);
  }, [axes]);

  const strongestAxis = useMemo(() => {
    if (!evaluatedAxes.length) return null;
    return [...evaluatedAxes].sort((a, b) => b.score - a.score)[0];
  }, [evaluatedAxes]);

  const gapAxis = useMemo(() => {
    if (!evaluatedAxes.length) return null;
    // Find axis with largest deficit vs benchmark
    const sorted = [...evaluatedAxes].sort((a, b) => (a.score - a.benchmark) - (b.score - b.benchmark));
    const cand = sorted[0];
    if (strongestAxis && cand.key === strongestAxis.key && sorted.length > 1) {
      return sorted[1];
    }
    return cand;
  }, [evaluatedAxes, strongestAxis]);

  const avgScore = useMemo(() => {
    if (!evaluatedAxes.length) return null;
    return Math.round(evaluatedAxes.reduce((acc, ax) => acc + ax.score, 0) / evaluatedAxes.length);
  }, [evaluatedAxes]);

  if (!candidate || axes.length === 0) return null;

  // Geometry configuration for SVG radar
  const size = 320;
  const center = size / 2; // 160
  const radius = 86;
  const numAxes = axes.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // 12 o'clock

  // Point calculation helper
  const getCoordinates = (value, index) => {
    const angle = startAngle + index * angleStep;
    const distance = (value / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle)
    };
  };

  // Label placement helper with directional offsets to prevent boundary clipping
  const getLabelCoordinates = (index) => {
    const angle = startAngle + index * angleStep;
    const distance = radius + 25; // 111px
    const rawX = center + distance * Math.cos(angle);
    const rawY = center + distance * Math.sin(angle);
    
    let anchor = 'middle';
    let offsetX = 0;
    let offsetY = 4;

    if (Math.abs(Math.cos(angle)) < 0.15) {
      anchor = 'middle';
      offsetY = Math.sin(angle) < 0 ? -4 : 14;
    } else if (Math.cos(angle) > 0) {
      anchor = 'start';
      offsetX = 6;
      offsetY = 3;
    } else {
      anchor = 'end';
      offsetX = -6;
      offsetY = 3;
    }

    return {
      x: rawX + offsetX,
      y: rawY + offsetY,
      anchor
    };
  };

  // Concentric polygon web rings (20, 40, 60, 80, 100)
  const rings = [20, 40, 60, 80, 100];

  const getRingPoints = (ringValue) => {
    return axes
      .map((_, i) => {
        const { x, y } = getCoordinates(ringValue, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Candidate polygon points
  const candidatePolygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.score, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Benchmark polygon points
  const benchmarkPolygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.benchmark, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const currentHovered = hoveredIndex !== null ? axes[hoveredIndex] : null;

  return (
    <div className="rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] p-4 sm:p-5 shadow-card space-y-4 select-none transition-all duration-200 hover:border-stone-300 dark:hover:border-stone-700 animate-fade-in-up">
      
      {/* ── Card Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-[#2A2520]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300 shrink-0 shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 flex-wrap">
              <span className="whitespace-nowrap">Competency Mesh</span>
              <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                6-Axis
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Candidate evaluation vs position target baseline
            </p>
          </div>
        </div>

        {/* Legend & Table Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 ring-2 ring-brand-500/20" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold text-[10px]">Candidate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-dashed border-slate-400 dark:border-slate-500 bg-slate-300/40 dark:bg-slate-700/40" />
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Benchmark</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTableFallback(prev => !prev)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            title={showTableFallback ? "Show interactive radar mesh" : "Show accessible data table"}
            aria-label="Toggle accessible radar data table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTableFallback ? (
        /* Accessible Table Fallback */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase">
                <th className="py-2 px-2 font-bold">Competency Axis</th>
                <th className="py-2 px-2 text-right font-bold">Candidate Score</th>
                <th className="py-2 px-2 text-right font-bold">Job Benchmark</th>
                <th className="py-2 px-2 text-right font-bold">Delta</th>
                <th className="py-2 px-2 font-bold">Grounding Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {axes.map(axis => {
                const delta = axis.evaluated ? axis.score - axis.benchmark : null;
                return (
                  <tr key={axis.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-2 font-semibold text-slate-900 dark:text-white">
                      {axis.label}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                      {axis.evaluated ? `${axis.score}%` : <span className="text-slate-400 dark:text-slate-500 italic font-normal">Unevaluated</span>}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                      {axis.benchmark}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold">
                      {axis.evaluated && delta !== null ? (
                        <span className={delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          {delta >= 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 text-[11px]">
                      {axis.evidence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vertical Stacked Layout: Centered SVG Canvas on Top, Full-Width Telemetry Below */
        <div className="flex flex-col items-center gap-4 w-full">
          
          {/* ── 1. Centered SVG Radar Canvas ── */}
          <div className="w-full flex items-center justify-center py-1">
            <svg
              viewBox="0 0 320 295"
              className="w-full max-w-[310px] h-auto select-none animate-radar-draw"
              role="img"
              aria-label="Candidate competency radar visualization"
            >
              <defs>
                {/* Cobalt gradient for candidate polygon */}
                <radialGradient id="radarCandidateGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4F6BFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3851E0" stopOpacity="0.12" />
                </radialGradient>

                {/* Glow filter for active vertex */}
                <filter id="vertexGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4F6BFF" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Background Concentric Polygon Rings */}
              {rings.map((ringVal) => (
                <polygon
                  key={ringVal}
                  points={getRingPoints(ringVal)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray={ringVal === 100 ? 'none' : '3 3'}
                  className="text-slate-200 dark:text-slate-800"
                />
              ))}

              {/* Radial Spoke Lines */}
              {axes.map((_, i) => {
                const { x, y } = getCoordinates(100, i);
                const isHovered = hoveredIndex === i;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke={isHovered ? "#4F6BFF" : "currentColor"}
                    strokeWidth={isHovered ? "1.5" : "1"}
                    className={isHovered ? "" : "text-slate-200 dark:text-slate-800 transition-colors"}
                  />
                );
              })}

              {/* Benchmark Target Polygon (Dashed outline) */}
              <polygon
                points={benchmarkPolygonPoints}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-80 dark:opacity-60"
              />

              {/* Candidate Actual Polygon (Animated Smooth Fill) */}
              <polygon
                points={candidatePolygonPoints}
                fill="url(#radarCandidateGradient)"
                stroke="#4F6BFF"
                strokeWidth="2.5"
                style={{ transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {/* Interactive Vertices & Labels */}
              {axes.map((axis, i) => {
                const { x: cx, y: cy } = getCoordinates(axis.score, i);
                const { x: lx, y: ly, anchor } = getLabelCoordinates(i);
                const isHovered = hoveredIndex === i;

                return (
                  <g key={axis.key} className="cursor-pointer">
                    {/* Hover trigger zone */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />

                    {/* Outer pulse ring on hover */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="11"
                        fill="#4F6BFF"
                        opacity="0.25"
                        filter="url(#vertexGlow)"
                      />
                    )}

                    {/* Visible vertex dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#4F6BFF"
                      strokeWidth="2"
                      style={{ transition: 'all 150ms ease' }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />

                    {/* Outer Short Label with Contrast Classes */}
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchor}
                      dominantBaseline="central"
                      className={`text-[10px] font-mono transition-colors font-bold ${
                        isHovered 
                          ? 'fill-brand-600 dark:fill-brand-400 font-extrabold' 
                          : 'fill-slate-600 dark:fill-slate-300'
                      }`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {axis.shortLabel} {axis.evaluated ? `(${axis.score}%)` : '(—)'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── 2. Full-Width Telemetry & Evidence Inspector (Cleanly Below Radar) ── */}
          <div className="w-full p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#0A0D16] border border-slate-200/90 dark:border-slate-800 space-y-2.5 text-xs transition-all">
            {currentHovered ? (
              /* Active Hovered Telemetry State */
              <div className="space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {currentHovered.label}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                    !currentHovered.evaluated
                      ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                      : currentHovered.score >= currentHovered.benchmark 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {!currentHovered.evaluated ? 'Pending Evaluation' : currentHovered.score >= currentHovered.benchmark ? 'Meets Baseline' : 'Focus Area'}
                  </span>
                </div>

                {/* Comparative Progress Meter */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Candidate: <strong className="text-brand-600 dark:text-brand-400 font-bold">{currentHovered.evaluated ? `${currentHovered.score}%` : 'Unevaluated'}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Target: <strong className="text-slate-700 dark:text-slate-200">{currentHovered.benchmark}%</strong>
                    </span>
                  </div>
                  
                  {/* Visual Bar Comparison */}
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative">
                    {/* Benchmark marker line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-500 dark:bg-slate-400 z-10" 
                      style={{ left: `${currentHovered.benchmark}%` }} 
                      title={`Target Baseline: ${currentHovered.benchmark}%`}
                    />
                    {/* Candidate score fill */}
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-amber-500 transition-all duration-300"
                      style={{ width: `${currentHovered.evaluated ? currentHovered.score : 0}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentHovered.description}
                </p>

                {/* Grounding signal quote */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <Info className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                  <span className="truncate">{currentHovered.evidence}</span>
                </div>
              </div>
            ) : (
              /* Idle Informative Telemetry State */
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    <span>Real-Time Grounding Telemetry</span>
                  </span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                    {avgScore !== null ? `${avgScore}% Avg` : 'Pending Evaluation'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Hover any radar vertex above to inspect candidate evidence, evaluation logs, and target deltas.
                </p>

                {/* Quick Signal Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/70 dark:border-[#2A2520]">
                  <div className="p-2 rounded-lg bg-[#FDFCFA] dark:bg-[#14110F] border border-[#E5E0DA] dark:border-[#2A2520]">
                    <span className="text-[9px] font-mono uppercase text-stone-500 dark:text-stone-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Top Strength
                    </span>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate block mt-0.5 font-mono">
                      {strongestAxis ? (
                        <>
                          {strongestAxis.shortLabel} <span className="text-emerald-600 dark:text-emerald-400 font-bold">({strongestAxis.score}%)</span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Pending evaluation</span>
                      )}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#FDFCFA] dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                    <span className="text-[9px] font-mono uppercase text-stone-500 dark:text-stone-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {gapAxis ? ((gapAxis.score < gapAxis.benchmark) ? 'Skill Gap' : 'Growth Area') : 'Skill Gap'}
                    </span>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate block mt-0.5 font-mono">
                      {gapAxis ? (
                        <>
                          {gapAxis.shortLabel} <span className="text-amber-600 dark:text-amber-400 font-bold">({gapAxis.score}%)</span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Pending evaluation</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
