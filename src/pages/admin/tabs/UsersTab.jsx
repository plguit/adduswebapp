import React, { useState, useEffect } from 'react';
import { Search, Users, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { apiService } from '../../../services/api.js';

const ITEMS_PER_PAGE = 10;

export function UsersTab() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    apiService.fetchAdminUsers().then(setProfiles);
  }, []);

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.phoneNumber || '').includes(q) ||
      (p.email || '').toLowerCase().includes(q);
    
    let matchDate = true;
    if (dateFrom) {
      const from = new Date(dateFrom);
      const created = p.createdAt ? new Date(p.createdAt) : null;
      matchDate = created ? created >= from : false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const created = p.createdAt ? new Date(p.createdAt) : null;
      matchDate = matchDate && (created ? created <= to : false);
    }
    
    return matchSearch && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo]);

  const downloadCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Auth', 'Status', 'Projects', 'Joined', 'Last Login'];
    const rows = filtered.map(p => {
      const projCount = (p.projects || []).length;
      const status = p.onboardingStatus === 'completed' ? 'Active' : 'Onboarding';
      return [p.name || '—', p.phoneNumber || '—', p.email || '—', p.authProvider || 'phone', status, projCount, p.createdAt || '—', p.lastLoginAt || '—'];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="admin-search-wrap">
          <Search size={16} />
          <input className="admin-search-input" placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: '#9CA3AF' }} />
          <input type="date" className="admin-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" style={{ padding: '6px 10px', fontSize: '13px' }} />
          <span style={{ color: '#6B7280', fontSize: '12px' }}>to</span>
          <input type="date" className="admin-select" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" style={{ padding: '6px 10px', fontSize: '13px' }} />
          {(dateFrom || dateTo) && <button className="admin-clear-filter" onClick={() => { setDateFrom(''); setDateTo(''); }}><span style={{ fontSize: '16px', lineHeight: 1 }}>×</span></button>}
        </div>
        <button className="admin-action-btn" onClick={downloadCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Download CSV
        </button>
        <span className="admin-count-chip">{filtered.length} users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Auth</th>
              <th>Status</th>
              <th>Projects</th>
              <th>Joined</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty-row"><Users size={20} /> No users found</td></tr>
            ) : paginated.map(p => {
              const projCount = (p.projects || []).length;
              const status = p.onboardingStatus === 'completed' ? 'Active' : 'Onboarding';
              return (
                <tr key={p.userId}>
                  <td className="admin-td-bold">{p.name || '—'}</td>
                  <td>{p.phoneNumber || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td><span className="admin-badge admin-badge-grey">{p.authProvider || 'phone'}</span></td>
                  <td>
                    <span className="admin-status-chip" style={{ color: status === 'Active' ? '#34d399' : '#f59e0b', borderColor: status === 'Active' ? '#34d399' : '#f59e0b' }}>
                      ● {status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{projCount}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td>{p.lastLoginAt ? new Date(p.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="admin-page-info">Page {currentPage} of {totalPages} ({filtered.length} total)</span>
          <button className="admin-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
