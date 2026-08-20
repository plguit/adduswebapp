/**
 * Creator Score Engine — ADDUS Phase 3B
 * Calculates dynamic creator scores based on weighted performance dimensions.
 * Admin-configurable weights. Never hardcoded in business logic.
 */

import { creatorAuthService } from '../../shared/services/creatorAuthService.js';

const SCORE_CONFIG_KEY = 'addus_score_weight_config';
const CREATOR_METRICS_KEY = 'addus_creator_metrics';

// ── Default Score Weights (admin-configurable) ────────────────────────────

export const DEFAULT_SCORE_WEIGHTS = {
  experience: 15,
  portfolio: 15,
  verification: 10,
  projectSuccess: 20,
  customerRating: 15,
  onTimeDelivery: 10,
  responseSpeed: 5,
  acceptanceRate: 5,
  availability: 3,
  qualityBrain: 2
};

export const scoreWeightConfig = {
  getWeights() {
    try {
      const stored = JSON.parse(localStorage.getItem(SCORE_CONFIG_KEY) || 'null');
      return stored || DEFAULT_SCORE_WEIGHTS;
    } catch { return DEFAULT_SCORE_WEIGHTS; }
  },

  setWeights(weights) {
    localStorage.setItem(SCORE_CONFIG_KEY, JSON.stringify({
      ...weights,
      updatedAt: new Date().toISOString()
    }));
  }
};

// ── Creator Metrics Store ─────────────────────────────────────────────────

function getMetricsStore() {
  try { return JSON.parse(localStorage.getItem(CREATOR_METRICS_KEY) || '{}'); }
  catch { return {}; }
}

function saveMetricsStore(store) {
  localStorage.setItem(CREATOR_METRICS_KEY, JSON.stringify(store));
}

export const creatorMetrics = {
  get(creatorId) {
    const store = getMetricsStore();
    return store[creatorId] || {
      creatorId,
      totalProjectsReceived: 0,
      totalProjectsAccepted: 0,
      totalProjectsCompleted: 0,
      totalProjectsCancelled: 0,
      totalProjectsLate: 0,
      ratingsReceived: [],
      responseTimes: [],       // Array of minutes
      industryExpertise: {},   // { industry: count }
      serviceExpertise: {},    // { service: count }
      portfolioCount: 0,
      portfolioWithMedia: 0,
      documentsVerified: 0,
      totalDocuments: 0,
      availabilityUpdatesCount: 0,
      lastAvailabilityUpdate: null,
      qualityBrainScores: [],
      updatedAt: null
    };
  },

  save(creatorId, updates) {
    const store = getMetricsStore();
    store[creatorId] = {
      ...this.get(creatorId),
      ...updates,
      creatorId,
      updatedAt: new Date().toISOString()
    };
    saveMetricsStore(store);
    return store[creatorId];
  },

  recordProjectAccepted(creatorId, responseTimeMinutes) {
    const m = this.get(creatorId);
    this.save(creatorId, {
      totalProjectsAccepted: m.totalProjectsAccepted + 1,
      totalProjectsReceived: m.totalProjectsReceived + 1,
      responseTimes: [...m.responseTimes, responseTimeMinutes]
    });
  },

  recordProjectCompleted(creatorId, { isOnTime, industry, service, qualityScore }) {
    const m = this.get(creatorId);
    const industryExp = { ...m.industryExpertise };
    const serviceExp = { ...m.serviceExpertise };
    if (industry) industryExp[industry] = (industryExp[industry] || 0) + 1;
    if (service) serviceExp[service] = (serviceExp[service] || 0) + 1;

    this.save(creatorId, {
      totalProjectsCompleted: m.totalProjectsCompleted + 1,
      totalProjectsLate: isOnTime ? m.totalProjectsLate : m.totalProjectsLate + 1,
      industryExpertise: industryExp,
      serviceExpertise: serviceExp,
      qualityBrainScores: qualityScore
        ? [...m.qualityBrainScores, qualityScore]
        : m.qualityBrainScores
    });
  },

  recordRating(creatorId, rating) {
    const m = this.get(creatorId);
    this.save(creatorId, {
      ratingsReceived: [...m.ratingsReceived, { rating, date: new Date().toISOString() }]
    });
  }
};

// ── Score Calculation Functions ───────────────────────────────────────────

function calcExperienceScore(creator, metrics) {
  const years = creator.categories?.reduce((max, c) => {
    const exp = parseInt(c.onboardingData?.experience || c.onboardingData?.vg_experience || 0);
    return Math.max(max, exp);
  }, 0) || 0;
  const projects = metrics.totalProjectsCompleted;
  const yearScore = Math.min(years * 8, 50);          // max 50 pts from years
  const projectScore = Math.min(projects * 2, 50);    // max 50 pts from projects
  return Math.round(yearScore + projectScore);
}

function calcPortfolioScore(creator, metrics) {
  const totalItems = metrics.portfolioCount || 0;
  const withMedia = metrics.portfolioWithMedia || 0;
  const completeness = totalItems > 0 ? (withMedia / totalItems) : 0;
  const quantityScore = Math.min(totalItems * 5, 50);
  const qualityScore = completeness * 50;
  return Math.round(quantityScore + qualityScore);
}

function calcVerificationScore(creator) {
  let score = 0;
  const docs = creator.documents || [];
  const verifiedDocs = docs.filter(d => d.status === 'verified').length;
  score += Math.min(verifiedDocs * 12, 60);  // 60 pts max for docs
  if (creator.verificationStatus === 'approved') score += 20;
  if (creator.phone) score += 10;
  if (creator.email) score += 10;
  return Math.min(score, 100);
}

function calcProjectSuccessScore(metrics) {
  const total = metrics.totalProjectsCompleted + metrics.totalProjectsCancelled + metrics.totalProjectsLate;
  if (total === 0) return 50; // neutral baseline
  const successRate = metrics.totalProjectsCompleted / total;
  return Math.round(successRate * 100);
}

function calcCustomerRatingScore(metrics) {
  const ratings = metrics.ratingsReceived || [];
  if (ratings.length === 0) return 50; // neutral baseline
  // Recent ratings have higher weight (last 10 count double)
  const recent = ratings.slice(-10);
  const older = ratings.slice(0, -10);
  const recentSum = recent.reduce((s, r) => s + r.rating, 0) * 2;
  const olderSum = older.reduce((s, r) => s + r.rating, 0);
  const totalWeight = recent.length * 2 + older.length;
  const avg = totalWeight > 0 ? (recentSum + olderSum) / totalWeight : 3;
  return Math.round(((avg - 1) / 4) * 100); // 1–5 star → 0–100
}

function calcOnTimeScore(metrics) {
  const total = metrics.totalProjectsCompleted + metrics.totalProjectsLate;
  if (total === 0) return 75; // neutral
  return Math.round((metrics.totalProjectsCompleted / total) * 100);
}

function calcResponseTimeScore(metrics) {
  const times = metrics.responseTimes || [];
  if (times.length === 0) return 75; // neutral
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  if (avg <= 15) return 100;
  if (avg <= 60) return 85;
  if (avg <= 240) return 70;
  if (avg <= 1440) return 50; // 1 day
  return 20;
}

function calcAcceptanceRate(metrics) {
  const received = metrics.totalProjectsReceived || 0;
  const accepted = metrics.totalProjectsAccepted || 0;
  if (received === 0) return 75; // neutral
  return Math.round((accepted / received) * 100);
}

function calcAvailabilityScore(creator, metrics) {
  let score = 50;
  if (creator.availabilityStatus === 'available') score += 30;
  if (metrics.availabilityUpdatesCount > 5) score += 20;
  return Math.min(score, 100);
}

function calcQualityBrainScore(metrics) {
  const scores = metrics.qualityBrainScores || [];
  if (scores.length === 0) return 50; // neutral
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  return Math.round(avg);
}

// ── Main Score Calculator ─────────────────────────────────────────────────

export const creatorScoreEngine = {
  /**
   * Calculate and persist the full score for a creator
   */
  calculateScore(creatorId) {
    const creator = creatorAuthService.getCreatorById(creatorId);
    if (!creator) return null;

    const metrics = creatorMetrics.get(creatorId);
    const weights = scoreWeightConfig.getWeights();

    const dimensions = {
      experience: calcExperienceScore(creator, metrics),
      portfolio: calcPortfolioScore(creator, metrics),
      verification: calcVerificationScore(creator),
      projectSuccess: calcProjectSuccessScore(metrics),
      customerRating: calcCustomerRatingScore(metrics),
      onTimeDelivery: calcOnTimeScore(metrics),
      responseSpeed: calcResponseTimeScore(metrics),
      acceptanceRate: calcAcceptanceRate(metrics),
      availability: calcAvailabilityScore(creator, metrics),
      qualityBrain: calcQualityBrainScore(metrics)
    };

    // Weighted overall score
    const overallScore = Math.round(
      Object.entries(dimensions).reduce((total, [key, score]) => {
        const weight = weights[key] || 0;
        return total + (score * weight / 100);
      }, 0)
    );

    const scoreData = {
      creatorId,
      overallScore,
      dimensions,
      weights,
      industryExpertise: metrics.industryExpertise || {},
      serviceExpertise: metrics.serviceExpertise || {},
      calculatedAt: new Date().toISOString()
    };

    // Persist score to creator profile
    creatorAuthService.updateCreator(creatorId, {
      scoreCard: {
        ...scoreData,
        visible: creator.verificationStatus === 'approved',
        message: metrics.totalProjectsCompleted === 0
          ? 'Score will appear after your first completed project.'
          : null
      }
    });

    return scoreData;
  },

  /**
   * Get score for display (returns cached or recalculates)
   */
  getScore(creatorId) {
    const creator = creatorAuthService.getCreatorById(creatorId);
    if (!creator) return null;
    if (creator.scoreCard?.calculatedAt) return creator.scoreCard;
    return this.calculateScore(creatorId);
  },

  /**
   * Get score label
   */
  getScoreLabel(score) {
    if (score >= 90) return { label: 'Elite', color: '#34D399' };
    if (score >= 80) return { label: 'Expert', color: '#818CF8' };
    if (score >= 70) return { label: 'Professional', color: '#60A5FA' };
    if (score >= 60) return { label: 'Skilled', color: '#FBBF24' };
    if (score >= 50) return { label: 'Growing', color: '#F59E0B' };
    return { label: 'Beginner', color: '#9CA3AF' };
  },

  /**
   * Get leaderboard (top N creators sorted by score)
   */
  getLeaderboard(limit = 20, filterByProfession = null) {
    const creators = creatorAuthService.getAllCreators()
      .filter(c => c.verificationStatus === 'approved');

    const withScores = creators.map(c => ({
      ...c,
      score: this.calculateScore(c.creatorId)
    }));

    let filtered = withScores;
    if (filterByProfession) {
      filtered = withScores.filter(c =>
        c.primaryProfession === filterByProfession ||
        c.categories?.some(cat => cat.professionName === filterByProfession)
      );
    }

    return filtered
      .sort((a, b) => (b.score?.overallScore || 0) - (a.score?.overallScore || 0))
      .slice(0, limit);
  },

  /**
   * Get improvement suggestions for a creator
   */
  getImprovementSuggestions(creatorId) {
    const score = this.getScore(creatorId);
    if (!score) return [];

    const suggestions = [];
    const d = score.dimensions || {};

    if (d.portfolio < 60) suggestions.push({ priority: 'high', text: 'Add more portfolio projects with media to increase your Portfolio Score.' });
    if (d.availability < 60) suggestions.push({ priority: 'medium', text: 'Keep your availability calendar updated to improve your Availability Score.' });
    if (d.responseSpeed < 60) suggestions.push({ priority: 'medium', text: 'Respond to project invitations faster to improve your Response Speed Score.' });
    if (d.acceptanceRate < 60) suggestions.push({ priority: 'medium', text: 'Accept more suitable projects to improve your Acceptance Rate.' });
    if (d.verification < 60) suggestions.push({ priority: 'high', text: 'Complete document verification to unlock a higher Verification Score.' });
    if (d.projectSuccess < 70) suggestions.push({ priority: 'high', text: 'Focus on completing projects on time and within budget.' });
    if (d.customerRating < 70) suggestions.push({ priority: 'high', text: 'Prioritise quality deliverables to improve customer ratings.' });

    return suggestions;
  }
};

export default creatorScoreEngine;
