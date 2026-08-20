/**
 * ADDUS Platform — Competitor Engine
 *
 * Evidence-based competitor discovery and management.
 * Never invents competitors. Only stores validated external findings.
 */

import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { validateSource, deduplicateSources } from './sourceValidator.js';

export const COMPETITOR_STATUS = {
  DISCOVERED: 'DISCOVERED',
  VERIFIED: 'VERIFIED',
  STALE: 'STALE',
  INVALID: 'INVALID'
};

export function createCompetitorRecord(name, website, source, confidence = 'MEDIUM') {
  if (!name || typeof name !== 'string') return null;

  const sourceValidation = validateSource(website, source);

  return {
    competitorId: `COMP_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    website: sourceValidation.valid ? sourceValidation.domain : null,
    source: sourceValidation.valid ? 'EXTERNAL_RESEARCH' : 'UNKNOWN',
    confidence: sourceValidation.valid ? 'MEDIUM' : 'LOW',
    status: sourceValidation.valid ? COMPETITOR_STATUS.VERIFIED : COMPETITOR_STATUS.INVALID,
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: sourceValidation.valid ? new Date().toISOString() : null,
    metadata: {
      sourceValidation,
      originalSource: website
    }
  };
}

export function addCompetitor(vault, competitor) {
  if (!vault.competitors) vault.competitors = [];

  const exists = vault.competitors.some(c => 
    c.name.toLowerCase() === competitor.name.toLowerCase() ||
    (c.website && competitor.website && c.website === competitor.website)
  );

  if (!exists) {
    vault.competitors.push(competitor);
    return true;
  }
  return false;
}

export function getCompetitors(vault, status = null) {
  if (!vault || !Array.isArray(vault.competitors)) return [];

  if (status) {
    return vault.competitors.filter(c => c.status === status);
  }
  return vault.competitors;
}

export function removeStaleCompetitors(vault, maxAgeMs = 90 * 24 * 60 * 60 * 1000) {
  if (!vault || !Array.isArray(vault.competitors)) return 0;

  const now = Date.now();
  let removed = 0;

  vault.competitors = vault.competitors.filter(c => {
    if (!c.lastVerifiedAt) return true;
    const age = now - new Date(c.lastVerifiedAt).getTime();
    if (age > maxAgeMs) {
      removed++;
      return false;
    }
    return true;
  });

  return removed;
}