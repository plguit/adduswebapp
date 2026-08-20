/**
 * Diagnosis Engine Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildDiagnosis, DIAGNOSIS_CONFIDENCE } from '../backend/services/diagnosisEngine.js';
import { PROVENANCE_STATES } from '../backend/services/evidenceService.js';

describe('Diagnosis Engine', () => {
  describe('buildDiagnosis', () => {
    it('should return empty diagnosis for empty vault', () => {
      const result = buildDiagnosis({}, []);
      assert.ok(result.diagnosis);
      assert.ok(Array.isArray(result.diagnosis.strengths));
      assert.ok(Array.isArray(result.diagnosis.gaps));
      assert.ok(Array.isArray(result.diagnosis.risks));
      assert.ok(Array.isArray(result.diagnosis.opportunities));
      assert.ok(Array.isArray(result.diagnosis.missingEvidence));
    });

    it('should identify business name as strength when present', () => {
      const vault = { businessName: 'Test Business' };
      const result = buildDiagnosis(vault, []);
      const nameStrength = result.diagnosis.strengths.find(s => s.dimension === 'Business Identity');
      assert.ok(nameStrength, 'Should have Business Identity strength');
      assert.ok(nameStrength.observation.includes('Test Business'));
    });

    it('should identify missing business name as gap', () => {
      const vault = {};
      const result = buildDiagnosis(vault, []);
      const nameGap = result.diagnosis.gaps.find(g => g.dimension === 'Business Identity');
      assert.ok(nameGap, 'Should have Business Identity gap');
      assert.ok(result.diagnosis.missingEvidence.some(m => m.field === 'businessName'));
    });

    it('should identify industry as strength when present', () => {
      const vault = { industry: 'Technology' };
      const result = buildDiagnosis(vault, []);
      const industryStrength = result.diagnosis.strengths.find(s => s.dimension === 'Industry Classification');
      assert.ok(industryStrength, 'Should have Industry Classification strength');
    });

    it('should identify missing assets as gaps and opportunities', () => {
      const vault = {
        businessName: 'Test Business',
        brandAssets: {}
      };
      const result = buildDiagnosis(vault, []);
      const assetGap = result.diagnosis.gaps.find(g => g.dimension === 'Brand Assets');
      assert.ok(assetGap, 'Should have Brand Assets gap');
      assert.ok(result.diagnosis.opportunities.some(o => o.dimension === 'Brand Identity'), 'Should have brand identity opportunity');
      assert.ok(result.diagnosis.opportunities.some(o => o.dimension === 'Visual Content'), 'Should have visual content opportunity');
    });

    it('should mark low evidence confidence when no evidence items', () => {
      const vault = { businessName: 'Test' };
      const result = buildDiagnosis(vault, []);
      assert.strictEqual(result.diagnosis.confidence, DIAGNOSIS_CONFIDENCE.LOW);
    });

    it('should include provenance in diagnosis items', () => {
      const vault = { businessName: 'Test Business', industry: 'Tech' };
      const result = buildDiagnosis(vault, []);
      for (const item of [...result.diagnosis.strengths, ...result.diagnosis.gaps]) {
        assert.ok(item.provenance, 'Each diagnosis item should have provenance');
        assert.ok(Object.values(PROVENANCE_STATES).includes(item.provenance), 'Provenance should be valid');
      }
    });

    it('should detect website access restrictions as risk', () => {
      const vault = {
        businessName: 'Test',
        websiteRetrievalMeta: { sourceStatus: 'ACCESS_BLOCKED', retrievalSuccess: false }
      };
      const result = buildDiagnosis(vault, []);
      const accessRisk = result.diagnosis.risks.find(r => r.dimension === 'Website Access');
      assert.ok(accessRisk, 'Should have Website Access risk');
      assert.ok(accessRisk.observation.includes('restricted'));
    });

    it('should include metadata', () => {
      const result = buildDiagnosis({}, []);
      assert.ok(result.metadata);
      assert.ok(result.metadata.generatedAt);
      assert.strictEqual(result.metadata.source, 'deterministic');
    });
  });
});
