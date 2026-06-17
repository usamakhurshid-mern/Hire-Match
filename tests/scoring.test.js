import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch } from '../src/services/scoring.service.js';
import { extractSkills, extractRequirements } from '../src/services/skills.service.js';

const SAMPLE_RESUME = `Senior Software Engineer with 6 years of experience building scalable web applications.
Skills: Node.js, Express, React, PostgreSQL, Redis, Docker, AWS.
Bachelor's in Computer Science. Led team of 4 engineers. Remote worker.`;

const SAMPLE_JD = `We are hiring a Senior Backend Engineer.
Required: Node.js, Express, PostgreSQL, 5+ years experience.
Preferred: Redis, Docker, AWS.
Location: Remote (US). Bachelor's degree required.`;

describe('skills.service', () => {
  it('extracts skills from resume', () => {
    const skills = extractSkills(SAMPLE_RESUME);
    assert.ok(skills.includes('node.js'));
    assert.ok(skills.includes('postgresql'));
  });

  it('extracts requirements from job description', () => {
    const reqs = extractRequirements(SAMPLE_JD);
    assert.ok(reqs.required.length > 0);
  });
});

describe('scoring.service', () => {
  it('returns high score for strong match', () => {
    const result = scoreMatch(SAMPLE_RESUME, SAMPLE_JD, { includeExplanation: true });
    assert.ok(result.overallScore >= 70);
    assert.equal(result.recommendation, 'strong_fit');
    assert.ok(result.explanation);
    assert.ok(result.matchId.startsWith('mtch_'));
  });

  it('returns lower score for weak match', () => {
    const weakResume = `Junior designer with 1 year experience in Photoshop and Illustrator.
    Creative portfolio work for local clients.`;
    const result = scoreMatch(weakResume, SAMPLE_JD, { includeExplanation: true });
    assert.ok(result.overallScore < 60);
  });
});
