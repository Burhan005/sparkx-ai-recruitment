/**
 * SparkX Fuzzy Skill Normalizer & Typo-Tolerant Matcher
 * Maps candidate typos, aliases, and abbreviations (e.g., 'docket' -> 'Docker', 'k8s' -> 'Kubernetes')
 * to standard industry skill taxonomy with Levenshtein distance resilience.
 */

const SKILL_ALIASES = {
  // Container & Cloud Infrastructure
  'docket': 'Docker',
  'dockr': 'Docker',
  'docker': 'Docker',
  'dockers': 'Docker',
  'k8s': 'Kubernetes',
  'k8': 'Kubernetes',
  'kubernete': 'Kubernetes',
  'kubernets': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'terrafom': 'Terraform',
  'terform': 'Terraform',
  'terraform': 'Terraform',
  'ansibl': 'Ansible',
  'ansible': 'Ansible',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud Platform (GCP)',
  'google cloud': 'Google Cloud Platform (GCP)',
  'azure': 'Microsoft Azure',

  // Programming Languages & Frameworks
  'pyhton': 'Python',
  'pyton': 'Python',
  'python': 'Python',
  'python3': 'Python',
  'recat': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'react': 'React',
  'react native': 'React Native',
  'angularjs': 'Angular',
  'anglar': 'Angular',
  'angular': 'Angular',
  'vuejs': 'Vue.js',
  'vue': 'Vue.js',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'ts': 'TypeScript',
  'typscript': 'TypeScript',
  'typescript': 'TypeScript',
  'js': 'JavaScript',
  'javascrip': 'JavaScript',
  'javascript': 'JavaScript',
  'golang': 'Go',
  'go lang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'c++': 'C++',
  'cpp': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'dotnet': '.NET Core',
  '.net': '.NET Core',
  'fastapi': 'FastAPI',
  'fast-api': 'FastAPI',
  'django': 'Django',
  'springboot': 'Spring Boot',
  'spring-boot': 'Spring Boot',
  'spring': 'Spring Boot',

  // Databases & Messaging
  'postgres': 'PostgreSQL',
  'postgre': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'pgsql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongo': 'MongoDB',
  'mongod': 'MongoDB',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'kafka': 'Apache Kafka',
  'apache kafka': 'Apache Kafka',
  'rabbitmq': 'RabbitMQ',
  'graphql': 'GraphQL',

  // Finance & Accounting
  'gaap': 'GAAP',
  'ifrs': 'IFRS',
  'cpa': 'CPA (Certified Public Accountant)',
  'sox': 'SOX Compliance',
  'reconcilation': 'Account Reconciliation',
  'reconciliation': 'Account Reconciliation',
  'reconciliations': 'Account Reconciliation',
  'audit': 'Financial Auditing',
  'auditing': 'Financial Auditing',
  'tax': 'Tax Accounting & Compliance',
  'taxation': 'Tax Accounting & Compliance',
  'general ledger': 'General Ledger Accounting',
  'p&l': 'P&L Management',
  'balance sheet': 'Balance Sheet Reconciliation'
};

/**
 * Calculates Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalizes a raw skill string into its canonical display format, fixing known typos.
 */
export function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') return '';
  const clean = rawSkill.trim();
  const lower = clean.toLowerCase();

  // 1. Exact alias match
  if (SKILL_ALIASES[lower]) {
    return SKILL_ALIASES[lower];
  }

  // 2. Fuzzy match against known aliases (edit distance <= 1 for 4-6 chars, <= 2 for 7+ chars)
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (Math.abs(alias.length - lower.length) <= 2) {
      const maxDistance = lower.length <= 4 ? 1 : (lower.length <= 7 ? 1 : 2);
      if (levenshteinDistance(lower, alias) <= maxDistance) {
        return canonical;
      }
    }
  }

  return clean;
}

/**
 * Determines whether candidate skill matches required job skill with typo tolerance.
 */
export function fuzzySkillMatch(candidateSkill, jobSkill) {
  if (!candidateSkill || !jobSkill) return false;

  const cClean = candidateSkill.toLowerCase().trim();
  const jClean = jobSkill.toLowerCase().trim();

  // Exact or normalized alias equality
  if (cClean === jClean) return true;
  if (SKILL_ALIASES[cClean] && SKILL_ALIASES[jClean] && SKILL_ALIASES[cClean] === SKILL_ALIASES[jClean]) return true;

  // Substring inclusion
  if (cClean.length > 3 && jClean.includes(cClean)) return true;
  if (jClean.length > 3 && cClean.includes(jClean)) return true;

  // Levenshtein distance check for typos (e.g. 'docket' vs 'docker')
  const minLen = Math.min(cClean.length, jClean.length);
  if (minLen >= 4 && Math.abs(cClean.length - jClean.length) <= 2) {
    const maxAllowed = minLen <= 6 ? 1 : 2;
    if (levenshteinDistance(cClean, jClean) <= maxAllowed) {
      return true;
    }
  }

  // Check canonical aliases against each other
  const cNorm = normalizeSkill(candidateSkill).toLowerCase();
  const jNorm = normalizeSkill(jobSkill).toLowerCase();
  if (cNorm === jNorm) return true;
  if (cNorm.length > 3 && jNorm.includes(cNorm)) return true;
  if (jNorm.length > 3 && cNorm.includes(jNorm)) return true;

  return false;
}
