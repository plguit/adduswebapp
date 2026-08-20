import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getActiveResearchProvider,
  isResearchAvailable,
  searchExternalResearch,
  resetResearchProvider
} from '../backend/services/researchProvider.js';

import {
  recordObservation,
  getObservations,
  getObservationStats,
  clearObservations,
  AI_REQUESTS,
  EXTERNAL_CALLS,
  RESEARCH,
  SYSTEM
} from '../backend/services/observationStore.js';

import { RESEARCH_DECISIONS } from '../backend/services/researchDecisionEngine.js';

// ─────────────────────────────────────────────────────────
// Phase 3 — Research Provider
// ─────────────────────────────────────────────────────────

describe('Phase 3 — Research Provider', () => {
  it('should return null provider when no API key configured', () => {
    resetResearchProvider();
    const provider = getActiveResearchProvider();
    assert.strictEqual(provider, null);
  });

  it('should report research as unavailable when no provider', () => {
    resetResearchProvider();
    assert.strictEqual(isResearchAvailable(), false);
  });

  it('should return unavailable result when no provider', async () => {
    resetResearchProvider();
    const result = await searchExternalResearch('test query');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.reason, 'RESEARCH_UNAVAILABLE');
  });
});

// ─────────────────────────────────────────────────────────
// Phase 3 — Observation Store
// ─────────────────────────────────────────────────────────

describe('Phase 3 — Observation Store', () => {
  it('should record AI request observation', () => {
    clearObservations();
    const entry = recordObservation({
      category: AI_REQUESTS,
      requestId: 'req_123',
      requestType: 'CHAT_RESPONSE',
      userId: 'user1',
      status: 'SUCCESS'
    });
    assert.ok(entry.id);
    assert.strictEqual(entry.category, AI_REQUESTS);
  });

  it('should record external call observation', () => {
    clearObservations();
    const entry = recordObservation({
      category: EXTERNAL_CALLS,
      requestId: 'req_124',
      service: 'website_retrieval',
      provider: 'node-fetch',
      endpoint: 'https://example.com',
      status: 'SUCCESS'
    });
    assert.strictEqual(entry.category, EXTERNAL_CALLS);
  });

  it('should record research observation', () => {
    clearObservations();
    const entry = recordObservation({
      category: RESEARCH,
      requestId: 'req_125',
      query: 'test query',
      provider: 'serper',
      status: 'COMPLETED'
    });
    assert.strictEqual(entry.category, RESEARCH);
  });

  it('should record system event observation', () => {
    clearObservations();
    const entry = recordObservation({
      category: SYSTEM,
      requestId: 'req_126',
      eventType: 'rate_limit',
      severity: 'WARNING',
      message: 'Rate limit approaching'
    });
    assert.strictEqual(entry.category, SYSTEM);
  });

  it('should filter observations by category', () => {
    clearObservations();
    recordObservation({ category: AI_REQUESTS, requestId: 'req_1' });
    recordObservation({ category: EXTERNAL_CALLS, requestId: 'req_2' });
    recordObservation({ category: AI_REQUESTS, requestId: 'req_3' });

    const aiRequests = getObservations({ category: AI_REQUESTS });
    assert.strictEqual(aiRequests.length, 2);
  });

  it('should return observation stats', () => {
    clearObservations();
    recordObservation({ category: AI_REQUESTS, status: 'SUCCESS', cacheHit: true, latencyMs: 100 });
    recordObservation({ category: AI_REQUESTS, status: 'ERROR', cacheHit: false, latencyMs: 200 });
    recordObservation({ category: EXTERNAL_CALLS, status: 'SUCCESS', latencyMs: 150 });

    const stats = getObservationStats();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.aiRequests.total, 2);
    assert.strictEqual(stats.aiRequests.cacheHits, 1);
    assert.strictEqual(stats.aiRequests.errors, 1);
    assert.strictEqual(stats.externalCalls.total, 1);
  });

  it('should limit observations to max size', () => {
    clearObservations();
    for (let i = 0; i < 1005; i++) {
      recordObservation({ category: AI_REQUESTS, requestId: `req_${i}` });
    }
    const stats = getObservationStats();
    assert.strictEqual(stats.total, 1000);
  });

  it('should clear all observations', () => {
    recordObservation({ category: AI_REQUESTS, requestId: 'req_1' });
    clearObservations();
    const stats = getObservationStats();
    assert.strictEqual(stats.total, 0);
  });
});

// ─────────────────────────────────────────────────────────
// Phase 3 — Token Budget Enforcement
// ─────────────────────────────────────────────────────────

describe('Phase 3 — Token Budget Enforcement', () => {
  it('should have correct Phase 3 budget limits', async () => {
    const { REQUEST_TYPES } = await import('../backend/services/aiRequestManager.js');
    
    assert.strictEqual(REQUEST_TYPES.CHAT_RESPONSE.maxInputTokens, 1800);
    assert.strictEqual(REQUEST_TYPES.CHAT_RESPONSE.maxOutputTokens, 700);
    assert.strictEqual(REQUEST_TYPES.STRATEGIC_ANALYSIS.maxInputTokens, 3000);
    assert.strictEqual(REQUEST_TYPES.STRATEGIC_ANALYSIS.maxOutputTokens, 1200);
    assert.strictEqual(REQUEST_TYPES.COMPETITOR_ANALYSIS.maxInputTokens, 2200);
    assert.strictEqual(REQUEST_TYPES.COMPETITOR_ANALYSIS.maxOutputTokens, 900);
    assert.strictEqual(REQUEST_TYPES.RESEARCH_SYNTHESIS.maxInputTokens, 2500);
    assert.strictEqual(REQUEST_TYPES.RESEARCH_SYNTHESIS.maxOutputTokens, 1000);
  });
});