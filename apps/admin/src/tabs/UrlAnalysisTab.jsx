import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Search, Filter, Clock, User, Mail, Phone, ExternalLink, AlertCircle, CheckCircle2, XCircle, Loader2, ShieldAlert, BarChart3 } from 'lucide-react';
import { adminApiService } from '../services/adminApiService.js';

const STATUS_CONFIG = {
  SUCCESS: { label: 'Success', color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', icon: CheckCircle2 },
  PARTIAL: { label: 'Partial', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', icon: AlertCircle },
  FAILED: { label: 'Failed', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', icon: XCircle },
  TIMEOUT: { label: 'Timeout', color: '#FB923C', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)', icon: Clock },
  BLOCKED: { label: 'Blocked', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: ShieldAlert },
  PROCESSING: { label: 'Processing', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', icon: Loader2 },
  QUEUED: { label: 'Queued', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', icon: Clock },
  CANCELLED: { label: 'Cancelled', color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', icon: XCircle }
};

const FAILURE_CATEGORY_LABELS = {
  INVALID_URL: 'Invalid URL',
  DNS_ERROR: 'DNS Error',
  CONNECTION_ERROR: 'Connection Error',
  TIMEOUT: 'Timeout',
  SSL_ERROR: 'SSL Error',
  REDIRECT_ERROR: 'Redirect Error',
  HTTP_4XX: 'HTTP 4xx',
  HTTP_5XX: 'HTTP 5xx',
  BOT_PROTECTION: 'Bot Protection',
  ACCESS_BLOCKED: 'Access Blocked',
  AUTH_REQUIRED: 'Auth Required',
  EMPTY_CONTENT: 'Empty Content',
  INSUFFICIENT_CONTENT: 'Insufficient Content',
  PARSER_ERROR: 'Parser Error',
  BROWSER_ERROR: 'Browser Error',
  AI_ANALYSIS_ERROR: 'AI Analysis Error',
  RATE_LIMITED: 'Rate Limited',
  RESOURCE_LIMIT: 'Resource Limit',
  UNKNOWN_ERROR: 'Unknown Error'
};

export function UrlAnalysisTab() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [failureFilter, setFailureFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const limit = 50;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminApiService.getUrlAnalysisLogs({
          q: q || undefined,
          status: statusFilter || undefined,
          website_classification: classificationFilter || undefined,
          analysis_method: methodFilter || undefined,
          failure_category: failureFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page,
          limit
        }),
        adminApiService.getUrlAnalysisStats()
      ]);
      setLogs(logsRes.logs || []);
      setTotal(logsRes.total || 0);
      setTotalPages(logsRes.totalPages || 1);
      setStats(statsRes.stats || null);
    } catch (e) {
      console.warn('[UrlAnalysisTab] load failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, statusFilter, classificationFilter, methodFilter, failureFilter, fromDate, toDate]);

  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (ms) => {
    if (ms == null) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const truncateUrl = (url, max = 50) => {
    if (!url) return '—';
    if (url.length <= max) return url;
    return url.slice(0, max) + '...';
  };

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">URL Analysis Logs</h2>
          <p className="tab-pane-subtitle">Operational monitoring for ADDUS URL Intelligence. Isolated from customer/business records.</p>
        </div>
        <div className="search-filter-wrap">
          <Search size={14} />
          <input
            type="text"
            className="table-search-input"
            placeholder="Search URL, user, domain, error..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="flex gap-3 margin-top-20" style={{ flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: '#fff' },
            { label: 'Success', value: stats.success, color: '#34D399' },
            { label: 'Partial', value: stats.partial, color: '#FBBF24' },
            { label: 'Failed', value: stats.failed, color: '#F87171' },
            { label: 'Timeout', value: stats.timeout, color: '#FB923C' },
            { label: 'Blocked', value: stats.blocked, color: '#A78BFA' },
            { label: 'Processing', value: stats.processing, color: '#60A5FA' }
          ].map(s => (
            <div key={s.label} style={{
              flex: '1 1 120px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 margin-top-20" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} style={{ color: '#9CA3AF' }} />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>

        <select
          value={classificationFilter}
          onChange={e => { setClassificationFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
        >
          <option value="">All Classifications</option>
          <option value="SIMPLE">Simple</option>
          <option value="STANDARD">Standard</option>
          <option value="DYNAMIC">Dynamic</option>
          <option value="LARGE">Large</option>
          <option value="RESTRICTED">Restricted</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        <select
          value={methodFilter}
          onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
        >
          <option value="">All Methods</option>
          <option value="FAST_PATH">Fast Path</option>
          <option value="FAST_AND_DEEP">Fast + Deep</option>
          <option value="DEEP_PATH">Deep Path</option>
          <option value="CACHE">Cache</option>
          <option value="FALLBACK">Fallback</option>
          <option value="MANUAL_INPUT">Manual Input</option>
          <option value="DOCUMENT_UPLOAD">Document Upload</option>
        </select>

        <select
          value={failureFilter}
          onChange={e => { setFailureFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
        >
          <option value="">All Failures</option>
          {Object.entries(FAILURE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={e => { setFromDate(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
          title="From date"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => { setToDate(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '12px' }}
          title="To date"
        />
      </div>

      {/* Table */}
      <div className="admin-table-wrap margin-top-20">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: '8px' }}>Loading URL analysis logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No URL analysis logs found.
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>User</th>
                <th>Status</th>
                <th>Classification</th>
                <th>Method</th>
                <th>Submitted</th>
                <th>Duration</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(entry => {
                const statusConf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.PARTIAL;
                const StatusIcon = statusConf.icon;
                return (
                  <tr key={entry.id}>
                    <td style={{ maxWidth: 250 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <span title={entry.url}>{truncateUrl(entry.url, 45)}</span>
                      </div>
                      {entry.domain && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{entry.domain}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{entry.user_name || '—'}</div>
                      {entry.user_mobile && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{entry.user_mobile}</div>}
                      {entry.user_email && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{entry.user_email}</div>}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: statusConf.bg,
                        color: statusConf.color,
                        border: `1px solid ${statusConf.border}`
                      }}>
                        <StatusIcon size={12} />
                        {statusConf.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{entry.website_classification || '—'}</td>
                    <td style={{ fontSize: '12px' }}>{entry.analysis_method || '—'}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(entry.submitted_at)}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDuration(entry.duration_ms)}</td>
                    <td style={{ maxWidth: 200, fontSize: '12px', color: entry.error_message ? '#F87171' : '#6b7280' }} title={entry.error_message || ''}>
                      {entry.error_message ? truncateUrl(entry.error_message, 40) : '—'}
                    </td>
                    <td>
                      <button
                        className="admin-table-action-btn"
                        onClick={() => setSelectedEntry(entry)}
                        title="View details"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 margin-top-20" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <button
            className="admin-secondary-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            className="admin-secondary-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedEntry(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>URL Analysis Detail</h3>
              <button className="admin-modal-close" onClick={() => setSelectedEntry(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailRow label="URL" value={selectedEntry.url} />
              <DetailRow label="Normalized URL" value={selectedEntry.normalized_url} mono />
              <DetailRow label="Domain" value={selectedEntry.domain} />
              <DetailRow label="Status" value={STATUS_CONFIG[selectedEntry.status]?.label || selectedEntry.status} status />
              <DetailRow label="Classification" value={selectedEntry.website_classification || '—'} />
              <DetailRow label="Analysis Method" value={selectedEntry.analysis_method || '—'} />
              <DetailRow label="Submitted At" value={formatDate(selectedEntry.submitted_at)} />
              <DetailRow label="Started At" value={formatDate(selectedEntry.started_at)} />
              <DetailRow label="Completed At" value={formatDate(selectedEntry.completed_at)} />
              <DetailRow label="Duration" value={formatDuration(selectedEntry.duration_ms)} />
              <DetailRow label="HTTP Status" value={selectedEntry.http_status || '—'} />
              <DetailRow label="Pages Analyzed" value={selectedEntry.pages_analyzed || 0} />
              <DetailRow label="Retry Count" value={selectedEntry.retry_count || 0} />
              <DetailRow label="Analysis Job ID" value={selectedEntry.analysis_job_id || '—'} mono />
              <DetailRow label="Request ID" value={selectedEntry.request_id || '—'} mono />
              <DetailRow label="User Name" value={selectedEntry.user_name || '—'} />
              <DetailRow label="User Mobile" value={selectedEntry.user_mobile || '—'} />
              <DetailRow label="User Email" value={selectedEntry.user_email || '—'} />
              <DetailRow label="User ID" value={selectedEntry.user_id || '—'} mono />
              <DetailRow label="Business ID" value={selectedEntry.business_id || '—'} mono />
              {selectedEntry.failure_category && (
                <DetailRow label="Failure Category" value={FAILURE_CATEGORY_LABELS[selectedEntry.failure_category] || selectedEntry.failure_category} error />
              )}
              {selectedEntry.error_message && (
                <DetailRow label="Error Message" value={selectedEntry.error_message} error />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, status, error }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '12px', color: '#9CA3AF', minWidth: '140px', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: '13px',
        color: error ? '#F87171' : status ? '#34D399' : '#E0E0E0',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all',
        textAlign: 'right'
      }}>
        {value}
      </span>
    </div>
  );
}
