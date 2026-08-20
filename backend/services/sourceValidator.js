/**
 * ADDUS Platform — Source Validator
 *
 * Validates external research sources for reliability and relevance.
 */

export const SOURCE_TYPES = {
  CUSTOMER_PROVIDED: 'CUSTOMER_PROVIDED',
  WEBSITE: 'WEBSITE',
  STRUCTURED_DATA: 'STRUCTURED_DATA',
  DISCOVERED_ASSET: 'DISCOVERED_ASSET',
  EXTERNAL_RESEARCH: 'EXTERNAL_RESEARCH',
  INTERNAL_PROJECT_DATA: 'INTERNAL_PROJECT_DATA',
  INTERNAL_CONVERSATION: 'INTERNAL_CONVERSATION',
  AI_INFERENCE: 'AI_INFERENCE'
};

export const PROVENANCE_STATES = {
  OBSERVED: 'OBSERVED',
  CUSTOMER_PROVIDED: 'CUSTOMER_PROVIDED',
  VERIFIED_EXTERNAL: 'VERIFIED_EXTERNAL',
  INFERRED: 'INFERRED',
  AI_GENERATED: 'AI_GENERATED'
};

const TRUSTED_DOMAINS = [
  'gov', 'gov.uk', 'edu', 'edu.uk', 'who.int', 'un.org', 'worldbank.org',
  'oecd.org', 'imf.org', 'weforum.org', 'mckinsey.com',
  'bcg.com', 'bain.com', 'accenture.com', 'forrester.com',
  'gartner.com', 'statista.com', 'crunchbase.com'
];

export function validateSource(sourceUrl, sourceType = 'UNKNOWN') {
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return { valid: false, reason: 'Source URL is missing' };
  }

  try {
    const url = new URL(sourceUrl);
    const domain = url.hostname;

    const isTrusted = TRUSTED_DOMAINS.some(td => {
      if (domain === td) return true;
      if (domain.endsWith('.' + td)) return true;
      if (td.includes('.') && domain.endsWith(td)) return true;
      return false;
    });

    return {
      valid: true,
      trusted: isTrusted,
      sourceType,
      domain,
      confidence: isTrusted ? 0.9 : 0.5,
      retrievedAt: new Date().toISOString()
    };
  } catch {
    return { valid: false, reason: 'Malformed URL', sourceType };
  }
}

export function isSourceFresh(sourceItem, maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  if (!sourceItem || !sourceItem.retrievedAt) return false;
  const age = Date.now() - new Date(sourceItem.retrievedAt).getTime();
  return age <= maxAgeMs;
}

export function deduplicateSources(sources) {
  const seen = new Set();
  return sources.filter(source => {
    const key = source.sourceUrl || source.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}