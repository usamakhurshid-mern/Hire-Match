const SKILL_ALIASES = {
  'node.js': ['nodejs', 'node', 'node js'],
  'react.js': ['reactjs', 'react'],
  'vue.js': ['vuejs', 'vue'],
  'express.js': ['expressjs', 'express'],
  postgresql: ['postgres', 'psql', 'pg'],
  javascript: ['js', 'ecmascript'],
  typescript: ['ts'],
  'amazon web services': ['aws'],
  kubernetes: ['k8s'],
  docker: ['containerization', 'containers'],
  redis: ['elasticache'],
  mongodb: ['mongo'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
};

const COMMON_SKILLS = [
  'node.js', 'react', 'vue', 'angular', 'express', 'postgresql', 'mysql', 'mongodb',
  'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'python', 'java',
  'javascript', 'typescript', 'go', 'rust', 'c#', '.net', 'php', 'ruby', 'rails',
  'graphql', 'rest', 'api', 'microservices', 'ci/cd', 'git', 'agile', 'scrum',
  'machine learning', 'tensorflow', 'pytorch', 'sql', 'nosql', 'html', 'css',
  'tailwind', 'next.js', 'nestjs', 'fastapi', 'django', 'flask', 'spring',
  'leadership', 'communication', 'problem solving', 'team management',
];

const EDUCATION_KEYWORDS = [
  "bachelor's", 'bachelor', 'bs', 'ba', 'b.sc', 'b.s',
  "master's", 'master', 'ms', 'ma', 'm.sc', 'mba',
  'phd', 'doctorate', 'associate', 'diploma', 'certification',
  'computer science', 'engineering', 'information technology',
];

const LOCATION_KEYWORDS = {
  remote: ['remote', 'work from home', 'wfh', 'distributed', 'anywhere'],
  hybrid: ['hybrid', 'partially remote'],
  onsite: ['on-site', 'onsite', 'in-office', 'in office'],
};

function canonicalize(skill) {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    if (lower === canonical || aliases.includes(lower)) {
      return canonical;
    }
  }
  return lower;
}

function textContainsSkill(text, skill) {
  const canonical = canonicalize(skill);
  const patterns = [canonical, ...(SKILL_ALIASES[canonical] || [])];

  return patterns.some((p) => {
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  });
}

export function extractSkills(text) {
  const normalized = text.toLowerCase();
  const found = new Set();

  for (const skill of COMMON_SKILLS) {
    if (textContainsSkill(normalized, skill)) {
      found.add(canonicalize(skill));
    }
  }

  return [...found];
}

export function extractRequirements(jdText) {
  const normalized = jdText.toLowerCase();
  const lines = jdText.split('\n');

  const required = new Set();
  const preferred = new Set();

  let section = 'general';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/required|must have|requirements|qualifications/.test(lower)) {
      section = 'required';
    } else if (/preferred|nice to have|bonus|desired/.test(lower)) {
      section = 'preferred';
    }

    for (const skill of COMMON_SKILLS) {
      if (textContainsSkill(lower, skill)) {
        if (section === 'required') {
          required.add(canonicalize(skill));
        } else if (section === 'preferred') {
          preferred.add(canonicalize(skill));
        } else if (/required|must/.test(lower)) {
          required.add(canonicalize(skill));
        }
      }
    }
  }

  const allJdSkills = extractSkills(normalized);
  if (required.size === 0) {
    allJdSkills.slice(0, 8).forEach((s) => required.add(s));
  }

  for (const skill of allJdSkills) {
    if (!required.has(skill)) {
      preferred.add(skill);
    }
  }

  return {
    required: [...required],
    preferred: [...preferred].filter((s) => !required.has(s)),
  };
}

export function compareSkills(resumeSkills, requirements) {
  const resumeSet = new Set(resumeSkills.map(canonicalize));

  const matchedRequired = requirements.required.filter((s) => resumeSet.has(canonicalize(s)));
  const missingRequired = requirements.required.filter((s) => !resumeSet.has(canonicalize(s)));
  const matchedPreferred = requirements.preferred.filter((s) => resumeSet.has(canonicalize(s)));
  const missingPreferred = requirements.preferred.filter((s) => !resumeSet.has(canonicalize(s)));

  const requiredRate = requirements.required.length
    ? matchedRequired.length / requirements.required.length
    : 0.7;

  const preferredRate = requirements.preferred.length
    ? matchedPreferred.length / requirements.preferred.length
    : 0.5;

  const score = clamp(requiredRate * 80 + preferredRate * 20);

  return {
    score,
    matched: [...new Set([...matchedRequired, ...matchedPreferred])],
    missing: missingRequired,
    required: {
      matched: matchedRequired,
      missing: missingRequired,
      matchRate: requirements.required.length
        ? Math.round((matchedRequired.length / requirements.required.length) * 100) / 100
        : 1,
    },
    preferred: {
      matched: matchedPreferred,
      missing: missingPreferred,
    },
  };
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function compareEducation(resumeText, jdText) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();

  const jdEducation = EDUCATION_KEYWORDS.filter((k) => jdLower.includes(k));
  if (jdEducation.length === 0) {
    return { score: 80, matched: [], missing: [] };
  }

  const matched = jdEducation.filter((k) => resumeLower.includes(k));
  const missing = jdEducation.filter((k) => !resumeLower.includes(k));

  const score = jdEducation.length ? (matched.length / jdEducation.length) * 100 : 80;

  return { score: clamp(score), matched, missing };
}

export function compareLocation(resumeText, jdText) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();

  let jdMode = 'unspecified';
  for (const [mode, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (keywords.some((k) => jdLower.includes(k))) {
      jdMode = mode;
      break;
    }
  }

  if (jdMode === 'unspecified') {
    return { score: 75, note: 'No specific location requirement detected' };
  }

  const resumeRemote = LOCATION_KEYWORDS.remote.some((k) => resumeLower.includes(k));
  const resumeHybrid = LOCATION_KEYWORDS.hybrid.some((k) => resumeLower.includes(k));

  if (jdMode === 'remote') {
    return { score: resumeRemote || resumeHybrid ? 95 : 70, note: 'Remote role' };
  }

  if (jdMode === 'hybrid') {
    return { score: resumeHybrid || resumeRemote ? 85 : 60, note: 'Hybrid role' };
  }

  return { score: 65, note: 'On-site role — verify candidate location' };
}
