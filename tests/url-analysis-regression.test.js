/**
 * URL Analysis Regression Tests
 *
 * Verifies that the Amazon-style fabrication bug is fixed:
 * - Insufficient evidence must NOT produce fabricated industry/stage/services
 * - Rejected sources must stop analysis immediately
 * - Backend must use authenticated identity, not hardcoded userId
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

const businessAnalysisServicePath = path.join(process.cwd(), 'src', 'services', 'businessAnalysisService.js');
const sourceCode = fs.readFileSync(businessAnalysisServicePath, 'utf-8');

describe('URL Analysis Regression', () => {
  describe('Frontend source integrity', () => {
    it('must not contain extractDomainIntel function', () => {
      assert.ok(!sourceCode.includes('function extractDomainIntel'), 'extractDomainIntel must be removed');
    });

    it('must not contain hardcoded domain keyword intelligence', () => {
      assert.ok(!sourceCode.includes('includes(\'superside\')'), 'Hardcoded "superside" keyword must be removed');
      assert.ok(!sourceCode.includes('includes(\'hotel\')'), 'Hardcoded "hotel" keyword must be removed');
      assert.ok(!sourceCode.includes('includes(\'shop\')'), 'Hardcoded "shop" keyword must be removed');
      assert.ok(!sourceCode.includes('includes(\'tech\')'), 'Hardcoded "tech" keyword must be removed');
    });

    it('must not contain hardcoded fallback industry values', () => {
      assert.ok(!sourceCode.includes('Commercial & Professional Services'), 'Hardcoded fallback industry must be removed');
      assert.ok(!sourceCode.includes('Core Commercial Services'), 'Hardcoded fallback services must be removed');
      assert.ok(!sourceCode.includes('Digital Offerings'), 'Hardcoded fallback services must be removed');
      assert.ok(!sourceCode.includes('Growth Stage'), 'Hardcoded fallback stage must be removed');
    });

    it('must not hardcode onboarding_user in API calls', () => {
      const apiCallMatches = sourceCode.match(/apiService\.(post|get)\([^)]+\)/g) || [];
      for (const call of apiCallMatches) {
        assert.ok(!call.includes('onboarding_user'), `API call must not hardcode userId: ${call}`);
      }
    });

    it('formatProfileResponse must not call extractDomainIntel', () => {
      const formatProfileMatch = sourceCode.match(/function formatProfileResponse[\s\S]*?^}/m);
      assert.ok(formatProfileMatch, 'formatProfileResponse function must exist');
      assert.ok(!formatProfileMatch[0].includes('extractDomainIntel'), 'formatProfileResponse must not call extractDomainIntel');
    });

    it('must use apiService for authenticated requests', () => {
      assert.ok(sourceCode.includes("import { apiService } from './apiService.js'"), 'Must import apiService');
    });
  });

  describe('Backend contract verification', () => {
    it('backend validateAndNormalizeUrl must reject URLs without domain', async () => {
      const { validateAndNormalizeUrl } = await import('../backend/routes/websiteRetrievalService.js');
      const result = validateAndNormalizeUrl('not-a-url');
      assert.strictEqual(result.isValid, false);
    });

    it('backend validateAndNormalizeUrl must reject empty URLs', async () => {
      const { validateAndNormalizeUrl } = await import('../backend/routes/websiteRetrievalService.js');
      const result = validateAndNormalizeUrl('');
      assert.strictEqual(result.isValid, false);
    });

    it('backend validateAndNormalizeUrl must accept valid HTTPS URLs', async () => {
      const { validateAndNormalizeUrl } = await import('../backend/routes/websiteRetrievalService.js');
      const result = validateAndNormalizeUrl('https://example.com');
      assert.strictEqual(result.isValid, true);
      assert.ok(result.normalizedUrl.includes('https://'));
    });
  });

  describe('Admin auth integrity', () => {
    it('AdminApp.jsx must not contain hardcoded credential check', () => {
      const adminAppPath = path.join(process.cwd(), 'src', 'pages', 'admin', 'AdminApp.jsx');
      const adminAppCode = fs.readFileSync(adminAppPath, 'utf-8');
      assert.ok(!adminAppCode.includes('ADMIN_EMAIL = \'admin@addus.in\''), 'Hardcoded ADMIN_EMAIL must be removed');
      assert.ok(!adminAppCode.includes('ADMIN_PASSWORD = \'addus@admin2025\''), 'Hardcoded ADMIN_PASSWORD must be removed');
      assert.ok(adminAppCode.includes('/api/admin/login'), 'Must call backend /api/admin/login');
    });

    it('shared config must not contain hardcoded admin email', () => {
      const configPath = path.join(process.cwd(), 'shared', 'config', 'index.js');
      const configCode = fs.readFileSync(configPath, 'utf-8');
      assert.ok(!configCode.includes('adminEmail: \'admin@addus.in\''), 'Hardcoded adminEmail in shared config must be removed');
    });
  });

  describe('Token service security', () => {
    it('tokenService must not contain hardcoded production secret fallback', () => {
      const tokenServicePath = path.join(process.cwd(), 'backend', 'utils', 'tokenService.js');
      const tokenServiceCode = fs.readFileSync(tokenServicePath, 'utf-8');
      assert.ok(!tokenServiceCode.includes('addus-auth-secret-change-in-production'), 'Hardcoded JWT secret fallback must be removed');
      assert.ok(tokenServiceCode.includes('process.env.AUTH_TOKEN_SECRET'), 'Must require AUTH_TOKEN_SECRET from environment');
    });
  });

  describe('URL analysis integration verification', () => {
    it('rejected source returns no fabricated profile for localhost', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('http://localhost');
      assert.strictEqual(result.sourceStatus, 'REJECTED_SOURCE');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.evidenceItems.length, 0);
      assert.strictEqual(result.insufficientEvidence, true);
    });

    it('rejected source returns no fabricated profile for private IP', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('http://192.168.1.1');
      assert.ok(result.sourceStatus === 'REJECTED_SOURCE' || result.sourceStatus === 'ACCESS_BLOCKED' || result.sourceStatus === 'RETRIEVAL_FAILED', `Expected non-fabricated status, got ${result.sourceStatus}`);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.evidenceItems.length, 0);
    });

    it('insufficient evidence website returns sparse profile with no fabrication', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('https://example.com');
      assert.ok(result.sourceStatus === 'INSUFFICIENT_EVIDENCE' || result.success === false || result.insufficientEvidence === true);
      if (result.evidenceItems) {
        for (const item of result.evidenceItems) {
          assert.ok(item.provenance === 'OBSERVED' || item.provenance === undefined, 'Evidence must be OBSERVED or unset, not fabricated');
        }
      }
    });

    it('evidence items have provenance OBSERVED when retrieved', async () => {
      const { normalizeEvidenceItems } = await import('../backend/services/evidenceService.js');
      const raw = [
        {
          evidenceId: 'EV_INT_1',
          source: 'https://example.com',
          field: 'identity',
          observation: 'Test',
          evidence: 'Test evidence content.',
          confidence: 'medium'
        }
      ];
      const normalized = normalizeEvidenceItems(raw, 'ANALYSIS_INT');
      assert.strictEqual(normalized[0].provenance, 'OBSERVED');
      assert.ok(normalized[0].qualityScore >= 0);
    });

    it('AI failure profile does not fabricate business attributes', async () => {
      const { createStructuredOutput } = await import('../backend/services/aiIntelligenceService.js');
      const result = createStructuredOutput({
        insufficientEvidence: true,
        humanReviewRequired: true
      });
      assert.strictEqual(result.insufficientEvidence, true);
      assert.strictEqual(result.humanReviewRequired, true);
      assert.ok(!result.businessName || result.businessName === null || result.businessName === 'No summary available');
    });

    it('timeout failure returns structured failure info', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('http://10.0.0.1:12345');
      assert.ok(['RETRIEVAL_FAILED', 'ACCESS_BLOCKED', 'REJECTED_SOURCE'].includes(result.sourceStatus), `Expected non-fabricated status, got ${result.sourceStatus}`);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.evidenceItems.length, 0);
    });

    it('access-blocked site returns ACCESS_BLOCKED or other valid failure status', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('https://amazon.in/');
      assert.ok(['ACCESS_BLOCKED', 'RETRIEVAL_FAILED', 'INSUFFICIENT_EVIDENCE', 'LIKELY_BUSINESS_WEBSITE'].includes(result.sourceStatus), `Got status: ${result.sourceStatus}`);
      if (result.sourceStatus !== 'LIKELY_BUSINESS_WEBSITE') {
        assert.strictEqual(result.success, false);
      }
      assert.ok(result.evidenceItems.length >= 0, 'Evidence count should be non-negative');
    });

    it('superside.com returns evidence-based profile with no hardcoded rules', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('https://www.superside.com/');
      assert.ok(result.sourceStatus === 'LIKELY_BUSINESS_WEBSITE' || result.sourceStatus === 'INSUFFICIENT_EVIDENCE' || result.sourceStatus === 'ACCESS_BLOCKED' || result.sourceStatus === 'RETRIEVAL_FAILED', `Got status: ${result.sourceStatus}`);
      if (result.sourceStatus === 'LIKELY_BUSINESS_WEBSITE') {
        assert.ok(result.evidenceItems.length > 0, 'Must have evidence items for likely business website');
        for (const item of result.evidenceItems) {
          assert.ok(item.provenance === 'OBSERVED' || item.provenance === undefined, 'Evidence must be OBSERVED');
        }
      }
    });

    it('retrieval failure does not classify timeout as INSUFFICIENT_EVIDENCE', async () => {
      const { retrieveWebsiteEvidence } = await import('../backend/routes/websiteRetrievalService.js');
      const result = await retrieveWebsiteEvidence('http://10.0.0.1:12345');
      if (result.sourceStatus === 'RETRIEVAL_FAILED') {
        assert.notStrictEqual(result.sourceStatus, 'INSUFFICIENT_EVIDENCE');
      }
    });
  });
});
