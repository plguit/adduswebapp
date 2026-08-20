/**
 * ADDUS Platform — Comparator Engine
 *
 * Structured comparison between business and external references.
 * Evidence-based only. Does not fabricate comparison data.
 */

export const COMPARISON_CRITERIA = {
  BRAND_CLARITY: 'brand_clarity',
  WEBSITE_CLARITY: 'website_clarity',
  SERVICE_PRESENTATION: 'service_presentation',
  PRODUCT_PRESENTATION: 'product_presentation',
  VISUAL_IDENTITY: 'visual_identity',
  CONTENT_QUALITY: 'content_quality',
  TRUST_SIGNALS: 'trust_signals',
  CUSTOMER_EXPERIENCE: 'customer_experience',
  CALLS_TO_ACTION: 'calls_to_action',
  SOCIAL_PRESENCE: 'social_presence',
  DIGITAL_PRESENCE: 'digital_presence'
};

export function buildComparison(businessEvidence, comparatorEvidence, criterion) {
  const businessData = businessEvidence[criterion] || null;
  const comparatorData = comparatorEvidence[criterion] || null;

  if (!businessData && !comparatorData) {
    return {
      criterion,
      businessEvidence: null,
      comparatorEvidence: null,
      difference: null,
      confidence: 'UNKNOWN',
      significance: 'NONE'
    };
  }

  const confidence = (businessData && comparatorData) ? 'MEDIUM' : 'LOW';
  const significance = (businessData && comparatorData) ? 'MODERATE' : 'UNKNOWN';

  return {
    criterion,
    businessEvidence: businessData,
    comparatorEvidence: comparatorData,
    difference: businessData && comparatorData ? 'comparison_available' : 'partial_comparison',
    confidence,
    significance,
    note: 'Comparison based on available evidence only'
  };
}

export function buildComparatorOutput(criteria, businessEvidence, comparatorEvidence) {
  const comparisons = {};

  for (const criterion of criteria) {
    comparisons[criterion] = buildComparison(businessEvidence, comparatorEvidence, criterion);
  }

  return {
    criteria,
    comparisons,
    overallConfidence: Object.values(comparisons).some(c => c.confidence === 'MEDIUM') ? 'MEDIUM' : 'LOW',
    generatedAt: new Date().toISOString()
  };
}