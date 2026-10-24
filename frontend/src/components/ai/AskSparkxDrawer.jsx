import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Award,
  Database, 
  TrendingUp, 
  FileText, 
  Code2, 
  MessageSquare,
  ArrowRight,
  Layers,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  Users,
  Target
} from 'lucide-react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { normalizeWorkflow } from '../../utils/workflowContract';
import api from '../../services/api';

/**
 * FormattedMarkdownText — Rich Markdown Renderer
 * Parses **bold**, `inline code`, bullet lists, and currency/percent highlights
 * into semantic React JSX, eliminating raw markdown asterisks.
 */
function FormattedMarkdownText({ content, className = '' }) {
  if (!content) return null;

  const lines = String(content).split('\n');

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const textToParse = isBullet ? trimmed.replace(/^([•\-\*]\s*)/, '') : trimmed;

        const parts = [];
        const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
        let lastIdx = 0;
        let match;
        let pKey = 0;

        while ((match = regex.exec(textToParse)) !== null) {
          if (match.index > lastIdx) {
            parts.push(<span key={pKey++}>{textToParse.substring(lastIdx, match.index)}</span>);
          }
          const matchedStr = match[0];
          if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
            const inner = matchedStr.slice(2, -2);
            parts.push(
              <strong key={pKey++} className="font-bold text-stone-900 dark:text-stone-100">
                {inner}
              </strong>
            );
          } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
            const inner = matchedStr.slice(1, -1);
            parts.push(
              <code key={pKey++} className="px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-[#2A2520] text-brand-700 dark:text-brand-300 font-mono text-[10.5px]">
                {inner}
              </code>
            );
          }
          lastIdx = regex.lastIndex;
        }

        if (lastIdx < textToParse.length) {
          parts.push(<span key={pKey++}>{textToParse.substring(lastIdx)}</span>);
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <span className="text-brand-500 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1">{parts}</div>
            </div>
          );
        }

        return (
          <div key={lineIdx} className="leading-relaxed">
            {parts}
          </div>
        );
      })}
    </div>
  );
}

export default function AskSparkxDrawer({
  isOpen,
  onClose,
  initialContextCandidate = null,
  initialContextJob = null,
  candidateContext = null
}) {
  const effectiveInitCand = initialContextCandidate || candidateContext;
  const { 
    candidates = [], 
    jobs = [], 
    currentUser, 
    userRole = 'recruiter', 
    myApplications = [] 
  } = useRecruitment();
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Active Context
  const [contextCandidate, setContextCandidate] = useState(effectiveInitCand);
  const [contextJob, setContextJob] = useState(initialContextJob);
  const contextCandidateRef = useRef(effectiveInitCand);

  useEffect(() => {
    const nextCand = initialContextCandidate || candidateContext;
    if (nextCand) {
      setContextCandidate(nextCand);
      contextCandidateRef.current = nextCand;
    }
    if (initialContextJob) setContextJob(initialContextJob);
  }, [initialContextCandidate, initialContextJob, candidateContext]);

  useEffect(() => {
    contextCandidateRef.current = contextCandidate;
  }, [contextCandidate]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (conversation.length === 0) {
        // Welcome greeting with context
        const candName = contextCandidate ? contextCandidate.name : null;
        if (userRole === 'candidate') {
          setConversation([
            {
              id: 'init-0',
              sender: 'ai',
              text: `Hello ${currentUser?.name || ''}! I am **ARETE Copilot**, your AI career advisor. Ask me about the status of your applications, interview preparation points, or role requirements.`,
              facts: [
                `Logged in as: ${currentUser?.name || 'Candidate'} (${currentUser?.email || ''})`,
                `Active Applications: ${myApplications?.length || 0}`
              ]
            }
          ]);
        } else {
          setConversation([
            {
              id: 'init-0',
              sender: 'ai',
              text: candName
                ? `Hello! I have active context loaded for **${candName}** (${contextCandidate.jobTitle || 'Candidate'}). Ask me to analyze their skills, summarize assessment code, evaluate interview responses, or check for hiring flags.`
                : `Hello! I am **ARETE Copilot**, your talent intelligence copilot. I am connected directly to your pipeline (${candidates.length} candidates, ${jobs.length} open roles). Ask me about candidate status, pipeline bottlenecks, skill gaps, or role matching.`,
              facts: [
                `Live pipeline records: ${candidates.length} candidates, ${jobs.length} open roles.`,
                candName ? `Loaded candidate dossier: ${candName} (ID: ${contextCandidate.id})` : 'Global recruiter scope active.'
              ]
            }
          ]);
        }
      }
    }
  }, [isOpen, contextCandidate, candidates.length, jobs.length, userRole, currentUser?.name, currentUser?.email, myApplications?.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // Contextual Suggested Prompts
  const candidatePrompts = [
    `Which profiles have I applied for?`,
    `What is my application status?`,
    `What is the advertised CTC budget for roles I applied to?`,
    `How can I prepare for my upcoming AI interview?`,
  ];

  const recruiterPrompts = contextCandidate ? [
    `Why is ${contextCandidate.name} a strong match?`,
    `What is ${contextCandidate.name}'s expected CTC vs our role budget?`,
    `What are the biggest skill gaps for this candidate?`,
    `Summarize ${contextCandidate.name}'s assessment evidence`,
  ] : [
    `Which candidates are expecting CTC within our advertised budget?`,
    `Are there any candidates whose expected CTC exceeds the budget?`,
    `What is the average expected CTC across our applicants?`,
    `Which candidates need recruiter action today?`,
  ];

  const suggestedPrompts = userRole === 'candidate' ? candidatePrompts : recruiterPrompts;

  // Grounded Intelligence Engine (Queries backend Copilot with live DB & LLM synthesis, with client-side fallback)
  const processQuery = async (userText) => {
    const q = userText.toLowerCase().trim();
    setIsProcessing(true);

    // 1. Immediate Greeting & Small Talk Check (Never dump database facts for casual greetings)
    const isGreeting = /^(hi+|hello+|hey+|good\s*(morning|afternoon|evening)|howdy|sup|greetings|hola)(\s+there)?[\s!\.\?]*$/i.test(q);
    if (isGreeting) {
      setTimeout(() => {
        setConversation(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: 'Hello! I am **ARETE AI**, your talent intelligence and decision copilot. How can I help you today?',
            databaseFacts: [],
            metrics: [],
            aiInterpretation: 'I can help you review candidate dossiers, detect skill gaps, analyze coding submissions, or explain evidence-based hiring decisions. Feel free to ask about any candidate or job requisition!',
            uncertainty: ''
          }
        ]);
        setIsProcessing(false);
      }, 200);
      return;
    }

    // 2. Identity / Capabilities Check
    const isIdentity = /^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+are\s+you|help(\s+me)?|how\s+to\s+use)[\s!\.\?]*$/i.test(q);
    if (isIdentity) {
      setTimeout(() => {
        setConversation(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: 'I am the **ARETE Decision Intelligence Copilot**, powered by authoritative database grounding and multi-modal evidence synthesis.',
            databaseFacts: [],
            metrics: [],
            aiInterpretation: 'Here is what I can do for you:\n• Candidate Deep-Dives: "Tell me about Ada" or "What are her skill gaps?"\n• Evidence Explanations: "Why is this candidate rated a Strong Fit?"\n• Skill Alignment: "Which applicants satisfy all must-have competencies?"\n• Integrity Checks: "Are there any high-risk proctor flags?"\n• Decision Briefings: "Summarize this candidate\'s verified strengths and gaps."',
            uncertainty: ''
          }
        ]);
        setIsProcessing(false);
      }, 200);
      return;
    }

    // Candidate Scope Protection & Recruiter Context Resolution
    let eagerCandidate = null;
    if (userRole === 'recruiter') {
      eagerCandidate = candidates.find(c => c.name && q.includes(c.name.toLowerCase()));
      if (!eagerCandidate) {
        for (const c of candidates) {
          if (!c.name) continue;
          const tokens = c.name.toLowerCase().split(/[\s\-_]+/).filter(t => t.length >= 3);
          if (tokens.some(t => new RegExp(`\\b${t}\\b`, 'i').test(q))) {
            eagerCandidate = c;
            break;
          }
        }
      }
      if (eagerCandidate) {
        setContextCandidate(eagerCandidate);
        contextCandidateRef.current = eagerCandidate;
      }
    } else {
      // Candidate protection: Ensure candidates cannot query other applicants or cross-pipeline dossiers
      const isCrossCandidateQuery = candidates.some(c => c.name && c.email !== currentUser?.email && q.includes(c.name.toLowerCase())) ||
        /other candidates|other applicants|who else applied|competitors|all candidates|pipeline overview|compare candidates|other applicant/i.test(q);
      
      if (isCrossCandidateQuery) {
        setTimeout(() => {
          setConversation(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: 'For candidate privacy, compliance, and equal opportunity governance, applicant access is strictly scoped to your own application files and public role listings.',
              databaseFacts: [
                `Active User: ${currentUser?.name || 'Candidate'} (${currentUser?.email || ''})`,
                `Role: Candidate Portal (RBAC Protected)`
              ],
              metrics: [],
              aiInterpretation: 'You can ask about your own application statuses, preparation guidance for upcoming AI interviews, or criteria for open roles in our job catalog.',
              uncertainty: ''
            }
          ]);
          setIsProcessing(false);
        }, 200);
        return;
      }
    }

    const candidateIdForQuery = userRole === 'candidate'
      ? (currentUser?.id || null)
      : (eagerCandidate?.id || contextCandidateRef.current?.id || contextCandidate?.id);

    // 2.5 Recruiter Decision Assistant: When evaluating a candidate, query authoritative Decision Assistant
    if (userRole === 'recruiter' && candidateIdForQuery) {
      try {
        const assistantRes = await api.queryDecisionAssistant({
          candidateId: candidateIdForQuery,
          query: userText,
          jobId: contextJob?.id,
          cohortCandidateIds: null
        });

        if (assistantRes && assistantRes.answer) {
          setConversation(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: assistantRes.answer,
              authoritativeScore: assistantRes.authoritative_score,
              fitTier: assistantRes.fit_tier,
              mustHaveCoverage: assistantRes.must_have_coverage,
              preferredCoverage: assistantRes.preferred_coverage,
              statusBreakdown: assistantRes.status_breakdown,
              citedEvidence: assistantRes.cited_evidence || [],
              materialGaps: assistantRes.material_gaps || [],
              suggestedFollowUps: assistantRes.suggested_follow_ups || [],
              evidenceRecords: assistantRes.evidence_records || [],
              provider: assistantRes.provider,
              limitations: assistantRes.limitations_disclaimer,
              isDecisionAssistant: true,
              candidateId: assistantRes.candidate_id,
              candidateName: assistantRes.candidate_name
            }
          ]);
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        console.warn('[DecisionAssistant] Assistant query returned error, falling back to general copilot:', err);
      }
    }

    // 2.6 Recruiter Job Pool Decision Assistant: When querying within a job requisition without an active candidate context
    const targetJobIdForQuery = contextJob?.id || activeJobId;
    if (userRole === 'recruiter' && targetJobIdForQuery && !candidateIdForQuery) {
      try {
        const jobAssistantRes = await api.queryJobDecisionAssistant({
          jobId: targetJobIdForQuery,
          query: userText,
          limit: 10
        });

        if (jobAssistantRes && jobAssistantRes.answer) {
          setConversation(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: jobAssistantRes.answer,
              jobTitle: jobAssistantRes.job_title,
              totalCandidates: jobAssistantRes.total_candidates,
              topCandidates: jobAssistantRes.top_candidates || [],
              requiredSkillsBreakdown: jobAssistantRes.required_skills_breakdown || [],
              unverifiedSkills: jobAssistantRes.unverified_skills || [],
              suggestedFollowUps: jobAssistantRes.suggested_follow_ups || [],
              provider: jobAssistantRes.provider,
              limitations: jobAssistantRes.limitations_disclaimer,
              isJobDecisionAssistant: true
            }
          ]);
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        console.warn('[JobDecisionAssistant] Job assistant query error, falling back:', err);
      }
    }

    // 3. Try Backend Copilot API first
    try {
      const backendRes = await api.queryCopilot({
        query: userText,
        candidateId: candidateIdForQuery,
        jobId: contextJob?.id,
        userRole: userRole,
        userEmail: currentUser?.email,
        userName: currentUser?.name
      });

      if (backendRes && backendRes.text) {
        if (backendRes.candidate_id) {
          const matched = candidates.find(c => String(c.id) === String(backendRes.candidate_id));
          const targetToSet = matched || { id: backendRes.candidate_id, name: backendRes.candidate_name, jobTitle: 'Candidate' };
          setContextCandidate(targetToSet);
          contextCandidateRef.current = targetToSet;
        }

        setConversation(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: backendRes.text,
            databaseFacts: backendRes.database_facts || [],
            metrics: backendRes.metrics || [],
            aiInterpretation: backendRes.ai_interpretation || '',
            uncertainty: backendRes.uncertainty || ''
          }
        ]);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn('[Copilot] Backend query failed, using local semantic fallback:', err);
    }

    // 4. Local Semantic Fallback (If backend is unreachable)
    setTimeout(() => {
      let aiResponse = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: '',
        databaseFacts: [],
        metrics: [],
        aiInterpretation: '',
        uncertainty: ''
      };

      // Check Candidate Self Query: "who am i", "which profiles have i applied"
      const isSelfQuery = /who\s+am\s+i|which\s+profiles?|profiles?\s+i|i\s+applied|i\s+ve\s+applied|have\s+i\s+applied|my\s+applications?|my\s+profile|my\s+status|where\s+did\s+i\s+apply|what\s+did\s+i\s+apply/i.test(q);
      if (isSelfQuery || (userRole === 'candidate' && /profile|apply|applied|application|status|role|job/i.test(q))) {
        const apps = myApplications || [];
        aiResponse.text = `You are logged in as **${currentUser?.name || 'Candidate'}** (\`${currentUser?.email || ''}\`).`;
        aiResponse.databaseFacts = apps.length > 0
          ? apps.map(a => `${a.jobTitle || a.title || 'Role'} — Stage: ${a.stage || 'Applied'}, Fit: ${a.matchScore || 0}%, Applied: ${a.appliedDate || 'Recently'}`)
          : ['No active job applications found under this account.'];
        aiResponse.metrics = [
          `Active Applications: ${apps.length}`,
          `Role: Candidate Portal`
        ];
        aiResponse.aiInterpretation = apps.length > 0
          ? `You have applied for **${apps[0]?.jobTitle || apps[0]?.title || 'Open Position'}**${apps.length > 1 ? ` and ${apps.length - 1} other role(s)` : ''}. Your application is in the **${apps[0]?.stage || 'screening'}** stage.`
          : 'You haven\'t submitted any job applications yet. Head over to **Browse Jobs** to explore open roles and apply!';
        aiResponse.uncertainty = '';
        setConversation(prev => [...prev, aiResponse]);
        setIsProcessing(false);
        return;
      }

      // Identify mentioned candidate or active context
      const mentionedCandidate = eagerCandidate || contextCandidateRef.current || contextCandidate;
      const targetJob = jobs.find(j => j.title && q.includes(j.title.toLowerCase())) || (mentionedCandidate ? jobs.find(j => String(j.id) === String(mentionedCandidate.jobId)) : null);

      if (mentionedCandidate) {
        setContextCandidate(mentionedCandidate);
        contextCandidateRef.current = mentionedCandidate;
      }

      // ── INTENT INTERVIEW: Interview scheduling & calendar queries ──
      const isInterviewQuery = /interview|interviews|scheduled|scheduling|meet|meeting|calendar|slot|call/i.test(q);
      if (isInterviewQuery) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const isAskingToday = /today/i.test(q);
        const isAskingTomorrow = /tomorrow/i.test(q);

        const timeMatch = q.match(/\b(\d{1,2})(?::|\.)?(\d{2})?\s*(am|pm)?\b/i);
        let targetH = null;
        let targetM = 0;
        let timeLabel = '';
        if (timeMatch) {
          let h = parseInt(timeMatch[1], 10);
          if (h >= 0 && h <= 23) {
            targetM = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            const ampm = (timeMatch[3] || '').toLowerCase();
            if (ampm === 'pm' && h < 12) h += 12;
            else if (ampm === 'am' && h === 12) h = 0;
            targetH = h;
            timeLabel = timeMatch[0].trim();
          }
        }

        const scheduledCands = candidates.filter(c => {
          const slot = String(c.interview_scheduled_at || c.interviewScheduledAt || '').trim();
          return (slot && slot !== 'Upcoming Slot') || c.interview_status === 'scheduled' || c.interviewStatus === 'scheduled';
        });

        const slotMatches = (slotStr) => {
          if (!slotStr || slotStr === 'Upcoming Slot') return false;
          const sLower = slotStr.toLowerCase();
          let dateOk = false;
          if (isAskingToday) {
            dateOk = sLower.includes(todayStr) || sLower.includes('today') || (!/\d{4}-\d{2}-\d{2}/.test(sLower) && !sLower.includes('tomorrow'));
          } else if (isAskingTomorrow) {
            dateOk = sLower.includes('tomorrow');
          } else {
            dateOk = true;
          }
          if (!dateOk) return false;
          if (targetH === null) return true;

          const tm = sLower.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
          if (tm) {
            let sh = parseInt(tm[1], 10);
            const sm = parseInt(tm[2], 10);
            const sampm = (tm[3] || '').toLowerCase();
            if (sampm === 'pm' && sh < 12) sh += 12;
            else if (sampm === 'am' && sh === 12) sh = 0;
            if (sh === targetH && Math.abs(sm - targetM) <= 20) return true;
            if (sh === targetH && targetM === 0) return true;
          }
          return false;
        };

        const matching = scheduledCands.filter(c => slotMatches(c.interview_scheduled_at || c.interviewScheduledAt));

        let slotDesc = 'upcoming schedule';
        if (isAskingToday && timeLabel) slotDesc = `today at ${timeLabel}`;
        else if (isAskingTomorrow && timeLabel) slotDesc = `tomorrow at ${timeLabel}`;
        else if (timeLabel) slotDesc = `at ${timeLabel}`;
        else if (isAskingToday) slotDesc = 'today';
        else if (isAskingTomorrow) slotDesc = 'tomorrow';

        if (matching.length > 0) {
          const c = matching[0];
          aiResponse.text = `Interview Scheduled for **${slotDesc}**:`;
          aiResponse.databaseFacts = [
            `Candidate: **${c.name}** (${c.jobTitle || 'Role'})`,
            `Scheduled Time: **${c.interview_scheduled_at || c.interviewScheduledAt}**`,
            `Status: ${(c.interview_status || c.interviewStatus || 'Scheduled').replace('_', ' ')}`,
            `Google Meet: ${c.interview_meeting_url || c.interviewMeetingUrl || 'Pending URL'}`,
            `Match Score: ${c.matchScore || 0}% • Email: ${c.email || ''}`
          ];
          aiResponse.metrics = [
            `Candidate: ${c.name}`,
            `Slot: ${c.interview_scheduled_at || c.interviewScheduledAt}`,
            `Status: ${(c.interview_status || c.interviewStatus || 'Scheduled')}`
          ];
          aiResponse.aiInterpretation = `**${c.name}** has a verified interview confirmed for **${slotDesc}** (${c.interview_scheduled_at || c.interviewScheduledAt}). Join link is ready.`;
        } else if (timeLabel || isAskingToday || isAskingTomorrow) {
          const todayCands = scheduledCands.filter(c => String(c.interview_scheduled_at || c.interviewScheduledAt).includes(todayStr) || /today/i.test(String(c.interview_scheduled_at || c.interviewScheduledAt)));
          const otherCands = scheduledCands.filter(c => !todayCands.includes(c));

          aiResponse.text = `Interview Schedule Status for **${slotDesc}**:`;
          aiResponse.databaseFacts = [
            `Verified Database Fact: No candidate interview is currently scheduled for **${slotDesc}**.`
          ];
          if (todayCands.length > 0) {
            aiResponse.databaseFacts.push(`Active Bookings Scheduled for Today:`);
            todayCands.forEach(c => {
              aiResponse.databaseFacts.push(`• **${c.name}** (${c.jobTitle || 'Role'}) — Slot: ${c.interview_scheduled_at || c.interviewScheduledAt} | Meet: ${c.interview_meeting_url || c.interviewMeetingUrl || 'Meet Link'}`);
            });
          }
          if (otherCands.length > 0) {
            aiResponse.databaseFacts.push(`Upcoming Bookings in Pipeline:`);
            otherCands.slice(0, 3).forEach(c => {
              aiResponse.databaseFacts.push(`• **${c.name}** (${c.jobTitle || 'Role'}) — Slot: ${c.interview_scheduled_at || c.interviewScheduledAt}`);
            });
          }
          aiResponse.metrics = [
            `${slotDesc}: Free (Unbooked)`,
            `Today's Confirmed: ${todayCands.length}`,
            `Total Pipeline Scheduled: ${scheduledCands.length}`
          ];
          aiResponse.aiInterpretation = `There is currently **no candidate interview scheduled for ${slotDesc}**. ${todayCands.length > 0 ? `However, **${todayCands[0].name}** has an interview scheduled for today at **${todayCands[0].interview_scheduled_at || todayCands[0].interviewScheduledAt}**.` : ''} The slot is available for scheduling.`;
        } else {
          aiResponse.text = `Current Pipeline Interview Schedule & Calendar:`;
          aiResponse.databaseFacts = [
            `Total Confirmed Scheduled Interviews: ${scheduledCands.length} candidate(s)`,
            `Candidates in Interview Stage: ${candidates.filter(c => normalizeWorkflow(c).stage === 'interview').length} candidate(s)`
          ];
          scheduledCands.forEach(c => {
            aiResponse.databaseFacts.push(`• **${c.name}** (${c.jobTitle || 'Role'}) — Slot: ${c.interview_scheduled_at || c.interviewScheduledAt} | Meet: ${c.interview_meeting_url || c.interviewMeetingUrl || 'Google Meet'}`);
          });
          aiResponse.metrics = [
            `Confirmed Interviews: ${scheduledCands.length}`,
            `Pipeline in Interview: ${candidates.filter(c => normalizeWorkflow(c).stage === 'interview').length}`
          ];
          aiResponse.aiInterpretation = `The recruitment pipeline currently has ${scheduledCands.length} confirmed candidate interview booking(s).`;
        }
        aiResponse.uncertainty = '';
        setConversation(prev => [...prev, aiResponse]);
        setIsProcessing(false);
        return;
      }

      // ── INTENT A: Action required / pending review / waiting for action ──
      if (q.includes('action') || q.includes('waiting') || q.includes('pending') || q.includes('triage queue') || q.includes('action today')) {
        const inboundApplied = candidates.filter(c => normalizeWorkflow(c).stage === 'applied');
        const awaitingScreening = candidates.filter(c => normalizeWorkflow(c).stage === 'screening');
        const awaitingDecision = candidates.filter(c => normalizeWorkflow(c).stage === 'review' && normalizeWorkflow(c).hiringDecision === 'undecided');
        const pendingAssessments = candidates.filter(c => ['invited', 'in_progress'].includes(normalizeWorkflow(c).assessmentStatus));

        aiResponse.databaseFacts = [
          `Inbound applications (applied stage): ${inboundApplied.length} applicant(s)`,
          `Active screening stage: ${awaitingScreening.length} candidate(s)`,
          `Evaluation & Review (decision undecided): ${awaitingDecision.length} candidate(s)`,
          `Technical tests pending submission: ${pendingAssessments.length} candidate(s)`
        ];
        aiResponse.metrics = [
          `Total Actionable Items: ${inboundApplied.length + awaitingScreening.length + awaitingDecision.length}`,
          `Pipeline Bottleneck: ${awaitingDecision.length > 0 ? 'Committee Decision Stage' : inboundApplied.length > 0 ? 'Inbound Application Triage' : 'Healthy Velocity'}`
        ];
        aiResponse.aiInterpretation = (
          `Recruiter triage priority: First advance the ${inboundApplied.length} inbound application(s) into active screening. Second, resolve final hiring decisions for ${awaitingDecision.length} candidate(s) currently in the Review stage.`
        );
        aiResponse.uncertainty = 'Candidate response rates for assessment invitations depend on individual candidate scheduling.';
        aiResponse.text = 'Action Queue & Pipeline Bottleneck Analysis:';
      }

      // ── INTENT B: Completed assessments not yet reviewed ──
      else if ((q.includes('completed') && (q.includes('assessment') || q.includes('test') || q.includes('code'))) || q.includes('unreviewed') || q.includes('not reviewed')) {
        const completedUnreviewed = candidates.filter(c => {
          const wf = normalizeWorkflow(c);
          return (wf.assessmentStatus === 'evaluated' || wf.assessmentStatus === 'submitted') && wf.stage !== 'completed' && wf.hiringDecision === 'undecided';
        });

        aiResponse.databaseFacts = completedUnreviewed.slice(0, 6).map(c => 
          `${c.name} (${c.jobTitle || 'Role'}) — Score: ${c.coding_score ?? c.scores?.overall ?? 'Pending'}/100, Stage: ${normalizeWorkflow(c).stage}`
        );
        aiResponse.metrics = [
          `Total evaluated unreviewed candidates: ${completedUnreviewed.length}`,
          `Average Assessment Score: ${completedUnreviewed.length ? Math.round(completedUnreviewed.reduce((acc, c) => acc + (c.coding_score || c.scores?.overall || 0), 0) / completedUnreviewed.length) : 0}/100`
        ];
        aiResponse.aiInterpretation = completedUnreviewed.length > 0
          ? `${completedUnreviewed.length} candidate(s) have submitted coding assessments that completed automated test suite execution and require committee or interview advancement.`
          : 'All completed assessments have been processed or transitioned beyond the initial evaluation stage.';
        aiResponse.uncertainty = 'Assessment scores measure unit test correctness in isolated subprocess sandbox; code style and architectural tradeoffs require recruiter code replay inspection.';
        aiResponse.text = 'Candidates with completed assessments awaiting review:';
      }

      // ── INTENT C: Candidate Specific Skills Inquiry ──
      else if (mentionedCandidate && (/skill|skills|stack|tech|technolog|know|knows|proficien/i.test(q))) {
        const cand = mentionedCandidate;
        const candSkills = cand.skills || [];
        const reqSkills = targetJob?.requiredSkills || [];
        const matchingSkills = candSkills.filter(s => reqSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
        const missingSkills = reqSkills.filter(rs => !candSkills.some(s => s.toLowerCase() === rs.toLowerCase()));

        aiResponse.databaseFacts = [
          `Candidate: ${cand.name} (Role: ${cand.job?.title || cand.jobTitle || 'Open Role'})`,
          `Verified Candidate Skills: ${candSkills.length ? candSkills.join(', ') : 'None listed'}`,
          `Role Matched Skills: ${matchingSkills.length ? matchingSkills.join(', ') : 'No direct matches'}`,
          `Missing / Growth Areas: ${missingSkills.length ? missingSkills.join(', ') : 'All role criteria satisfied'}`,
          `Target Job Requisites: ${reqSkills.length ? reqSkills.join(', ') : 'General competencies'}`
        ];
        aiResponse.metrics = [
          `Role Fit Score: ${cand.matchScore || 0}%`,
          `Skills Matched: ${matchingSkills.length} of ${reqSkills.length || candSkills.length}`,
          `Coverage: ${reqSkills.length ? Math.round((matchingSkills.length / reqSkills.length) * 100) : 100}%`
        ];
        aiResponse.aiInterpretation = (
          `**${cand.name}** has verified skills in **${candSkills.join(', ')}**. For this role, verified strengths are **${matchingSkills.length ? matchingSkills.join(', ') : 'foundational capabilities'}** (fit score **${cand.matchScore || 0}%**). ` +
          (missingSkills.length ? `Growth areas to evaluate in interviews: **${missingSkills.join(', ')}**.` : 'All primary skill criteria are satisfied.')
        );
        aiResponse.uncertainty = 'Skills are validated from candidate resume parsing and coding sandbox evaluations.';
        aiResponse.text = `Technical Skills & Competency Profile for **${cand.name}**:`;
      }

      // ── INTENT D: Candidate Specific Deep Analysis (General Dossier) ──
      else if (mentionedCandidate) {
        const cand = mentionedCandidate;
        const wf = normalizeWorkflow(cand);
        const candSkills = cand.skills || [];
        const reqSkills = targetJob?.requiredSkills || [];
        const matchingSkills = candSkills.filter(s => reqSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
        const missingSkills = reqSkills.filter(rs => !candSkills.some(s => s.toLowerCase() === rs.toLowerCase()));

        aiResponse.databaseFacts = [
          `Candidate: ${cand.name} (ID: ${cand.id})`,
          `Requisition: ${cand.job?.title || cand.jobRole || targetJob?.title || 'Open Role'}`,
          `Current Stage: ${wf.stage} | Hiring Decision: ${wf.hiringDecision}`,
          `Assessment Status: ${wf.assessmentStatus} (Score: ${cand.coding_score ?? cand.scores?.overall ?? 'Pending'}/100)`,
          `Interview Status: ${wf.interviewStatus}`,
          `Proctor Risk Rating: ${cand.integrityRisk || 'Low'} (Score: ${cand.integrityScore || 100}/100)`
        ];
        aiResponse.metrics = [
          `Algorithmic Match Score: ${cand.matchScore || 0}%`,
          `Required Skills Coverage: ${reqSkills.length ? Math.round((matchingSkills.length / reqSkills.length) * 100) : 100}%`,
          `Matched Skills: ${matchingSkills.length ? matchingSkills.join(', ') : 'General competencies'}`
        ];
        aiResponse.aiInterpretation = (
          `${cand.name} has demonstrated solid capability in ${matchingSkills.length ? matchingSkills.join(', ') : 'core domain skills'}. ` +
          (missingSkills.length ? `Identified growth competencies: ${missingSkills.join(', ')}. ` : 'No major skill deficits against role criteria. ') +
          (cand.scores?.overall ? `Assessment evidence verified with ${cand.scores.overall}/100 automated pass rate.` : 'Sandbox assessment has not been evaluated.')
        );
        aiResponse.uncertainty = (
          missingSkills.length
            ? `Candidate may possess unlisted experience in ${missingSkills.join(', ')} that was not detected during resume keyword normalization.`
            : 'All primary role requirements satisfied based on submitted candidate profile and evaluation data.'
        );
        aiResponse.text = `Dossier & Evidence Breakdown for **${cand.name}**:`;
      }

      // ── INTENT D: Skill Specific Search ──
      else if (/who knows|which candidates? (know|have|use)|search for skill|skills? in/i.test(q)) {
        const skillMatch = q.match(/(?:who knows|which candidates? (?:know|have|use)|search for skill|skills? in)\s+([a-zA-Z0-9_\+\#\.\s]+)/i);
        const searchSkill = skillMatch ? skillMatch[1].trim().toLowerCase() : '';
        const matchingCands = searchSkill ? candidates.filter(c => (c.skills || []).some(s => s.toLowerCase().includes(searchSkill))) : [];

        aiResponse.text = `Candidates with skill "${searchSkill}":`;
        aiResponse.databaseFacts = matchingCands.length > 0
          ? matchingCands.slice(0, 6).map(c => `${c.name} (${c.jobTitle || 'Role'}) — Fit: ${c.matchScore || 0}%`)
          : [`No candidates found with "${searchSkill}" in verified skills.`];
        aiResponse.metrics = [
          `Matches: ${matchingCands.length} of ${candidates.length} candidates`
        ];
        aiResponse.aiInterpretation = `Found ${matchingCands.length} candidate(s) possessing verified competencies in ${searchSkill}.`;
        aiResponse.uncertainty = 'Skills are validated from candidate resume parsing and assessment verification.';
      }

      // ── INTENT E: Pipeline Overview (ONLY when specifically asked!) ──
      else if (q.includes('pipeline') || q.includes('overview') || q.includes('summary') || q.includes('stats') || q.includes('how many candidates')) {
        const stagesCount = {
          applied: candidates.filter(c => normalizeWorkflow(c).stage === 'applied').length,
          screening: candidates.filter(c => normalizeWorkflow(c).stage === 'screening').length,
          assessment: candidates.filter(c => normalizeWorkflow(c).stage === 'assessment').length,
          interview: candidates.filter(c => normalizeWorkflow(c).stage === 'interview').length,
          review: candidates.filter(c => normalizeWorkflow(c).stage === 'review').length,
          completed: candidates.filter(c => normalizeWorkflow(c).stage === 'completed').length,
        };

        aiResponse.databaseFacts = [
          `Total Candidates in Database: ${candidates.length}`,
          `Total Open Roles: ${jobs.length}`,
          `Stage Distribution: Inbound: ${stagesCount.applied}, Screening: ${stagesCount.screening}, Assessment: ${stagesCount.assessment}, Interview: ${stagesCount.interview}, Review: ${stagesCount.review}, Completed: ${stagesCount.completed}`
        ];
        aiResponse.metrics = [
          `High-Match Candidates (>=85%): ${candidates.filter(c => (c.matchScore || 0) >= 85).length}`,
          `Integrity Flags: ${candidates.filter(c => c.integrityRisk === 'High').length}`
        ];
        aiResponse.aiInterpretation = (
          `Live query resolved across authenticated database. You can drill down into specific candidates, ask which applicants require immediate action, or compare technical assessment versus interview performance.`
        );
        aiResponse.uncertainty = 'Live queries reflect synchronous database state at transaction time.';
        aiResponse.text = 'Live Pipeline Intelligence Summary:';
      }

      // ── INTENT F: General Fallback (Polite, conversational AI response — NEVER a raw DB dump) ──
      else {
        aiResponse.text = `Here is what I can tell you regarding "${userText}":`;
        aiResponse.databaseFacts = [];
        aiResponse.metrics = [];
        if (userRole === 'candidate') {
          aiResponse.aiInterpretation = `I am your ARETE career advisor. You can ask me about the status of your submitted applications (${myApplications?.length || 0} active), how to prepare for upcoming technical or AI interviews, or explore requirements for open positions in the job catalog.`;
        } else {
          aiResponse.aiInterpretation = `I analyzed your query against the recruitment database (${candidates.length} candidates, ${jobs.length} jobs). You can ask me to evaluate specific candidates (e.g. "Tell me about ${candidates[0]?.name || 'a candidate'}"), check candidate skill gaps, review pending action items, or inspect pipeline bottlenecks.`;
        }
        aiResponse.uncertainty = '';
      }

      setConversation(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 300);
  };

  const handleSend = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim() || isProcessing) return;
    const qText = query.trim();
    setLastFailedQuery(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: qText
    };
    setConversation(prev => [...prev, userMsg]);
    setQuery('');
    processQuery(qText);
  };

  const handleRetry = (retryText) => {
    if (!retryText || isProcessing) return;
    setLastFailedQuery(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: retryText
    };
    setConversation(prev => [...prev, userMsg]);
    processQuery(retryText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Drawer Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="ARETE Decision Intelligence Copilot"
        className="relative w-full max-w-xl bg-[#FDFBF7] dark:bg-[#161311] border-l border-[#E8E4DF] dark:border-[#2A2520] shadow-depth-elevated flex flex-col z-10 animate-slide-in"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between bg-[#FDFBF7] dark:bg-[#161311]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-[#1B1310] border border-[#E8E4DF] dark:border-[#382B22] flex items-center justify-center text-stone-800 dark:text-[#D6B477] shadow-subtle">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-display">ARETE Copilot</h2>
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#24201D] text-stone-700 dark:text-stone-300 border border-[#E8E4DF] dark:border-[#36302A]">
                  {userRole === 'candidate' ? 'Career Assistant' : 'Recruiter AI'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {userRole === 'candidate' 
                  ? 'Personalized application guidance & interview preparation' 
                  : 'Grounded recruitment intelligence with verified evidence paths'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#24201D] transition"
            aria-label="Close ARETE Copilot drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Context Banner */}
        {contextCandidate && (
          <div className="px-5 py-2.5 bg-stone-100/70 dark:bg-[#1A1714] border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">Context:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 truncate">{contextCandidate.name}</span>
              <span className="text-stone-500 dark:text-stone-400 text-[11px]">({contextCandidate.jobTitle || 'Role'})</span>
            </div>
            <button
              type="button"
              onClick={() => setContextCandidate(null)}
              className="text-[10px] font-mono text-brand-600 dark:text-brand-400 hover:underline shrink-0"
            >
              Clear context
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversation.map(msg => (
            <div 
              key={msg.id}
              className={`flex flex-col space-y-2.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`p-4 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white shadow-subtle'
                  : msg.isError
                  ? 'bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/40 text-stone-900 dark:text-stone-100 shadow-subtle'
                  : 'bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-900 dark:text-stone-100 shadow-subtle'
              }`}>
                <FormattedMarkdownText 
                  content={msg.text} 
                  className={msg.sender === 'user' ? 'text-white' : 'font-semibold text-stone-900 dark:text-stone-100'} 
                />

                {/* Error Recovery CTA */}
                {msg.isError && msg.failedQuery && (
                  <div className="mt-3 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/40 flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Temporary assistant error</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRetry(msg.failedQuery)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#24201D] hover:bg-stone-100 dark:hover:bg-[#36302A] text-stone-800 dark:text-stone-200 border border-[#E8E4DF] dark:border-[#36302A] text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry Query</span>
                    </button>
                  </div>
                )}

                {/* Structured Evidence Callouts for AI messages */}
                {msg.sender === 'ai' && !msg.isError && (msg.databaseFacts?.length > 0 || msg.metrics?.length > 0 || msg.aiInterpretation) && (
                  <div className="mt-3.5 pt-3 border-t border-[#E8E4DF] dark:border-[#2A2520] space-y-3">
                    {/* Database Facts (Strict facts from database) */}
                    {msg.databaseFacts?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>Database Verified Facts</span>
                        </span>
                        <ul className="space-y-1.5">
                          {msg.databaseFacts.map((fact, i) => {
                            const colonIdx = fact.indexOf(':');
                            if (colonIdx > 0 && colonIdx < 30) {
                              const key = fact.substring(0, colonIdx).trim();
                              const val = fact.substring(colonIdx + 1).trim();
                              return (
                                <li key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed bg-[#FDFCFA] dark:bg-[#1A1714] px-2.5 py-1.5 rounded-lg border border-[#E8E4DF] dark:border-[#2A2520] shadow-subtle">
                                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                  <div className="flex-1">
                                    <span className="font-bold text-stone-800 dark:text-stone-200">{key}:</span>{' '}
                                    <span className="text-stone-600 dark:text-stone-300">
                                      <FormattedMarkdownText content={val} />
                                    </span>
                                  </div>
                                </li>
                              );
                            }
                            return (
                              <li key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed bg-[#FDFCFA] dark:bg-[#1A1714] px-2.5 py-1.5 rounded-lg border border-[#E8E4DF] dark:border-[#2A2520] shadow-subtle">
                                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                <div className="flex-1 text-stone-600 dark:text-stone-300">
                                  <FormattedMarkdownText content={fact} />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Calculated Metrics */}
                    {msg.metrics?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Calculated Benchmark Metrics</span>
                        </span>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {msg.metrics.map((m, i) => (
                            <span 
                              key={i} 
                              className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25 text-[10.5px] font-mono font-semibold shadow-subtle flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                              <span>{m}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Qualitative Interpretation */}
                    {msg.aiInterpretation && (
                      <div className="space-y-1.5 bg-brand-50/60 dark:bg-brand-950/25 p-3.5 rounded-xl border border-brand-200/60 dark:border-brand-900/40">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Synthesis & Recruiter Briefing</span>
                        </span>
                        <div className="text-[11.5px] text-stone-700 dark:text-stone-200 leading-relaxed pt-0.5">
                          <FormattedMarkdownText content={msg.aiInterpretation} />
                        </div>
                      </div>
                    )}

                    {/* Uncertainty boundary */}
                    {msg.uncertainty && (
                      <div className="text-[10.5px] text-stone-500 dark:text-stone-400 flex items-start gap-1.5 pt-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="text-stone-700 dark:text-stone-300">Confidence Boundary:</strong>{' '}
                          <FormattedMarkdownText content={msg.uncertainty} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Decision Assistant Authoritative Evidence Card (Candidate Scope) */}
                {msg.sender === 'ai' && msg.isDecisionAssistant && (
                  <div className="mt-3.5 pt-3 border-t border-[#E8E4DF] dark:border-[#2A2520] space-y-3">
                    {/* Scorecard Benchmark Pill Bar */}
                    <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-[#201C18] border border-[#E8E4DF] dark:border-[#2A2520] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                          Authoritative Scorecard
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {msg.authoritativeScore}% Fit • {String(msg.fitTier || '').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                        <div className="p-1.5 rounded-lg bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520]">
                          <span className="text-stone-400 block text-[9px]">Must-Have Coverage</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">{msg.mustHaveCoverage}%</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520]">
                          <span className="text-stone-400 block text-[9px]">Preferred Coverage</span>
                          <strong className="text-brand-600 dark:text-brand-400">{msg.preferredCoverage}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Grounded Evidence Citations */}
                    {msg.citedEvidence?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Grounded Competency Proof ({msg.citedEvidence.length})</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.citedEvidence.slice(0, 8).map((c, i) => {
                            const isVerified = c.status === 'VERIFIED';
                            const isEvidenced = c.status === 'EVIDENCED';
                            const isClaimed = c.status === 'CLAIMED';
                            return (
                              <div
                                key={i}
                                className={`group relative px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1.5 transition ${
                                  isVerified
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                    : isEvidenced
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                    : isClaimed
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                }`}
                                title={c.reason || c.quote_snippet || ''}
                              >
                                <span>{c.skill_name}</span>
                                <span className="text-[8.5px] opacity-75">[{c.status}]</span>
                                {c.artifact_url && (
                                  <a
                                    href={c.artifact_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="opacity-60 hover:opacity-100 hover:scale-110 transition ml-0.5"
                                    title={`View verified record (${c.evidence_type || 'evidence'})`}
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Material Gaps */}
                    {msg.materialGaps?.length > 0 && (
                      <div className="space-y-1.5 text-[10.5px]">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Gaps to Address ({msg.materialGaps.length})</span>
                        </span>
                        <ul className="space-y-1">
                          {msg.materialGaps.slice(0, 3).map((g, i) => (
                            <li key={i} className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-stone-700 dark:text-stone-300 text-[10.5px]">
                              <strong className="text-amber-700 dark:text-amber-400">{g.skill_name}:</strong> {g.mitigation_recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Grounded Evidence Records Snippets */}
                    {msg.evidenceRecords?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          <Database className="w-3 h-3" />
                          <span>Direct Evidence Anchors</span>
                        </span>
                        <div className="space-y-1">
                          {msg.evidenceRecords.slice(0, 3).map((er, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-stone-100/60 dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] text-[10px] font-mono">
                              <div className="flex items-center justify-between text-stone-500 mb-0.5">
                                <span className="font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{er.evidence_type || 'Proof'}: {er.skill_name}</span>
                                {er.record_ref && <span className="text-[9px] opacity-75">{er.record_ref}</span>}
                              </div>
                              {er.quote_snippet && (
                                <p className="text-stone-700 dark:text-stone-300 italic text-[10.5px] line-clamp-2">
                                  "{er.quote_snippet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Suggested Follow-Up Prompts */}
                    {msg.suggestedFollowUps?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                          Recommended Inquiries:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((qText, qi) => (
                            <button
                              key={qi}
                              type="button"
                              onClick={() => {
                                setQuery(qText);
                                processQuery(qText);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#FDFCFA] dark:bg-[#1A1714] text-stone-700 dark:text-stone-300 border border-[#E8E4DF] dark:border-[#2A2520] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-left transition flex items-center gap-1 shadow-subtle group"
                            >
                              <span>{qText}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-stone-400 group-hover:text-brand-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limitations Disclaimer */}
                    {msg.limitations && (
                      <p className="text-[9.5px] text-stone-400 dark:text-stone-500 italic pt-1">
                        ⚠️ {msg.limitations}
                      </p>
                    )}
                  </div>
                )}

                {/* Job Pool Decision Assistant Card (Requisition Scope) */}
                {msg.sender === 'ai' && msg.isJobDecisionAssistant && (
                  <div className="mt-3.5 pt-3 border-t border-[#E8E4DF] dark:border-[#2A2520] space-y-3">
                    {/* Requisition Header & Coverage Summary */}
                    <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-[#201C18] border border-[#E8E4DF] dark:border-[#2A2520] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                            {msg.jobTitle || 'Requisition Pool'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                          {msg.totalCandidates} Applicants Analyzed
                        </span>
                      </div>
                    </div>

                    {/* Pool-Wide Unverified Skills Alert Banner */}
                    {msg.unverifiedSkills?.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-[10.5px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Competency Verification Deficit Alert</span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed">
                          Over 50% of the applicant pool lacks verified proof for: <strong className="font-semibold text-amber-900 dark:text-amber-100">{msg.unverifiedSkills.join(', ')}</strong>. Consider triggering targeted coding challenges or structured interview evaluation.
                        </p>
                      </div>
                    )}

                    {/* Ranked Leaderboard Cards */}
                    {msg.topCandidates?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center justify-between">
                          <span>Top Evaluated Applicants ({msg.topCandidates.length})</span>
                          <span className="text-[9px]">Grounded Scorecards</span>
                        </span>
                        <div className="space-y-1.5">
                          {msg.topCandidates.map((cand, idx) => {
                            const isStrong = cand.fit_tier === 'STRONG_FIT';
                            const isModerate = cand.fit_tier === 'MODERATE_FIT';
                            return (
                              <div
                                key={cand.candidate_id || idx}
                                className="p-2.5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] hover:border-brand-500/50 transition flex items-center justify-between gap-2 shadow-subtle"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-[#26201B] text-stone-600 dark:text-stone-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                        {cand.candidate_name}
                                      </h4>
                                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#201C18] text-stone-600 dark:text-stone-400 uppercase">
                                        {cand.stage}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 pt-0.5">
                                      <span className="text-emerald-600 dark:text-emerald-400">Must: {cand.must_have_coverage}%</span>
                                      <span>•</span>
                                      <span>Pref: {cand.preferred_coverage}%</span>
                                      <span>•</span>
                                      <span className="text-stone-400">{cand.verified_skills_count} verified</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                    isStrong
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                      : isModerate
                                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/25'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                  }`}>
                                    {cand.fit_score}%
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchedCand = candidates.find(c => String(c.id) === String(cand.candidate_id)) || {
                                        id: cand.candidate_id,
                                        name: cand.candidate_name,
                                        jobTitle: msg.jobTitle
                                      };
                                      setContextCandidate(matchedCand);
                                      contextCandidateRef.current = matchedCand;
                                      const prompt = `Why is ${cand.candidate_name} rated a ${String(cand.fit_tier).replace('_', ' ')}? Summarize evidence & gaps.`;
                                      setQuery(prompt);
                                      processQuery(prompt);
                                    }}
                                    className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 hover:bg-brand-100 hover:scale-105 transition flex items-center gap-1 shadow-subtle"
                                    title={`Drill down into ${cand.candidate_name}'s evidence dossier`}
                                  >
                                    <span>Inspect</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Required Skills Distribution Breakdown */}
                    {msg.requiredSkillsBreakdown?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-brand-500" />
                          <span>Requisition Competency Coverage Breakdown</span>
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {msg.requiredSkillsBreakdown.slice(0, 6).map((sb, sIdx) => (
                            <div key={sIdx} className="p-2 rounded-lg bg-stone-50 dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] text-[10px] font-mono">
                              <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                                <span className="truncate">{sb.skill_name}</span>
                                <span className="text-[9px] uppercase px-1 rounded bg-stone-200 dark:bg-[#2A2520] text-stone-600 dark:text-stone-400 shrink-0">
                                  {sb.importance}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-stone-500 pt-1 text-[9.5px]">
                                <span className="text-emerald-600 dark:text-emerald-400">{sb.verified_count} verified</span>
                                <span className={sb.unverified_rate > 50 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-400'}>
                                  {sb.unverified_rate}% unverified
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Suggested Follow-Up Prompts */}
                    {msg.suggestedFollowUps?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                          Suggested Requisition Inquiries:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((qText, qi) => (
                            <button
                              key={qi}
                              type="button"
                              onClick={() => {
                                setQuery(qText);
                                processQuery(qText);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#FDFCFA] dark:bg-[#1A1714] text-stone-700 dark:text-stone-300 border border-[#E8E4DF] dark:border-[#2A2520] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-left transition flex items-center gap-1 shadow-subtle group"
                            >
                              <span>{qText}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-stone-400 group-hover:text-brand-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limitations Disclaimer */}
                    {msg.limitations && (
                      <p className="text-[9.5px] text-stone-400 dark:text-stone-500 italic pt-1">
                        ⚠️ {msg.limitations}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 p-2.5 bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] rounded-lg max-w-[220px]">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Querying database ledger...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts Pill Carousel */}
        <div className="px-5 py-2.5 border-t border-[#E8E4DF] dark:border-[#2A2520] bg-stone-50/50 dark:bg-[#14110F]">
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 block mb-1.5 uppercase font-bold tracking-wider">
            Suggested Queries:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(p);
                  processQuery(p);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FDFCFA] dark:bg-[#1A1714] text-stone-700 dark:text-stone-300 border border-[#E8E4DF] dark:border-[#2A2520] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap transition shrink-0 shadow-subtle"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <form onSubmit={handleSend} className="p-3.5 border-t border-[#E8E4DF] dark:border-[#2A2520] bg-[#FDFCFA] dark:bg-[#1A1714] flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={contextCandidate ? `Ask about ${contextCandidate.name}...` : "Ask about candidates, jobs, or pipeline status..."}
            className="flex-1 px-3.5 py-2 bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] rounded-lg text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            aria-label="ARETE Copilot prompt input"
          />
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="p-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold text-xs transition shadow-subtle"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
