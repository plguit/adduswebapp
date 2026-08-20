/**
 * Professional Presence Evaluation Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildPresenceEvaluation, PRESENCE_DIMENSIONS } from '../backend/services/presenceEvaluationEngine.js';
import { PROVENANCE_STATES, CONFIDENCE_LEVELS } from '../backend/services/evidenceService.js';

describe('Professional Presence Evaluation Engine', () => {
  describe('buildPresenceEvaluation', () => {
    it('should return evaluation structure for empty vault', () => {
      const result = buildPresenceEvaluation({}, []);
      assert.ok(result.evaluation);
      assert.ok(result.evaluation.dimensions);
      assert.ok(result.metadata);
    });

    it('should evaluate brand identity with logo', () => {
      const vault = {
        businessName: 'Test Business',
        brandAssets: { logo: 'logo.png', website: 'https://test.com' },
        businessDescription: 'We do great things for customers in the technology sector.'
      };
      const result = buildPresenceEvaluation(vault, []);
      const brand = result.evaluation.dimensions[PRESENCE_DIMENSIONS.BRAND_IDENTITY];
      assert.ok(brand.score !== null, 'Brand Identity should have a score');
      assert.ok(brand.strengths.includes('Logo asset present'));
    });

    it('should evaluate website with retrieval success', () => {
      const vault = {
        websiteUrl: 'https://test.com',
        websiteRetrievalMeta: { retrievalSuccess: true, sourceStatus: 'LIKELY_BUSINESS_WEBSITE' }
      };
      const result = buildPresenceEvaluation(vault, []);
      const website = result.evaluation.dimensions[PRESENCE_DIMENSIONS.WEBSITE];
      assert.ok(website.score !== null);
      assert.ok(website.strengths.includes('Website successfully retrieved and analyzed'));
    });

    it('should flag website access blocked as risk', () => {
      const vault = {
        websiteUrl: 'https://test.com',
        websiteRetrievalMeta: { retrievalSuccess: false, sourceStatus: 'ACCESS_BLOCKED' }
      };
      const result = buildPresenceEvaluation(vault, []);
      const website = result.evaluation.dimensions[PRESENCE_DIMENSIONS.WEBSITE];
      assert.ok(website.gaps.some(g => g.includes('blocked')));
    });

    it('should include provenance in all dimensions', () => {
      const vault = { businessName: 'Test' };
      const result = buildPresenceEvaluation(vault, []);
      for (const dim of Object.values(result.evaluation.dimensions)) {
        if (dim.score !== null) {
          assert.ok(dim.provenance, 'Evaluated dimension should have provenance');
          assert.ok(Object.values(PROVENANCE_STATES).includes(dim.provenance));
        }
      }
    });

    it('should compute overall score from evaluated dimensions', () => {
      const vault = {
        businessName: 'Test Business',
        brandAssets: { logo: 'logo.png', website: 'https://test.com', socialLinks: ['https://fb.com/test'] },
        businessDescription: 'We do great things.'
      };
      const result = buildPresenceEvaluation(vault, []);
      assert.ok(result.evaluation.overallScore !== null);
      assert.ok(result.evaluation.overallScore >= 0);
      assert.ok(result.evaluation.overallScore <= 100);
    });

    it('should return null scores for dimensions without evidence', () => {
      const result = buildPresenceEvaluation({}, []);
      for (const dim of Object.values(result.evaluation.dimensions)) {
        assert.strictEqual(dim.score, null, 'Unsupported dimensions should have null score');
        assert.ok(dim.reason.includes('Insufficient evidence'), 'Reason should mention insufficient evidence');
      }
    });
  });
});
