/**
 * ADDUS Platform — Evidence Intelligence Service
 *
 * Phase 2 implementation:
 *  - Structured evidence model
 *  - Provenance tracking
 *  - Evidence quality scoring
 *  - Source deduplication
 *  - Evidence normalization
 *  - Insufficient-evidence evaluation
 *
 * No external dependencies.
 */

import { URL } from 'url';

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const MAX_EVIDENCE_ITEMS = 50;
const MIN_MEANINGFUL_EVIDENCE_LENGTH = 10;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.85;

// ─────────────────────────────────────────────────────────
// Evidence Types
// ─────────────────────────────────────────────────────────

export const EVIDENCE_TYPES = {
  IDENTITY: 'identity',
  BUSINESS_DESCRIPTION: 'business_description',
  CONTACT: 'contact',
  LOCATION: 'location',
  SERVICES: 'services',
  PRODUCTS: 'products',
  BRAND: 'brand',
  SOCIAL_PRESENCE: 'social_presence',
  PRICING: 'pricing',
  CONTENT: 'content',
  TECHNOLOGY: 'technology',
  REVIEWS: 'reviews',
  METADATA: 'metadata',
  STRUCTURED_DATA: 'structured_data',
  GENERAL: 'general'
};

export const PROVENANCE_STATES = {
  OBSERVED: 'OBSERVED',
  CUSTOMER_PROVIDED: 'CUSTOMER_PROVIDED',
  VERIFIED_EXTERNAL: 'VERIFIED_EXTERNAL',
  INFERRED: 'INFERRED',
  AI_GENERATED: 'AI_GENERATED'
};

export const SOURCE_TYPES = {
  CUSTOMER_PROVIDED: 'CUSTOMER_PROVIDED',
  WEBSITE: 'WEBSITE',
  STRUCTURED_DATA: 'STRUCTURED_DATA',
  DISCOVERED_ASSET: 'DISCOVERED_ASSET',
  EXTERNAL_RESEARCH: 'EXTERNAL_RESEARCH',
  INTERNAL_PROJECT_DATA: 'INTERNAL_PROJECT_DATA',
  INTERNAL_CONVERSATION: 'INTERNAL_CONVERSATION',
  AI_INFERENCE: 'AI_INFERENCE'
};

export const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'UNKNOWN'
};

// ─────────────────────────────────────────────────────────
// Evidence Item Schema
// ─────────────────────────────────────────────────────────

/**
 * {
 *   evidenceId: string;
 *   analysisId: string;
 *   sourceId: string;
 *   sourceUrl: string;
 *   finalUrl: string;
 *   sourceStatus: string;
 *   evidenceType: string;
 *   title: string;
 *   content: string;
 *   extractedValue: string | null;
 *   confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
 *   provenance: 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'RECOMMENDED' | 'UNKNOWN' | 'NOT_AVAILABLE';
 *   timestamp: string;
 *   freshness: 'CURRENT' | 'STALE' | 'SUPERSEDED';
 *   qualityScore: number; // 0-100
 *   duplicateOf: string | null;
 *   relatedEvidence: string[];
 * }
 */

// ─────────────────────────────────────────────────────────
// Source Normalization
// ─────────────────────────────────────────────────────────

export function normalizeSourceUrl(url) {
  try {
    const parsed = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    // Normalize trailing slash
    let normalized = parsed.href;
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }
    return {
      original: url,
      normalized,
      domain: parsed.hostname,
      path: parsed.pathname
    };
  } catch {
    return {
      original: url,
      normalized: url,
      domain: null,
      path: null
    };
  }
}

export function getSourceId(url) {
  const normalized = normalizeSourceUrl(url);
  return `SRC_${normalized.domain || 'unknown'}_${Date.now()}`;
}

// ─────────────────────────────────────────────────────────
// Evidence Quality Scoring
// ─────────────────────────────────────────────────────────

export function calculateEvidenceQuality(evidenceItem) {
  let score = 0;
  const factors = [];

  // Source reliability
  if (evidenceItem.sourceStatus === 'VERIFIED_BUSINESS_WEBSITE') {
    score += 40;
    factors.push('verified_source');
  } else if (evidenceItem.sourceStatus === 'LIKELY_BUSINESS_WEBSITE') {
    score += 25;
    factors.push('likely_business_source');
  } else if (evidenceItem.sourceStatus === 'POSSIBLE_BUSINESS_SOURCE') {
    score += 10;
    factors.push('possible_source');
  }

  // Evidence type weight
  const typeWeights = {
    [EVIDENCE_TYPES.IDENTITY]: 30,
    [EVIDENCE_TYPES.CONTACT]: 25,
    [EVIDENCE_TYPES.BUSINESS_DESCRIPTION]: 20,
    [EVIDENCE_TYPES.SERVICES]: 20,
    [EVIDENCE_TYPES.PRODUCTS]: 20,
    [EVIDENCE_TYPES.BRAND]: 15,
    [EVIDENCE_TYPES.SOCIAL_PRESENCE]: 10,
    [EVIDENCE_TYPES.PRICING]: 15,
    [EVIDENCE_TYPES.CONTENT]: 10,
    [EVIDENCE_TYPES.REVIEWS]: 15,
    [EVIDENCE_TYPES.STRUCTURED_DATA]: 20,
    [EVIDENCE_TYPES.LOCATION]: 15,
    [EVIDENCE_TYPES.TECHNOLOGY]: 5,
    [EVIDENCE_TYPES.METADATA]: 5,
    [EVIDENCE_TYPES.GENERAL]: 5
  };

  const typeWeight = typeWeights[evidenceItem.evidenceType] || 5;
  score += typeWeight;
  if (typeWeight >= 15) factors.push('high_value_type');

  // Confidence level
  if (evidenceItem.confidence === 'HIGH') {
    score += 20;
    factors.push('high_confidence');
  } else if (evidenceItem.confidence === 'MEDIUM') {
    score += 10;
    factors.push('medium_confidence');
  } else if (evidenceItem.confidence === 'LOW') {
    score += 5;
    factors.push('low_confidence');
  }

  // Provenance
  if (evidenceItem.provenance === PROVENANCE_STATES.OBSERVED) {
    score += 20;
    factors.push('observed');
  } else if (evidenceItem.provenance === PROVENANCE_STATES.INFERRED) {
    score += 10;
    factors.push('inferred');
  } else if (evidenceItem.provenance === PROVENANCE_STATES.UNKNOWN) {
    score += 0;
    factors.push('unknown');
  }

  // Content length (capped)
  const contentLength = (evidenceItem.content || '').length;
  if (contentLength > 200) {
    score += 10;
    factors.push('detailed_content');
  } else if (contentLength > 50) {
    score += 5;
    factors.push('moderate_content');
  }

  // Cap at 100
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    factors,
    rating: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'
  };
}

// ─────────────────────────────────────────────────────────
// Duplicate Detection
// ─────────────────────────────────────────────────────────

function jaccardSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function jsHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

export function findDuplicateEvidence(newItem, existingItems) {
  // NEW: Compute deterministic hash for evidence content
  const newHash = jsHash(newItem.content);

  for (const existing of existingItems) {
    // Skip same evidence ID and different types
    if (existing.evidenceId === newItem.evidenceId) continue;
    if (existing.evidenceType !== newItem.evidenceType) continue;

    // NEW: Compare hashes instead of similarity
    const existingHash = jsHash(existing.content);
    if (newHash === existingHash) {
      return {
        isDuplicate: true,
        duplicateOf: existing.evidenceId,
        similarity: 1.0
      };
    }
  }

  // No duplicates found
  return { isDuplicate: false, duplicateOf: null, similarity: 0 };
}

// ─────────────────────────────────────────────────────────
// Evidence Normalization
// ─────────────────────────────────────────────────────────

function sanitizeHtml(text) {
  if (!text) return '';
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

export function normalizeEvidenceItems(rawItems, analysisId, options = {}) {
  const { businessId, productId, projectId } = options;
  const normalized = [];
  const seen = new Set();

  for (const item of rawItems) {
    if (!item || !item.evidence || item.evidence.trim().length < MIN_MEANINGFUL_EVIDENCE_LENGTH) {
      continue;
    }

    const normalizedItem = {
      evidenceId: item.evidenceId || `EV_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      analysisId,
      businessId: businessId || null,
      productId: productId || null,
      projectId: projectId || null,
      sourceId: item.sourceId || getSourceId(item.source || ''),
      sourceUrl: item.source || '',
      finalUrl: item.source || '',
      sourceStatus: item.sourceType === 'VERIFIED_WEBSITE' ? 'VERIFIED_BUSINESS_WEBSITE' : 'LIKELY_BUSINESS_WEBSITE',
      sourceType: item.sourceType || SOURCE_TYPES.WEBSITE,
      evidenceType: item.field || EVIDENCE_TYPES.GENERAL,
      title: item.observation || 'Untitled evidence',
      content: sanitizeHtml(item.evidence).slice(0, 2000),
      extractedValue: null,
      confidence: mapConfidence(item.confidence),
      provenance: PROVENANCE_STATES.OBSERVED,
      timestamp: item.checkedAt || new Date().toISOString(),
      freshness: 'CURRENT',
      qualityScore: 0,
      duplicateOf: null,
      relatedEvidence: [],
      relatedEntity: item.relatedEntity || null,
      metadata: item.metadata || {}
    };

    // Calculate quality
    const quality = calculateEvidenceQuality(normalizedItem);
    normalizedItem.qualityScore = quality.score;

    // Check for duplicates
    const duplicateCheck = findDuplicateEvidence(normalizedItem, normalized);
    if (duplicateCheck.isDuplicate) {
      normalizedItem.duplicateOf = duplicateCheck.duplicateOf;
      normalizedItem.qualityScore = Math.max(0, normalizedItem.qualityScore - 20);
    }

    // Deduplicate by evidenceId within this batch
    if (seen.has(normalizedItem.evidenceId)) continue;
    seen.add(normalizedItem.evidenceId);

    normalized.push(normalizedItem);
  }

  // Sort by quality score descending
  normalized.sort((a, b) => b.qualityScore - a.qualityScore);

  // Limit total items
  return normalized.slice(0, MAX_EVIDENCE_ITEMS);
}

function mapConfidence(confidence) {
  if (!confidence) return CONFIDENCE_LEVELS.UNKNOWN;
  const lower = confidence.toLowerCase();
  if (lower === 'high') return CONFIDENCE_LEVELS.HIGH;
  if (lower === 'medium') return CONFIDENCE_LEVELS.MEDIUM;
  if (lower === 'low') return CONFIDENCE_LEVELS.LOW;
  return CONFIDENCE_LEVELS.UNKNOWN;
}

// ─────────────────────────────────────────────────────────
// Evidence Sufficiency
// ─────────────────────────────────────────────────────────

export function evaluateEvidenceSufficiency(evidenceItems, requiredTypes = []) {
  const result = {
    sufficient: false,
    score: 0,
    meaningfulCount: 0,
    highQualityCount: 0,
    coveredTypes: [],
    missingTypes: [],
    weaknesses: [],
    recommendations: []
  };

  if (!evidenceItems || evidenceItems.length === 0) {
    result.weaknesses.push('No evidence retrieved.');
    result.recommendations.push('Provide a business website URL or upload business documents.');
    return result;
  }

  const meaningful = evidenceItems.filter(e => e.content && e.content.trim().length >= MIN_MEANINGFUL_EVIDENCE_LENGTH);
  result.meaningfulCount = meaningful.length;
  result.highQualityCount = meaningful.filter(e => e.qualityScore >= 50).length;
  result.score = Math.round((result.highQualityCount / Math.max(1, meaningful.length)) * 100);

  const coveredTypes = new Set(meaningful.map(e => e.evidenceType));
  result.coveredTypes = Array.from(coveredTypes);

  if (requiredTypes.length > 0) {
    result.missingTypes = requiredTypes.filter(t => !coveredTypes.has(t));
    if (result.missingTypes.length > 0) {
      result.weaknesses.push(`Missing evidence types: ${result.missingTypes.join(', ')}`);
    }
  }

  // Sufficiency criteria
  if (meaningful.length < 3) {
    result.weaknesses.push('Insufficient meaningful evidence items retrieved.');
    result.recommendations.push('Retrieve more pages or provide additional business artifacts.');
  }

  if (result.highQualityCount < 2) {
    result.weaknesses.push('Not enough high-quality evidence to support reliable analysis.');
    result.recommendations.push('Provide official business website or verified business documents.');
  }

  // Check for identity evidence
  const hasIdentity = meaningful.some(e =>
    e.evidenceType === EVIDENCE_TYPES.IDENTITY ||
    e.evidenceType === EVIDENCE_TYPES.BUSINESS_DESCRIPTION ||
    e.evidenceType === EVIDENCE_TYPES.CONTACT
  );

  if (!hasIdentity) {
    result.weaknesses.push('No clear business identity evidence found.');
    result.recommendations.push('Ensure the source clearly identifies the business name, description, or contact information.');
  }

  result.sufficient = result.weaknesses.length === 0 && meaningful.length >= 3 && result.highQualityCount >= 2;

  return result;
}

// ─────────────────────────────────────────────────────────
// Evidence Aggregation
// ─────────────────────────────────────────────────────────

export function aggregateEvidenceByType(evidenceItems) {
  const aggregated = {};

  for (const item of evidenceItems) {
    if (!aggregated[item.evidenceType]) {
      aggregated[item.evidenceType] = [];
    }
    aggregated[item.evidenceType].push(item);
  }

  // Sort each group by quality
  for (const type of Object.keys(aggregated)) {
    aggregated[type].sort((a, b) => b.qualityScore - a.qualityScore);
  }

  return aggregated;
}

export function getEvidenceSummary(evidenceItems) {
  const aggregated = aggregateEvidenceByType(evidenceItems);
  const summary = {
    totalItems: evidenceItems.length,
    meaningfulItems: evidenceItems.filter(e => e.content && e.content.trim().length >= MIN_MEANINGFUL_EVIDENCE_LENGTH).length,
    highQualityItems: evidenceItems.filter(e => e.qualityScore >= 50).length,
    typesCovered: Object.keys(aggregated),
    topEvidence: evidenceItems
      .filter(e => e.qualityScore >= 50)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5),
    weakEvidence: evidenceItems.filter(e => e.qualityScore < 30).length,
    duplicates: evidenceItems.filter(e => e.duplicateOf !== null).length
  };

  return summary;
}

// ─────────────────────────────────────────────────────────
// Evidence Store
// ─────────────────────────────────────────────────────────

export class EvidenceStore {
  constructor() {
    this.items = [];
    this.analyses = new Map();
  }

  addEvidence(items, analysisId) {
    const normalized = normalizeEvidenceItems(items, analysisId);
    this.items.push(...normalized);
    this.analyses.set(analysisId, {
      analysisId,
      evidenceIds: normalized.map(e => e.evidenceId),
      createdAt: new Date().toISOString()
    });
    return normalized;
  }

  getEvidenceForAnalysis(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) return [];
    return this.items.filter(e => analysis.evidenceIds.includes(e.evidenceId));
  }

  getAllEvidence() {
    return [...this.items];
  }

  getEvidenceByType(evidenceType) {
    return this.items.filter(e => e.evidenceType === evidenceType);
  }

  getHighQualityEvidence(minScore = 50) {
    return this.items.filter(e => e.qualityScore >= minScore);
  }

  loadFromVault(vault) {
    if (!vault || !Array.isArray(vault.websiteEvidenceItems)) return;
    const existingIds = new Set(this.items.map(e => e.evidenceId));
    for (const raw of vault.websiteEvidenceItems) {
      if (!raw || existingIds.has(raw.evidenceId)) continue;
      const normalized = {
        evidenceId: raw.evidenceId || `EV_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        analysisId: raw.analysisId || 'vault_restored',
        sourceId: raw.sourceId || `SRC_${raw.sourceUrl || 'unknown'}_${Date.now()}`,
        sourceUrl: raw.sourceUrl || '',
        finalUrl: raw.finalUrl || raw.sourceUrl || '',
        sourceStatus: raw.sourceStatus || 'LIKELY_BUSINESS_WEBSITE',
        evidenceType: raw.evidenceType || raw.field || EVIDENCE_TYPES.GENERAL,
        title: raw.title || raw.observation || 'Restored evidence',
        content: raw.content || raw.evidence || '',
        extractedValue: raw.extractedValue || null,
        confidence: mapConfidence(raw.confidence),
        provenance: raw.provenance || PROVENANCE_STATES.OBSERVED,
        timestamp: raw.timestamp || raw.checkedAt || new Date().toISOString(),
        freshness: raw.freshness || 'CURRENT',
        qualityScore: raw.qualityScore || 0,
        duplicateOf: raw.duplicateOf || null,
        relatedEvidence: raw.relatedEvidence || []
      };
      this.items.push(normalized);
      existingIds.add(normalized.evidenceId);
    }
  }

  clear() {
    this.items = [];
    this.analyses.clear();
  }
}

// Global evidence store instance
export const evidenceStore = new EvidenceStore();

// ─────────────────────────────────────────────────────────
// Helper: Map raw retrieval evidence to structured evidence
// ─────────────────────────────────────────────────────────

export function mapRetrievalEvidenceToStructured(retrievalResult, analysisId) {
  if (!retrievalResult || !retrievalResult.evidenceItems) {
    return [];
  }

  return retrievalResult.evidenceItems.map(item => ({
    ...item,
    analysisId,
    provenance: PROVENANCE_STATES.OBSERVED,
    freshness: 'CURRENT',
    duplicateOf: null,
    relatedEvidence: []
  }));
}
