/**
 * ADDUS Platform — Audit Logger
 *
 * Structured audit logging for all intelligence operations.
 * Provides traceability for every AI request, research action, and vault update.
 */

export function createAuditEntry({
  requestId,
  userId,
  businessId,
  productId,
  projectId,
  intent,
  contextSources,
  evidenceRefs,
  researchRefs,
  model,
  estimatedInputTokens,
  estimatedOutputTokens,
  actualInputTokens = null,
  actualOutputTokens = null,
  cacheHit = false,
  researchPerformed = false,
  status = 'PENDING',
  error = null,
  confidence = 'UNKNOWN'
}) {
  return {
    requestId: requestId || `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    businessId,
    productId,
    projectId,
    intent,
    contextSources: Array.isArray(contextSources) ? contextSources : [],
    evidenceRefs: Array.isArray(evidenceRefs) ? evidenceRefs : [],
    researchRefs: Array.isArray(researchRefs) ? researchRefs : [],
    model,
    estimatedInputTokens,
    estimatedOutputTokens,
    actualInputTokens,
    actualOutputTokens,
    cacheHit,
    researchPerformed,
    status,
    error: error ? { status: error.status, name: error.name, message: error.message } : null,
    confidence,
    createdAt: new Date().toISOString()
  };
}

export function appendAuditTrail(vault, auditEntry) {
  if (!vault) return;
  if (!vault.auditLog) vault.auditLog = [];
  vault.auditLog.unshift(auditEntry);
  if (vault.auditLog.length > 100) {
    vault.auditLog = vault.auditLog.slice(0, 100);
  }
}

export function getAuditTrail(vault, filters = {}) {
  if (!vault || !Array.isArray(vault.auditLog)) return [];

  let entries = [...vault.auditLog];

  if (filters.userId) {
    entries = entries.filter(e => e.userId === filters.userId);
  }
  if (filters.intent) {
    entries = entries.filter(e => e.intent === filters.intent);
  }
  if (filters.status) {
    entries = entries.filter(e => e.status === filters.status);
  }
  if (filters.fromDate) {
    entries = entries.filter(e => new Date(e.createdAt) >= new Date(filters.fromDate));
  }
  if (filters.toDate) {
    entries = entries.filter(e => new Date(e.createdAt) <= new Date(filters.toDate));
  }

  return entries.slice(0, filters.limit || 50);
}