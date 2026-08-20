/**
 * ADDUS Platform — Observation Store
 *
 * Phase 3 implementation:
 *  - In-memory observation store for Admin Observation Room
 *  - Tracks AI requests, external calls, research, system events
 *  - Provides filtering and aggregation
 */

import { getBusinessVault } from '../../ai/business-brain/vaultService.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'vaults');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[ObservationStore] Could not create data directory:', e.message);
}

const MAX_OBSERVATIONS = 1000;
export const AI_REQUESTS = 'AI_REQUESTS';
export const EXTERNAL_CALLS = 'EXTERNAL_CALLS';
export const RESEARCH = 'RESEARCH';
export const SYSTEM = 'SYSTEM';

class ObservationStore {
  constructor() {
    this.observations = [];
    this.listeners = new Set();
    this.loadFromDisk();
  }

  saveToDisk() {
    const filePath = path.join(DATA_DIR, 'observations.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.observations, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[observationStore] Failed to save to disk:', e.message);
    }
  }

  loadFromDisk() {
    try {
      const filePath = path.join(DATA_DIR, 'observations.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.observations = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[observationStore] No observations to load:', e.message);
    }
  }

  record(observation) {
    const newEntry = {
      id: `OBS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: observation.timestamp || new Date().toISOString(),
      auditId: observation.requestId || `OBS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...observation
    };
    this.observations.unshift(newEntry);
    if (this.observations.length > MAX_OBSERVATIONS) {
      this.observations = this.observations.slice(0, MAX_OBSERVATIONS);
    }
    this.saveToDisk();
    this.notifyListeners(newEntry);
    return newEntry;
  }

  recordAIRequest(data) {
    return this.record({
      category: AI_REQUESTS,
      requestId: data.requestId,
      userId: data.userId,
      businessId: data.businessId,
      productId: data.productId,
      projectId: data.projectId,
      requestType: data.requestType,
      intent: data.intent,
      provider: data.provider || 'groq',
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      estimatedCost: data.estimatedCost,
      latencyMs: data.latencyMs,
      cacheHit: data.cacheHit || false,
      retryCount: data.retryCount || 0,
      status: data.status,
      error: data.error,
      contextSources: data.contextSources || []
    });
  }

  recordExternalCall(data) {
    return this.record({
      category: EXTERNAL_CALLS,
      requestId: data.requestId,
      service: data.service,
      provider: data.provider,
      endpoint: data.endpoint,
      domain: data.domain,
      reason: data.reason,
      operation: data.operation,
      status: data.status,
      latencyMs: data.latencyMs,
      responseSize: data.responseSize,
      error: data.error
    });
  }

  recordResearch(data) {
    return this.record({
      category: RESEARCH,
      requestId: data.requestId,
      query: data.query,
      provider: data.provider,
      sources: data.sources || [],
      reasonTriggered: data.reasonTriggered,
      cacheReused: data.cacheReused || false,
      freshness: data.freshness,
      resultCount: data.resultCount,
      status: data.status
    });
  }

  recordSystemEvent(data) {
    return this.record({
      category: SYSTEM,
      requestId: data.requestId,
      eventType: data.eventType,
      severity: data.severity || 'INFO',
      message: data.message,
      details: data.details || {}
    });
  }

  getObservations(filters = {}) {
    let results = [...this.observations];

    if (filters.category) {
      results = results.filter(o => o.category === filters.category);
    }
    if (filters.userId) {
      results = results.filter(o => o.userId === filters.userId);
    }
    if (filters.businessId) {
      results = results.filter(o => o.businessId === filters.businessId);
    }
    if (filters.status) {
      results = results.filter(o => o.status === filters.status);
    }
    if (filters.fromDate) {
      results = results.filter(o => new Date(o.timestamp) >= new Date(filters.fromDate));
    }
    if (filters.toDate) {
      results = results.filter(o => new Date(o.timestamp) <= new Date(filters.toDate));
    }
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  getAIRequests(filters = {}) {
    return this.getObservations({ ...filters, category: AI_REQUESTS });
  }

  getExternalCalls(filters = {}) {
    return this.getObservations({ ...filters, category: EXTERNAL_CALLS });
  }

  getResearch(filters = {}) {
    return this.getObservations({ ...filters, category: RESEARCH });
  }

  getSystemEvents(filters = {}) {
    return this.getObservations({ ...filters, category: SYSTEM });
  }

  getStats() {
    const aiRequests = this.observations.filter(o => o.category === AI_REQUESTS);
    const externalCalls = this.observations.filter(o => o.category === EXTERNAL_CALLS);
    const research = this.observations.filter(o => o.category === RESEARCH);
    const systemEvents = this.observations.filter(o => o.category === SYSTEM);

    return {
      total: this.observations.length,
      aiRequests: {
        total: aiRequests.length,
        cacheHits: aiRequests.filter(o => o.cacheHit).length,
        errors: aiRequests.filter(o => o.status === 'ERROR').length,
        avgLatency: aiRequests.length > 0 
          ? Math.round(aiRequests.reduce((sum, o) => sum + (o.latencyMs || 0), 0) / aiRequests.length)
          : 0
      },
      externalCalls: {
        total: externalCalls.length,
        failures: externalCalls.filter(o => o.status === 'ERROR').length,
        avgLatency: externalCalls.length > 0
          ? Math.round(externalCalls.reduce((sum, o) => sum + (o.latencyMs || 0), 0) / externalCalls.length)
          : 0
      },
      research: {
        total: research.length,
        cacheReused: research.filter(o => o.cacheReused).length,
        providerCalls: research.filter(o => !o.cacheReused).length
      },
      systemEvents: {
        total: systemEvents.length,
        errors: systemEvents.filter(o => o.severity === 'ERROR').length,
        warnings: systemEvents.filter(o => o.severity === 'WARNING').length
      }
    };
  }

  clear() {
    this.observations = [];
    this.notifyListeners(null);
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(entry) {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (e) {
        console.error('[ObservationStore] Listener error:', e.message);
      }
    }
  }
}

export const observationStore = new ObservationStore();

export function recordObservation(observation) {
  return observationStore.record(observation);
}

export function getObservationStats() {
  return observationStore.getStats();
}

export function getObservations(filters = {}) {
  return observationStore.getObservations(filters);
}

export function clearObservations() {
  observationStore.clear();
}