import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'url_analysis');
const LOG_FILE = path.join(DATA_DIR, 'url_activity_logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
    catch (e) { console.warn('[UrlAnalysisStore] Could not create data directory:', e.message); }
  }
}

function readLogs() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('[UrlAnalysisStore] Failed to read logs:', e.message);
    return [];
  }
}

function writeLogs(logs) {
  try {
    ensureDataDir();
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(0, 50000), null, 2));
  } catch (e) {
    console.warn('[UrlAnalysisStore] Failed to write logs:', e.message);
  }
}

function generateId() {
  return `URL${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname || null;
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let normalized = `${u.protocol}//${u.hostname}${u.pathname}`;
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    return normalized.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export const urlAnalysisStore = {
  create(params) {
    const logs = readLogs();
    const entry = {
      id: generateId(),
      url: params.url || null,
      normalized_url: normalizeUrl(params.url),
      domain: extractDomain(params.url),
      status: params.status || 'QUEUED',
      submitted_at: params.submitted_at || new Date().toISOString(),
      started_at: params.started_at || null,
      completed_at: params.completed_at || null,
      duration_ms: params.duration_ms || null,
      error_code: params.error_code || null,
      error_message: params.error_message || null,
      failure_category: params.failure_category || null,
      analysis_method: params.analysis_method || null,
      website_classification: params.website_classification || null,
      user_id: params.user_id || null,
      user_name: params.user_name || null,
      user_mobile: params.user_mobile || null,
      user_email: params.user_email || null,
      business_id: params.business_id || null,
      analysis_job_id: params.analysis_job_id || null,
      request_id: params.request_id || null,
      http_status: params.http_status || null,
      retry_count: params.retry_count || 0,
      pages_analyzed: params.pages_analyzed || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    logs.unshift(entry);
    writeLogs(logs);
    return entry;
  },

  update(id, params) {
    const logs = readLogs();
    const idx = logs.findIndex(l => l.id === id);
    if (idx === -1) return null;
    const updated = { ...logs[idx], ...params, updated_at: new Date().toISOString() };
    if (params.completed_at && !updated.started_at) {
      updated.started_at = params.completed_at;
    }
    if (params.completed_at && updated.started_at) {
      const start = new Date(updated.started_at).getTime();
      const end = new Date(updated.completed_at).getTime();
      updated.duration_ms = Math.max(0, end - start);
    }
    logs[idx] = updated;
    writeLogs(logs);
    return updated;
  },

  getById(id) {
    const logs = readLogs();
    return logs.find(l => l.id === id) || null;
  },

  getAll(filters = {}) {
    let logs = readLogs();

    if (filters.status) logs = logs.filter(l => l.status === filters.status);
    if (filters.website_classification) logs = logs.filter(l => l.website_classification === filters.website_classification);
    if (filters.analysis_method) logs = logs.filter(l => l.analysis_method === filters.analysis_method);
    if (filters.failure_category) logs = logs.filter(l => l.failure_category === filters.failure_category);
    if (filters.domain) logs = logs.filter(l => (l.domain || '').toLowerCase().includes(filters.domain.toLowerCase()));
    if (filters.user_id) logs = logs.filter(l => l.user_id === filters.user_id);
    if (filters.business_id) logs = logs.filter(l => l.business_id === filters.business_id);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      logs = logs.filter(l =>
        (l.url || '').toLowerCase().includes(q) ||
        (l.domain || '').toLowerCase().includes(q) ||
        (l.user_name || '').toLowerCase().includes(q) ||
        (l.user_email || '').toLowerCase().includes(q) ||
        (l.user_mobile || '').toLowerCase().includes(q) ||
        (l.user_id || '').toLowerCase().includes(q) ||
        (l.business_id || '').toLowerCase().includes(q) ||
        (l.error_message || '').toLowerCase().includes(q)
      );
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      logs = logs.filter(l => new Date(l.submitted_at) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      logs = logs.filter(l => new Date(l.submitted_at) <= to);
    }

    const sortField = filters.sortField || 'submitted_at';
    const sortDir = (filters.sortDir || 'desc').toLowerCase();
    logs.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 50;
    const start = (page - 1) * limit;
    const paginated = logs.slice(start, start + limit);

    return {
      logs: paginated,
      total: logs.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(logs.length / limit))
    };
  },

  getStats(filters = {}) {
    const result = this.getAll(filters);
    const logs = result.logs;
    const stats = {
      total: result.total,
      success: logs.filter(l => l.status === 'SUCCESS').length,
      partial: logs.filter(l => l.status === 'PARTIAL').length,
      failed: logs.filter(l => l.status === 'FAILED').length,
      timeout: logs.filter(l => l.status === 'TIMEOUT').length,
      blocked: logs.filter(l => l.status === 'BLOCKED').length,
      processing: logs.filter(l => l.status === 'PROCESSING' || l.status === 'QUEUED').length,
      cancelled: logs.filter(l => l.status === 'CANCELLED').length
    };
    return stats;
  },

  clear() {
    writeLogs([]);
  }
};
