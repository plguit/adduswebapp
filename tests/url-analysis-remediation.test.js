import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

const businessAnalysisServicePath = path.join(process.cwd(), 'src', 'services', 'businessAnalysisService.js');
const sourceCode = fs.readFileSync(businessAnalysisServicePath, 'utf-8');

describe('URL Analysis Remediation', () => {
  it('must not contain extractDomainIntel function', () => {
    assert.ok(!sourceCode.includes('function extractDomainIntel'), 'extractDomainIntel must be removed from businessAnalysisService.js');
  });

  it('must not contain hardcoded domain keyword intelligence', () => {
    assert.ok(!sourceCode.includes('includes(\'superside\')'), 'Hardcoded domain keyword "superside" must be removed');
    assert.ok(!sourceCode.includes('includes(\'hotel\')'), 'Hardcoded domain keyword "hotel" must be removed');
    assert.ok(!sourceCode.includes('includes(\'shop\')'), 'Hardcoded domain keyword "shop" must be removed');
    assert.ok(!sourceCode.includes('includes(\'tech\')'), 'Hardcoded domain keyword "tech" must be removed');
  });

  it('must not contain hardcoded fallback industry values', () => {
    assert.ok(!sourceCode.includes('Commercial & Professional Services'), 'Hardcoded fallback industry must be removed');
    assert.ok(!sourceCode.includes('Core Commercial Services'), 'Hardcoded fallback services must be removed');
    assert.ok(!sourceCode.includes('Digital Offerings'), 'Hardcoded fallback services must be removed');
  });

  it('must not hardcode onboarding_user userId in API calls', () => {
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
