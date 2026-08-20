/**
 * ADDUS Platform — Compounding Business Context Engine
 *
 * Phase 14 implementation:
 *  - Separates durable facts from inferences, preferences, and temporary context
 *  - Ensures inferences are not promoted to facts without sufficient evidence
 *  - progressively improves future decisions
 */

export const CONTEXT_TYPE = {
  FACT: 'FACT',
  INFERENCE: 'INFERENCE',
  PREFERENCE: 'PREFERENCE',
  TEMPORARY_CONTEXT: 'TEMPORARY_CONTEXT'
};

export const CONTEXT_CATEGORY = {
  BUSINESS_POSITIONING: 'BUSINESS_POSITIONING',
  AUDIENCE: 'AUDIENCE',
  BRAND_PREFERENCE: 'BRAND_PREFERENCE',
  CREATIVE_DIRECTION: 'CREATIVE_DIRECTION',
  SPECIALIST_PERFORMANCE: 'SPECIALIST_PERFORMANCE',
  PROJECT_OUTCOME: 'PROJECT_OUTCOME',
  CUSTOMER_PREFERENCE: 'CUSTOMER_PREFERENCE',
  REPEATED_REQUIREMENT: 'REPEATED_REQUIREMENT'
};

export function createContextEntry({
  type = CONTEXT_TYPE.INFERENCE,
  category = CONTEXT_CATEGORY.BUSINESS_POSITIONING,
  key,
  value,
  evidence = [],
  confidence = 50,
  source = 'ai_inferred',
  expiresAt = null
}) {
  return {
    contextId: `CTX_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    category,
    key,
    value,
    evidence: Array.isArray(evidence) ? evidence : [],
    confidence: Math.min(100, Math.max(0, confidence)),
    source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    usageCount: 0,
    successCount: 0,
    expiresAt: expiresAt || (type === CONTEXT_TYPE.TEMPORARY_CONTEXT ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null),
    metadata: {}
  };
}

export function upgradeInferenceToFact(contextEntry, newEvidence = []) {
  if (contextEntry.type !== CONTEXT_TYPE.INFERENCE) {
    return contextEntry;
  }

  const combinedEvidence = [...contextEntry.evidence, ...newEvidence];
  const uniqueEvidence = [...new Set(combinedEvidence)];

  if (uniqueEvidence.length >= 3 && contextEntry.confidence >= 70) {
    return {
      ...contextEntry,
      type: CONTEXT_TYPE.FACT,
      evidence: uniqueEvidence,
      confidence: Math.min(100, contextEntry.confidence + 10),
      lastVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return {
    ...contextEntry,
    evidence: uniqueEvidence,
    confidence: Math.min(100, contextEntry.confidence + 5),
    updatedAt: new Date().toISOString()
  };
}

export function recordContextUsage(contextEntry, successful = false) {
  return {
    ...contextEntry,
    usageCount: (contextEntry.usageCount || 0) + 1,
    successCount: successful ? (contextEntry.successCount || 0) + 1 : (contextEntry.successCount || 0),
    lastVerifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function pruneExpiredContext(contextEntries) {
  const now = new Date().toISOString();
  return contextEntries.filter(entry => {
    if (!entry.expiresAt) return true;
    return new Date(entry.expiresAt) > new Date(now);
  });
}

export function buildCompoundingContext(vault, contextEntries = []) {
  const safeVault = vault || {};
  const facts = contextEntries.filter(e => e.type === CONTEXT_TYPE.FACT);
  const inferences = contextEntries.filter(e => e.type === CONTEXT_TYPE.INFERENCE);
  const preferences = contextEntries.filter(e => e.type === CONTEXT_TYPE.PREFERENCE);
  const temporary = pruneExpiredContext(contextEntries.filter(e => e.type === CONTEXT_TYPE.TEMPORARY_CONTEXT));

  const businessPositioning = facts.filter(e => e.category === CONTEXT_CATEGORY.BUSINESS_POSITIONING);
  const audience = facts.filter(e => e.category === CONTEXT_CATEGORY.AUDIENCE);
  const brandPreferences = preferences.filter(e => e.category === CONTEXT_CATEGORY.BRAND_PREFERENCE);
  const creativeDirections = facts.filter(e => e.category === CONTEXT_CATEGORY.CREATIVE_DIRECTION);
  const specialistPerformance = facts.filter(e => e.category === CONTEXT_CATEGORY.SPECIALIST_PERFORMANCE);
  const projectOutcomes = facts.filter(e => e.category === CONTEXT_CATEGORY.PROJECT_OUTCOME);
  const customerPreferences = preferences.filter(e => e.category === CONTEXT_CATEGORY.CUSTOMER_PREFERENCE);
  const repeatedRequirements = facts.filter(e => e.category === CONTEXT_CATEGORY.REPEATED_REQUIREMENT);

  return {
    facts: {
      count: facts.length,
      items: facts,
      businessPositioning: businessPositioning.length > 0 ? businessPositioning[0] : null,
      audience: audience.length > 0 ? audience[0] : null,
      creativeDirections,
      specialistPerformance,
      projectOutcomes,
      repeatedRequirements
    },
    inferences: {
      count: inferences.length,
      items: inferences.filter(e => !e.expiresAt || new Date(e.expiresAt) > new Date())
    },
    preferences: {
      count: preferences.length,
      items: preferences,
      brand: brandPreferences,
      customer: customerPreferences
    },
    temporary: {
      count: temporary.length,
      items: temporary
    },
    summary: {
      totalContext: contextEntries.length,
      factCount: facts.length,
      inferenceCount: inferences.length,
      preferenceCount: preferences.length,
      temporaryCount: temporary.length,
      averageConfidence: facts.length > 0 
        ? Math.round(facts.reduce((sum, e) => sum + (e.confidence || 0), 0) / facts.length)
        : 0,
      lastUpdated: new Date().toISOString()
    }
  };
}

export function getRelevantContext(contextSummary, category, type = null) {
  let items = [];
  
  if (category) {
    items = items.concat(
      contextSummary.facts.items.filter(e => e.category === category),
      contextSummary.inferences.items.filter(e => e.category === category),
      contextSummary.preferences.items.filter(e => e.category === category)
    );
  }
  
  if (type) {
    items = items.filter(e => e.type === type);
  }
  
  return items.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}
