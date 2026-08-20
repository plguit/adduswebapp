/**
 * ADDUS Platform — Prediction Engine
 *
 * Phase 9 implementation:
 *  - Directional outcome predictions
 *  - Evidence-based confidence
 *  - Explicit assumptions and basis
 *  - No unsupported numerical predictions
 */

import { CONFIDENCE_LEVELS } from './evidenceService.js';
import { buildDiagnosis } from './diagnosisEngine.js';

export const PREDICTION_DIRECTION = {
  LIKELY_TO_IMPROVE: 'LIKELY_TO_IMPROVE',
  LIKELY_TO_REMAIN_WEAK: 'LIKELY_TO_REMAIN_WEAK',
  HIGH_RISK: 'HIGH_RISK',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  NEEDS_MORE_DATA: 'NEEDS_MORE_DATA'
};

export function buildPredictionsFromDiagnosis(diagnosis, vault, evidenceItems = []) {
  const predictions = [];
  const safeDiagnosis = diagnosis?.diagnosis || {};
  
  const gaps = safeDiagnosis.gaps || [];
  const strengths = safeDiagnosis.strengths || [];
  const risks = safeDiagnosis.risks || [];
  const opportunities = safeDiagnosis.opportunities || [];
  
  const evidenceCount = evidenceItems.length;
  const hasWebsite = !!(vault?.websiteUrl || vault?.website);
  const hasBrandAssets = !!(vault?.brandAssets?.logo || vault?.brandAssets?.photography);
  const hasContent = Array.isArray(vault?.services) && vault.services.length > 0;
  const hasDigitalPresence = hasWebsite && evidenceCount > 0;

  // ─────────────────────────────────────────────────────────
  // Prediction 1: Trust perception improvement
  // ─────────────────────────────────────────────────────────
  if (gaps.some(g => g.dimension === 'Trust Signals' || g.dimension === 'Brand Assets')) {
    predictions.push({
      prediction: 'Customer trust perception',
      direction: hasBrandAssets ? PREDICTION_DIRECTION.LIKELY_TO_IMPROVE : PREDICTION_DIRECTION.LIKELY_TO_REMAIN_WEAK,
      confidence: gaps.some(g => g.dimension === 'Trust Signals') ? CONFIDENCE_LEVELS.MEDIUM : CONFIDENCE_LEVELS.LOW,
      basis: [
        'Trust signals gap identified in diagnosis',
        hasBrandAssets ? 'Some brand assets exist but trust signals are incomplete' : 'No brand assets detected to build trust'
      ],
      assumptions: [
        'Business will address identified gaps',
        'Market conditions remain stable'
      ],
      timeHorizon: '3-6 months'
    });
  } else if (strengths.some(s => s.dimension === 'Trust Signals')) {
    predictions.push({
      prediction: 'Customer trust perception',
      direction: PREDICTION_DIRECTION.LIKELY_TO_IMPROVE,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: ['Trust signals are present and documented'],
      assumptions: ['Current trust signals are maintained and reinforced'],
      timeHorizon: '3-6 months'
    });
  }

  // ─────────────────────────────────────────────────────────
  // Prediction 2: Brand consistency
  // ─────────────────────────────────────────────────────────
  if (gaps.some(g => g.dimension === 'Consistency' || g.dimension === 'Brand Identity')) {
    predictions.push({
      prediction: 'Brand consistency across channels',
      direction: PREDICTION_DIRECTION.LIKELY_TO_REMAIN_WEAK,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: [
        'Brand identity gaps detected',
        gaps.find(g => g.dimension === 'Consistency')?.observation || 'No consistency framework found'
      ],
      assumptions: [
        'Current asset gaps persist without intervention',
        'No new brand guidelines are introduced'
      ],
      timeHorizon: '6-12 months'
    });
  } else if (strengths.some(s => s.dimension === 'Brand Identity')) {
    predictions.push({
      prediction: 'Brand consistency across channels',
      direction: PREDICTION_DIRECTION.LIKELY_TO_IMPROVE,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: ['Brand identity assets are documented and present'],
      assumptions: ['Brand guidelines are followed consistently'],
      timeHorizon: '3-6 months'
    });
  }

  // ─────────────────────────────────────────────────────────
  // Prediction 3: Conversion readiness
  // ─────────────────────────────────────────────────────────
  if (gaps.some(g => g.dimension === 'Customer-Facing Experience' || g.dimension === 'Website')) {
    predictions.push({
      prediction: 'Website conversion readiness',
      direction: hasDigitalPresence ? PREDICTION_DIRECTION.LIKELY_TO_IMPROVE : PREDICTION_DIRECTION.LIKELY_TO_REMAIN_WEAK,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: [
        hasDigitalPresence ? 'Digital presence exists but has gaps' : 'Limited or no digital presence detected',
        gaps.find(g => g.dimension === 'Customer-Facing Experience')?.observation || 'Customer experience gaps identified'
      ],
      assumptions: [
        'Website improvements are prioritized',
        'User experience best practices are applied'
      ],
      timeHorizon: '2-4 months'
    });
  }

  // ─────────────────────────────────────────────────────────
  // Prediction 4: Content consistency
  // ─────────────────────────────────────────────────────────
  if (gaps.some(g => g.dimension === 'Content')) {
    predictions.push({
      prediction: 'Content consistency and quality',
      direction: PREDICTION_DIRECTION.LIKELY_TO_REMAIN_WEAK,
      confidence: CONFIDENCE_LEVELS.LOW,
      basis: [
        'Content gaps identified in diagnosis',
        'Insufficient documented content found'
      ],
      assumptions: [
        'Content strategy is not developed',
        'No content calendar or governance is introduced'
      ],
      timeHorizon: '6-12 months'
    });
  }

  // ─────────────────────────────────────────────────────────
  // Prediction 5: Execution delays
  // ─────────────────────────────────────────────────────────
  if (evidenceCount < 2 && gaps.length === 0 && risks.length === 0) {
    predictions.push({
      prediction: 'Overall business improvement trajectory',
      direction: PREDICTION_DIRECTION.NEEDS_MORE_DATA,
      confidence: CONFIDENCE_LEVELS.UNKNOWN,
      basis: ['Insufficient evidence and analysis depth to generate reliable predictions'],
      assumptions: ['More business context and evidence are required'],
      timeHorizon: 'Unknown'
    });
  } else if (risks.length > 0 && gaps.length > 3) {
    predictions.push({
      prediction: 'Execution delays and fragmentation',
      direction: PREDICTION_DIRECTION.HIGH_RISK,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: [
        `${risks.length} risk(s) identified`,
        `${gaps.length} gap(s) require attention`,
        'Multiple simultaneous improvements needed without clear prioritization'
      ],
      assumptions: [
        'No external project management support is engaged',
        'Business does not have dedicated internal resources'
      ],
      timeHorizon: '3-6 months'
    });
  } else if (gaps.length <= 2 && risks.length === 0) {
    predictions.push({
      prediction: 'Execution delays and fragmentation',
      direction: PREDICTION_DIRECTION.LIKELY_TO_IMPROVE,
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      basis: [
        'Limited gaps identified',
        'No critical risks detected'
      ],
      assumptions: ['Current improvements can be executed sequentially'],
      timeHorizon: '1-3 months'
    });
  }

  // ─────────────────────────────────────────────────────────
  // Default: Needs more data
  // ─────────────────────────────────────────────────────────
  if (predictions.length === 0) {
    predictions.push({
      prediction: 'Overall business improvement trajectory',
      direction: PREDICTION_DIRECTION.NEEDS_MORE_DATA,
      confidence: CONFIDENCE_LEVELS.UNKNOWN,
      basis: ['Insufficient evidence to generate reliable predictions'],
      assumptions: ['More business context and evidence are required'],
      timeHorizon: 'Unknown'
    });
  }

  return predictions.slice(0, 6);
}
