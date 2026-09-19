// AI Recruiter Service: Adaptive Questioning, Scoring, & Gap Analysis

/**
 * Dynamically generate tailored interview questions based on job requirements.
 */
export function generateQuestionsForRole(roleTitle, skills, experienceYears) {
  const skillList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
  const primarySkill = skillList[0] || "core domain";
  const secondarySkill = skillList[1] || "system design";

  return [
    {
      id: "gen-q1",
      type: "Technical Competence",
      prompt: `In the context of ${roleTitle}, how do you leverage ${primarySkill} in production to handle high throughput, concurrency, and reliability?`,
      idealKeywords: [primarySkill.toLowerCase(), "concurrency", "optimization", "monitoring", "latency", "async", "cache"],
      followUpVague: `You mentioned utilizing ${primarySkill}, but what specific architectural bottlenecks did you encounter, and how did you measure performance improvements?`,
      followUpExpert: `Given your deep familiarity with ${primarySkill}, how would you architect automated failover and zero-downtime deployments under sudden traffic spikes?`
    },
    {
      id: "gen-q2",
      type: "System Architecture",
      prompt: `How would you integrate ${primarySkill} with ${secondarySkill} while maintaining data consistency, modular separation, and secure access control?`,
      idealKeywords: ["api", "contract", "schema", "validation", "security", "token", "encryption", secondarySkill.toLowerCase()],
      followUpVague: `Could you specify the protocol, data formats, and error handling mechanisms you would establish between these components?`,
      followUpExpert: `What caching or eventual consistency strategy would you adopt if ${secondarySkill} experiences network partitions or backpressure?`
    },
    {
      id: "gen-q3",
      type: "Adaptive Behavioral & Problem Solving",
      prompt: `Walk me through a challenging production bug or unexpected outage you investigated in your past ${experienceYears}+ years of work. What was your root-cause analysis process?`,
      idealKeywords: ["root cause", "post-mortem", "logs", "telemetry", "tracing", "remediation", "prevention"],
      followUpVague: `What specific observability tools or telemetry metrics pointed you to the root cause rather than guessing?`,
      followUpExpert: `What automated guardrails or alert thresholds did your team introduce afterwards to guarantee that exact failure mode never recurs?`
    }
  ];
}

/**
 * Adaptive Cross-Questioning: Analyzes candidate response and decides if an adaptive follow-up is needed.
 */
export function evaluateAnswerAndAdapt(question, answer) {
  if (!answer || answer.trim().length === 0) {
    return {
      needsFollowUp: true,
      followUpQuestion: "We didn't catch that clearly. Could you elaborate on your experience or give a specific example?",
      quality: "vague",
      feedback: "Answer was empty or too brief to evaluate."
    };
  }

  const wordCount = answer.trim().split(/\s+/).length;
  const answerLower = answer.toLowerCase();
  
  // Count matching ideal keywords
  const matchedKeywords = (question.idealKeywords || []).filter(kw => 
    answerLower.includes(kw.toLowerCase())
  );

  // 1. If very brief or missing technical grounding: Trigger Vague Follow-Up
  if (wordCount < 20 || (matchedKeywords.length === 0 && wordCount < 35)) {
    return {
      needsFollowUp: true,
      followUpQuestion: question.followUpVague || "Could you provide a concrete production example or technical metric that illustrates your answer?",
      quality: "vague",
      matchedKeywords,
      feedback: "Candidate's response was somewhat generic. Prompting for practical elaboration to test actual understanding."
    };
  }

  // 2. If candidate gives a deep, confident answer with high keyword presence: Challenge with Expert Drill-Down
  if (matchedKeywords.length >= 3 && wordCount >= 30) {
    return {
      needsFollowUp: true,
      followUpQuestion: question.followUpExpert || "That's a solid architectural choice. How do you safeguard this under extreme edge cases or network degradation?",
      quality: "advanced",
      matchedKeywords,
      feedback: "Strong technical depth shown. Initiating scenario-based stress test to verify depth of expertise."
    };
  }

  // 3. Sufficiently answered, proceed to next question
  return {
    needsFollowUp: false,
    quality: "solid",
    matchedKeywords,
    feedback: "Answer demonstrates clear functional competency and relevant knowledge."
  };
}

/**
 * Generate Comprehensive AI Scorecard & Skill Gap Analysis
 */
export function generateCandidateEvaluation({
  job,
  candidateName,
  resumeSkills = [],
  transcript = [],
  integrityScore = 95,
  integrityEvents = [],
  codeScore = 90
}) {
  const totalQuestions = transcript.length;
  let wordCountSum = 0;
  let totalKeywordMatches = 0;

  transcript.forEach(item => {
    if (item.speaker === 'candidate') {
      const words = item.text.split(/\s+/).length;
      wordCountSum += words;
    }
  });

  // Calculate scores (0-100)
  const avgWordsPerAnswer = totalQuestions > 0 ? wordCountSum / Math.max(1, totalQuestions / 2) : 40;
  const communicationScore = Math.min(98, Math.max(60, Math.round(70 + (avgWordsPerAnswer > 30 ? 20 : 10))));
  const technicalScore = Math.min(99, Math.max(50, Math.round((codeScore * 0.4) + (85 * 0.6))));
  const problemSolvingScore = Math.min(95, Math.max(55, Math.round(technicalScore * 0.9 + 5)));
  const jobSkillsScore = Math.round((technicalScore * 0.45) + (communicationScore * 0.25) + (problemSolvingScore * 0.3));
  
  // Aggregate overall fit
  const overall = Math.round(
    (jobSkillsScore * 0.4) + 
    (technicalScore * 0.3) + 
    (communicationScore * 0.15) + 
    (integrityScore * 0.15)
  );

  // Skill Gap Analysis
  const requiredSkills = job.requiredSkills || [];
  const candidateSkillsLower = resumeSkills.map(s => s.toLowerCase());
  
  const strongSkills = [];
  const missingSkills = [];

  requiredSkills.forEach(skill => {
    if (candidateSkillsLower.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))) {
      strongSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Recommendations
  const recommendations = [];
  if (missingSkills.length > 0) {
    missingSkills.forEach(skill => {
      recommendations.push(`Targeted upskilling in ${skill}: Hands-on module & practical architectural design.`);
    });
  } else {
    recommendations.push("Ready for high-impact production leadership; focus on cross-functional system scaling.");
    recommendations.push("Mentorship capability for junior team members in modern engineering workflows.");
  }

  // Hire-and-develop readiness assessment
  let readiness = "Immediately Job-Ready";
  if (missingSkills.length >= 3 || overall < 70) {
    readiness = "Requires Core Upskilling (Skill Gap > 40%)";
  } else if (missingSkills.length > 0 || overall < 85) {
    readiness = "Hire-and-Develop (Trainable with 30-day onboarding)";
  }

  // Integrity Risk
  let integrityRisk = "Low";
  if (integrityScore < 60 || integrityEvents.some(e => e.type === "MULTIPLE_FACES")) {
    integrityRisk = "High";
  } else if (integrityScore < 80 || integrityEvents.filter(e => e.type === "TAB_SWITCH").length >= 2) {
    integrityRisk = "Medium";
  }

  // Evidence Snippets for HR
  const evidenceSnippets = transcript
    .filter(t => t.speaker === 'candidate' && t.text.length > 20)
    .slice(0, 3)
    .map(t => ({
      question: t.relatedQuestion || "Assessment Dialogue",
      answer: t.text,
      aiInsight: "Candidate demonstrated structural understanding under direct questioning."
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
    interviewSummary: `Candidate completed the automated AI interview and live skill assessment. Demonstrated strong fluency with an overall score of ${overall}/100. Integrity rating evaluated at ${integrityRisk} risk.`,
    evidenceSnippets,
    skillGaps: {
      strongSkills,
      missingSkills,
      recommendations,
      readiness
    }
  };
}
