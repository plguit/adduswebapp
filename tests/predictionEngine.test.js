/**
 * Prediction Engine Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildPredictionsFromDiagnosis, PREDICTION_DIRECTION } from '../backend/services/predictionEngine.js';
import { CONFIDENCE_LEVELS } from '../backend/services/evidenceService.js';

describe('Prediction Engine', () => {
  describe('buildPredictionsFromDiagnosis', () => {
    it('should return NEEDS_MORE_DATA when no diagnosis provided', () => {
      const result = buildPredictionsFromDiagnosis(null, {}, []);
      assert.ok(result.length > 0);
      assert.ok(result.some(p => p.direction === PREDICTION_DIRECTION.NEEDS_MORE_DATA));
    });

    it('should predict trust improvement when brand assets exist', () => {
      const diagnosis = {
        diagnosis: {
          strengths: [{ dimension: 'Brand Identity', observation: 'Logo present' }],
          gaps: [{ dimension: 'Trust Signals', observation: 'No reviews found' }]
        }
      };
      const vault = { brandAssets: { logo: 'logo.png' } };
      const result = buildPredictionsFromDiagnosis(diagnosis, vault, []);
      assert.ok(result.some(p => p.prediction === 'Customer trust perception'));
    });

    it('should predict HIGH_RISK when many gaps and risks exist', () => {
      const diagnosis = {
        diagnosis: {
          gaps: [
            { dimension: 'Website' },
            { dimension: 'Content' },
            { dimension: 'Brand Identity' },
            { dimension: 'Communication' }
          ],
          risks: [{ dimension: 'Website Access', observation: 'Blocked' }]
        }
      };
      const result = buildPredictionsFromDiagnosis(diagnosis, {}, []);
      assert.ok(result.some(p => p.direction === PREDICTION_DIRECTION.HIGH_RISK));
    });

    it('should include basis and assumptions in every prediction', () => {
      const diagnosis = {
        diagnosis: {
          gaps: [{ dimension: 'Content', observation: 'Missing' }]
        }
      };
      const result = buildPredictionsFromDiagnosis(diagnosis, {}, []);
      for (const prediction of result) {
        assert.ok(Array.isArray(prediction.basis), 'Prediction should have basis array');
        assert.ok(Array.isArray(prediction.assumptions), 'Prediction should have assumptions array');
        assert.ok(prediction.basis.length > 0, 'Basis should not be empty');
        assert.ok(prediction.assumptions.length > 0, 'Assumptions should not be empty');
      }
    });

    it('should not make unsupported numerical predictions', () => {
      const diagnosis = {
        diagnosis: {
          gaps: [{ dimension: 'Website' }]
        }
      };
      const result = buildPredictionsFromDiagnosis(diagnosis, {}, []);
      for (const prediction of result) {
        const text = JSON.stringify(prediction);
        assert.ok(!text.match(/\d+%/), 'Should not contain percentage predictions');
        assert.ok(!text.match(/revenue.*\d/), 'Should not predict revenue numbers');
      }
    });

    it('should limit predictions to 6', () => {
      const diagnosis = {
        diagnosis: {
          gaps: [
            { dimension: 'Website' }, { dimension: 'Content' }, { dimension: 'Brand' },
            { dimension: 'Trust' }, { dimension: 'Communication' }, { dimension: 'Social' },
            { dimension: 'SEO' }, { dimension: 'Mobile' }
          ]
        }
      };
      const result = buildPredictionsFromDiagnosis(diagnosis, {}, []);
      assert.ok(result.length <= 6);
    });
  });
});
