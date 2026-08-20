/**
 * Blueprint Engine Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildBlueprint } from '../backend/services/blueprintEngine.js';

describe('Blueprint Engine', () => {
  describe('buildBlueprint', () => {
    it('should return blueprint structure', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(result.blueprint);
      assert.ok(result.metadata);
    });

    it('should identify foundation phase for missing identity', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(result.blueprint.execution.phases.some(p => p.name === 'FOUNDATION'));
    });

    it('should include required work items', () => {
      const result = buildBlueprint({ businessName: 'Test' }, [], []);
      assert.ok(result.blueprint.requiredWork.length > 0);
    });

    it('should include dependencies', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(Array.isArray(result.blueprint.dependencies));
    });

    it('should include suggested sequence', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(Array.isArray(result.blueprint.execution.suggestedSequence));
      assert.ok(result.blueprint.execution.suggestedSequence.length > 0);
    });

    it('should include expected outcome', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(result.blueprint.expectedOutcome);
      assert.ok(result.blueprint.expectedOutcome.description);
      assert.ok(Array.isArray(result.blueprint.expectedOutcome.successMetrics));
    });

    it('should include metadata', () => {
      const result = buildBlueprint({}, [], []);
      assert.ok(result.metadata.generatedAt);
      assert.strictEqual(result.metadata.source, 'deterministic');
    });
  });
});
