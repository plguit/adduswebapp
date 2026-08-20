/**
 * Creator Matching Engine — ADDUS Phase 3B
 * Calculates per-project match scores for creators.
 * Produces explainable AI recommendations.
 */

import { creatorAuthService } from '../../shared/services/creatorAuthService.js';
import { creatorScoreEngine } from './creatorScoreEngine.js';

const AUTO_MATCH_CONFIG_KEY = 'addus_auto_match_config';

export const autoMatchConfig = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUTO_MATCH_CONFIG_KEY) || '{"enabled": false}'); }
    catch { return { enabled: false }; }
  },
  set(config) {
    localStorage.setItem(AUTO_MATCH_CONFIG_KEY, JSON.stringify(config));
  }
};

/**
 * Calculate budget match score (0–100)
 */
function calcBudgetMatch(creator, projectBudget) {
  // Parse project budget range
  const budgetStr = projectBudget || '';
  const nums = budgetStr.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''), 10)) || [];
  if (nums.length === 0) return 50; // unknown

  const projectMin = nums[0] || 0;
  const projectMax = nums[1] || projectMin;
  const projectMid = (projectMin + projectMax) / 2;

  // Creator pricing across categories
  const creatorMin = creator.categories?.reduce((min, c) => {
    const price = c.pricing?.basePrice || 0;
    return price > 0 ? Math.min(min, price) : min;
  }, Infinity) || 0;

  if (creatorMin === Infinity || creatorMin === 0) return 50;

  if (creatorMin <= projectMax && creatorMin >= projectMin * 0.5) return 100;
  if (creatorMin <= projectMax * 1.2) return 80;
  if (creatorMin <= projectMax * 1.5) return 60;
  return 30;
}

/**
 * Calculate location match score (0–100)
 */
function calcLocationMatch(creator, projectLocation) {
  if (!projectLocation || !creator.location) return 50;
  const creatorCity = (creator.location.city || '').toLowerCase();
  const creatorState = (creator.location.state || '').toLowerCase();
  const projLoc = projectLocation.toLowerCase();

  if (projLoc.includes(creatorCity) || creatorCity.includes(projLoc)) return 100;
  if (projLoc.includes(creatorState) || creatorState.includes(projLoc)) return 75;
  return 40;
}

/**
 * Calculate industry expertise match (0–100)
 */
function calcIndustryMatch(creator, projectIndustry) {
  if (!projectIndustry) return 50;
  const expertise = creator.scoreCard?.industryExpertise || {};
  const count = expertise[projectIndustry] || 0;
  if (count >= 10) return 100;
  if (count >= 5) return 85;
  if (count >= 2) return 70;
  if (count >= 1) return 55;
  return 30;
}

/**
 * Calculate service expertise match (0–100)
 */
function calcServiceMatch(creator, projectService) {
  if (!projectService) return 50;
  const expertise = creator.scoreCard?.serviceExpertise || {};
  const count = expertise[projectService] || 0;
  if (count >= 8) return 100;
  if (count >= 4) return 85;
  if (count >= 1) return 70;
  // Check if service is in their profession list
  const hasService = creator.categories?.some(c =>
    c.professionName?.toLowerCase().includes(projectService.toLowerCase())
  );
  if (hasService) return 60;
  return 30;
}

/**
 * Check equipment match (0–100)
 */
function calcEquipmentMatch(creator, requiredEquipment = []) {
  if (!requiredEquipment || requiredEquipment.length === 0) return 100;
  const creatorEquip = creator.equipment || [];
  const owned = creatorEquip.filter(e => e.ownership === 'owned').map(e => e.name?.toLowerCase());

  let matches = 0;
  for (const req of requiredEquipment) {
    const reqLower = req.toLowerCase();
    if (owned.some(o => o.includes(reqLower) || reqLower.includes(o))) {
      matches++;
    }
  }

  return Math.round((matches / requiredEquipment.length) * 100);
}

/**
 * Check availability match
 */
function calcAvailabilityMatch(creator, shootDate) {
  if (!shootDate) return 80;
  if (creator.availabilityStatus === 'available') return 100;
  if (creator.availabilityStatus === 'busy') return 10;
  if (creator.availabilityStatus === 'unavailable') return 0;
  return 60;
}

/**
 * Generate explainer reasons
 */
function generateReasons(creator, breakdown, score) {
  const reasons = [];

  if (breakdown.serviceMatch >= 70) reasons.push(`✓ ${creator.categories?.length || 0} matching service${creator.categories?.length !== 1 ? 's' : ''}`);
  if (breakdown.industryMatch >= 70) {
    const topIndustry = Object.entries(creator.scoreCard?.industryExpertise || {}).sort((a, b) => b[1] - a[1])[0];
    if (topIndustry) reasons.push(`✓ ${topIndustry[1]} projects in ${topIndustry[0]}`);
  }
  if (breakdown.availabilityMatch >= 80) reasons.push('✓ Available on requested date');
  if (breakdown.budgetMatch >= 80) reasons.push('✓ Budget match');
  if (breakdown.equipmentMatch >= 80) reasons.push('✓ Owns required equipment');
  const rating = creator.scoreCard?.dimensions?.customerRating;
  if (rating && rating >= 80) reasons.push(`✓ High customer rating (${Math.round(rating * 4 / 100 + 1 * 10) / 10}★)`);
  if (breakdown.locationMatch >= 75) reasons.push('✓ Located nearby');

  return reasons;
}

// ── Main Matching Engine ──────────────────────────────────────────────────

export const matchingEngine = {
  /**
   * Calculate match score for a creator on a specific project
   */
  calcMatch(creator, project) {
    const score = creatorScoreEngine.getScore(creator.creatorId);

    const breakdown = {
      industryMatch: calcIndustryMatch(creator, project.industry || project.businessIndustry),
      serviceMatch: calcServiceMatch(creator, project.service),
      availabilityMatch: calcAvailabilityMatch(creator, project.shootDate),
      budgetMatch: calcBudgetMatch(creator, project.budget),
      locationMatch: calcLocationMatch(creator, project.location),
      equipmentMatch: calcEquipmentMatch(creator, project.requiredEquipment),
      creatorScore: score?.overallScore || 50
    };

    // Weighted match score
    const matchScore = Math.round(
      breakdown.serviceMatch * 0.25 +
      breakdown.industryMatch * 0.15 +
      breakdown.availabilityMatch * 0.20 +
      breakdown.budgetMatch * 0.15 +
      breakdown.equipmentMatch * 0.10 +
      breakdown.locationMatch * 0.05 +
      breakdown.creatorScore * 0.10
    );

    const reasons = generateReasons(creator, breakdown, matchScore);

    return {
      creatorId: creator.creatorId,
      creator,
      matchScore,
      breakdown,
      reasons,
      matchLabel: matchScore >= 90 ? 'Excellent Match'
        : matchScore >= 80 ? 'Very Strong Match'
        : matchScore >= 70 ? 'Strong Match'
        : matchScore >= 60 ? 'Good Match'
        : 'Partial Match'
    };
  },

  /**
   * Get ranked creator recommendations for a project
   */
  getRankedCreators(project, limit = 10) {
    const creators = creatorAuthService.getAllCreators()
      .filter(c => c.verificationStatus === 'approved' && c.availabilityStatus !== 'unavailable');

    const scored = creators.map(creator => this.calcMatch(creator, project));
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  },

  /**
   * Get top recommended creator (for auto-assignment)
   */
  getTopMatch(project) {
    const ranked = this.getRankedCreators(project, 1);
    return ranked[0] || null;
  },

  /**
   * Check if auto-assignment is enabled
   */
  isAutoEnabled() {
    return autoMatchConfig.get().enabled === true;
  }
};

export default matchingEngine;
