/**
 * ADDUS Platform — Content Hash Utility
 *
 * Provides simple content hashing for website change detection,
 * cache fingerprinting, and evidence deduplication.
 */

export function simpleHash(str) {
  if (!str || typeof str !== 'string') return null;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function hashObject(obj) {
  if (!obj) return null;
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return simpleHash(str);
}

export function generateContentHash(text) {
  if (!text || typeof text !== 'string') return null;
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return simpleHash(normalized);
}

export function generateWebsiteHash(evidenceItems, primaryPage) {
  const parts = [];
  
  if (primaryPage?.title) parts.push(primaryPage.title);
  if (primaryPage?.metaDescription) parts.push(primaryPage.metaDescription);
  
  for (const item of (evidenceItems || []).slice(0, 10)) {
    parts.push(item.content || item.title || '');
  }
  
  const combined = parts.join('|');
  return simpleHash(combined);
}