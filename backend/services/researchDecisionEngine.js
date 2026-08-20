/**
 * ADDUS Platform — Research Decision Engine
 *
 * Determines whether external research is required for a given user message.
 * Checks existing memory first to avoid redundant external calls.
 */

import { getBusinessVault } from '../../ai/business-brain/vaultService.js';
import { evidenceStore, getEvidenceSummary } from './evidenceService.js';
import { searchExternalResearch, isResearchAvailable } from './researchProvider.js';

export const RESEARCH_DECISIONS = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
  STALE_RESEARCH: 'STALE_RESEARCH',
  INSUFFICIENT_INTERNAL_EVIDENCE: 'INSUFFICIENT_INTERNAL_EVIDENCE'
};

const RESEARCH_KEYWORDS = [
  /competitor/i, /competition/i, /market/i, /trend/i, /research/i,
  /industry.*report/i, /benchmark/i, /compare.*to/i, /versus/i,
  /market.*size/i, /industry.*analysis/i, /who.*else/i,
  /alternative/i, /other.*option/i, /landscape/i
];

export function evaluateResearchNeed(userId, message, intent) {
  if (!message || typeof message !== 'string') {
    return { decision: RESEARCH_DECISIONS.NOT_REQUIRED, reason: 'Empty message' };
  }

  const vault = getBusinessVault(userId);
  const evidence = evidenceStore.getAllEvidence();
  const evidenceSummary = getEvidenceSummary(evidence);

  if (!RESEARCH_KEYWORDS.some(pattern => pattern.test(message))) {
    return { decision: RESEARCH_DECISIONS.NOT_REQUIRED, reason: 'Message does not indicate research need' };
  }

  const hasInternalEvidence = evidenceSummary.totalItems > 0 && evidenceSummary.highQualityItems > 0;
  const hasBusinessBasics = !!(vault.businessName && vault.industry);

  if (!hasBusinessBasics && !hasInternalEvidence) {
    return { decision: RESEARCH_DECISIONS.INSUFFICIENT_INTERNAL_EVIDENCE, reason: 'No internal evidence to compare against' };
  }

  if (hasInternalEvidence && intent !== 'RESEARCH_QUESTION') {
    return { decision: RESEARCH_DECISIONS.OPTIONAL, reason: 'Research may help but internal evidence exists' };
  }

  return { decision: RESEARCH_DECISIONS.REQUIRED, reason: 'External knowledge required' };
}

export function shouldRefreshResearch(researchItem, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  if (!researchItem || !researchItem.retrievedAt) return true;
  const age = Date.now() - new Date(researchItem.retrievedAt).getTime();
  return age > maxAgeMs;
}

export async function executeResearchIfNeeded(userId, message, intent) {
  const decision = evaluateResearchNeed(userId, message, intent);

  if (decision.decision === RESEARCH_DECISIONS.NOT_REQUIRED) {
    return { ...decision, research: null, usedFallback: true };
  }

  if (!isResearchAvailable()) {
    return {
      ...decision,
      research: null,
      usedFallback: true,
      reason: 'RESEARCH_UNAVAILABLE'
    };
  }

  try {
    const searchResult = await searchExternalResearch(message, { maxResults: 5 });
    return {
      ...decision,
      research: searchResult,
      usedFallback: false,
      provider: searchResult.provider
    };
  } catch (error) {
    return {
      ...decision,
      research: null,
      usedFallback: true,
      reason: error.message
    };
  }
}