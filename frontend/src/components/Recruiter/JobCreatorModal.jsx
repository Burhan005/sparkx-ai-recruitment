import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Sparkles, X, Plus, CheckCircle2, 
  BrainCircuit, Sliders, ArrowRight,
  Code2, DollarSign, Users, TrendingUp,
  Target, ShieldCheck, FileSpreadsheet, Check
} from 'lucide-react';

const TRACK_CONFIGS = {
  technical: {
    id: 'technical',
    label: 'Engineering & Tech',
    department: 'Engineering',
    icon: Code2,
    isCoding: true,
    assessmentTitle: 'Practical Coding & System Architecture Assessment',
    assessmentDescription: 'Real-time live coding challenges, data structures, algorithmic puzzles, and edge-case assertion test suites.',
    educationPlaceholder: "Bachelor's or Master's in Computer Science, Software Engineering, or related field",
    skillsPlaceholder: 'e.g. Python, FastAPI, React, PyTorch, Docker, Kubernetes, PostgreSQL',
    descriptionPlaceholder: 'We are seeking an engineer to build and scale low-latency distributed microservices and mission-critical cloud pipelines...',
    deliverableType: 'Live Code Execution & Unit Test Assertions',
    rubrics: ['Algorithmic Efficiency (Big-O)', 'Concurrency & Thread Safety', 'Defensive Error Handling', 'Test Suite Coverage'],
    difficulties: ['Junior', 'Mid-Level', 'Senior', 'Staff / Lead'],
    defaultDifficulty: 'Mid-Level',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Technical Architecture & Concurrency',
        prompt: `In your production services utilizing ${pSkill}, how have you architected concurrency and asynchronous workers to prevent memory leaks and thread pool starvation under sudden traffic bursts?`
      },
      {
        id: 'q_gen_2',
        type: 'Distributed Reliability & Data Contracts',
        prompt: `Describe how you enforce strict API contracts, idempotency, and graceful schema migrations between ${pSkill} and ${sSkill} backends during multi-region deployments.`
      },
      {
        id: 'q_gen_3',
        type: 'Incident Triage & Architectural Post-Mortem',
        prompt: `Walk through a critical production regression or race condition you debugged in your ${exp}+ years of software development. What diagnostic telemetry isolated the root cause?`
      }
    ]
  },
  finance: {
    id: 'finance',
    label: 'Finance & Accounting',
    department: 'Finance & Accounting',
    icon: DollarSign,
    isCoding: false,
    assessmentTitle: 'Financial Modeling & Operational Audit Simulation',
    assessmentDescription: 'Case study analysis evaluating balance sheet reconciliation, US GAAP / IFRS compliance, variance modeling, and audit readiness.',
    educationPlaceholder: "Bachelor's / Master's in Finance, Accounting, Economics, or CPA / CA / CFA",
    skillsPlaceholder: 'e.g. US GAAP, Financial Modeling, IFRS, Tax Compliance, Budgeting, Excel, SAP, Ledger Reconciliation',
    descriptionPlaceholder: 'Seeking a senior financial specialist to manage ledger integrity, financial statements, tax reporting, and audit preparedness...',
    deliverableType: 'Variance Analysis & Financial Deliverable Submission',
    rubrics: ['Internal Controls & Fraud Prevention', 'US GAAP / IFRS Compliance', 'Variance Diagnosis & Modeling', 'Executive Financial Recommendations'],
    difficulties: ['Junior Analyst', 'Mid-Level Specialist', 'Senior Controller', 'Director / VP'],
    defaultDifficulty: 'Mid-Level Specialist',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Internal Controls & Regulatory Compliance',
        prompt: `When managing core processes under ${pSkill}, what internal controls and segregation of duties do you establish to prevent revenue leakage and audit discrepancies?`
      },
      {
        id: 'q_gen_2',
        type: 'Ledger Variance & Diagnostic Audit',
        prompt: `Walk through an instance where significant ledger variance or unbudgeted discrepancy emerged involving ${sSkill}. What investigative methodology resolved the root cause?`
      },
      {
        id: 'q_gen_3',
        type: 'Executive Capital Allocation & Trade-offs',
        prompt: `In your ${exp}+ years in finance, how do you defend fiscal constraints when department heads demand aggressive budget expansion exceeding quarterly cash flow projections?`
      }
    ]
  },
  hr: {
    id: 'hr',
    label: 'HR & Talent',
    department: 'Human Resources',
    icon: Users,
    isCoding: false,
    assessmentTitle: 'Workplace Scenario & Talent Strategy Simulation',
    assessmentDescription: 'Simulations testing conflict de-escalation, labor law adherence, organizational restructuring, and executive retention planning.',
    educationPlaceholder: "Bachelor's or Master's in Human Resources, Business Administration (MBA), or Organizational Psychology",
    skillsPlaceholder: 'e.g. Talent Acquisition, Employee Relations, Compensation & Benefits, HRBP, Conflict Resolution, Labor Law',
    descriptionPlaceholder: 'Looking for an experienced HRBP to direct talent strategy, organizational development, employee relations, and retention initiatives...',
    deliverableType: 'Workplace Scenario Resolution & Action Plan',
    rubrics: ['De-escalation & Mediation', 'Labor Law Adherence & Confidentiality', 'Strategic Workforce Planning', 'Culture & Retention Impact'],
    difficulties: ['Associate Recruiter / HR', 'Mid-Level HRBP', 'Senior People Lead', 'Head of People / VP'],
    defaultDifficulty: 'Mid-Level HRBP',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Workplace Conflict & Policy Investigation',
        prompt: `In managing sensitive employee relations involving ${pSkill}, what confidential investigation framework do you apply to resolve grievances while ensuring labor law compliance?`
      },
      {
        id: 'q_gen_2',
        type: 'Strategic Retention & Org Architecture',
        prompt: `When high-impact team members critical to ${sSkill} exhibit flight risk, what compensation, leveling, and organizational interventions do you deploy to structurally retain talent?`
      },
      {
        id: 'q_gen_3',
        type: 'Executive Alignment & Change Management',
        prompt: `Across your ${exp}+ years in people operations, how do you handle situations where senior executive decisions conflict with established workplace equity and compliance policies?`
      }
    ]
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing & Growth',
    department: 'Marketing & Growth',
    icon: TrendingUp,
    isCoding: false,
    assessmentTitle: 'Growth Strategy & Campaign Optimization Deliverable',
    assessmentDescription: 'Case study analyzing customer acquisition cost (CAC), lifetime value (LTV), attribution modeling, and multi-channel campaign turnarounds.',
    educationPlaceholder: "Bachelor's or Master's in Marketing, Communications, Business, or related discipline",
    skillsPlaceholder: 'e.g. SEO/SEM, Performance Marketing, Customer Acquisition (CAC/LTV), Content Strategy, Google Analytics, Attribution',
    descriptionPlaceholder: 'Leading end-to-end growth strategy, paid acquisition, lifecycle funnels, and organic brand expansion...',
    deliverableType: 'Growth Model & GTM Strategy Deliverable',
    rubrics: ['Unit Economics (CAC/LTV/ROAS)', 'Attribution & Funnel Analytics', 'A/B Testing Rigor', 'Creative & Brand Positioning'],
    difficulties: ['Growth Associate', 'Mid-Level Strategist', 'Growth Lead / Manager', 'VP of Marketing'],
    defaultDifficulty: 'Mid-Level Strategist',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Growth Unit Economics & Payback Modeling',
        prompt: `When scaling growth initiatives leveraging ${pSkill}, how do you model customer acquisition cost (CAC) and lifetime value (LTV) to protect payback periods and avoid diminishing channel ROAS?`
      },
      {
        id: 'q_gen_2',
        type: 'Funnel Optimization & Hypothesis Testing',
        prompt: `Describe an A/B experimentation sequence or conversion funnel restructuring with ${sSkill} where initial tests underperformed. How did you isolate drop-off friction and pivot?`
      },
      {
        id: 'q_gen_3',
        type: 'Brand Equity vs Direct Response Allocation',
        prompt: `With ${exp}+ years in marketing, how do you establish consensus between immediate short-term lead gen quotas and essential long-term brand equity investment?`
      }
    ]
  },
  sales: {
    id: 'sales',
    label: 'Sales & BD',
    department: 'Sales & Business Development',
    icon: Target,
    isCoding: false,
    assessmentTitle: 'Enterprise Deal Strategy & Objection Simulation',
    assessmentDescription: 'Simulations testing MEDDPICC deal qualification, competitive objection handling, executive pitch structure, and contract negotiation.',
    educationPlaceholder: "Bachelor's in Business Administration, Marketing, Economics, or proven enterprise sales track record",
    skillsPlaceholder: 'e.g. B2B Enterprise Sales, Pipeline Management, MEDDPICC, Contract Negotiation, CRM (Salesforce), Account Strategy',
    descriptionPlaceholder: 'Driving enterprise software revenue expansion, closing 6-figure ARR opportunities, and managing complex multi-stakeholder deals...',
    deliverableType: 'Deal Strategy & Pitch Simulation Deliverable',
    rubrics: ['Discovery & Value Quantification', 'Objection Handling & Differentiation', 'MEDDPICC Qualification Rigor', 'Contract Negotiation & Closing'],
    difficulties: ['BDR / SDR', 'Mid-Market AE', 'Enterprise Strategic AE', 'VP / Head of Sales'],
    defaultDifficulty: 'Mid-Market AE',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Enterprise Opportunity Qualification',
        prompt: `When quarterbacking complex deals requiring ${pSkill}, how do you apply qualification frameworks (such as MEDDPICC) to validate economic buyers and eliminate stalled pipeline early?`
      },
      {
        id: 'q_gen_2',
        type: 'Competitive Objection Handling & Margin Defense',
        prompt: `Describe a high-stakes negotiation involving ${sSkill} where the enterprise prospect leveraged an aggressive competitor's discount. What strategy preserved deal value and closed the contract?`
      },
      {
        id: 'q_gen_3',
        type: 'Forecast Integrity & Multi-Stakeholder Alignment',
        prompt: `In your ${exp}+ years closing revenue, how do you ensure forecast accuracy when enterprise deals get caught in protracted legal redlining or security reviews?`
      }
    ]
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    department: 'Operations & Supply Chain',
    icon: Sliders,
    isCoding: false,
    assessmentTitle: 'Process Optimization & SLA Governance Simulation',
    assessmentDescription: 'Evaluates process bottleneck identification, Lean Six Sigma methodologies, vendor contingency management, and SLA enforcement.',
    educationPlaceholder: "Bachelor's in Operations Management, Industrial Engineering, Supply Chain, or MBA",
    skillsPlaceholder: 'e.g. Process Optimization, Lean Six Sigma, Vendor Management, SLA Compliance, Logistics, ERP, Workflow Automation',
    descriptionPlaceholder: 'Spearheading cross-functional operational workflows, vendor management, and SLA governance to eliminate process bottlenecks...',
    deliverableType: 'Bottleneck Audit & SLA Remediation Plan',
    rubrics: ['Cycle-Time & Bottleneck Identification', 'Vendor SLA Enforcement', 'Lean / Continuous Improvement', 'Contingency & Risk Mitigation'],
    difficulties: ['Operations Associate', 'Operations Manager', 'Senior Ops Lead', 'Director of Operations'],
    defaultDifficulty: 'Operations Manager',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Cycle-Time & Bottleneck Optimization',
        prompt: `How do you diagnose throughput bottlenecks in operational workflows utilizing ${pSkill}, and what metrics (e.g. cycle time, error rate) confirm structural resolution?`
      },
      {
        id: 'q_gen_2',
        type: 'Vendor SLA Breach & Crisis Remediation',
        prompt: `Describe an unforeseen vendor outage or supply chain failure under ${sSkill}. What immediate triage and contingency workflows did you execute within 24 hours?`
      },
      {
        id: 'q_gen_3',
        type: 'Scaling Standardized Operating Procedures',
        prompt: `Across your ${exp}+ years in operations, how do you implement Lean continuous improvement disciplines across distributed teams without inducing bureaucratic inertia?`
      }
    ]
  },
  product: {
    id: 'product',
    label: 'Product & UX',
    department: 'Product & Design',
    icon: Sparkles,
    isCoding: false,
    assessmentTitle: 'Product PRD & User Experience Simulation',
    assessmentDescription: 'Evaluates product requirement definition, UX wireframe critique, metric prioritization (North Star, retention), and technical feasibility trade-offs.',
    educationPlaceholder: "Bachelor's or Master's in Product Design, Human-Computer Interaction (HCI), Computer Science, or MBA",
    skillsPlaceholder: 'e.g. Product Strategy, PRD Writing, User Research, Wireframing, Figma, North Star Metrics, Agile Scrum',
    descriptionPlaceholder: 'Guiding end-to-end product vision, crafting detailed PRDs, conducting user research, and partnering with engineering to ship high-impact features...',
    deliverableType: 'Product Specification & User Journey Analysis',
    rubrics: ['User Problem Framing', 'North Star & Engagement Metrics', 'Technical Feasibility Trade-offs', 'Execution Scoping & Roadmapping'],
    difficulties: ['Associate PM / Designer', 'Product Manager / UX Lead', 'Senior Product Manager', 'VP of Product / Design'],
    defaultDifficulty: 'Product Manager / UX Lead',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Roadmap Prioritization & Technical Debt',
        prompt: `When defining product scope for ${pSkill}, what framework do you use to balance critical customer feature requests against vital technical debt and infrastructure work?`
      },
      {
        id: 'q_gen_2',
        type: 'Metrics Divergence & UX Iteration',
        prompt: `Describe a product feature launch involving ${sSkill} where telemetry analytics diverged from qualitative user interview feedback. How did you diagnose the disconnect and iterate?`
      },
      {
        id: 'q_gen_3',
        type: 'Cross-Functional Stakeholder Alignment',
        prompt: `In your ${exp}+ years in product, how do you navigate disputes when go-to-market teams promise custom features that exceed engineering sprint capacity?`
      }
    ]
  },
  legal: {
    id: 'legal',
    label: 'Legal & Compliance',
    department: 'Legal & Compliance',
    icon: ShieldCheck,
    isCoding: false,
    assessmentTitle: 'Commercial Contract Redline & Regulatory Audit',
    assessmentDescription: 'Case study analyzing commercial indemnification limits, GDPR / data sovereignty compliance, IP assignment, and regulatory risk mitigation.',
    educationPlaceholder: "LL.B, LL.M, Juris Doctor (J.D.), or equivalent legal credential",
    skillsPlaceholder: 'e.g. Commercial Contracts, GDPR/Data Privacy, Corporate Governance, IP Protection, Regulatory Compliance, Redlining',
    descriptionPlaceholder: 'Leading commercial contract negotiation, regulatory data privacy oversight, risk assessment, and corporate governance...',
    deliverableType: 'Contract Redlining & Risk Matrix Deliverable',
    rubrics: ['Indemnification & Liability Capping', 'Regulatory / Privacy Compliance (GDPR/CCPA)', 'IP Protection & Assignment', 'Commercial Velocity Balance'],
    difficulties: ['Legal Counsel', 'Senior Commercial Counsel', 'Compliance Officer', 'General Counsel / VP'],
    defaultDifficulty: 'Senior Commercial Counsel',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Commercial Risk & Liability Mitigation',
        prompt: `In negotiating enterprise vendor agreements involving ${pSkill}, what non-negotiable clauses do you mandate regarding uncapped indemnification, warranties, and consequential damages?`
      },
      {
        id: 'q_gen_2',
        type: 'Regulatory Compliance & Privacy Enforcement',
        prompt: `Walk through a multi-jurisdictional compliance or data transfer issue involving ${sSkill} (e.g. GDPR, DPDP, HIPAA). How did you resolve legal exposure without stalling business operations?`
      },
      {
        id: 'q_gen_3',
        type: 'Crisis Governance & Internal Disclosure',
        prompt: `With your ${exp}+ years in legal and compliance, what is your triage playbook when an internal audit discovers potential regulatory non-compliance or contract breach?`
      }
    ]
  }
};

function detectTrackFromText(title = '', department = '') {
  const text = `${title} ${department}`.toLowerCase();
  
  if (/finance|account|controller|cpa|tax|audit|treasury|fp&a|bookkeep|ledger|payroll|cfo/i.test(text)) {
    return 'finance';
  }
  if (/human resource|\bhr\b|talent|recruiter|recruiting|people ops|people partner|hrbp|workforce|employee relation/i.test(text)) {
    return 'hr';
  }
  if (/market|growth|seo|sem|content|copywriter|social media|brand|acquisition|campaign|demand gen/i.test(text)) {
    return 'marketing';
  }
  if (/sales|business dev|account exec|bdr|sdr|closing|enterprise rep|commercial rep|revenue/i.test(text)) {
    return 'sales';
  }
  if (/operations|supply chain|logistics|procurement|inventory|facilities|warehouse|ops manager|scrum master|agile coach/i.test(text)) {
    return 'operations';
  }
  if (/product manager|product owner|ui\/ux|ux designer|product designer|user research|figma/i.test(text)) {
    return 'product';
  }
  if (/legal|counsel|compliance|regulatory|attorney|lawyer|paralegal|contracts|governance/i.test(text)) {
    return 'legal';
  }
  if (/software|engineer|developer|architect|backend|frontend|fullstack|devops|cloud|data engineer|data scientist|ml|ai|qa|tester|sre|security engineer|system engineer/i.test(text)) {
    return 'technical';
  }
  return null;
}

export default function JobCreatorModal({ isOpen, onClose }) {
  const { createJob } = useRecruitment();
  const [roleTrack, setRoleTrack] = useState('technical');
  const [hasManuallySelectedTrack, setHasManuallySelectedTrack] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    experience: '3-5 years',
    minExperienceYears: 3,
    education: TRACK_CONFIGS.technical.educationPlaceholder,
    description: '',
    requiredSkills: '',
    languages: ['Python', 'JavaScript', 'TypeScript'],
    codingDifficulty: 'Mid-Level',
    status: 'Active'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentTrack = TRACK_CONFIGS[roleTrack] || TRACK_CONFIGS.technical;

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle manual track selection
  const handleSelectTrack = (trackKey) => {
    const targetConfig = TRACK_CONFIGS[trackKey];
    if (!targetConfig) return;

    setRoleTrack(trackKey);
    setHasManuallySelectedTrack(true);
    setGeneratedQuestions([]); // Clear questions preview to reflect new track

    setFormData(prev => {
      // Check if current department or education were default
      const prevConfig = TRACK_CONFIGS[roleTrack];
      const isPrevEdu = !prev.education || (prevConfig && prev.education === prevConfig.educationPlaceholder);
      const isPrevDept = !prev.department || (prevConfig && prev.department === prevConfig.department);

      return {
        ...prev,
        department: isPrevDept ? targetConfig.department : prev.department,
        education: isPrevEdu ? targetConfig.educationPlaceholder : prev.education,
        codingDifficulty: targetConfig.defaultDifficulty,
        languages: targetConfig.isCoding ? (prev.languages?.length ? prev.languages : ['Python', 'JavaScript', 'TypeScript']) : []
      };
    });
  };

  // Handle title change with auto-track detection (if user hasn't manually locked)
  const handleTitleChange = (newTitle) => {
    setFormData(prev => ({ ...prev, title: newTitle }));
    if (!hasManuallySelectedTrack) {
      const detected = detectTrackFromText(newTitle, formData.department);
      if (detected && detected !== roleTrack) {
        const targetConfig = TRACK_CONFIGS[detected];
        setRoleTrack(detected);
        setGeneratedQuestions([]);
        setFormData(prev => ({
          ...prev,
          title: newTitle,
          department: targetConfig.department,
          education: targetConfig.educationPlaceholder,
          codingDifficulty: targetConfig.defaultDifficulty,
          languages: targetConfig.isCoding ? ['Python', 'JavaScript', 'TypeScript'] : []
        }));
      }
    }
  };

  if (!isOpen) return null;

  const toggleLanguage = (lang) => {
    setFormData(prev => {
      const current = prev.languages || [];
      const updated = current.includes(lang)
        ? (current.length > 1 ? current.filter(l => l !== lang) : current)
        : [...current, lang];
      return { ...prev, languages: updated };
    });
  };

  const handleGenerateAIQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const skills = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const mainSkill = skills[0] || (currentTrack.isCoding ? 'System Architecture' : 'Strategic Governance');
      const secSkill = skills[1] || (currentTrack.isCoding ? 'High-Throughput Concurrency' : 'Risk Management');
      const exp = formData.minExperienceYears || 3;

      const questions = currentTrack.generateQuestions(mainSkill, secSkill, exp);
      setGeneratedQuestions(questions);
      setIsGenerating(false);
    }, 700);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const defaultFallbackSkills = currentTrack.isCoding 
      ? ['System Architecture', 'Algorithms', 'Debugging'] 
      : ['Strategic Analysis', 'Operational Governance', 'Executive Communication'];

    const effectiveSkills = skillsArray.length ? skillsArray : defaultFallbackSkills;
    const isCoding = currentTrack.isCoding;

    const newJob = {
      id: `job-${Date.now()}`,
      title: formData.title,
      department: formData.department,
      location: formData.location,
      experience: `${formData.minExperienceYears}+ years`,
      minExperienceYears: Number(formData.minExperienceYears),
      education: formData.education,
      description: formData.description || `We are looking for an exceptional ${formData.title} to join our high-impact team.`,
      requiredSkills: effectiveSkills,
      languages: isCoding ? (formData.languages || ['Python', 'JavaScript']) : [],
      codingDifficulty: isCoding ? formData.codingDifficulty : null,
      coding_difficulty: isCoding ? formData.codingDifficulty : null,
      is_coding: isCoding,
      codingAssessment: isCoding ? {
        title: `${formData.title} Practical Task`,
        language: (formData.languages?.[0] || 'JavaScript').toLowerCase(),
        is_coding: true,
        instructions: "Implement the core handler and system logic.",
        initialCode: "function handler(data) {\n  return data;\n}"
      } : {
        title: currentTrack.assessmentTitle,
        is_coding: false,
        domain_category: roleTrack,
        deliverable_type: currentTrack.deliverableType,
        rubrics: currentTrack.rubrics,
        instructions: `Review the operational scenario and provide an executive deliverable for ${formData.title}.`,
        initialCode: "Provide executive summary, core analysis, and action recommendations."
      },
      questions: generatedQuestions.length > 0 ? generatedQuestions : currentTrack.generateQuestions(
        effectiveSkills[0] || 'Core Domain Competence',
        effectiveSkills[1] || 'Specialized Execution',
        formData.minExperienceYears || 3
      ),
      status: 'Active'
    };

    createJob(newJob);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 sm:p-8 text-slate-900 dark:text-slate-100 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Iridescent top hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Job Requirement</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Domain-aware profile synthesis & tailored adaptive assessment generation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Track Selector */}
        <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] shadow-inner">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Role Track & Assessment Domain
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                currentTrack.isCoding 
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {currentTrack.isCoding ? 'Coding Challenges' : 'Executive Simulation (Non-Coding)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Auto-detects from title or select manually
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(TRACK_CONFIGS).map(([key, cfg]) => {
              const IconComponent = cfg.icon;
              const isSelected = roleTrack === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectTrack(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition border flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder={currentTrack.isCoding ? "e.g. Senior Backend Engineer" : "e.g. Senior Financial Controller & Tax Auditor"}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department *</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Min Experience (Years) *</label>
              <input
                type="number"
                min="0"
                max="25"
                value={formData.minExperienceYears}
                onChange={e => setFormData({ ...formData, minExperienceYears: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Required Skills (Comma separated) *</label>
            <input
              type="text"
              value={formData.requiredSkills}
              onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
              placeholder={currentTrack.skillsPlaceholder}
              required
            />
          </div>

          {/* DYNAMIC ASSESSMENT SECTION: CONDITIONAL CODING VS NON-CODING */}
          {currentTrack.isCoding ? (
            /* TECHNICAL TRACK: Coding languages & challenge difficulty */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-3 shadow-inner">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supported Programming Languages for Coding Assessment *
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Candidates can select any of these allowed languages to complete their technical tasks.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL'].map(lang => {
                    const isChecked = (formData.languages || []).includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-1.5 ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <span>{isChecked ? '✓' : '+'}</span>
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Coding Assessment Difficulty:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentTrack.difficulties.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, codingDifficulty: lvl })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                        formData.codingDifficulty === lvl
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* NON-TECHNICAL TRACK: Domain Simulation & Deliverable Rubrics */
            <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-inner">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <currentTrack.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentTrack.assessmentTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {currentTrack.assessmentDescription}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                  No Code Required
                </span>
              </div>

              {/* Rubric chips */}
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/30">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Automated Evaluation Rubric Focus:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentTrack.rubrics.map((r, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 text-slate-700 dark:text-slate-300 flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{r}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulation Seniority Level */}
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Study Seniority Level:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentTrack.difficulties.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, codingDifficulty: lvl })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                        formData.codingDifficulty === lvl
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Education Qualification *</label>
            <input
              type="text"
              value={formData.education}
              onChange={e => setFormData({ ...formData, education: e.target.value })}
              placeholder={currentTrack.educationPlaceholder}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={currentTrack.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
            />
          </div>

          {/* AI Question Generation trigger */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-indigo-200 dark:border-indigo-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>AI Interview Question & Assessment Generator</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically synthesizes authentic {currentTrack.label.toLowerCase()} interview questions tailored for this role.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAIQuestions}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Synthesizing..." : "Preview Questions"}</span>
            </button>
          </div>

          {/* Questions preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-[#06080E] rounded-2xl border border-slate-200 dark:border-white/[0.06]">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Generated Adaptive Question Set ({generatedQuestions.length})
              </span>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id || idx} className="text-xs p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 shadow-sm">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Q{idx+1}: {q.type}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Adaptive Probe Ready
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">{q.prompt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Requirement Created!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Requirement</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
