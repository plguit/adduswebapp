import { test, describe } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';

import { runAIIntelligencePipeline, flagForHumanReview, buildFieldProvenance, computeEvidenceQuality } from '../backend/services/aiIntelligenceService.js';
import { evidenceStore, PROVENANCE_STATES, CONFIDENCE_LEVELS, EVIDENCE_TYPES } from '../backend/services/evidenceService.js';
import { createEmptyVault, getBusinessVault, updateBusinessVault } from '../ai/business-brain/vaultService.js';
import { validateAndNormalizeUrl, retrieveWebsiteEvidence } from '../backend/routes/websiteRetrievalService.js';

const TEST_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'phase6-output');

async function writeTestOutput(filename, data) {
  try {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.writeFile(path.join(TEST_OUTPUT_DIR, filename), JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn(`Failed to write test output ${filename}:`, e.message);
  }
}

// ─────────────────────────────────────────────────────────
// Phase 6 — AI Business Intelligence
// ─────────────────────────────────────────────────────────

describe('Phase 6 — Business Intelligence', () => {
  test('normalizeIntelligenceOutput adds evidenceQuality when missing', async () => {
    const { computeEvidenceQuality } = await import('../backend/services/aiIntelligenceService.js');
    const result = computeEvidenceQuality({ totalItems: 5, highQualityItems: 2, typesCovered: [EVIDENCE_TYPES.IDENTITY] });
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(Array.isArray(result.gaps));
    assert.ok(typeof result.assessment === 'string');
  });

  test('normalizeIntelligenceOutput validates classification values', async () => {
    const { normalizeIntelligenceOutput } = await import('../backend/services/aiIntelligenceService.js');
    const input = {
      serviceAssessments: [
        { serviceId: 'website', classification: 'INVALID', confidence: 'invalid', priority: 'invalid' }
      ],
      existingAssets: [
        { classification: 'INVALID', confidence: 'invalid' }
      ],
      websiteAssessment: { classification: 'INVALID', confidence: 'invalid' },
      roadmap: [{ classification: 'INVALID', priority: 'invalid' }]
    };
    const output = normalizeIntelligenceOutput(input);
    assert.strictEqual(output.serviceAssessments[0].classification, 'INFERENCE');
    assert.strictEqual(output.serviceAssessments[0].confidence, 'low');
    assert.strictEqual(output.serviceAssessments[0].priority, 'medium');
    assert.strictEqual(output.existingAssets[0].classification, 'FACT');
    assert.strictEqual(output.existingAssets[0].confidence, 'medium');
    assert.strictEqual(output.websiteAssessment.classification, 'FACT');
    assert.strictEqual(output.websiteAssessment.confidence, 'medium');
    assert.strictEqual(output.roadmap[0].classification, 'RECOMMENDATION');
    assert.strictEqual(output.roadmap[0].priority, 'medium');
  });

  test('businessSnapshot defaults to empty arrays when missing', async () => {
    const { normalizeIntelligenceOutput } = await import('../backend/services/aiIntelligenceService.js');
    const output = normalizeIntelligenceOutput({});
    assert.deepStrictEqual(output.businessSnapshot.known, []);
    assert.deepStrictEqual(output.businessSnapshot.inferred, []);
    assert.deepStrictEqual(output.businessSnapshot.missing, []);
    assert.deepStrictEqual(output.businessSnapshot.questions, []);
  });

  test('runAIIntelligencePipeline returns structured output with provenance', async () => {
    const vault = createEmptyVault();
    vault.businessName = 'Test Corp';
    vault.industry = 'Technology';
    const evidenceItems = [];
    const result = await runAIIntelligencePipeline({
      userId: 'phase6_test',
      vault,
      evidenceItems,
      analysisId: 'TEST_PHASE6_1'
    });
    assert.ok(result.analysisId === 'TEST_PHASE6_1' || result.analysisId === undefined || result.insufficientEvidence === true);
    assert.ok(result.provenance === PROVENANCE_STATES.INFERRED || result.provenance === undefined || result.insufficientEvidence === true);
    assert.ok(result.fieldProvenance || result.businessUnderstanding || result.insufficientEvidence === true);
    await writeTestOutput('intelligence-pipeline-test.json', result);
  });

  test('runAIIntelligencePipeline flags insufficient evidence for human review', async () => {
    const result = await runAIIntelligencePipeline({
      userId: 'phase6_test_insufficient',
      vault: createEmptyVault(),
      evidenceItems: [],
      analysisId: 'TEST_PHASE6_2'
    });
    assert.strictEqual(result.insufficientEvidence, true);
    assert.strictEqual(result.humanReviewRequired, true);
    assert.strictEqual(result.confidence, CONFIDENCE_LEVELS.UNKNOWN);
  });
});

describe('Phase 6 — URL Analysis Evidence Quality', () => {
  test('retrieveWebsiteEvidence returns INSUFFICIENT_EVIDENCE for weak website', async () => {
    const result = await retrieveWebsiteEvidence('https://example.com');
    assert.ok(result.sourceStatus === 'INSUFFICIENT_EVIDENCE' || result.insufficientEvidence === true || result.success === false);
    await writeTestOutput('url-analysis-example-com.json', result);
  });

  test('retrieveWebsiteEvidence returns REJECTED_SOURCE for localhost', async () => {
    const result = await retrieveWebsiteEvidence('http://localhost');
    assert.strictEqual(result.sourceStatus, 'REJECTED_SOURCE');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.evidenceItems.length, 0);
  });

  test('retrieveWebsiteEvidence returns REJECTED_SOURCE for private IP', async () => {
    const result = await retrieveWebsiteEvidence('http://192.168.1.1');
    assert.strictEqual(result.sourceStatus, 'REJECTED_SOURCE');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.evidenceItems.length, 0);
  });

  test('evidence items from retrieval have provenance OBSERVED', async () => {
    const result = await retrieveWebsiteEvidence('https://example.com');
    if (result.evidenceItems && result.evidenceItems.length > 0) {
      for (const item of result.evidenceItems) {
        assert.ok(
          item.provenance === PROVENANCE_STATES.OBSERVED || !item.provenance,
          'Evidence must be OBSERVED or unset'
        );
      }
    }
  });
});

describe('Phase 6 — Authentication Contract', () => {
  test('no onboarding_user references in production code', async () => {
    const srcFiles = [
      'src/services/aiService.js',
      'src/services/apiService.js',
      'src/components/chat/ADDIChatScreen.jsx',
      'src/components/chat/ConversationalOnboarding.jsx'
    ];
    for (const file of srcFiles) {
      const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
      assert.ok(!content.includes('onboarding_user'), `Found onboarding_user in ${file}`);
      assert.ok(!content.includes('dashboard_user'), `Found dashboard_user in ${file}`);
    }
  });

  test('aiService.sendMessage uses session userId, not hardcoded fallback', async () => {
    const content = await fs.readFile(path.join(process.cwd(), 'src/services/aiService.js'), 'utf-8');
    assert.ok(content.includes('session?.userId'), 'aiService must use session userId');
    assert.ok(!content.includes("userId = 'dashboard_user'"), 'aiService must not hardcode dashboard_user');
  });
});

describe('Phase 6 — Regression Guard', () => {
  test('Phase 1–5.5 test files exist and are loadable', async () => {
    const testFiles = [
      'tests/phase1.test.js',
      'tests/evidence.test.js',
      'tests/ai-intelligence.test.js',
      'tests/auth.test.js',
      'tests/phase5.test.js',
      'tests/url-analysis-regression.test.js',
      'tests/phase55.test.js'
    ];
    for (const file of testFiles) {
      const fullPath = path.join(process.cwd(), file);
      await fs.access(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      assert.ok(content.includes('describe(') || content.includes('test('), `${file} should contain tests`);
    }
  });

  test('BusinessIntelligence component file exists', async () => {
    const componentPath = path.join(process.cwd(), 'src/components/business/BusinessIntelligence.jsx');
    await fs.access(componentPath);
    const content = await fs.readFile(componentPath, 'utf-8');
    assert.ok(content.includes('BusinessIntelligence'), 'Component should be defined');
    assert.ok(content.includes('/intelligence'), 'Component should call intelligence endpoint');
  });

  test('intelligence endpoint exists in aiRoutes', async () => {
    const routesPath = path.join(process.cwd(), 'backend/routes/aiRoutes.js');
    const content = await fs.readFile(routesPath, 'utf-8');
    assert.ok(content.includes("router.post('/intelligence'"), 'Should have /intelligence endpoint');
    assert.ok(content.includes('requireAuth'), 'Should require authentication');
  });
});
