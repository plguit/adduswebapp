/**
 * Phase 2 Tests — Evidence Model, Provenance, Quality Scoring, Deduplication, Sufficiency
 * Uses Node.js built-in test runner (node:test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  normalizeEvidenceItems,
  mapRetrievalEvidenceToStructured,
  evaluateEvidenceSufficiency,
  getEvidenceSummary,
  aggregateEvidenceByType,
  calculateEvidenceQuality,
  findDuplicateEvidence,
  normalizeSourceUrl,
  getSourceId,
  EvidenceStore,
  evidenceStore,
  EVIDENCE_TYPES,
  PROVENANCE_STATES,
  CONFIDENCE_LEVELS
} from '../backend/services/evidenceService.js';

// ─────────────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────────────

describe('normalizeEvidenceItems', () => {
  it('should normalize raw evidence items into structured format', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Page title found',
        evidence: 'Acme Corp - Professional Services',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].evidenceId, 'EV_1');
    assert.strictEqual(result[0].analysisId, 'ANALYSIS_1');
    assert.strictEqual(result[0].provenance, PROVENANCE_STATES.OBSERVED);
    assert.ok(result[0].qualityScore >= 0);
  });

  it('should filter out items with insufficient evidence length', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Short',
        evidence: 'ab',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(result.length, 0);
  });

  it('should generate evidenceId when missing', () => {
    const raw = [
      {
        observation: 'Test',
        evidence: 'This is a test evidence item with enough length',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.ok(result[0].evidenceId.startsWith('EV_'));
  });

  it('should sort items by quality score descending', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Low quality',
        evidence: 'Short text here',
        source: 'https://acme.com',
        sourceType: 'POSSIBLE_BUSINESS_SOURCE',
        confidence: 'low',
        field: 'general',
        checkedAt: '2024-01-01T00:00:00Z'
      },
      {
        evidenceId: 'EV_2',
        observation: 'High quality',
        evidence: 'Very detailed evidence with contact information and business description that is very long',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'contact',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.ok(result[0].qualityScore >= result[1].qualityScore);
  });
});

// ─────────────────────────────────────────────────────────
// Provenance & Confidence
// ─────────────────────────────────────────────────────────

describe('provenance and confidence', () => {
  it('should map confidence values correctly', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Test',
        evidence: 'This is a test evidence item with enough length',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(result[0].confidence, CONFIDENCE_LEVELS.HIGH);
    assert.strictEqual(result[0].provenance, PROVENANCE_STATES.OBSERVED);
  });

  it('should default to UNKNOWN for missing confidence', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Test',
        evidence: 'This is a test evidence item with enough length',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: null,
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(result[0].confidence, CONFIDENCE_LEVELS.UNKNOWN);
  });
});

// ─────────────────────────────────────────────────────────
// Quality Scoring
// ─────────────────────────────────────────────────────────

describe('calculateEvidenceQuality', () => {
  it('should assign higher scores to verified sources', () => {
    const item = {
      sourceStatus: 'VERIFIED_BUSINESS_WEBSITE',
      evidenceType: EVIDENCE_TYPES.CONTACT,
      confidence: 'HIGH',
      provenance: PROVENANCE_STATES.OBSERVED,
      content: 'Contact us at info@acme.com or call +1-555-0100'
    };

    const result = calculateEvidenceQuality(item);
    assert.ok(result.score >= 70);
    assert.strictEqual(result.rating, 'HIGH');
  });

  it('should assign lower scores to unknown sources', () => {
    const item = {
      sourceStatus: 'POSSIBLE_BUSINESS_SOURCE',
      evidenceType: EVIDENCE_TYPES.GENERAL,
      confidence: 'LOW',
      provenance: PROVENANCE_STATES.UNKNOWN,
      content: 'random text here'
    };

    const result = calculateEvidenceQuality(item);
    assert.ok(result.score < 50);
  });

  it('should cap score at 100', () => {
    const item = {
      sourceStatus: 'VERIFIED_BUSINESS_WEBSITE',
      evidenceType: EVIDENCE_TYPES.IDENTITY,
      confidence: 'HIGH',
      provenance: PROVENANCE_STATES.OBSERVED,
      content: 'A'.repeat(500)
    };

    const result = calculateEvidenceQuality(item);
    assert.ok(result.score <= 100);
  });
});

// ─────────────────────────────────────────────────────────
// Duplicate Detection
// ─────────────────────────────────────────────────────────

describe('findDuplicateEvidence', () => {
  it('should detect near-duplicate evidence', () => {
    const newItem = {
      evidenceId: 'EV_2',
      evidenceType: EVIDENCE_TYPES.CONTACT,
      content: 'Contact us at info@acme.com or call +1-555-0100'
    };

    const existingItems = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'Contact us at info@acme.com or call +1-555-0100'
      }
    ];

    const result = findDuplicateEvidence(newItem, existingItems);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.duplicateOf, 'EV_1');
  });

  it('should not flag different evidence as duplicate', () => {
    const newItem = {
      evidenceId: 'EV_2',
      evidenceType: EVIDENCE_TYPES.CONTACT,
      content: 'Completely different contact information here'
    };

    const existingItems = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'Contact us at info@acme.com'
      }
    ];

    const result = findDuplicateEvidence(newItem, existingItems);
    assert.strictEqual(result.isDuplicate, false);
  });
});

// ─────────────────────────────────────────────────────────
// Evidence Sufficiency
// ─────────────────────────────────────────────────────────

describe('evaluateEvidenceSufficiency', () => {
  it('should mark as sufficient when high-quality identity/contact evidence exists', () => {
    const items = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.IDENTITY,
        content: 'Acme Corporation is a leading provider of professional services with over 20 years of experience',
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 80
      },
      {
        evidenceId: 'EV_2',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'Contact us at info@acme.com or call +1-555-0100',
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 75
      },
      {
        evidenceId: 'EV_3',
        evidenceType: EVIDENCE_TYPES.SERVICES,
        content: 'We offer consulting, design, and development services for enterprise clients',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 60
      }
    ];

    const result = evaluateEvidenceSufficiency(items, [EVIDENCE_TYPES.IDENTITY, EVIDENCE_TYPES.CONTACT]);
    assert.strictEqual(result.sufficient, true);
    assert.strictEqual(result.meaningfulCount, 3);
    assert.ok(result.highQualityCount >= 2);
  });

  it('should mark as insufficient when evidence is missing', () => {
    const items = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.GENERAL,
        content: 'Short text here',
        confidence: CONFIDENCE_LEVELS.LOW,
        provenance: PROVENANCE_STATES.UNKNOWN,
        qualityScore: 10
      }
    ];

    const result = evaluateEvidenceSufficiency(items, [EVIDENCE_TYPES.IDENTITY, EVIDENCE_TYPES.CONTACT]);
    assert.strictEqual(result.sufficient, false);
    assert.ok(result.weaknesses.length > 0);
  });

  it('should identify missing evidence types', () => {
    const items = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.SERVICES,
        content: 'We provide many professional services for businesses',
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 50
      }
    ];

    const result = evaluateEvidenceSufficiency(items, [EVIDENCE_TYPES.IDENTITY, EVIDENCE_TYPES.CONTACT]);
    assert.ok(result.missingTypes.includes(EVIDENCE_TYPES.IDENTITY));
    assert.ok(result.missingTypes.includes(EVIDENCE_TYPES.CONTACT));
  });
});

// ─────────────────────────────────────────────────────────
// Evidence Summary
// ─────────────────────────────────────────────────────────

describe('getEvidenceSummary', () => {
  it('should produce summary statistics', () => {
    const items = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'A'.repeat(100),
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 80
      },
      {
        evidenceId: 'EV_2',
        evidenceType: EVIDENCE_TYPES.SERVICES,
        content: 'B'.repeat(100),
        confidence: CONFIDENCE_LEVELS.LOW,
        provenance: PROVENANCE_STATES.UNKNOWN,
        qualityScore: 20
      }
    ];

    const summary = getEvidenceSummary(items);
    assert.strictEqual(summary.totalItems, 2);
    assert.strictEqual(summary.typesCovered.length, 2);
    assert.ok(summary.highQualityItems >= 1);
  });
});

// ─────────────────────────────────────────────────────────
// Aggregate Evidence By Type
// ─────────────────────────────────────────────────────────

describe('aggregateEvidenceByType', () => {
  it('should group evidence by type and sort by quality', () => {
    const items = [
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'A'.repeat(100),
        qualityScore: 80
      },
      {
        evidenceId: 'EV_2',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'B'.repeat(100),
        qualityScore: 40
      },
      {
        evidenceId: 'EV_3',
        evidenceType: EVIDENCE_TYPES.SERVICES,
        content: 'C'.repeat(100),
        qualityScore: 60
      }
    ];

    const aggregated = aggregateEvidenceByType(items);
    assert.ok(aggregated[EVIDENCE_TYPES.CONTACT]);
    assert.strictEqual(aggregated[EVIDENCE_TYPES.CONTACT].length, 2);
    assert.ok(aggregated[EVIDENCE_TYPES.CONTACT][0].qualityScore >= aggregated[EVIDENCE_TYPES.CONTACT][1].qualityScore);
  });
});

// ─────────────────────────────────────────────────────────
// Source Normalization
// ─────────────────────────────────────────────────────────

describe('normalizeSourceUrl', () => {
  it('should normalize URLs and remove tracking params', () => {
    const result = normalizeSourceUrl('https://acme.com/?utm_source=google&utm_medium=cpc');
    assert.strictEqual(result.domain, 'acme.com');
    assert.ok(!result.normalized.includes('utm_source'));
  });

  it('should handle invalid URLs gracefully', () => {
    const result = normalizeSourceUrl('not-a-url');
    assert.strictEqual(result.domain, null);
    assert.strictEqual(result.normalized, 'not-a-url');
  });
});

describe('getSourceId', () => {
  it('should generate consistent source IDs', () => {
    const id1 = getSourceId('https://acme.com/page');
    const id2 = getSourceId('https://acme.com/page');
    assert.ok(id1.startsWith('SRC_acme.com_'));
  });
});

// ─────────────────────────────────────────────────────────
// EvidenceStore
// ─────────────────────────────────────────────────────────

describe('EvidenceStore', () => {
  it('should add and retrieve evidence by analysisId', () => {
    const store = new EvidenceStore();
    const items = [
      {
        evidenceId: 'EV_1',
        field: EVIDENCE_TYPES.CONTACT,
        evidence: 'A'.repeat(100),
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 80
      }
    ];

    const normalized = store.addEvidence(items, 'ANALYSIS_1');
    assert.strictEqual(normalized.length, 1);

    const retrieved = store.getEvidenceForAnalysis('ANALYSIS_1');
    assert.strictEqual(retrieved.length, 1);
  });

  it('should filter evidence by type', () => {
    const store = new EvidenceStore();
    store.addEvidence([
      {
        evidenceId: 'EV_1',
        field: EVIDENCE_TYPES.CONTACT,
        evidence: 'A'.repeat(100),
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 80
      },
      {
        evidenceId: 'EV_2',
        field: EVIDENCE_TYPES.SERVICES,
        evidence: 'B'.repeat(100),
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 50
      }
    ], 'ANALYSIS_1');

    const contactEvidence = store.getEvidenceByType(EVIDENCE_TYPES.CONTACT);
    assert.strictEqual(contactEvidence.length, 1);
    assert.strictEqual(contactEvidence[0].evidenceType, EVIDENCE_TYPES.CONTACT);
  });

  it('should clear all evidence', () => {
    const store = new EvidenceStore();
    store.addEvidence([
      {
        evidenceId: 'EV_1',
        evidenceType: EVIDENCE_TYPES.CONTACT,
        content: 'A'.repeat(100),
        confidence: CONFIDENCE_LEVELS.HIGH,
        provenance: PROVENANCE_STATES.OBSERVED,
        qualityScore: 80
      }
    ], 'ANALYSIS_1');

    store.clear();
    assert.strictEqual(store.getAllEvidence().length, 0);
  });
});

// ─────────────────────────────────────────────────────────
// Map retrieval evidence to structured format
// ─────────────────────────────────────────────────────────

describe('mapRetrievalEvidenceToStructured', () => {
  it('should map retrieval evidence to structured format', () => {
    const retrievalResult = {
      evidenceItems: [
        {
          evidenceId: 'EV_1',
          observation: 'Page title found',
          evidence: 'Acme Corp - Professional Services',
          source: 'https://acme.com',
          sourceType: 'VERIFIED_WEBSITE',
          confidence: 'high',
          field: 'businessName',
          checkedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };

    const result = mapRetrievalEvidenceToStructured(retrievalResult, 'ANALYSIS_1');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].analysisId, 'ANALYSIS_1');
    assert.strictEqual(result[0].provenance, PROVENANCE_STATES.OBSERVED);
  });

  it('should return empty array for null/empty input', () => {
    assert.strictEqual(mapRetrievalEvidenceToStructured(null, 'ANALYSIS_1').length, 0);
    assert.strictEqual(mapRetrievalEvidenceToStructured({}, 'ANALYSIS_1').length, 0);
  });
});

// ─────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('should handle empty evidence array', () => {
    const result = normalizeEvidenceItems([], 'ANALYSIS_1');
    assert.strictEqual(result.length, 0);
  });

  it('should handle evidence with special characters', () => {
    const raw = [
      {
        evidenceId: 'EV_1',
        observation: 'Test',
        evidence: 'Evidence with special chars: <script>alert("xss")</script> & more',
        source: 'https://acme.com',
        sourceType: 'VERIFIED_WEBSITE',
        confidence: 'high',
        field: 'businessName',
        checkedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const result = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(result.length, 1);
    assert.ok(!result[0].content.includes('<script>'));
  });
});

console.log('Phase 2 tests loaded. Run with: node --test tests/');
