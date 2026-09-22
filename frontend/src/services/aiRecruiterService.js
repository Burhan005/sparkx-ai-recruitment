// AI Recruiter Service: Dynamic Evaluation & Adaptive Questioning
// NO HARDCODED SCORES — every score is computed live from the candidate's actual text.
import { fuzzySkillMatch } from '../utils/skillMatcher';

const TECH_ENTITIES = {
  redis: "Redis caching & in-memory data structures",
  kafka: "Apache Kafka event streaming & partition offsets",
  docker: "Docker container virtualization",
  kubernetes: "Kubernetes pod orchestration & cluster ingress",
  postgres: "PostgreSQL relational query optimization",
  postgresql: "PostgreSQL relational query optimization",
  mongodb: "MongoDB document sharding & replica sets",
  mysql: "MySQL transaction isolation",
  graphql: "GraphQL schema design & N+1 batch loading",
  grpc: "gRPC protocol buffer streaming",
  websocket: "WebSocket bidirectional frame streaming",
  fastapi: "FastAPI asynchronous event loops",
  react: "React virtual DOM diffing & state reconciliation",
  node: "Node.js non-blocking asynchronous I/O",
  typescript: "TypeScript strict type enforcement",
  jwt: "JWT bearer tokens & cryptographic signature verification",
  oauth: "OAuth2 / OIDC authorization flows",
  caching: "distributed cache invalidation & TTL policies",
  microservices: "microservice service boundaries & network partitions",
  aws: "AWS cloud infrastructure & IAM policy isolation"
};

const UNSURE_PATTERNS = [
  /\bidk\b/i, /\bi don't know\b/i, /\bi dont know\b/i, /\bno idea\b/i, /\bnot sure\b/i,
  /\bnot familiar\b/i, /\bhaven't used\b/i, /\bhavent used\b/i, /\bnever used\b/i,
  /\bpass\b/i, /\bskip\b/i, /\bno clue\b/i, /\bcan't answer\b/i, /\bcant answer\b/i,
  /\bnot worked with\b/i, /\bhaven't worked with\b/i, /\bhavent worked with\b/i,
  /\bnot experienced\b/i, /\bno experience\b/i, /\bunfamiliar\b/i,
  /^\s*no\s*$/i, /^\s*nope\s*$/i, /^\s*nah\s*$/i
];

const TERMINAL_PATTERNS = [
  /\bbye\b/i, /\bbye bye\b/i, /\bexit\b/i, /\bquit\b/i, /\bstop\b/i,
  /\bend\b/i, /\bleave\b/i, /\bterminate\b/i, /\bwhat the hell\b/i,
  /\bclose interview\b/i, /\bfinish\b/i
];

export function generateQuestionsForRole(roleTitle, skills, experienceYears = 2, candidateName = 'Candidate') {
  const skillList = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const primarySkill = skillList[0] || "System Architecture";
  const secondarySkill = skillList[1] || (skillList[0] || "Database Optimization");

  return [
    {
      id: "gen-q1",
      type: "Technical Competence & Concurrency",
      prompt: `In your production work with ${primarySkill}, how have you architected services to handle high concurrency and prevent memory leaks or thread starvation under sudden traffic bursts?`,
      idealKeywords: [primarySkill.toLowerCase(), "concurrency", "optimization", "monitoring", "latency", "async", "cache", "throughput"],
      followUpVague: `In a system leveraging ${primarySkill}, what specific profiling tools or metrics would you use to detect memory or CPU bottlenecks?`,
      followUpExpert: `Under a 10x traffic spike on ${primarySkill}, what backpressure and circuit-breaker patterns did you implement?`
    },
    {
      id: "gen-q2",
      type: "Distributed Architecture & Modular Boundaries",
      prompt: `How do you design modular communication between ${primarySkill} services and ${secondarySkill} backends while enforcing strict schema contracts and security boundaries?`,
      idealKeywords: ["api", "contract", "schema", "validation", "security", "token", "encryption", secondarySkill.toLowerCase()],
      followUpVague: `What serialization protocol and error retry policies did you configure between ${primarySkill} and ${secondarySkill}?`,
      followUpExpert: `What eventual consistency or saga pattern did you implement when ${secondarySkill} encounters a network partition?`
    },
    {
      id: "gen-q3",
      type: "Production Incident Triage & Root Cause",
      prompt: `Walk me through a severe production outage or silent performance degradation you investigated in your past ${experienceYears}+ years of work. What was your root-cause analysis procedure?`,
      idealKeywords: ["root cause", "post-mortem", "logs", "telemetry", "tracing", "remediation", "prevention", "metrics"],
      followUpVague: `What specific observability tools or telemetry traces pointed you to the root cause rather than guesswork?`,
      followUpExpert: `What automated canary checks or regression suites were deployed in CI/CD to guarantee that failure mode never recurs?`
    }
  ];
}

export function evaluateAnswerAndAdapt(question, answer) {
  if (!answer || answer.trim().length === 0) {
    return {
      needsFollowUp: true,
      followUpQuestion: "We didn't catch that clearly. Could you summarize your core technical approach in 2-3 sentences?",
      quality: "empty",
      feedback: "Answer was empty or too brief to evaluate."
    };
  }

  const answerTrimmed = answer.trim();
  const words = answerTrimmed.split(/\s+/);
  const wordCount = words.length;
  const answerLower = answerTrimmed.toLowerCase();
  const primaryTopic = question?.idealKeywords?.[0] || "this architecture";

  // Case 0: Detect terminal exit requests ("bye", "quit", "what the hell")
  const isTerminal = TERMINAL_PATTERNS.some(p => p.test(answerTrimmed));
  if (isTerminal) {
    return {
      needsFollowUp: false,
      followUpQuestion: null,
      quality: "terminal_exit",
      feedback: "Candidate concluded response. Advancing session."
    };
  }

  // Case 1: Detect explicit admissions of uncertainty / lack of knowledge ("idk", "I don't know")
  // Do NOT trap the candidate in follow-up loops — advance smoothly
  const isUnsure = UNSURE_PATTERNS.some(p => p.test(answerTrimmed));
  if (isUnsure) {
    return {
      needsFollowUp: false,
      followUpQuestion: null,
      quality: "acknowledged_gap",
      feedback: `Candidate transparently acknowledged unfamiliarity with ${primaryTopic}. Moving forward.`
    };
  }

  // Case 2: Detect non-words / gibberish (e.g. 'asdfghj' or repetitive chars)
  const isGibberish = (wordCount < 3 && answerTrimmed.length > 15) || !/[aeiouAEIOU]/.test(answerTrimmed);
  if (isGibberish) {
    return {
      needsFollowUp: true,
      followUpQuestion: "That didn't come through clearly. Could you summarize your core technical approach or design choice in 2-3 sentences?",
      quality: "gibberish",
      feedback: "Unclear or random input detected. Prompting for technical clarity."
    };
  }
  
  // Case 3: Check if candidate specifically referenced a technical tool/concept
  let matchedEntity = null;
  for (const [k, v] of Object.entries(TECH_ENTITIES)) {
    if (new RegExp(`\\b${k}\\b`, 'i').test(answerLower)) {
      matchedEntity = v;
      break;
    }
  }

  if (wordCount < 25 && matchedEntity) {
    const entityProbes = [
      `You specifically highlighted using ${matchedEntity}. What were the key production trade-offs or constraints you navigated when implementing that?`,
      `Regarding ${matchedEntity}, how did your team ensure high availability, monitoring, and failover under peak traffic loads?`,
      `When operating with ${matchedEntity}, what failure modes or unexpected edge cases did your team have to architect around?`
    ];
    return {
      needsFollowUp: true,
      followUpQuestion: entityProbes[answerTrimmed.length % entityProbes.length],
      quality: "targeted_mention",
      feedback: `Candidate referenced ${matchedEntity}. Context-aware deep-dive dispatched.`
    };
  }

  // Count matching ideal keywords
  const matchedKeywords = (question?.idealKeywords || []).filter(kw => 
    answerLower.includes(kw.toLowerCase())
  );

  // Case 4: Vague / high-level response (< 20 words or no keywords matched)
  if (wordCount < 20 || matchedKeywords.length === 0) {
    const vagueProbes = [
      question?.followUpVague || `Could you elaborate on the specific tools, telemetry metrics, or frameworks you relied on in that scenario?`,
      `In terms of production reliability, what was the biggest technical constraint or bottleneck you had to engineer around in that scenario?`,
      `What specific error handling, retry policies, or test suites did you implement to validate that approach?`
    ];
    return {
      needsFollowUp: true,
      followUpQuestion: vagueProbes[answerTrimmed.length % vagueProbes.length],
      quality: "vague",
      matchedKeywords,
      feedback: `Answer was high-level (${wordCount} words). Targeted probing question dispatched.`
    };
  }

  // Case 5: Strong technical depth shown (>= 2 keywords, >= 25 words)
  if (matchedKeywords.length >= 2 && wordCount >= 25) {
    const kwStr = matchedKeywords.slice(0, 2).join(', ');
    const advancedProbes = [
      question?.followUpExpert || `You highlighted ${kwStr}. How do you safeguard this architecture under 10x traffic spikes and automated failover?`,
      `Given your experience with ${kwStr}, how would you architect automated canary deployments and zero-downtime rollbacks if a regression is detected?`,
      `That's a sound architectural design for ${kwStr}. What automated alerts and telemetry thresholds do you configure to catch degradation before users notice?`
    ];
    return {
      needsFollowUp: true,
      followUpQuestion: advancedProbes[answerTrimmed.length % advancedProbes.length],
      quality: "advanced",
      matchedKeywords,
      feedback: `Strong technical depth shown on ${kwStr}. Initiating scenario-based stress test.`
    };
  }

  // Case 6: Functional standard answer
  return {
    needsFollowUp: false,
    quality: "solid",
    matchedKeywords,
    feedback: "Answer demonstrates clear functional competency and relevant knowledge."
  };
}

export function generateCandidateEvaluation({
  job,
  candidateName,
  resumeSkills = [],
  transcript = [],
  integrityScore = 100,
  integrityEvents = [],
  codeScore = 0
}) {
  const candidateEntries = transcript.filter(t => t.speaker === 'candidate');
  const requiredSkills = job?.requiredSkills || [];

  let technicalScore = 0;
  let communicationScore = 0;

  if (candidateEntries.length > 0) {
    let totalScore = 0;
    let totalWords = 0;

    candidateEntries.forEach(entry => {
      const text = entry.text || '';
      const words = text.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      // Check text quality & keyword match
      const lower = text.toLowerCase();
      const matched = requiredSkills.filter(s => lower.includes(s.toLowerCase()));
      const isGibberish = (words.length < 3 && text.length > 15) || !/[aeiouAEIOU]/.test(text);

      if (isGibberish) {
        totalScore += 15;
      } else if (words.length < 10) {
        totalScore += 30 + matched.length * 10;
      } else if (words.length < 25) {
        totalScore += 50 + matched.length * 15;
      } else {
        totalScore += 70 + Math.min(25, matched.length * 10);
      }
    });

    technicalScore = Math.min(98, Math.max(15, Math.round(totalScore / candidateEntries.length)));
    communicationScore = Math.min(98, Math.max(25, Math.round(30 + Math.min(60, totalWords * 1.2))));
  }

  let problemSolvingScore = 0;
  let jobSkillsScore = 0;
  let overall = 0;

  if (technicalScore > 0 || codeScore > 0) {
    problemSolvingScore = Math.min(98, Math.max(10, Math.round((technicalScore * 0.7) + (codeScore * 0.3))));
    jobSkillsScore = Math.round((technicalScore * 0.5) + (codeScore * 0.3) + (communicationScore * 0.2));
    overall = Math.round(
      (jobSkillsScore * 0.4) + 
      (technicalScore * 0.4) + 
      (communicationScore * 0.2)
    );
  } else {
    problemSolvingScore = 0;
    jobSkillsScore = 0;
    overall = 0;
  }

  // Skill Gap Analysis
  const candidateSkillsLower = (resumeSkills || []).map(s => s.toLowerCase());
  const transcriptTextLower = candidateEntries.map(t => t.text || '').join(' ').toLowerCase();

  const strongSkills = [];
  const missingSkills = [];

  requiredSkills.forEach(skill => {
    const sLower = skill.toLowerCase();
    if ((resumeSkills || []).some(cs => fuzzySkillMatch(cs, skill)) || transcriptTextLower.includes(sLower)) {
      strongSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const recommendations = [];
  if (missingSkills.length > 0) {
    missingSkills.forEach(skill => {
      recommendations.push(`Targeted upskilling in ${skill}: Complete hands-on module and architecture sandbox.`);
    });
  } else {
    recommendations.push("Demonstrated comprehensive coverage across all role competencies.");
  }

  let readiness = "Immediately Job-Ready";
  if (overall < 60 || missingSkills.length >= 3) {
    readiness = "Requires Core Upskilling (Skill Gap > 40%)";
  } else if (overall < 80 || missingSkills.length > 0) {
    readiness = "Hire-and-Develop (Trainable with 30-day onboarding)";
  }

  let integrityRisk = "Low";
  if (integrityScore < 60 || integrityEvents.some(e => e.type === "MULTIPLE_FACES")) {
    integrityRisk = "High";
  } else if (integrityScore < 80 || integrityEvents.filter(e => e.type === "TAB_SWITCH").length >= 2) {
    integrityRisk = "Medium";
  }

  const evidenceSnippets = candidateEntries
    .filter(t => (t.text || '').length > 10)
    .slice(0, 3)
    .map(t => ({
      question: t.relatedQuestion || "Assessment Dialogue",
      answer: t.text,
      aiInsight: `Analyzed dynamically — word count: ${(t.text || '').split(/\s+/).length}.`
    }));

  return {
    scores: {
      jobSkills: jobSkillsScore,
      technicalScore,
      communication: communicationScore,
      problemSolving: problemSolvingScore,
      overall
    },
    integrityScore,
    integrityRisk,
    interviewSummary: `Candidate completed the automated AI interview and assessment. Overall competency scored dynamically at ${overall}/100 with ${integrityScore}/100 integrity rating.`,
    evidenceSnippets,
    skillGaps: {
      strongSkills,
      missingSkills,
      recommendations,
      readiness
    }
  };
}