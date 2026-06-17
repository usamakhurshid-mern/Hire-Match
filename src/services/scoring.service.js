import { v4 as uuidv4 } from 'uuid';
import {
  extractSkills,
  extractRequirements,
  compareSkills,
  compareEducation,
  compareLocation,
} from './skills.service.js';
import { extractYears, getRecommendation, clampScore } from '../utils/textNormalizer.js';

const DEFAULT_WEIGHTS = {
  skills: 0.45,
  experience: 0.35,
  education: 0.1,
  location: 0.1,
};

function normalizeWeights(weights) {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  const total = Object.values(merged).reduce((a, b) => a + b, 0);
  if (total === 0) return DEFAULT_WEIGHTS;

  return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v / total]));
}

function compareExperience(resumeText, jdText) {
  const candidateYears = extractYears(resumeText);
  const requiredYears = extractYears(jdText) || 0;

  let score = 70;
  let seniority = 'unknown';

  if (candidateYears !== null && requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      score = Math.min(100, 80 + (candidateYears - requiredYears) * 3);
      seniority = candidateYears > requiredYears + 3 ? 'overqualified' : 'aligned';
    } else {
      score = Math.max(20, 80 - (requiredYears - candidateYears) * 15);
      seniority = 'underqualified';
    }
  } else if (candidateYears !== null) {
    score = Math.min(90, 60 + candidateYears * 5);
    seniority = candidateYears >= 5 ? 'aligned' : 'unknown';
  }

  return {
    score: clampScore(score),
    candidateYears,
    requiredYears: requiredYears || null,
    seniority,
  };
}

function buildExplanation({ overallScore, skills, experience, education, location, requirements }) {
  const highlights = [];
  const concerns = [];

  if (skills.required.matchRate >= 0.8) {
    highlights.push(`Strong required skills match (${Math.round(skills.required.matchRate * 100)}%)`);
  }

  if (experience.seniority === 'aligned') {
    highlights.push('Experience level aligns with job requirements');
  }

  if (skills.required.missing.length > 0) {
    concerns.push(`Missing required skills: ${skills.required.missing.slice(0, 5).join(', ')}`);
  }

  if (experience.seniority === 'underqualified') {
    concerns.push(
      `Experience gap: candidate has ${experience.candidateYears ?? '?'} years, role requires ${experience.requiredYears}+`
    );
  }

  if (education.missing.length > 0) {
    concerns.push(`Education requirements not fully met`);
  }

  if (location.score < 70) {
    concerns.push(location.note);
  }

  const summaryParts = [];
  if (overallScore >= 75) summaryParts.push('Strong overall fit.');
  else if (overallScore >= 50) summaryParts.push('Moderate fit with some gaps.');
  else summaryParts.push('Weak fit — significant gaps detected.');

  if (skills.required.missing.length > 0) {
    summaryParts.push(`Primary gap: ${skills.required.missing[0]} not found in resume.`);
  } else if (requirements.required.length > 0) {
    summaryParts.push('Core required skills are present.');
  }

  return {
    summary: summaryParts.join(' '),
    highlights,
    concerns,
  };
}

export function scoreMatch(resumeText, jobDescriptionText, options = {}) {
  const weights = normalizeWeights(options.weights || {});
  const includeExplanation = options.includeExplanation !== false;

  const resumeSkills = extractSkills(resumeText);
  const requirements = extractRequirements(jobDescriptionText);

  const skills = compareSkills(resumeSkills, requirements);
  const experience = compareExperience(resumeText, jobDescriptionText);
  const education = compareEducation(resumeText, jobDescriptionText);
  const location = compareLocation(resumeText, jobDescriptionText);

  const overallScore = clampScore(
    skills.score * weights.skills +
      experience.score * weights.experience +
      education.score * weights.education +
      location.score * weights.location
  );

  const result = {
    matchId: `mtch_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    overallScore,
    recommendation: getRecommendation(overallScore),
    dimensions: {
      skills: {
        score: skills.score,
        matched: skills.matched,
        missing: skills.missing,
      },
      experience,
      education,
      location,
    },
    requiredSkills: skills.required,
    preferredSkills: skills.preferred,
    metadata: {
      language: options.language || 'en',
      modelVersion: 'v1.0.0',
    },
  };

  if (includeExplanation) {
    result.explanation = buildExplanation({
      overallScore,
      skills,
      experience,
      education,
      location,
      requirements,
    });
  }

  return result;
}
