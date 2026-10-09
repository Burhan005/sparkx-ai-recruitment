import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Code2, 
  Video, 
  Terminal, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  ArrowLeft,
  Sparkles,
  Layers,
  TrendingUp,
  Briefcase,
  HelpCircle,
  FileCheck2,
  Check,
  UserCheck
} from 'lucide-react';
import { Card, Badge, Progress, Button } from '../ui/Primitives';
import api from '../../services/api';
import { useRecruitment } from '../../context/RecruitmentContext';

export default function SkillPassportView() {
  const { candidateId: routeCandidateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, currentUser } = useRecruitment();

  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | VERIFIED | EVIDENCED | CLAIMED
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedSkillIds, setExpandedSkillIds] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Recruiter verification modal state
  const [verifyingSkill, setVerifyingSkill] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyScore, setVerifyScore] = useState(100);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const fetchPassport = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let data = null;
      if (routeCandidateId) {
        data = await api.getCandidateSkillPassport(routeCandidateId);
      } else {
        // Candidate viewing their own passport
        data = await api.getMySkillPassport();
      }
      setPassport(data);
    } catch (err) {
      console.warn('[SkillPassportView] Fetch failed:', err);
      setError(err.message || 'Unable to load Verified Skill Passport.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [routeCandidateId]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const toggleExpand = useCallback((skillId) => {
    setExpandedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!passport?.skills) return;
    setExpandedSkillIds(new Set(passport.skills.map(s => s.candidate_skill_id)));
  }, [passport]);

  const collapseAll = useCallback(() => {
    setExpandedSkillIds(new Set());
  }, []);

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!verifyingSkill || !passport?.candidate_id) return;
    setVerifyLoading(true);
    try {
      await api.verifyCandidateSkillManually(
        passport.candidate_id,
        verifyingSkill.candidate_skill_id,
        { notes: verifyNotes, score: Number(verifyScore) }
      );
      setVerifyingSkill(null);
      setVerifyNotes('');
      setVerifyScore(100);
      await fetchPassport(true);
    } catch (err) {
      alert(`Manual verification failed: ${err.message}`);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Filter skills deterministically
  const filteredSkills = useMemo(() => {
    if (!passport?.skills) return [];
    return passport.skills.filter(s => {
      // Search
      const matchesSearch = !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status
      const matchesStatus = statusFilter === 'ALL' || s.verification_status === statusFilter;

      // Category
      const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [passport, searchQuery, statusFilter, categoryFilter]);

  const distinctCategories = useMemo(() => {
    if (!passport?.categories) return [];
    return passport.categories.map(c => c.category);
  }, [passport]);

  const getSourceIcon = (type) => {
    switch (type) {
      case 'coding_submission':
        return <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'mcq_submission':
        return <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'interview':
        return <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'assessment':
        return <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'recruiter_verification':
        return <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'resume':
      default:
        return <FileText className="w-4 h-4 text-stone-500 dark:text-stone-400" />;
    }
  };

  const getStrengthBadge = (strength) => {
    switch (strength) {
      case 'STRONG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Strong Evidence
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            Moderate Evidence
          </span>
        );
      case 'SUPPORTING':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-stone-200 dark:bg-[#33251E] text-stone-600 dark:text-[#BAACA1] border border-stone-300 dark:border-[#4B372A]">
            Supporting Claim
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
        <p className="text-sm text-stone-500 dark:text-stone-400 font-mono">
          Assembling authoritative Verified Skill Passport...
        </p>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <Card className="p-8 text-center space-y-4 border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Skill Passport Unavailable
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto">
            {error || 'No candidate record found with active skills.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="primary" onClick={() => fetchPassport()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* ─── PASSPORT HEADER & CANDIDATE IDENTITY ─── */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                ARETE Verified Identity
              </span>
              <span className="text-xs text-stone-400 font-mono">
                EEOC & SOC2 Certified • Evidence-Backed
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {passport.candidate_name}'s Skill Passport
            </h1>

            <p className="text-sm text-stone-300 flex items-center gap-2 flex-wrap">
              <Briefcase className="w-4 h-4 text-stone-400" />
              <span>Target Role: <strong className="text-white">{passport.job_title || 'General Application'}</strong></span>
              {passport.applied_date && (
                <>
                  <span className="text-stone-500">•</span>
                  <span className="text-stone-400">Applied {passport.applied_date}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
                <span className="font-mono uppercase font-bold">Verification Index</span>
                <span className="font-bold text-emerald-400">{passport.verification_rate}%</span>
              </div>
              <Progress value={passport.verification_rate} variant="primary" className="h-2" />
              <div className="text-[11px] text-stone-400 mt-2 font-mono">
                {passport.verified_skills_count} of {passport.total_skills} skills verified with authentic evidence
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => fetchPassport(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync Evidence
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 4 CORE METRIC CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Skills */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Skills</span>
            <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {passport.total_skills}
            </span>
            <span className="text-xs text-stone-500 font-mono">in passport</span>
          </div>
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Across {passport.categories?.length || 0} technical domains
          </div>
        </Card>

        {/* Verified Skills */}
        <Card className="p-5 flex flex-col justify-between border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Verified Skills</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {passport.verified_skills_count}
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-mono">
              ({passport.verification_rate}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Pass score ≥ 70% in coding/interview
          </div>
        </Card>

        {/* Evidenced Skills */}
        <Card className="p-5 flex flex-col justify-between border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Evidenced Skills</span>
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {passport.evidenced_skills_count}
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-mono">preliminary</span>
          </div>
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Has platform data; pending mastery
          </div>
        </Card>

        {/* Claimed (Self-Reported) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Claimed Only</span>
            <HelpCircle className="w-4 h-4 text-stone-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-stone-600 dark:text-stone-300">
              {passport.claimed_skills_count}
            </span>
            <span className="text-xs text-stone-500 font-mono">unsubstantiated</span>
          </div>
          <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Self-reported with zero test records
          </div>
        </Card>
      </div>

      {/* ─── CONTROLS: SEARCH, TABS & CATEGORIES ─── */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-[#1A1410] rounded-xl border border-stone-200 dark:border-[#38281F] overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-[#2B1F17] text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-stone-600 dark:text-[#A8988B] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({passport.total_skills})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified ({passport.verified_skills_count})
            </button>
            <button
              onClick={() => setStatusFilter('EVIDENCED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'EVIDENCED'
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Evidenced ({passport.evidenced_skills_count})
            </button>
            <button
              onClick={() => setStatusFilter('CLAIMED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'CLAIMED'
                  ? 'bg-stone-700 text-white shadow-sm font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              Claimed Only ({passport.claimed_skills_count})
            </button>
          </div>

          {/* Search & Domain Filter */}
          <div className="flex items-center gap-3 flex-1 lg:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search skill or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-[#14100D] border border-stone-200 dark:border-[#38281F] rounded-lg text-slate-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {distinctCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-stone-50 dark:bg-[#14100D] border border-stone-200 dark:border-[#38281F] rounded-lg text-slate-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Categories</option>
                {distinctCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-800 pl-3">
              <button
                onClick={expandAll}
                className="p-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
                title="Expand all evidence drawers"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={collapseAll}
                className="p-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
                title="Collapse all"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── SKILL PASSPORT LIST ─── */}
      <div className="space-y-4">
        {filteredSkills.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching skills found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try clearing search filters or selecting another verification status.'
                : 'No skills recorded in this passport yet. Complete an application or assessment to generate skill records.'}
            </p>
          </Card>
        ) : (
          filteredSkills.map((skill) => {
            const isExpanded = expandedSkillIds.has(skill.candidate_skill_id);
            const isVerified = skill.verification_status === 'VERIFIED';
            const isEvidenced = skill.verification_status === 'EVIDENCED';

            return (
              <Card 
                key={skill.candidate_skill_id}
                className={`overflow-hidden transition-all duration-200 border ${
                  isVerified 
                    ? 'border-emerald-500/30 hover:border-emerald-500/60 dark:bg-[#121815]/30' 
                    : isEvidenced
                    ? 'border-amber-500/30 hover:border-amber-500/60 dark:bg-[#181512]/30'
                    : 'border-stone-200 dark:border-[#2B1F17] hover:border-stone-300'
                }`}
              >
                {/* Skill Summary Row */}
                <div 
                  onClick={() => toggleExpand(skill.candidate_skill_id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 dark:hover:bg-[#1A1410]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Badge Icon */}
                    <div className={`p-2.5 rounded-xl border mt-0.5 ${
                      isVerified 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                        : isEvidenced
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        : 'bg-stone-100 dark:bg-[#2B1F17] border-stone-200 dark:border-[#38281F] text-stone-500'
                    }`}>
                      {isVerified ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : isEvidenced ? (
                        <Activity className="w-5 h-5" />
                      ) : (
                        <HelpCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {skill.name}
                        </h3>
                        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-[#251A14] px-2 py-0.5 rounded border border-stone-200 dark:border-[#38281F]">
                          {skill.category}
                        </span>

                        {/* Status Label Pill */}
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isVerified
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : isEvidenced
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-stone-200 dark:bg-[#33251E] text-stone-600 dark:text-[#BAACA1] border-stone-300 dark:border-[#4B372A]'
                        }`}>
                          {skill.verification_status}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                        {skill.summary_explanation}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400 pt-1 flex-wrap font-mono">
                        <span>Proficiency: <strong className="text-slate-800 dark:text-stone-200 capitalize">{skill.proficiency_level}</strong></span>
                        {skill.years_experience > 0 && (
                          <span>Experience: <strong className="text-slate-800 dark:text-stone-200">{skill.years_experience} yrs</strong></span>
                        )}
                        <span>Latest: <strong className="text-slate-800 dark:text-stone-200">{skill.recency_label}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Stats & Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      {skill.verified_score !== null && skill.verified_score !== undefined && (
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {Math.round(skill.verified_score)}%
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-stone-400">
                        {skill.evidence_count} evidence record{skill.evidence_count === 1 ? '' : 's'}
                      </div>
                    </div>

                    {userRole === 'recruiter' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVerifyingSkill(skill);
                          setVerifyNotes(`Verified competency in ${skill.name}`);
                          setVerifyScore(100);
                        }}
                        className="text-xs py-1 px-2.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />
                        Verify
                      </Button>
                    )}

                    <div className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* ─── EXPANDABLE EVIDENCE DOSSIER ─── */}
                {isExpanded && (
                  <div className="border-t border-stone-200 dark:border-[#2B1F17] bg-stone-50/50 dark:bg-[#0E0B09]/80 p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        Platform Evidence Audit Trail ({skill.evidence_count})
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        Immutable Relational Records
                      </span>
                    </div>

                    {skill.evidence.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-[#38281F] bg-white/50 dark:bg-[#1A1410]/50 text-center space-y-2">
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          No verified platform evidence available for this skill.
                        </p>
                        {userRole === 'candidate' && (
                          <div className="pt-1">
                            <Button 
                              size="sm" 
                              variant="primary" 
                              onClick={() => navigate('/assessment')}
                              className="text-xs py-1"
                            >
                              Launch Assessment Sandbox
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {skill.evidence.map((ev) => (
                          <div 
                            key={ev.id}
                            className="p-3.5 rounded-xl border border-stone-200/80 dark:border-[#33251E] bg-white dark:bg-[#14100D] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-stone-100 dark:bg-[#251A14] border border-stone-200 dark:border-[#38281F] mt-0.5">
                                {getSourceIcon(ev.evidence_type)}
                              </div>

                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {ev.source_title}
                                  </h4>
                                  {getStrengthBadge(ev.evidence_strength)}
                                  <span className="text-[10px] font-mono text-stone-400">
                                    ID: {ev.id}
                                  </span>
                                </div>

                                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                                  {ev.snippet || 'Assessment item evaluated and passed.'}
                                </p>

                                <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 pt-0.5">
                                  <span>Type: <strong className="text-stone-600 dark:text-stone-300 capitalize">{ev.evidence_type.replace('_', ' ')}</strong></span>
                                  {ev.created_at && (
                                    <span>Recorded: <strong className="text-stone-600 dark:text-stone-300">{ev.recency_label}</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Score & verification mark */}
                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-stone-100 dark:border-[#251A14]">
                              {ev.score_contribution !== null && ev.score_contribution !== undefined && (
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                  ev.score_contribution >= 70 
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-stone-100 dark:bg-[#251A14] text-stone-700 dark:text-stone-300'
                                }`}>
                                  +{Math.round(ev.score_contribution)} pts
                                </span>
                              )}
                              {ev.is_verified_source && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-1">
                                  <Check className="w-3 h-3" /> Meets threshold
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ─── RECRUITER VERIFICATION MODAL ─── */}
      {verifyingSkill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 border-stone-300 dark:border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                Verify Competency: {verifyingSkill.name}
              </h3>
              <button 
                onClick={() => setVerifyingSkill(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualVerify} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Verification Notes / Evidence Summary
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Evaluated live technical architecture exercise and reviewed portfolio work."
                  className="w-full p-2.5 text-xs bg-stone-50 dark:bg-[#1A1410] border border-stone-200 dark:border-[#38281F] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Verified Score (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={verifyScore}
                  onChange={(e) => setVerifyScore(e.target.value)}
                  className="w-full p-2 text-xs bg-stone-50 dark:bg-[#1A1410] border border-stone-200 dark:border-[#38281F] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setVerifyingSkill(null)}
                  disabled={verifyLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={verifyLoading}
                >
                  {verifyLoading ? 'Saving...' : 'Authorize Verification'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

// Inline fallback icon for Activity
function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
