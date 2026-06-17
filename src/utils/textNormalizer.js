export function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function extractYears(text) {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/gi,
    /(?:experience|exp)[:\s]+(\d+)\+?\s*(?:years?|yrs?)/gi,
    /(\d+)\+?\s*(?:years?|yrs?)/gi,
  ];

  const years = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseInt(match[1], 10);
      if (value >= 0 && value <= 50) {
        years.push(value);
      }
    }
  }

  return years.length ? Math.max(...years) : null;
}

export function getRecommendation(score) {
  if (score >= 75) return 'strong_fit';
  if (score >= 50) return 'moderate_fit';
  return 'weak_fit';
}

export function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
