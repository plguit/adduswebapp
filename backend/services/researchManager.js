/**
 * ADDUS Platform — Research Manager (Foundation)
 *
 * Phase 1: Interface and decision layer only.
 * External provider integration is deferred.
 *
 * Responsibilities:
 * - Determine if a question requires external research
 * - Manage research memory (avoid repeating research)
 * - Provide structured interface for future search providers
 */

import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { executeAIRequest, REQUEST_TYPES } from './aiRequestManager.js';

export const RESEARCH_TYPES = {
  COMPETITOR: 'competitor',
  MARKET: 'market',
  INDUSTRY: 'industry',
  TREND: 'trend',
  GENERAL: 'general'
};

export const RESEARCH_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  NOT_REQUIRED: 'NOT_REQUIRED'
};

function isResearchRequired(message) {
  if (!message || typeof message !== 'string') return false;
  
  const researchKeywords = [
    /competitor/i, /competition/i, /market/i, /trend/i, /research/i,
    /industry.*report/i, /benchmark/i, /compare.*to/i, /versus/i,
    /market.*size/i, /industry.*analysis/i, /who.*else/i,
    /alternative/i, /other.*option/i, /landscape/i
  ];
  
  return researchKeywords.some(pattern => pattern.test(message));
}

export async function shouldPerformResearch(userId, message) {
  if (!isResearchRequired(message)) {
    return { required: false, reason: 'Question does not require external research' };
  }

  const vault = getBusinessVault(userId);
  const recentResearch = (vault.strategicIntelligence || [])
    .filter(item => item.sourceType === 'RESEARCH')
    .slice(-5);

  const researchMemory = recentResearch.map(item => ({
    query: item.serviceName || item.objective,
    createdAt: item.createdAt,
    confidence: item.confidence
  }));

  return {
    required: true,
    reason: 'Question requires external knowledge',
    existingResearch: researchMemory,
    suggestion: 'External research provider not yet configured. Deferring research.'
  };
}

export async function performResearch(userId, query, type = RESEARCH_TYPES.GENERAL) {
  const vault = getBusinessVault(userId);
  
  const researchEntry = {
    researchId: `RES_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    query,
    type,
    status: RESEARCH_STATUS.FAILED,
    source: 'none',
    summary: 'External research provider not configured in Phase 1.',
    keyFindings: [],
    confidence: 0,
    researchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    relatedBusiness: vault.businessName || null,
    relatedProduct: null,
    relatedProject: null
  };

  if (!vault.strategicIntelligence) vault.strategicIntelligence = [];
  vault.strategicIntelligence.push(researchEntry);
  
  updateBusinessVault(userId, { strategicIntelligence: vault.strategicIntelligence }, 'RESEARCHED');
  
  return {
    success: false,
    researchId: researchEntry.researchId,
    status: RESEARCH_STATUS.FAILED,
    message: 'External research provider not configured. This will be available in a future phase.'
  };
}

export async function getResearchMemory(userId, topic) {
  const vault = getBusinessVault(userId);
  const research = (vault.strategicIntelligence || [])
    .filter(item => item.sourceType === 'RESEARCH')
    .filter(item => !topic || item.serviceName?.toLowerCase().includes(topic.toLowerCase()));

  return research.map(item => ({
    researchId: item.intelligenceId,
    query: item.serviceName || item.objective,
    summary: item.recommendation || item.why,
    confidence: item.confidence,
    createdAt: item.createdAt,
    expiresAt: item.createdAt ? new Date(new Date(item.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
  }));
}

export function validateSource(sourceUrl, sourceType) {
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return { valid: false, reason: 'Source URL is missing' };
  }

  const trustedDomains = [
    'gov', 'edu', 'who.int', 'un.org', 'worldbank.org',
    'oecd.org', 'imf.org', 'weforum.org', 'mckinsey.com',
    'bcg.com', 'bain.com', 'accenture.com'
  ];

  const isTrusted = trustedDomains.some(domain => sourceUrl.includes(domain));
  
  return {
    valid: true,
    trusted: isTrusted,
    sourceType: sourceType || 'UNKNOWN',
    confidence: isTrusted ? 0.9 : 0.5
  };
}

export function isResearchStale(researchItem) {
  if (!researchItem || !researchItem.researchedAt) return true;
  
  const maxAge = researchItem.type === RESEARCH_TYPES.TREND ? 7 * 24 * 60 * 60 * 1000 :
                 researchItem.type === RESEARCH_TYPES.MARKET ? 30 * 24 * 60 * 60 * 1000 :
                 90 * 24 * 60 * 60 * 1000;
  
  const age = Date.now() - new Date(researchItem.researchedAt).getTime();
  return age > maxAge;
}