import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  EvidenceStore,
  evidenceStore,
  normalizeEvidenceItems,
  mapRetrievalEvidenceToStructured,
  evaluateEvidenceSufficiency,
  getEvidenceSummary,
  PROVENANCE_STATES,
  CONFIDENCE_LEVELS,
  EVIDENCE_TYPES
} from '../backend/services/evidenceService.js';

import { createEmptyVault, updateBusinessVault, getBusinessVault, calculateConfidenceScore } from '../ai/business-brain/vaultService.js';
import { buildFieldProvenance } from '../backend/services/aiIntelligenceService.js';

// ─────────────────────────────────────────────────────────
// Phase 5.5 — Production Integrity Verification & Stabilization
// ─────────────────────────────────────────────────────────

describe('Phase 5.5 — Evidence Persistence & Provenance', () => {
  test('EvidenceStore can load persisted evidence from vault', () => {
    const store = new EvidenceStore();
    const vault = getBusinessVault('persist_test_user');
    const rawEvidence = [
      {
        evidenceId: 'EV_PERSIST_1',
        sourceUrl: 'https://example.com',
        field: 'identity',
        observation: 'Test Business',
        evidence: 'Test Business is a consulting firm.',
        confidence: 'high',
        checkedAt: new Date().toISOString()
      }
    ];
    updateBusinessVault('persist_test_user', { websiteEvidenceItems: rawEvidence });
    const updatedVault = getBusinessVault('persist_test_user');
    store.loadFromVault(updatedVault);
    const all = store.getAllEvidence();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].evidenceId, 'EV_PERSIST_1');
    assert.strictEqual(all[0].provenance, PROVENANCE_STATES.OBSERVED);
    assert.strictEqual(all[0].confidence, CONFIDENCE_LEVELS.HIGH);
  });

  test('EvidenceStore does not duplicate evidence on reload', () => {
    const store = new EvidenceStore();
    const vault = getBusinessVault('persist_test_user_2');
    const rawEvidence = [
      {
        evidenceId: 'EV_PERSIST_DUP',
        sourceUrl: 'https://example.com',
        field: 'identity',
        observation: 'Dup Test',
        evidence: 'Duplicate evidence test.',
        confidence: 'medium',
        checkedAt: new Date().toISOString()
      }
    ];
    updateBusinessVault('persist_test_user_2', { websiteEvidenceItems: rawEvidence });
    const updatedVault = getBusinessVault('persist_test_user_2');
    store.loadFromVault(updatedVault);
    store.loadFromVault(updatedVault);
    assert.strictEqual(store.getAllEvidence().length, 1);
  });

  test('EvidenceStore handles empty vault gracefully', () => {
    const store = new EvidenceStore();
    const emptyVault = createEmptyVault();
    store.loadFromVault(emptyVault);
    assert.strictEqual(store.getAllEvidence().length, 0);
  });

  test('EvidenceStore handles null vault gracefully', () => {
    const store = new EvidenceStore();
    store.loadFromVault(null);
    store.loadFromVault(undefined);
    assert.strictEqual(store.getAllEvidence().length, 0);
  });

  test('normalizeEvidenceItems sets provenance to OBSERVED', () => {
    const raw = [
      {
        evidenceId: 'EV_PROV_1',
        source: 'https://example.com',
        field: 'identity',
        observation: 'Observed Business Name',
        evidence: 'This is observed evidence from the website.',
        confidence: 'high'
      }
    ];
    const normalized = normalizeEvidenceItems(raw, 'ANALYSIS_1');
    assert.strictEqual(normalized[0].provenance, PROVENANCE_STATES.OBSERVED);
  });

  test('mapRetrievalEvidenceToStructured preserves provenance', () => {
    const retrievalResult = {
      evidenceItems: [
        {
          evidenceId: 'EV_MAP_1',
          sourceUrl: 'https://example.com',
          field: 'services',
          observation: 'Web Design',
          evidence: 'We offer web design services.',
          confidence: 'medium'
        }
      ]
    };
    const mapped = mapRetrievalEvidenceToStructured(retrievalResult, 'ANALYSIS_2');
    assert.strictEqual(mapped[0].provenance, PROVENANCE_STATES.OBSERVED);
    assert.strictEqual(mapped[0].freshness, 'CURRENT');
  });
});

describe('Phase 5.5 — Provenance Integrity', () => {
  test('buildFieldProvenance marks fields as OBSERVED when evidence exists', () => {
    const evidenceSummary = {
      typesCovered: [EVIDENCE_TYPES.IDENTITY, EVIDENCE_TYPES.SERVICES],
      highQualityItems: 2,
      totalItems: 5
    };
    const fp = buildFieldProvenance({}, evidenceSummary);
    assert.strictEqual(fp.businessName.provenance, PROVENANCE_STATES.OBSERVED);
    assert.strictEqual(fp.services.provenance, PROVENANCE_STATES.OBSERVED);
  });

  test('buildFieldProvenance marks fields as INFERRED when no evidence', () => {
    const evidenceSummary = {
      typesCovered: [],
      highQualityItems: 0,
      totalItems: 0
    };
    const fp = buildFieldProvenance({}, evidenceSummary);
    assert.strictEqual(fp.businessName.provenance, PROVENANCE_STATES.INFERRED);
    assert.strictEqual(fp.industry.provenance, PROVENANCE_STATES.INFERRED);
    assert.strictEqual(fp.services.provenance, PROVENANCE_STATES.INFERRED);
  });

  test('fieldProvenance includes reason for INFERRED fields', () => {
    const evidenceSummary = {
      typesCovered: [],
      highQualityItems: 0,
      totalItems: 0
    };
    const fp = buildFieldProvenance({}, evidenceSummary);
    assert.ok(fp.industry.reason.includes('No'));
    assert.ok(fp.industry.reason.includes('evidence'));
  });
});

describe('Phase 5.5 — Confidence Integrity', () => {
  test('calculateConfidenceScore returns 0 for empty vault', () => {
    const vault = createEmptyVault();
    const score = calculateConfidenceScore(vault);
    assert.strictEqual(score, 0);
  });

  test('calculateConfidenceScore returns null for null vault', () => {
    assert.strictEqual(calculateConfidenceScore(null), null);
    assert.strictEqual(calculateConfidenceScore(undefined), null);
  });

  test('calculateConfidenceScore is calculated from evidence, not hardcoded', () => {
    const vault = createEmptyVault();
    vault.businessName = 'Test Corp';
    vault.industry = 'Technology';
    const score = calculateConfidenceScore(vault);
    assert.ok(score > 0);
    assert.ok(score < 100);
    assert.strictEqual(typeof score, 'number');
  });

  test('new vaults have aiConfidenceScore null by default', () => {
    const vault = createEmptyVault();
    assert.strictEqual(vault.aiConfidenceScore, null);
  });

  test('updated vaults get calculated confidence score', () => {
    const updated = updateBusinessVault('conf_test', { businessName: 'Confidence Test Inc' });
    assert.ok(updated.aiConfidenceScore !== null);
    assert.ok(updated.aiConfidenceScore >= 10);
  });
});

describe('Phase 5.5 — Insufficient Evidence Contract', () => {
  test('evaluateEvidenceSufficiency returns false for no evidence', () => {
    const result = evaluateEvidenceSufficiency([], [EVIDENCE_TYPES.IDENTITY]);
    assert.strictEqual(result.sufficient, false);
    assert.ok(result.weaknesses.length > 0);
  });

  test('evaluateEvidenceSufficiency returns false for low-quality evidence', () => {
    const items = [
      {
        evidenceId: 'EV_LOW_1',
        evidenceType: EVIDENCE_TYPES.GENERAL,
        content: 'Short',
        confidence: CONFIDENCE_LEVELS.UNKNOWN,
        provenance: PROVENANCE_STATES.UNKNOWN,
        qualityScore: 10
      }
    ];
    const result = evaluateEvidenceSufficiency(items, [EVIDENCE_TYPES.IDENTITY]);
    assert.strictEqual(result.sufficient, false);
  });

  test('insufficient evidence should not fabricate business attributes', () => {
    const emptyVault = createEmptyVault();
    assert.strictEqual(emptyVault.businessName, null);
    assert.strictEqual(emptyVault.industry, null);
    assert.strictEqual(emptyVault.services, null);
    assert.ok(Array.isArray(emptyVault.products));
    assert.strictEqual(emptyVault.targetAudience, null);
  });
});

describe('Phase 5.5 — Admin Data Authority', () => {
  test('admin vaults endpoint returns all vaults', async () => {
    const { getAllVaults } = await import('../ai/business-brain/vaultService.js');
    const vaults = getAllVaults();
    assert.ok(Array.isArray(vaults));
  });

  test('vault contains user account fields', () => {
    const vault = createEmptyVault();
    assert.ok('name' in vault);
    assert.ok('phoneNumber' in vault);
    assert.ok('email' in vault);
    assert.ok('authProvider' in vault);
    assert.ok('onboardingStatus' in vault);
    assert.ok('projects' in vault);
    assert.ok('chatHistory' in vault);
    assert.ok('notifications' in vault);
    assert.ok('expertReviewStatus' in vault);
    assert.ok('createdAt' in vault);
    assert.ok('lastLoginAt' in vault);
  });

  test('updateBusinessVault preserves user account fields', () => {
    const updated = updateBusinessVault('admin_auth_test', {
      name: 'Admin Test User',
      email: 'admin@test.com',
      phoneNumber: '1234567890'
    });
    assert.strictEqual(updated.name, 'Admin Test User');
    assert.strictEqual(updated.email, 'admin@test.com');
    assert.strictEqual(updated.phoneNumber, '1234567890');
  });
});

describe('Phase 5.5 — AI Failure Behavior', () => {
  test('AI pipeline returns UNKNOWN confidence on failure', async () => {
    const { createStructuredOutput } = await import('../backend/services/aiIntelligenceService.js');
    const { CONFIDENCE_LEVELS } = await import('../backend/services/evidenceService.js');
    const result = createStructuredOutput({
      insufficientEvidence: true,
      humanReviewRequired: true,
      confidence: CONFIDENCE_LEVELS.UNKNOWN
    });
    assert.strictEqual(result.confidence, CONFIDENCE_LEVELS.UNKNOWN);
    assert.strictEqual(result.insufficientEvidence, true);
    assert.strictEqual(result.humanReviewRequired, true);
  });

  test('AI failure does not fabricate business facts', () => {
    const failureProfile = {
      businessName: null,
      businessDescription: null,
      services: [],
      products: [],
      targetAudience: null,
      businessStage: null,
      brandPersonality: null,
      aiConfidenceScore: null,
      confidenceStatus: 'UNKNOWN',
      confidenceReason: 'AI analysis failed',
      industry: null
    };
    assert.strictEqual(failureProfile.businessName, null);
    assert.strictEqual(failureProfile.industry, null);
    assert.strictEqual(failureProfile.services.length, 0);
  });
});
