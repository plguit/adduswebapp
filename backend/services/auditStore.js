import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'audit');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
    catch (e) { console.warn('[AuditStore] Could not create data directory:', e.message); }
  }
}

function readLogs() {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('[AuditStore] Failed to read logs:', e.message);
    return [];
  }
}

function writeLogs(logs) {
  try {
    ensureDataDir();
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs.slice(0, 10000), null, 2));
  } catch (e) {
    console.warn('[AuditStore] Failed to write logs:', e.message);
  }
}

export const auditStore = {
  log(action, user = 'system', component = 'system', entity = null, details = {}, error = null) {
    const logs = readLogs();
    const entry = {
      logId: `AUD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user,
      component,
      action,
      entity: entity || details.entity || null,
      entityId: details.entityId || null,
      details: JSON.stringify(details),
      status: error ? 'error' : 'success',
      error: error?.message || String(error)
    };
    logs.unshift(entry);
    writeLogs(logs);
    return entry;
  },

  getAll(filters = {}) {
    let logs = readLogs();
    if (filters.user) logs = logs.filter(l => l.user === filters.user);
    if (filters.component) logs = logs.filter(l => l.component === filters.component);
    if (filters.action) logs = logs.filter(l => l.action === filters.action);
    if (filters.entity) logs = logs.filter(l => l.entity === filters.entity);
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      logs = logs.filter(l => new Date(l.timestamp) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      logs = logs.filter(l => new Date(l.timestamp) <= to);
    }
    const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
    return logs.slice(0, limit);
  },

  getStats() {
    const logs = readLogs();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayLogs = logs.filter(l => new Date(l.timestamp) >= today);
    const errorLogs = logs.filter(l => l.status === 'error');
    const users = [...new Set(logs.map(l => l.user))];
    const components = [...new Set(logs.map(l => l.component))];
    return {
      total: logs.length,
      today: todayLogs.length,
      errors: errorLogs.length,
      users: users.length,
      components: components.length,
      recentActions: logs.slice(0, 10).map(l => l.action)
    };
  },

  clear() {
    writeLogs([]);
  }
};
