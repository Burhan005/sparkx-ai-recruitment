import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  TrendingUp, 
  FileText, 
  Code2, 
  MessageSquare,
  ArrowRight,
  Layers,
  HelpCircle
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
              <strong key={pKey++} className="font-bold text-slate-900 dark:text-white">
                {inner}
              </strong>
            );
          } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
            const inner = matchedStr.slice(1, -1);
            parts.push(
              <code key={pKey++} className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-[10.5px]">
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
  initialContextJob = null
}) {
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
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Active Context
  const [contextCandidate, setContextCandidate] = useState(initialContextCandidate);
  const [contextJob, setContextJob] = useState(initialContextJob);
  const contextCandidateRef = useRef(initialContextCandidate);

  useEffect(() => {
    if (initialContextCandidate) {
      setContextCandidate(initialContextCandidate);
      contextCandidateRef.current = initialContextCandidate;
    }
    if (initialContextJob) setContextJob(initialContextJob);
  }, [initialContextCandidate, initialContextJob]);

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
              text: `Hello ${currentUser?.name || ''}! I am **Ask SparkX**, your AI career copilot. Ask me about the status of your applications, interview preparation points, or role requirements.`,
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
                : `Hello! I am **Ask SparkX**, your recruitment intelligence copilot. I am connected directly to your pipeline (${candidates.length} candidates, ${jobs.length} open roles). Ask me about candidate status, pipeline bottlenecks, skill gaps, or role matching.`,
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
            text: 'Hello! I am **Ask SparkX**, your AI recruitment intelligence copilot. How can I help you today?',
            databaseFacts: [],
            metrics: [],
            aiInterpretation: 'I can help you review candidate dossiers, detect skill gaps, analyze coding submissions, or uncover pipeline bottlenecks. Feel free to ask about any candidate or job role!',
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
            text: 'I am the **SparkX Recruitment Copilot**, powered by real-time database grounding and AI synthesis.',
            databaseFacts: [],
            metrics: [],
            aiInterpretation: 'Here is what I can do for you:\n• Candidate Deep-Dives: "Tell me about Aarav" or "What are Priya\'s skill gaps?"\n• Action Items: "Which candidates need action today?"\n• Skill Search: "Which applicants know Python and React?"\n• Integrity Checks: "Are there any high-risk proctor flags?"\n• Pipeline Bottlenecks: "Where are candidates getting stuck?"',
            uncertainty: ''
          }
        ]);
        setIsProcessing(false);
      }, 200);
      return;
    }

    // Eagerly check if query explicitly mentions any candidate name or token
    let eagerCandidate = candidates.find(c => c.name && q.includes(c.name.toLowerCase()));
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

    const candidateIdForQuery = eagerCandidate?.id || contextCandidateRef.current?.id || contextCandidate?.id;

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
        aiResponse.aiInterpretation = `I analyzed your query against the recruitment database (${candidates.length} candidates, ${jobs.length} jobs). You can ask me to evaluate specific candidates (e.g. "Tell me about Aarav"), check candidate skill gaps, review pending action items, or inspect pipeline bottlenecks.`;
        aiResponse.uncertainty = '';
      }

      setConversation(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 300);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim()
    };
    setConversation(prev => [...prev, userMsg]);
    const qText = query.trim();
    setQuery('');
    processQuery(qText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Drawer Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Ask SparkX Recruitment Copilot"
        className="relative w-full max-w-xl bg-white dark:bg-[#14161F] border-l border-[#E8E8E4] dark:border-[#222634] shadow-depth-elevated flex flex-col z-10 animate-slide-in"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#E8E8E4] dark:border-[#222634] flex items-center justify-between bg-white dark:bg-[#14161F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-[#E8E8E4] dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 shadow-subtle">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ask SparkX Copilot</h2>
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#E8E8E4] dark:border-slate-700">
                  {userRole === 'candidate' ? 'Career Assistant' : 'Recruiter AI'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {userRole === 'candidate' 
                  ? 'Personalized application guidance & interview preparation' 
                  : 'Grounded recruitment intelligence with evidence paths'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            aria-label="Close Ask SparkX drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Context Banner */}
        {contextCandidate && (
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#0E1017] border-b border-[#E8E8E4] dark:border-[#222634] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Context:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate">{contextCandidate.name}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">({contextCandidate.jobTitle || 'Role'})</span>
            </div>
            <button
              type="button"
              onClick={() => setContextCandidate(null)}
              className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline shrink-0"
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
                  : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-subtle'
              }`}>
                <FormattedMarkdownText 
                  content={msg.text} 
                  className={msg.sender === 'user' ? 'text-white' : 'font-semibold text-slate-900 dark:text-white'} 
                />

                {/* Structured Evidence Callouts for AI messages */}
                {msg.sender === 'ai' && (msg.databaseFacts?.length > 0 || msg.metrics?.length > 0 || msg.aiInterpretation) && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
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
                                <li key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed bg-white dark:bg-[#0E121E] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 shadow-subtle">
                                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                  <div className="flex-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{key}:</span>{' '}
                                    <span className="text-slate-600 dark:text-slate-300">
                                      <FormattedMarkdownText content={val} />
                                    </span>
                                  </div>
                                </li>
                              );
                            }
                            return (
                              <li key={i} className="flex items-start gap-2 text-[11px] font-mono leading-relaxed bg-white dark:bg-[#0E121E] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 shadow-subtle">
                                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                <div className="flex-1 text-slate-600 dark:text-slate-300">
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
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Synthesis & Recruiter Briefing</span>
                        </span>
                        <div className="text-[11.5px] text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                          <FormattedMarkdownText content={msg.aiInterpretation} />
                        </div>
                      </div>
                    )}

                    {/* Uncertainty boundary */}
                    {msg.uncertainty && (
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 pt-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="text-slate-700 dark:text-slate-300">Confidence Boundary:</strong>{' '}
                          <FormattedMarkdownText content={msg.uncertainty} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 rounded-lg max-w-[220px]">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Querying database ledger...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts Pill Carousel */}
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0E18]">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">
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
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white dark:bg-[#0E121E] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap transition shrink-0 shadow-subtle"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E121E] flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={contextCandidate ? `Ask about ${contextCandidate.name}...` : "Ask about candidates, jobs, or pipeline status..."}
            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            aria-label="Ask SparkX prompt input"
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
