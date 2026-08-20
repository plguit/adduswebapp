/**
 * ADDUS Platform — Opportunity Engine
 *
 * Generates structured gaps, possibilities, and opportunities
 * from evidence and evaluation results.
 */

import { EVIDENCE_TYPES, PROVENANCE_STATES, CONFIDENCE_LEVELS } from './evidenceService.js';

export const GAP_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const OPPORTUNITY_PRIORITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export function detectGaps(evaluationResults, evidenceSummary) {
  const gaps = [];

  if (!evaluationResults || typeof evaluationResults !== 'object') {
    return gaps;
  }

  for (const [criterion, result] of Object.entries(evaluationResults)) {
    if (!result || typeof result.score !== 'number') continue;

    if (result.score < 0.3) {
      gaps.push({
        gapId: `GAP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        criterion,
        severity: GAP_SEVERITY.CRITICAL,
        score: result.score,
        evidenceRefs: result.evidenceRefs || [],
        explanation: result.description || `Critical gap in ${criterion}`,
        confidence: CONFIDENCE_LEVELS.LOW,
        businessImpact: result.impact || 'Unknown impact'
      });
    } else if (result.score < 0.5) {
      gaps.push({
        gapId: `GAP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        criterion,
        severity: GAP_SEVERITY.HIGH,
        score: result.score,
        evidenceRefs: result.evidenceRefs || [],
        explanation: result.description || `Significant gap in ${criterion}`,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        businessImpact: result.impact || 'Moderate impact expected'
      });
    } else if (result.score < 0.7) {
      gaps.push({
        gapId: `GAP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        criterion,
        severity: GAP_SEVERITY.MEDIUM,
        score: result.score,
        evidenceRefs: result.evidenceRefs || [],
        explanation: result.description || `Minor gap in ${criterion}`,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        businessImpact: result.impact || 'Low impact expected'
      });
    }
  }

  return gaps.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });
}

export function generatePossibilities(gaps, evidenceSummary) {
  return gaps.slice(0, 5).map(gap => ({
    possibilityId: `POSS_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    description: `Address ${gap.criterion} gap`,
    supportingEvidence: gap.evidenceRefs,
    relatedGap: gap.gapId,
    businessImpact: gap.businessImpact,
    confidence: gap.confidence,
    prerequisites: ['Requires customer approval', 'Requires resource allocation']
  }));
}

export function generateOpportunities(gaps, possibilities, evidenceSummary) {
  const opportunities = [];

  for (const gap of gaps.slice(0, 5)) {
    const priority = gap.severity === 'CRITICAL' || gap.severity === 'HIGH'
      ? OPPORTUNITY_PRIORITY.HIGH
      : gap.severity === 'MEDIUM'
        ? OPPORTUNITY_PRIORITY.MEDIUM
        : OPPORTUNITY_PRIORITY.LOW;

    opportunities.push({
      opportunityId: `OPP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: gap.explanation,
      evidenceRefs: gap.evidenceRefs,
      relatedGap: gap.gapId,
      expectedImpact: gap.businessImpact,
      effort: priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      priority,
      confidence: gap.confidence
    });
  }

  return opportunities;
}

export function buildStructuredIntelligenceOutput({
  businessSnapshot,
  evidenceSummary,
  gaps = [],
  possibilities = [],
  opportunities = [],
  recommendations = [],
  predictions = [],
  competitors = [],
  comparisons = {},
  research = [],
  confidence = 'UNKNOWN',
  evidenceRefs = [],
  generatedAt
}) {
  return {
    businessSnapshot: businessSnapshot || {},
    evidenceSummary: evidenceSummary || {},
    strengths: [],
    gaps: gaps.slice(0, 10),
    possibilities: possibilities.slice(0, 10),
    opportunities: opportunities.slice(0, 10),
    recommendations: recommendations.slice(0, 12),
    predictions: predictions.slice(0, 5),
    competitors: competitors.slice(0, 10),
    comparisons: Object.keys(comparisons).slice(0, 10).reduce((acc, key) => {
      acc[key] = comparisons[key];
      return acc;
    }, {}),
    research: research.slice(0, 5),
    confidence,
    uncertainty: confidence === 'UNKNOWN' ? 'Insufficient evidence for high confidence' : 'Low uncertainty',
    evidenceRefs: evidenceRefs.slice(0, 20),
    generatedAt: generatedAt || new Date().toISOString(),
    requiresExpertReview: confidence === 'UNKNOWN' || gaps.some(g => g.severity === 'CRITICAL')
  };
}