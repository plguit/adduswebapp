/**
 * Specialist Matching Engine Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { matchSpecialists, getSpecialistRecommendation, SPECIALIST_CATEGORIES } from '../backend/services/specialistMatchingEngine.js';

describe('Specialist Matching Engine', () => {
  describe('matchSpecialists', () => {
    it('should return matches for required work', () => {
      const work = [{ workId: '1', type: 'website', dimension: 'Website', description: 'Build website' }];
      const specialists = [
        { id: 's1', name: 'Web Dev', categories: [SPECIALIST_CATEGORIES.WEB_DEVELOPMENT], availability: 'available', skills: ['frontend'] }
      ];
      const result = matchSpecialists(work, specialists);
      assert.ok(result.length > 0);
      assert.ok(result[0].matchedSpecialists.length > 0);
    });

    it('should return no match when no specialists available', () => {
      const work = [{ workId: '1', type: 'video', dimension: 'Video', description: 'Produce video' }];
      const result = matchSpecialists(work, []);
      assert.ok(result[0].matchedSpecialists.length === 0);
      assert.ok(result[0].note === 'No matching specialists available');
    });

    it('should rank specialists by match score', () => {
      const work = [{ workId: '1', type: 'branding', dimension: 'Brand', description: 'Design brand' }];
      const specialists = [
        { id: 's1', name: 'Brand Designer', categories: [SPECIALIST_CATEGORIES.BRAND_DESIGN], availability: 'available', skills: ['branding'], performanceHistory: { rating: 5 } },
        { id: 's2', name: 'Generalist', categories: [SPECIALIST_CATEGORIES.BRAND_DESIGN, SPECIALIST_CATEGORIES.MARKETING], availability: 'limited', skills: ['branding'], performanceHistory: { rating: 3 } }
      ];
      const result = matchSpecialists(work, specialists);
      assert.ok(result[0].matchedSpecialists[0].matchScore >= result[0].matchedSpecialists[1].matchScore);
    });
  });

  describe('getSpecialistRecommendation', () => {
    it('should return recommendation for matched specialist', () => {
      const match = {
        workType: 'website',
        dimension: 'Website',
        topMatch: { name: 'Web Dev', matchScore: 85, categories: ['Web Development'] }
      };
      const rec = getSpecialistRecommendation(match);
      assert.ok(rec.recommendation.includes('Web Dev'));
      assert.strictEqual(rec.confidence, 'HIGH');
    });

    it('should return low confidence when no match', () => {
      const rec = getSpecialistRecommendation({ matchedSpecialists: [], topMatch: null });
      assert.ok(rec.recommendation.includes('No specialist'));
      assert.strictEqual(rec.confidence, 'LOW');
    });
  });
});
