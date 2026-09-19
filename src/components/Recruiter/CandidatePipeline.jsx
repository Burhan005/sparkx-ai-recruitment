import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import CandidateScorecardModal from './CandidateScorecardModal';
import JobCreatorModal from './JobCreatorModal';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function CandidatePipeline() {
  const { 
    candidates, 
    jobs, 
    activeJob, 
    setActiveJobId, 
    selectedCandidate, 
    setSelectedCandidate,
    updateCandidateStatus,
    setCurrentView
  } = useRecruitment();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All | Evaluated | Shortlisted | High Risk
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          c.education.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'All') return true;
    if (filterStatus === 'Evaluated') return c.status === 'Evaluated';
    if (filterStatus === 'Shortlisted') return c.finalDecision === 'Shortlisted';
    if (filterStatus === 'High Risk') return c.integrityRisk === 'High';
    return true;
  });

  const totalApplicants = candidates.length;
  const highMatchCount = candidates.filter(c => c.matchScore >= 85).length;
  const integrityFlaggedCount = candidates.filter(c => c.integrityRisk === 'High').length;
  const evaluatedCount = candidates.filter(c => c.status === 'Evaluated').length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner / Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Recruiter Command Center
            </span>
            <span className="text-xs text-slate-500">Live AI Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            Intelligent Talent Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated screening, adaptive cross-examination dossiers, and integrity verification.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('interview')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-200 text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Test Live AI Interview</span>
          </button>
          
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">{totalApplicants}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>Across</span>
            <span className="text-indigo-400 font-medium">{jobs.length} active roles</span>
          </div>
        </div>

        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Evaluated</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{evaluatedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>Interviews Completed</span>
          </div>
        </div>

        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">High Match (&gt;85%)</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2">{highMatchCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>Strong Job-Fit Candidates</span>
          </div>
        </div>

        <div className="glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Integrity Anomalies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">{integrityFlaggedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>Anti-Cheating Flags Triggered</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, skill, university..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'All', label: 'All Candidates' },
            { id: 'Evaluated', label: 'AI Evaluated' },
            { id: 'Shortlisted', label: 'Shortlisted' },
            { id: 'High Risk', label: '⚠️ High Risk Flags' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* Candidate Pipeline List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No candidates match this criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filters.</p>
          </div>
        ) : (
          filteredCandidates.map((cand) => {
            const hasFraudFlags = cand.fraudFlags && cand.fraudFlags.length > 0;
            const isHighRisk = cand.integrityRisk === 'High';

            return (
              <div
                key={cand.id}
                className="glass-card-hover p-5 sm:p-6 rounded-2xl transition-all duration-200 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-black text-white text-lg border border-slate-700 shadow-inner">
                    {cand.name.charAt(0)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white hover:text-indigo-300 cursor-pointer transition" onClick={() => setSelectedCandidate(cand)}>
                        {cand.name}
                      </h3>

                      {/* Integrity Pill */}
                      {isHighRisk ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Integrity Flag ({cand.integrityScore}/100)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified ({cand.integrityScore}/100)</span>
                        </span>
                      )}

                      {/* Status pill */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cand.finalDecision === 'Shortlisted'
                          ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                          : cand.finalDecision === 'Rejected'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {cand.finalDecision || cand.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>{cand.education}</span>
                      <span>•</span>
                      <span>{cand.experienceYears} Years Exp</span>
                      <span>•</span>
                      <span className="text-slate-500">Applied {cand.appliedDate}</span>
                    </p>

                    {/* Resume Summary snippet */}
                    <p className="text-xs text-slate-300 line-clamp-1 max-w-2xl pt-0.5">
                      {cand.resumeSummary}
                    </p>

                    {/* Fraud flags warning if any */}
                    {hasFraudFlags && (
                      <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">Inconsistency: {cand.fraudFlags[0]}</span>
                      </div>
                    )}

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {cand.skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-800">
                          {skill}
                        </span>
                      ))}
                      {cand.skills.length > 5 && (
                        <span className="text-[11px] text-slate-500 self-center">+{cand.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Score Metrics & CTA */}
                <div className="flex items-center justify-between lg:justify-end space-x-6 border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
                  
                  {/* Scores */}
                  <div className="flex items-center space-x-5">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Match</span>
                      <div className="text-lg font-black text-white">{cand.matchScore}%</div>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">AI Score</span>
                      <div className={`text-lg font-black ${
                        cand.scores?.overall >= 80 ? 'text-emerald-400' : cand.scores?.overall >= 60 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {cand.scores?.overall > 0 ? `${cand.scores.overall}/100` : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedCandidate(cand)}
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Candidate Scorecard Modal */}
      {selectedCandidate && (
        <CandidateScorecardModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {/* Job Creator Modal */}
      <JobCreatorModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
      />

    </div>
  );
}
