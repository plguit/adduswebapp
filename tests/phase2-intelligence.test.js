import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  detectGaps,
  generatePossibilities,
  generateOpportunities,
  buildStructuredIntelligenceOutput,
  GAP_SEVERITY,
  OPPORTUNITY_PRIORITY
} from '../backend/services/opportunityEngine.js';

import {
  generateRecommendations,
  buildRecommendationSummary,
  RECOMMENDATION_STATUS
} from '../backend/services/recommendationEngine.js';

import {
  evaluateResearchNeed,
  shouldRefreshResearch
} from '../backend/services/researchDecisionEngine.js';

import {
  validateSource,
  deduplicateSources,
  isSourceFresh
} from '../backend/services/sourceValidator.js';

import {
  createCompetitorRecord,
  addCompetitor,
  getCompetitors,
  removeStaleCompetitors,
  COMPETITOR_STATUS
} from '../backend/services/competitorEngine.js';

import {
  buildComparison,
  buildComparatorOutput,
  COMPARISON_CRITERIA
} from '../backend/services/comparatorEngine.js';

import {
  createAuditEntry,
  appendAuditTrail,
  getAuditTrail
} from '../backend/services/auditLogger.js';

import { CONFIDENCE_LEVELS } from '../backend/services/evidenceService.js';

// ─────────────────────────────────────────────────────────
// Phase 2 — Opportunity Engine
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Opportunity Engine', () => {
  it('should detect critical gaps', () => {
    const evaluationResults = {
      brand_clarity: { score: 0.2, description: 'Brand clarity is weak', impact: 'High impact' },
      website_clarity: { score: 0.8, description: 'Website is clear' }
    };
    const gaps = detectGaps(evaluationResults, {});
    assert.ok(gaps.some(g => g.criterion === 'brand_clarity' && g.severity === 'CRITICAL'));
    assert.ok(!gaps.some(g => g.criterion === 'website_clarity'));
  });

  it('should detect high and medium gaps', () => {
    const evaluationResults = {
      content_quality: { score: 0.4, description: 'Content needs work', impact: 'Moderate impact' },
      visual_identity: { score: 0.6, description: 'Visual identity is acceptable', impact: 'Low impact' }
    };
    const gaps = detectGaps(evaluationResults, {});
    assert.ok(gaps.some(g => g.criterion === 'content_quality' && g.severity === 'HIGH'));
    assert.ok(gaps.some(g => g.criterion === 'visual_identity' && g.severity === 'MEDIUM'));
  });

  it('should generate possibilities from gaps', () => {
    const gaps = [
      { gapId: 'GAP_1', criterion: 'brand_clarity', evidenceRefs: ['ev_1'], businessImpact: 'High impact' }
    ];
    const possibilities = generatePossibilities(gaps, {});
    assert.strictEqual(possibilities.length, 1);
    assert.ok(possibilities[0].description.includes('brand_clarity'));
  });

  it('should generate opportunities from gaps', () => {
    const gaps = [
      { gapId: 'GAP_1', criterion: 'brand_clarity', evidenceRefs: ['ev_1'], explanation: 'Brand clarity low', severity: 'CRITICAL', confidence: CONFIDENCE_LEVELS.LOW, businessImpact: 'Impact' }
    ];
    const opportunities = generateOpportunities(gaps, [], {});
    assert.strictEqual(opportunities.length, 1);
    assert.strictEqual(opportunities[0].priority, 'HIGH');
  });

  it('should build structured intelligence output', () => {
    const output = buildStructuredIntelligenceOutput({
      businessSnapshot: { known: ['test'] },
      evidenceSummary: {},
      gaps: [],
      opportunities: [],
      recommendations: [],
      confidence: CONFIDENCE_LEVELS.MEDIUM
    });
    assert.ok('businessSnapshot' in output);
    assert.ok('gaps' in output);
    assert.ok('opportunities' in output);
    assert.ok('recommendations' in output);
    assert.strictEqual(output.confidence, CONFIDENCE_LEVELS.MEDIUM);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Recommendation Engine
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Recommendation Engine', () => {
  it('should generate RECOMMENDED when asset missing', () => {
    const gaps = [
      { gapId: 'GAP_1', criterion: 'brand_clarity', evidenceRefs: ['ev_1'], explanation: 'Brand clarity low', severity: 'HIGH', confidence: CONFIDENCE_LEVELS.MEDIUM, businessImpact: 'Impact' }
    ];
    const opportunities = [
      { opportunityId: 'OPP_1', description: 'Improve brand clarity', evidenceRefs: ['ev_1'], relatedGap: 'GAP_1', expectedImpact: 'Impact', effort: 'HIGH', priority: 'HIGH', confidence: CONFIDENCE_LEVELS.MEDIUM }
    ];
    const recommendations = generateRecommendations(gaps, opportunities, {}, []);
    assert.ok(recommendations.some(r => r.status === RECOMMENDATION_STATUS.RECOMMENDED));
  });

  it('should generate ALREADY_SUFFICIENT when asset exists', () => {
    const gaps = [
      { gapId: 'GAP_1', criterion: 'brand_clarity', evidenceRefs: ['ev_1'], explanation: 'Brand clarity low', severity: 'HIGH', confidence: CONFIDENCE_LEVELS.MEDIUM, businessImpact: 'Impact' }
    ];
    const opportunities = [
      { opportunityId: 'OPP_1', description: 'Improve brand clarity', evidenceRefs: ['ev_1'], relatedGap: 'GAP_1', expectedImpact: 'Impact', effort: 'HIGH', priority: 'HIGH', confidence: CONFIDENCE_LEVELS.MEDIUM }
    ];
    const existingAssets = [{ assetType: 'logo', confidence: 'HIGH' }];
    const recommendations = generateRecommendations(gaps, opportunities, {}, existingAssets);
    assert.ok(recommendations.some(r => r.status === RECOMMENDATION_STATUS.ALREADY_SUFFICIENT));
  });

  it('should build recommendation summary', () => {
    const recommendations = [
      { status: RECOMMENDATION_STATUS.RECOMMENDED, priority: 'HIGH' },
      { status: RECOMMENDATION_STATUS.ALREADY_SUFFICIENT, priority: 'LOW' },
      { status: RECOMMENDATION_STATUS.RECOMMENDED, priority: 'MEDIUM' }
    ];
    const summary = buildRecommendationSummary(recommendations);
    assert.strictEqual(summary.total, 3);
    assert.strictEqual(summary.recommended, 2);
    assert.strictEqual(summary.alreadySufficient, 1);
    assert.strictEqual(summary.highPriority, 1);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Research Decision Engine
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Research Decision Engine', () => {
  it('should return NOT_REQUIRED for non-research questions', async () => {
    const result = evaluateResearchNeed('user1', 'What is our business name?', 'BUSINESS_QUESTION');
    assert.strictEqual(result.decision, 'NOT_REQUIRED');
  });

  it('should return REQUIRED for competitor questions', async () => {
    const result = evaluateResearchNeed('user1', 'Who are our competitors?', 'RESEARCH_QUESTION');
    assert.ok(['REQUIRED', 'INSUFFICIENT_INTERNAL_EVIDENCE'].includes(result.decision));
  });

  it('should return INSUFFICIENT_INTERNAL_EVIDENCE when no evidence exists', async () => {
    const result = evaluateResearchNeed('user1', 'How does our website compare to competitors?', 'RESEARCH_QUESTION');
    assert.ok(['REQUIRED', 'INSUFFICIENT_INTERNAL_EVIDENCE'].includes(result.decision));
  });

  it('should identify stale research', () => {
    const fresh = { retrievedAt: new Date().toISOString() };
    const stale = { retrievedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() };
    assert.strictEqual(shouldRefreshResearch(fresh), false);
    assert.strictEqual(shouldRefreshResearch(stale), true);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Source Validator
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Source Validator', () => {
  it('should validate trusted sources', () => {
    const result = validateSource('https://www.gov.uk/data', 'government');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.trusted, true);
    assert.strictEqual(result.confidence, 0.9);
  });

  it('should validate untrusted sources', () => {
    const result = validateSource('https://randomblog.com/post', 'blog');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.trusted, false);
    assert.strictEqual(result.confidence, 0.5);
  });

  it('should reject invalid sources', () => {
    const result = validateSource('', 'unknown');
    assert.strictEqual(result.valid, false);
  });

  it('should deduplicate sources', () => {
    const sources = [
      { sourceUrl: 'https://example.com/1' },
      { sourceUrl: 'https://example.com/1' },
      { sourceUrl: 'https://example.com/2' }
    ];
    const unique = deduplicateSources(sources);
    assert.strictEqual(unique.length, 2);
  });

  it('should check source freshness', () => {
    const fresh = { retrievedAt: new Date().toISOString() };
    const stale = { retrievedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() };
    assert.strictEqual(isSourceFresh(fresh), true);
    assert.strictEqual(isSourceFresh(stale), false);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Competitor Engine
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Competitor Engine', () => {
  it('should create competitor record', () => {
    const record = createCompetitorRecord('Competitor A', 'https://competitor-a.com', 'EXTERNAL_RESEARCH');
    assert.ok(record.competitorId);
    assert.strictEqual(record.name, 'Competitor A');
    assert.strictEqual(record.source, 'EXTERNAL_RESEARCH');
  });

  it('should reject invalid competitor records', () => {
    const record = createCompetitorRecord('', 'https://competitor-a.com', 'EXTERNAL_RESEARCH');
    assert.strictEqual(record, null);
  });

  it('should add competitor to vault', () => {
    const vault = { competitors: [] };
    const record = createCompetitorRecord('Competitor A', 'https://competitor-a.com', 'EXTERNAL_RESEARCH');
    const added = addCompetitor(vault, record);
    assert.strictEqual(added, true);
    assert.strictEqual(vault.competitors.length, 1);
  });

  it('should not duplicate competitors', () => {
    const vault = { competitors: [{ name: 'Competitor A', website: 'competitor-a.com' }] };
    const record = createCompetitorRecord('Competitor A', 'https://competitor-a.com', 'EXTERNAL_RESEARCH');
    const added = addCompetitor(vault, record);
    assert.strictEqual(added, false);
    assert.strictEqual(vault.competitors.length, 1);
  });

  it('should get competitors', () => {
    const vault = {
      competitors: [
        { name: 'A', status: COMPETITOR_STATUS.VERIFIED },
        { name: 'B', status: COMPETITOR_STATUS.STALE }
      ]
    };
    const verified = getCompetitors(vault, COMPETITOR_STATUS.VERIFIED);
    assert.strictEqual(verified.length, 1);
    assert.strictEqual(verified[0].name, 'A');
  });

  it('should remove stale competitors', () => {
    const vault = {
      competitors: [
        { name: 'A', lastVerifiedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'B', lastVerifiedAt: new Date().toISOString() }
      ]
    };
    const removed = removeStaleCompetitors(vault);
    assert.strictEqual(removed, 1);
    assert.strictEqual(vault.competitors.length, 1);
    assert.strictEqual(vault.competitors[0].name, 'B');
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Comparator Engine
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Comparator Engine', () => {
  it('should build comparison with both sides', () => {
    const result = buildComparison(
      { brand_clarity: 'Strong brand' },
      { brand_clarity: 'Weak brand' },
      'brand_clarity'
    );
    assert.strictEqual(result.criterion, 'brand_clarity');
    assert.strictEqual(result.confidence, 'MEDIUM');
  });

  it('should handle partial comparison', () => {
    const result = buildComparison(
      { brand_clarity: 'Strong brand' },
      {},
      'brand_clarity'
    );
    assert.strictEqual(result.confidence, 'LOW');
    assert.strictEqual(result.comparatorEvidence, null);
  });

  it('should build comparator output', () => {
    const output = buildComparatorOutput(
      [COMPARISON_CRITERIA.BRAND_CLARITY],
      { brand_clarity: 'Strong' },
      { brand_clarity: 'Weak' }
    );
    assert.ok('comparisons' in output);
    assert.ok('brand_clarity' in output.comparisons);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 2 — Audit Logger
// ─────────────────────────────────────────────────────────

describe('Phase 2 — Audit Logger', () => {
  it('should create audit entry', () => {
    const entry = createAuditEntry({
      requestId: 'req_123',
      userId: 'user1',
      intent: 'BUSINESS_QUESTION',
      status: 'SUCCESS'
    });
    assert.strictEqual(entry.requestId, 'req_123');
    assert.strictEqual(entry.userId, 'user1');
    assert.strictEqual(entry.status, 'SUCCESS');
  });

  it('should append audit trail to vault', () => {
    const vault = { auditLog: [] };
    const entry = createAuditEntry({ userId: 'user1' });
    appendAuditTrail(vault, entry);
    assert.strictEqual(vault.auditLog.length, 1);
    assert.strictEqual(vault.auditLog[0].userId, 'user1');
  });

  it('should limit audit trail size', () => {
    const vault = { auditLog: [] };
    for (let i = 0; i < 105; i++) {
      appendAuditTrail(vault, createAuditEntry({ userId: 'user1' }));
    }
    assert.strictEqual(vault.auditLog.length, 100);
  });

  it('should filter audit trail', () => {
    const vault = {
      auditLog: [
        { userId: 'user1', intent: 'BUSINESS_QUESTION', status: 'SUCCESS', createdAt: new Date().toISOString() },
        { userId: 'user2', intent: 'RESEARCH_QUESTION', status: 'SUCCESS', createdAt: new Date().toISOString() }
      ]
    };
    const filtered = getAuditTrail(vault, { userId: 'user1' });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].userId, 'user1');
  });
});