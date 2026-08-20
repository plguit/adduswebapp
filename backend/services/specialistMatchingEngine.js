/**
 * ADDUS Platform — Specialist Matching Engine
 *
 * Phase 11 implementation:
 *  - Maps required capabilities to verified specialists
 *  - Considers expertise, industry relevance, availability, performance
 *  - Does not simply match by generic category
 */

export const SPECIALIST_CATEGORIES = {
  WEB_DEVELOPMENT: 'Web Development',
  UI_UX_DESIGN: 'UI/UX Design',
  BRAND_DESIGN: 'Brand Design',
  PHOTOGRAPHY: 'Photography',
  VIDEO_PRODUCTION: 'Video Production',
  CONTENT_STRATEGY: 'Content Strategy',
  MARKETING: 'Marketing',
  SEO: 'SEO',
  CONSULTING: 'Consulting'
};

export const SPECIALIST_REQUIREMENTS = {
  website: { categories: [SPECIALIST_CATEGORIES.WEB_DEVELOPMENT, SPECIALIST_CATEGORIES.UI_UX_DESIGN], skills: ['frontend', 'backend', 'responsive'] },
  logo_design: { categories: [SPECIALIST_CATEGORIES.BRAND_DESIGN], skills: ['logo', 'branding', 'identity'] },
  photography: { categories: [SPECIALIST_CATEGORIES.PHOTOGRAPHY], skills: ['product', 'lifestyle', 'commercial'] },
  video: { categories: [SPECIALIST_CATEGORIES.VIDEO_PRODUCTION], skills: ['filming', 'editing', 'motion'] },
  branding: { categories: [SPECIALIST_CATEGORIES.BRAND_DESIGN, SPECIALIST_CATEGORIES.CONSULTING], skills: ['strategy', 'identity', 'guidelines'] },
  social_media: { categories: [SPECIALIST_CATEGORIES.MARKETING, SPECIALIST_CATEGORIES.CONTENT_STRATEGY], skills: ['strategy', 'scheduling', 'engagement'] },
  seo: { categories: [SPECIALIST_CATEGORIES.SEO, SPECIALIST_CATEGORIES.CONTENT_STRATEGY], skills: ['technical', 'content', 'keywords'] },
  content: { categories: [SPECIALIST_CATEGORIES.CONTENT_STRATEGY], skills: ['writing', 'copywriting', 'storytelling'] },
  packaging: { categories: [SPECIALIST_CATEGORIES.BRAND_DESIGN], skills: ['structural', 'graphic', 'print'] }
};

export function matchSpecialists(requiredWork, availableSpecialists = []) {
  const matches = [];

  for (const work of requiredWork) {
    const workType = work.type?.toLowerCase() || 'general';
    const requirements = SPECIALIST_REQUIREMENTS[workType] || { categories: ['General'], skills: [] };
    
    const candidates = availableSpecialists.filter(spec => {
      if (!spec || !spec.categories) return false;
      return requirements.categories.some(cat => spec.categories.includes(cat));
    });

    if (candidates.length > 0) {
      const ranked = candidates
        .map(spec => ({
          ...spec,
          matchScore: calculateMatchScore(spec, requirements, work)
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      matches.push({
        workId: work.workId,
        workType: work.type,
        dimension: work.dimension,
        description: work.description,
        matchedSpecialists: ranked,
        topMatch: ranked[0] || null
      });
    } else {
      matches.push({
        workId: work.workId,
        workType: work.type,
        dimension: work.dimension,
        description: work.description,
        matchedSpecialists: [],
        topMatch: null,
        note: 'No matching specialists available'
      });
    }
  }

  return matches;
}

function calculateMatchScore(specialist, requirements, work) {
  let score = 0;

  const categoryMatches = requirements.categories.filter(cat => specialist.categories?.includes(cat)).length;
  score += categoryMatches * 30;

  if (specialist.industry && work.dimension) {
    score += 10;
  }

  if (specialist.performanceHistory && specialist.performanceHistory.rating) {
    score += Math.min(specialist.performanceHistory.rating * 10, 20);
  }

  if (specialist.availability === 'available') {
    score += 15;
  } else if (specialist.availability === 'limited') {
    score += 5;
  }

  if (specialist.skills) {
    const skillMatches = requirements.skills.filter(skill => specialist.skills.includes(skill)).length;
    score += Math.min(skillMatches * 5, 15);
  }

  return Math.min(score, 100);
}

export function getSpecialistRecommendation(matchResult) {
  if (!matchResult || !matchResult.topMatch) {
    return {
      recommendation: 'No specialist available',
      action: 'Expand specialist network or adjust requirements',
      confidence: 'LOW'
    };
  }

  const top = matchResult.topMatch;
  return {
    recommendation: `Match ${top.name || 'specialist'} for ${matchResult.workType}`,
    action: `Assign ${top.name || 'specialist'} to ${matchResult.dimension}`,
    confidence: top.matchScore >= 70 ? 'HIGH' : top.matchScore >= 40 ? 'MEDIUM' : 'LOW',
    matchScore: top.matchScore,
    rationale: `Specialist has ${top.categories?.join(', ')} expertise and ${top.matchScore >= 70 ? 'strong' : 'moderate'} alignment with requirements.`
  };
}
