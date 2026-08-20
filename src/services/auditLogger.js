import { storage } from '../utils/storage.js';

const AUDIT_LOG_KEY = 'ADDUS_AUDIT_LOGS_DB';

export const auditLogger = {
  log(action, user = 'system', component = 'system', entity = null, details = {}) {
    const logs = this.getAll();
    const entry = {
      logId: `AUD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user,
      component,
      action,
      entity: entity || details.entity || null,
      entityId: details.entityId || null,
      details: JSON.stringify(details),
      ip: details.ip || null,
      userAgent: details.userAgent || null,
      status: 'success',
      error: null
    };
    logs.unshift(entry);
    const trimmed = logs.slice(0, 5000);
    storage.set(AUDIT_LOG_KEY, trimmed);
    return entry;
  },

  logError(action, user = 'system', component = 'system', entity = null, error = null, details = {}) {
    const logs = this.getAll();
    const entry = {
      logId: `AUD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user,
      component,
      action,
      entity: entity || details.entity || null,
      entityId: details.entityId || null,
      details: JSON.stringify(details),
      ip: details.ip || null,
      userAgent: details.userAgent || null,
      status: 'error',
      error: error?.message || String(error)
    };
    logs.unshift(entry);
    const trimmed = logs.slice(0, 5000);
    storage.set(AUDIT_LOG_KEY, trimmed);
    return entry;
  },

  getAll() {
    return storage.get(AUDIT_LOG_KEY, []);
  },

  getByUser(user) {
    return this.getAll().filter(l => l.user === user);
  },

  getByComponent(component) {
    return this.getAll().filter(l => l.component === component);
  },

  getByAction(action) {
    return this.getAll().filter(l => l.action === action);
  },

  getByEntity(entity) {
    return this.getAll().filter(l => l.entity === entity);
  },

  getByDateRange(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return this.getAll().filter(l => {
      const t = new Date(l.timestamp);
      return t >= from && t <= to;
    });
  },

  clear() {
    storage.set(AUDIT_LOG_KEY, []);
  }
};

export default auditLogger;
