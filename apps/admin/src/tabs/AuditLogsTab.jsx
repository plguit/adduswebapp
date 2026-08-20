import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, User, Search, Filter } from 'lucide-react';
import { storage } from '../../../../src/utils/storage.js';
import { adminApiService } from '../services/adminApiService.js';

const AUDIT_LOGS_KEY = 'ADDUS_AUDIT_LOGS_DB';

/**
 * AuditLogsTab — Real System Audit Trail
 * Reads from ADDUS_AUDIT_LOGS_DB. No demo/fabricated entries.
 */
export function AuditLogsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        if (dataSource === 'backend' && adminReady) {
          const [logsRes, statsRes] = await Promise.all([
            adminApiService.getAuditLogs({ limit: 200 }),
            adminApiService.getAuditStats()
          ]);
          setLogs(logsRes.logs || []);
          setStats(statsRes.stats || null);
        } else {
          setLogs(storage.get(AUDIT_LOGS_KEY, []));
        }
      } catch (e) {
        console.warn('[AuditLogsTab] backend load failed, falling back to localStorage:', e.message);
        setLogs(storage.get(AUDIT_LOGS_KEY, []));
      }
    };
    loadLogs();
  }, [dataSource, adminReady]);

  const q = query.toLowerCase();
  const filtered = logs.filter(l => (
    (l.user || '').toLowerCase().includes(q) ||
    (l.component || '').toLowerCase().includes(q) ||
    (l.action || '').toLowerCase().includes(q) ||
    (l.entity || '').toLowerCase().includes(q) ||
    (l.details || '').toLowerCase().includes(q)
  ));

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">System Audit Logs</h2>
          <p className="tab-pane-subtitle">Complete immutable trail of all admin and system-level actions.</p>
        </div>
        <div className="search-filter-wrap">
          <Search size={14} />
          <input
            type="text"
            className="table-search-input"
            placeholder="Search by user, component, action, entity..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="audit-table-wrap margin-top-20">
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            {logs.length === 0
              ? 'No audit events recorded yet. Admin actions are automatically logged here.'
              : 'No logs match your search.'}
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Component</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.logId || l.id}>
                  <td><span className="id-badge-pill">{l.logId || l.id}</span></td>
                  <td className="text-muted text-xs">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td>{l.user || '—'}</td>
                  <td><span className="component-tag">{l.component || '—'}</span></td>
                  <td className="font-semibold text-white">{l.action || '—'}</td>
                  <td>{l.entity || '—'}</td>
                  <td>
                    <span className={`admin-badge ${l.status === 'success' ? 'admin-badge-green' : 'admin-badge-yellow'}`}>
                      {l.status || '—'}
                    </span>
                  </td>
                  <td className="text-muted text-xs" style={{ maxWidth: 200 }}>{l.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
