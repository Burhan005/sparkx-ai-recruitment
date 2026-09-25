import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { formatJobCTC } from '../../utils/compensationFormatter';
import { 
  Sparkles, X, Plus, CheckCircle2, 
  BrainCircuit, Sliders, ArrowRight,
  Code2, DollarSign, Users, TrendingUp,
  Target, ShieldCheck, FileSpreadsheet, Check,
  Save, IndianRupee
} from 'lucide-react';

const TRACK_CONFIGS = {
  technical: {
    id: 'technical',
    label: 'Engineering & Tech',
    shortLabel: 'Engineering',
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
    shortLabel: 'Finance',
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
    shortLabel: 'HR & Talent',
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
    shortLabel: 'Marketing',
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
    shortLabel: 'Sales & BD',
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
    shortLabel: 'Operations',
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
    shortLabel: 'Product & UX',
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
    shortLabel: 'Legal',
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

const TECHNICAL_SUBTRACKS = {
  network: {
    id: 'network',
    label: 'Network & Security Engineering',
    assessmentTitle: 'Network Architecture, Protocol Analysis & Diagnostics Assessment',
    assessmentDescription: 'Network topology design, routing protocols (BGP, OSPF), VLANs/Subnetting, firewall ACL policies, packet capture analysis (Wireshark/tcpdump), and network automation.',
    educationPlaceholder: "Bachelor's in Computer Science, Telecommunications, Information Systems, or CCNA / CCNP / CCIE / Network+ credentials",
    skillsPlaceholder: 'e.g. BGP, OSPF, TCP/IP, VLANs, Subnetting/CIDR, Firewalls (Palo Alto/Fortinet), VPN/IPsec, Wireshark, Cisco IOS, Python/Netmiko',
    descriptionPlaceholder: 'Seeking a Network Engineer to architect resilient LAN/WAN topologies, manage routing/switching, enforce firewall security policies, and troubleshoot packet-level anomalies...',
    supportedLanguagesTitle: 'Supported Network Scripting & Configuration Tools *',
    supportedLanguagesDesc: 'Candidates can select any of these allowed network automation or configuration formats to complete their practical tasks.',
    availableLanguages: ['Python (Netmiko/Automation)', 'Bash / Shell', 'Cisco IOS / Network CLI', 'Ansible', 'JSON / YAML (NetOps)'],
    defaultLanguages: ['Python (Netmiko/Automation)', 'Bash / Shell', 'Cisco IOS / Network CLI'],
    rubrics: ['Routing & Protocol Convergence (BGP/OSPF)', 'Subnetting & CIDR Calculation', 'Firewall, ACL & VPN Security Policies', 'Packet Analysis & Diagnostic Triage (Wireshark/tcpdump)'],
    difficulties: ['Junior Network Associate', 'Network Engineer (CCNA/CCNP)', 'Senior Network Specialist', 'Principal Network Architect'],
    defaultDifficulty: 'Network Engineer (CCNA/CCNP)',
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Routing Convergence & Protocol Triage',
        prompt: `In an enterprise multi-homed WAN environment utilizing ${pSkill}, how do you diagnose and eliminate asymmetric routing and BGP route flapping during primary ISP link failover?`
      },
      {
        id: 'q_gen_2',
        type: 'Packet Analysis & Latency Diagnosis',
        prompt: `Walk through a network performance incident where users reported intermittent packet drops and latency spikes with ${sSkill}. What Wireshark/tcpdump capture telemetry isolated whether the root cause was MTU fragmentation, duplex mismatch, or TCP window exhaustion?`
      },
      {
        id: 'q_gen_3',
        type: 'Zero Trust Network Security & Segment Isolation',
        prompt: `Across your ${exp}+ years in networking, how do you architect micro-segmentation and strict firewall ACL policies to prevent lateral movement after an endpoint compromise?`
      }
    ]
  },
  devops: {
    id: 'devops',
    label: 'DevOps & Cloud Infrastructure',
    assessmentTitle: 'DevOps, Cloud Infrastructure & Reliability Engineering Assessment',
    assessmentDescription: 'Hands-on infrastructure automation, container orchestration (Docker/K8s), CI/CD pipelines, IaC state management, and production incident triage.',
    educationPlaceholder: "Bachelor's or Master's in Computer Science, Systems Engineering, Information Technology, or relevant cloud/DevOps experience",
    skillsPlaceholder: 'e.g. Kubernetes, Docker, Terraform, CI/CD, AWS / GCP, Bash / Shell, Prometheus, Grafana, Ansible',
    descriptionPlaceholder: 'We are seeking a DevOps / SRE Engineer to automate scalable cloud infrastructure, maintain CI/CD pipelines, implement observability, and guarantee high system availability...',
    supportedLanguagesTitle: 'Supported Scripting & Infrastructure Tools for DevOps Assessment *',
    supportedLanguagesDesc: 'Candidates can select any of these allowed scripting or IaC environments to complete their technical tasks.',
    availableLanguages: ['Bash / Shell', 'Python', 'Go', 'Docker / Containerfile', 'Kubernetes YAML', 'Terraform / HCL', 'Ansible'],
    defaultLanguages: ['Bash / Shell', 'Python', 'Docker / Containerfile', 'Kubernetes YAML'],
    rubrics: ['Containerization & Orchestration (K8s/Docker)', 'Infrastructure as Code (Terraform/Ansible)', 'CI/CD Pipeline Security & Automation', 'Observability, SRE & Incident Post-Mortems'],
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'CI/CD Automation & Zero-Downtime Deployments',
        prompt: `In your production deployments utilizing ${pSkill}, how have you architected blue-green or canary release pipelines to prevent regressions and automate rollback without downtime during sudden traffic spikes?`
      },
      {
        id: 'q_gen_2',
        type: 'Infrastructure as Code & State Drift Management',
        prompt: `Describe how you enforce immutable infrastructure and remote state locking with ${pSkill} and ${sSkill} to prevent configuration drift across multi-region staging and production clusters.`
      },
      {
        id: 'q_gen_3',
        type: 'SRE Incident Triage & High-Availability Post-Mortem',
        prompt: `Walk through a critical production incident or cluster outage you resolved in your ${exp}+ years in DevOps/SRE. What observability telemetry (Prometheus, Grafana, OpenTelemetry) isolated the root cause?`
      }
    ]
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend & Web Engineering',
    assessmentTitle: 'Modern Frontend Engineering & Web Performance Assessment',
    assessmentDescription: 'Component architecture, state management, web vitals (LCP, FID, CLS), client-side security, and reactive UI patterns.',
    educationPlaceholder: "Bachelor's in Computer Science, Software Engineering, Design & Technology, or equivalent experience",
    skillsPlaceholder: 'e.g. React, TypeScript, Next.js, Tailwind CSS, Redux/Zustand, Webpack/Vite, Core Web Vitals, Jest/Cypress',
    descriptionPlaceholder: 'Seeking a skilled Frontend Engineer to build high-performance web applications, optimize rendering pipelines, and create delighting user experiences...',
    supportedLanguagesTitle: 'Supported Frontend Languages & Frameworks for Assessment *',
    supportedLanguagesDesc: 'Candidates can select any of these allowed web languages and frameworks to complete their practical tasks.',
    availableLanguages: ['TypeScript', 'JavaScript', 'HTML/CSS', 'React JSX/TSX', 'GraphQL'],
    defaultLanguages: ['TypeScript', 'JavaScript', 'React JSX/TSX'],
    rubrics: ['Component Architecture & Modularity', 'Web Vitals & Bundle Optimization', 'State Management & Concurrency', 'Accessibility & Responsive Design'],
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Client-Side Performance & Web Vitals',
        prompt: `When building high-traffic client applications with ${pSkill}, how do you diagnose and eliminate layout thrashing, excessive re-renders, and bloated bundle sizes to achieve optimal Core Web Vitals?`
      },
      {
        id: 'q_gen_2',
        type: 'State Architecture & Reactive Data Synchronization',
        prompt: `How do you structure client state and optimistic UI updates between ${pSkill} and ${sSkill} when handling high-frequency real-time events without race conditions?`
      },
      {
        id: 'q_gen_3',
        type: 'Frontend Resiliency & Defensive Rendering',
        prompt: `Walk through an issue where third-party script failures or network partitioning broke client-side rendering. What error boundary and fallback strategies did you deploy?`
      }
    ]
  },
  ai_data: {
    id: 'ai_data',
    label: 'AI, Machine Learning & Data',
    assessmentTitle: 'AI, Machine Learning & Data Pipelines Assessment',
    assessmentDescription: 'Model deployment, vector embeddings, high-throughput ETL pipelines, distributed training, and data quality validation.',
    educationPlaceholder: "Bachelor's or Master's in Computer Science, Data Science, Statistics, Mathematics, or AI/ML",
    skillsPlaceholder: 'e.g. Python, PyTorch, LangChain, Spark, SQL, Vector DBs, Snowflake, Kafka, Airflow',
    descriptionPlaceholder: 'Looking for an AI / Data Engineer to build resilient data pipelines, deploy ML models to production, and scale vector search systems...',
    supportedLanguagesTitle: 'Supported Languages & Frameworks for Data / AI Assessment *',
    supportedLanguagesDesc: 'Candidates can select any of these allowed data and machine learning languages to complete their technical tasks.',
    availableLanguages: ['Python', 'SQL', 'Scala', 'PyTorch / TensorFlow', 'C++', 'R'],
    defaultLanguages: ['Python', 'SQL'],
    rubrics: ['Data Pipeline Throughput & Latency', 'Model Serving & Inference Optimization', 'Data Quality & Schema Drift Defense', 'Vector Embeddings & RAG Architecture'],
    generateQuestions: (pSkill, sSkill, exp) => [
      {
        id: 'q_gen_1',
        type: 'Model Inference Latency & Scalability',
        prompt: `When serving production models utilizing ${pSkill}, how do you optimize GPU/CPU memory utilization and batching to keep inference p99 latency under strict SLAs under heavy concurrent traffic?`
      },
      {
        id: 'q_gen_2',
        type: 'Distributed Data Ingestion & Schema Integrity',
        prompt: `Describe how you enforce schema evolution, idempotent processing, and dead-letter queues across large-scale ETL pipelines with ${pSkill} and ${sSkill}.`
      },
      {
        id: 'q_gen_3',
        type: 'Production Model Drift & Data Quality Post-Mortem',
        prompt: `In your ${exp}+ years in data/AI, walk through a scenario where model inference degraded due to training-serving data skew or drift. How did automated monitoring detect and remediate it?`
      }
    ]
  },
  backend: {
    id: 'backend',
    label: 'Backend & Systems Engineering',
    assessmentTitle: 'Practical Coding & System Architecture Assessment',
    assessmentDescription: 'Real-time live coding challenges, data structures, algorithmic puzzles, and edge-case assertion test suites.',
    educationPlaceholder: "Bachelor's or Master's in Computer Science, Software Engineering, or related field",
    skillsPlaceholder: 'e.g. Python, FastAPI, React, PyTorch, Docker, Kubernetes, PostgreSQL',
    descriptionPlaceholder: 'We are seeking an engineer to build and scale low-latency distributed microservices and mission-critical cloud pipelines...',
    supportedLanguagesTitle: 'Supported Programming Languages for Coding Assessment *',
    supportedLanguagesDesc: 'Candidates can select any of these allowed languages to complete their technical tasks.',
    availableLanguages: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL'],
    defaultLanguages: ['Python', 'JavaScript', 'TypeScript'],
    rubrics: ['Algorithmic Efficiency (Big-O)', 'Concurrency & Thread Safety', 'Defensive Error Handling', 'Test Suite Coverage'],
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
  }
};

function getTechnicalSubTrack(title = '', skills = '') {
  const text = `${title} ${skills}`.toLowerCase();
  if (/network|routing|switching|cisco|juniper|arista|firewall|palo\s*alto|fortinet|ccna|ccnp|ccie|tcp\/ip|bgp|ospf|lan\/wan|subnets?|cidr/i.test(text)) {
    return 'network';
  }
  if (/devops|sre|site\s*reliability|cloud|infrastructure|infra|platform\s*engineer|sysadmin|kubernetes|docker|terraform|ansible/i.test(text)) {
    return 'devops';
  }
  if (/frontend|front-end|ui\/ux\s*eng|react|vue|angular|web\s*developer|css\b|javascript\s*dev/i.test(text)) {
    return 'frontend';
  }
  if (/data\s*engineer|data\s*science|machine\s*learning|ml\s*engineer|ai\s*engineer|nlp|llm\s*engineer|computer\s*vision/i.test(text)) {
    return 'ai_data';
  }
  return 'backend';
}

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

export default function JobCreatorModal({ isOpen, onClose, jobToEdit = null }) {
  const { createJob, updateJob } = useRecruitment();
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
    status: 'Active',
    ctcType: 'range',
    ctcMin: '8.00',
    ctcMax: '12.00',
    ctcCurrency: 'INR',
    ctcPeriod: 'per_annum',
    variablePayMin: '',
    variablePayMax: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeSubTrack = roleTrack === 'technical' ? getTechnicalSubTrack(formData.title, formData.requiredSkills) : null;

  const currentTrack = useMemo(() => {
    const base = TRACK_CONFIGS[roleTrack] || TRACK_CONFIGS.technical;
    if (roleTrack === 'technical') {
      const sub = TECHNICAL_SUBTRACKS[activeSubTrack] || TECHNICAL_SUBTRACKS.backend;
      return {
        ...base,
        ...sub,
        assessmentTitle: sub.assessmentTitle,
        assessmentDescription: sub.assessmentDescription,
        educationPlaceholder: sub.educationPlaceholder,
        skillsPlaceholder: sub.skillsPlaceholder,
        descriptionPlaceholder: sub.descriptionPlaceholder,
        rubrics: sub.rubrics,
        generateQuestions: sub.generateQuestions,
        availableLanguages: sub.availableLanguages,
        defaultLanguages: sub.defaultLanguages,
        supportedLanguagesTitle: sub.supportedLanguagesTitle,
        supportedLanguagesDesc: sub.supportedLanguagesDesc,
      };
    }
    return base;
  }, [roleTrack, activeSubTrack]);

  useEffect(() => {
    if (!isOpen) return;
    if (jobToEdit) {
      const detected = detectTrackFromText(jobToEdit.title, jobToEdit.department) || (jobToEdit.is_coding ? 'technical' : 'operations');
      const sub = detected === 'technical' ? getTechnicalSubTrack(jobToEdit.title, jobToEdit.requiredSkills) : null;
      const initialLangs = jobToEdit.languages?.length 
        ? jobToEdit.languages 
        : (detected === 'technical' ? (TECHNICAL_SUBTRACKS[sub]?.defaultLanguages || ['Python', 'JavaScript', 'TypeScript']) : []);

      setRoleTrack(detected);
      setHasManuallySelectedTrack(true);
      setFormData({
        title: jobToEdit.title || '',
        department: jobToEdit.department || 'Engineering',
        location: jobToEdit.location || 'Remote',
        experience: `${jobToEdit.minExperienceYears ?? jobToEdit.min_experience_years ?? 3}+ years`,
        minExperienceYears: jobToEdit.minExperienceYears ?? jobToEdit.min_experience_years ?? 3,
        education: jobToEdit.education || '',
        description: jobToEdit.description || '',
        requiredSkills: Array.isArray(jobToEdit.requiredSkills) ? jobToEdit.requiredSkills.join(', ') : (jobToEdit.requiredSkills || ''),
        languages: initialLangs,
        codingDifficulty: jobToEdit.codingDifficulty || jobToEdit.coding_difficulty || 'Mid-Level',
        status: jobToEdit.status || 'Active',
        ctcType: jobToEdit.ctcType || jobToEdit.ctc_type || 'range',
        ctcMin: jobToEdit.ctcMin ?? jobToEdit.ctc_min ?? '',
        ctcMax: jobToEdit.ctcMax ?? jobToEdit.ctc_max ?? '',
        ctcCurrency: jobToEdit.ctcCurrency || jobToEdit.ctc_currency || 'INR',
        ctcPeriod: jobToEdit.ctcPeriod || jobToEdit.ctc_period || 'per_annum',
        variablePayMin: jobToEdit.variablePayMin ?? jobToEdit.variable_pay_min ?? '',
        variablePayMax: jobToEdit.variablePayMax ?? jobToEdit.variable_pay_max ?? '',
      });
      setGeneratedQuestions(jobToEdit.questions || []);
    } else {
      setRoleTrack('technical');
      setHasManuallySelectedTrack(false);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Bangalore, India (Hybrid)',
        experience: '3-5 years',
        minExperienceYears: 3,
        education: TECHNICAL_SUBTRACKS.backend.educationPlaceholder,
        description: '',
        requiredSkills: '',
        languages: ['Python', 'JavaScript', 'TypeScript'],
        codingDifficulty: 'Mid-Level',
        status: 'Active',
        ctcType: 'range',
        ctcMin: '8.00',
        ctcMax: '12.00',
        ctcCurrency: 'INR',
        ctcPeriod: 'per_annum',
        variablePayMin: '',
        variablePayMax: '',
      });
      setGeneratedQuestions([]);
    }
  }, [isOpen, jobToEdit]);

  const previewCompensationJob = useMemo(() => {
    const minNum = formData.ctcMin !== '' && !isNaN(Number(formData.ctcMin)) ? Number(formData.ctcMin) : null;
    const maxNum = formData.ctcMax !== '' && !isNaN(Number(formData.ctcMax)) ? Number(formData.ctcMax) : null;
    return {
      ctc_type: formData.ctcType,
      ctcType: formData.ctcType,
      ctc_min: minNum,
      ctcMin: minNum,
      ctc_max: maxNum,
      ctcMax: maxNum,
      ctc_currency: formData.ctcCurrency,
      ctcCurrency: formData.ctcCurrency,
      ctc_period: formData.ctcPeriod,
      ctcPeriod: formData.ctcPeriod,
      variablePayMin: formData.variablePayMin !== '' && !isNaN(Number(formData.variablePayMin)) ? Number(formData.variablePayMin) : null,
      variablePayMax: formData.variablePayMax !== '' && !isNaN(Number(formData.variablePayMax)) ? Number(formData.variablePayMax) : null,
    };
  }, [formData.ctcType, formData.ctcMin, formData.ctcMax, formData.ctcCurrency, formData.ctcPeriod, formData.variablePayMin, formData.variablePayMax]);

  const candidatePreviewText = formatJobCTC(previewCompensationJob);

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

    let initialLangs = [];
    if (trackKey === 'technical') {
      const sub = getTechnicalSubTrack(formData.title, formData.requiredSkills);
      initialLangs = TECHNICAL_SUBTRACKS[sub]?.defaultLanguages || ['Python', 'JavaScript', 'TypeScript'];
    }

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
        languages: targetConfig.isCoding ? initialLangs : []
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

        let initialLangs = [];
        if (detected === 'technical') {
          const sub = getTechnicalSubTrack(newTitle, formData.requiredSkills);
          initialLangs = TECHNICAL_SUBTRACKS[sub]?.defaultLanguages || ['Python', 'JavaScript', 'TypeScript'];
        }
        setFormData(prev => ({
          ...prev,
          title: newTitle,
          department: targetConfig.department,
          education: targetConfig.educationPlaceholder,
          codingDifficulty: targetConfig.defaultDifficulty,
          languages: targetConfig.isCoding ? initialLangs : []
        }));
        return;
      }
    }

    // Dynamic subtrack switching within technical track (e.g. typing "Devops")
    if (roleTrack === 'technical') {
      const prevSub = getTechnicalSubTrack(formData.title, formData.requiredSkills);
      const newSub = getTechnicalSubTrack(newTitle, formData.requiredSkills);
      if (prevSub !== newSub) {
        const subCfg = TECHNICAL_SUBTRACKS[newSub] || TECHNICAL_SUBTRACKS.backend;
        const prevCfg = TECHNICAL_SUBTRACKS[prevSub] || TECHNICAL_SUBTRACKS.backend;
        setFormData(prev => ({
          ...prev,
          title: newTitle,
          languages: subCfg.defaultLanguages,
          education: (!prev.education || prev.education === prevCfg.educationPlaceholder) 
            ? subCfg.educationPlaceholder 
            : prev.education
        }));
        setGeneratedQuestions([]);
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
      const isDevOpsSub = activeSubTrack === 'devops';
      const isFrontendSub = activeSubTrack === 'frontend';
      const isAiDataSub = activeSubTrack === 'ai_data';

      const defaultMain = isDevOpsSub 
        ? 'Kubernetes & Docker' 
        : isFrontendSub 
        ? 'React & Performance' 
        : isAiDataSub 
        ? 'PyTorch & Data Pipelines' 
        : (currentTrack.isCoding ? 'System Architecture' : 'Strategic Governance');

      const defaultSec = isDevOpsSub 
        ? 'Terraform & CI/CD' 
        : isFrontendSub 
        ? 'TypeScript & Web Vitals' 
        : isAiDataSub 
        ? 'Vector Embeddings & Kafka' 
        : (currentTrack.isCoding ? 'High-Throughput Concurrency' : 'Risk Management');

      const mainSkill = skills[0] || defaultMain;
      const secSkill = skills[1] || defaultSec;
      const exp = formData.minExperienceYears || 3;

      const questions = currentTrack.generateQuestions(mainSkill, secSkill, exp);
      setGeneratedQuestions(questions);
      setIsGenerating(false);
    }, 700);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const defaultFallbackSkills = currentTrack.isCoding 
      ? ['System Architecture', 'Algorithms', 'Debugging'] 
      : ['Strategic Analysis', 'Operational Governance', 'Executive Communication'];

    const effectiveSkills = skillsArray.length ? skillsArray : defaultFallbackSkills;
    const isCoding = currentTrack.isCoding;

    const parseNum = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v) : null;
    const ctcMinNum = parseNum(formData.ctcMin);
    const ctcMaxNum = parseNum(formData.ctcMax);

    if (formData.ctcType === 'range' && ctcMinNum !== null && ctcMaxNum !== null && ctcMinNum > ctcMaxNum) {
      alert("Validation error: Minimum CTC cannot exceed Maximum CTC");
      return;
    }

    const compensationFields = {
      ctc_type: formData.ctcType || 'range',
      ctc_min: formData.ctcType === 'fixed' ? ctcMinNum : (formData.ctcType === 'starting_from' ? ctcMinNum : ctcMinNum),
      ctc_max: formData.ctcType === 'fixed' ? ctcMinNum : (formData.ctcType === 'starting_from' ? null : ctcMaxNum),
      ctc_currency: formData.ctcCurrency || 'INR',
      ctc_period: formData.ctcPeriod || 'per_annum',
      variable_pay_min: parseNum(formData.variablePayMin),
      variable_pay_max: parseNum(formData.variablePayMax),
    };

    if (jobToEdit) {
      const updatePayload = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        minExperienceYears: Number(formData.minExperienceYears),
        education: formData.education,
        description: formData.description,
        requiredSkills: effectiveSkills,
        languages: isCoding ? (formData.languages || ['Python', 'JavaScript']) : [],
        codingDifficulty: isCoding ? formData.codingDifficulty : null,
        ...compensationFields,
      };
      await updateJob(jobToEdit.id, updatePayload);
    } else {
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
        ...compensationFields,
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

      await createJob(newJob);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in-up"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-popover p-5 sm:p-7 text-slate-900 dark:text-slate-100 my-auto max-h-[92vh] overflow-y-auto animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-subtle">
              {jobToEdit ? <Save className="w-5 h-5 text-brand-600 dark:text-brand-400" /> : <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {jobToEdit ? `Edit Job Requirement: ${jobToEdit.title}` : 'Create New Job Requirement'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {jobToEdit ? 'Update position requirements, assessment rubric, or authoritative compensation budget' : 'Domain-aware profile synthesis & tailored adaptive assessment generation'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Track Selector */}
        <div className="mt-5 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Role Track & Assessment Domain
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                currentTrack.isCoding 
                  ? 'bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
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
                  title={cfg.label}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition border flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-subtle ring-2 ring-brand-500/30'
                      : 'bg-white dark:bg-[#0E121E] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-brand-500 dark:text-brand-400'}`} />
                  <span className="truncate">{cfg.shortLabel || cfg.label}</span>
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
                placeholder={activeSubTrack === 'network' ? "e.g. Senior Network & Security Engineer" : activeSubTrack === 'devops' ? "e.g. Senior DevOps / Cloud SRE Engineer" : activeSubTrack === 'frontend' ? "e.g. Lead Frontend / UI Engineer" : activeSubTrack === 'ai_data' ? "e.g. Staff AI & Data Engineer" : (currentTrack.isCoding ? "e.g. Senior Backend Engineer" : "e.g. Senior Financial Controller & Tax Auditor")}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department *</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              placeholder={currentTrack.skillsPlaceholder}
              required
            />
          </div>

          {/* COMPENSATION & AUTHORITATIVE CTC BUDGET SPECIFICATION */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>Compensation & CTC Budget</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                      Authoritative
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Defines the budget boundary for candidate discovery and automatic compensation relationship matching.
                  </p>
                </div>
              </div>

              {/* Currency & Period Pickers */}
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <select
                  value={formData.ctcCurrency}
                  onChange={e => setFormData({ ...formData, ctcCurrency: e.target.value })}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-subtle"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>

                <select
                  value={formData.ctcPeriod}
                  onChange={e => setFormData({ ...formData, ctcPeriod: e.target.value })}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-subtle"
                >
                  <option value="per_annum">{formData.ctcCurrency === 'INR' ? 'Per Annum (LPA)' : 'Per Annum (Annual)'}</option>
                  <option value="per_month">Per Month</option>
                </select>
              </div>
            </div>

            {/* CTC Type Selector */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'range', label: 'Salary Range (Min – Max)' },
                { id: 'fixed', label: 'Fixed CTC' },
                { id: 'starting_from', label: 'Starting From (Minimum)' },
                { id: 'not_disclosed', label: 'Not Disclosed' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, ctcType: tab.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    formData.ctcType === tab.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                      : 'bg-white dark:bg-[#0E121E] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CTC Numeric Inputs based on type */}
            {formData.ctcType === 'range' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Minimum CTC {formData.ctcCurrency === 'INR' ? '(in Lakhs, e.g. 8.0)' : `(${formData.ctcCurrency})`} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                      {formData.ctcCurrency === 'INR' ? '₹' : formData.ctcCurrency === 'USD' ? '$' : formData.ctcCurrency === 'EUR' ? '€' : '£'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ctcMin}
                      onChange={e => setFormData({ ...formData, ctcMin: e.target.value })}
                      placeholder="e.g. 8.0"
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum CTC {formData.ctcCurrency === 'INR' ? '(in Lakhs, e.g. 12.0)' : `(${formData.ctcCurrency})`} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                      {formData.ctcCurrency === 'INR' ? '₹' : formData.ctcCurrency === 'USD' ? '$' : formData.ctcCurrency === 'EUR' ? '€' : '£'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ctcMax}
                      onChange={e => setFormData({ ...formData, ctcMax: e.target.value })}
                      placeholder="e.g. 12.0"
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.ctcType === 'fixed' && (
              <div className="pt-1 max-w-sm">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fixed Exact CTC {formData.ctcCurrency === 'INR' ? '(in Lakhs, e.g. 10.0)' : `(${formData.ctcCurrency})`} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                    {formData.ctcCurrency === 'INR' ? '₹' : formData.ctcCurrency === 'USD' ? '$' : formData.ctcCurrency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ctcMin}
                    onChange={e => setFormData({ ...formData, ctcMin: e.target.value, ctcMax: e.target.value })}
                    placeholder="e.g. 10.0"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                    required
                  />
                </div>
              </div>
            )}

            {formData.ctcType === 'starting_from' && (
              <div className="pt-1 max-w-sm">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Starting CTC {formData.ctcCurrency === 'INR' ? '(in Lakhs, e.g. 8.0)' : `(${formData.ctcCurrency})`} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                    {formData.ctcCurrency === 'INR' ? '₹' : formData.ctcCurrency === 'USD' ? '$' : formData.ctcCurrency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ctcMin}
                    onChange={e => setFormData({ ...formData, ctcMin: e.target.value, ctcMax: '' })}
                    placeholder="e.g. 8.0"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                    required
                  />
                </div>
              </div>
            )}

            {formData.ctcType === 'not_disclosed' && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
                Budget will be hidden from candidate discovery cards and displayed as <strong>"Compensation not specified"</strong>. Candidates can still submit their expectations freely during application.
              </div>
            )}

            {/* Variable Pay (Performance bonus) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Optional Variable Pay / Performance Bonus
                </span>
                <span className="text-[10px] text-slate-400">Included in total compensation potential</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.variablePayMin}
                  onChange={e => setFormData({ ...formData, variablePayMin: e.target.value })}
                  placeholder={`Min Variable ${formData.ctcCurrency === 'INR' ? '(e.g. 1.0 LPA)' : ''}`}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.variablePayMax}
                  onChange={e => setFormData({ ...formData, variablePayMax: e.target.value })}
                  placeholder={`Max Variable ${formData.ctcCurrency === 'INR' ? '(e.g. 2.0 LPA)' : ''}`}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E121E] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>
            </div>

            {/* Live Candidate Discovery Badge Preview */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Candidate Discovery Badge Preview:</span>
              <div className="inline-flex items-center px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-bold font-mono">
                {candidatePreviewText}
              </div>
            </div>
          </div>

          {/* DYNAMIC ASSESSMENT SECTION: CONDITIONAL CODING VS NON-CODING */}
          {currentTrack.isCoding ? (
            /* TECHNICAL TRACK: Coding languages & challenge difficulty */
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {currentTrack.supportedLanguagesTitle || 'Supported Programming Languages for Coding Assessment *'}
                  </label>
                  {activeSubTrack && activeSubTrack !== 'backend' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold border border-brand-200 dark:border-brand-800/50">
                      {currentTrack.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  {currentTrack.supportedLanguagesDesc || 'Candidates can select any of these allowed languages to complete their technical tasks.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(currentTrack.availableLanguages || ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL']).map(lang => {
                    const isChecked = (formData.languages || []).includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center space-x-1.5 ${
                          isChecked
                            ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                            : 'bg-white dark:bg-[#0E121E] text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-brand-400'
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
                  {activeSubTrack === 'network' ? 'Network Diagnostics & Scenario Difficulty:' : activeSubTrack === 'devops' ? 'Hands-on Scenario Difficulty:' : 'Coding Assessment Difficulty:'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentTrack.difficulties.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, codingDifficulty: lvl })}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition border ${
                        formData.codingDifficulty === lvl
                          ? 'bg-brand-50 dark:bg-brand-950/70 border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'bg-white dark:bg-[#0E121E] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
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
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
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
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
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
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-[#0E121E] border border-emerald-200 dark:border-emerald-800/50 text-slate-700 dark:text-slate-300 flex items-center space-x-1"
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
                      className={`px-3 py-1 rounded-md text-xs font-bold transition border ${
                        formData.codingDifficulty === lvl
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-[#0E121E] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-400'
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* AI Question Generation trigger */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-brand-200 dark:border-brand-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
            <div>
              <div className="flex items-center space-x-2 text-brand-700 dark:text-brand-300 font-semibold text-xs">
                <BrainCircuit className="w-4 h-4 text-brand-600 dark:text-brand-400" />
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
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Synthesizing..." : "Preview Questions"}</span>
            </button>
          </div>

          {/* Questions preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-[#080A10] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-mono">
                Generated Adaptive Question Set ({generatedQuestions.length})
              </span>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id || idx} className="text-xs p-3 rounded-lg bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-subtle">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Q{idx+1}: {q.type}</span>
                    <span className="text-[10px] text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 px-2 py-0.5 rounded-md">
                      Adaptive Probe Ready
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">{q.prompt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
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
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center space-x-2 shadow-sm shadow-brand-500/20"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{jobToEdit ? 'Requirement Saved!' : 'Requirement Created!'}</span>
                </>
              ) : (
                <>
                  {jobToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{jobToEdit ? 'Save Requirement Changes' : 'Publish Requirement'}</span>
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
