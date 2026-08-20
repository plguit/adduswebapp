import React, { useState, useEffect } from 'react';
import { Search, Eye, Building2, Filter, Calendar, UserX, UserCheck, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BusinessProfileModal } from './BusinessProfileModal.jsx';
import { apiService } from '../../../services/api.js';

function normalizeVaultToProfile(vault) {
  if (!vault) return null;
  const brain = {
    businessName: vault.businessName || null,
    industry: vault.industry || null,
    businessStage: vault.businessStage || null,
    businessDescription: vault.businessDescription || null,
    products: vault.products || [],
    services: vault.services || [],
    targetAudience: vault.targetAudience || null,
    website: vault.websiteUrl || null
  };
  return {
    ...vault,
    businessBrain: brain,
    name: vault.name || null,
    phoneNumber: vault.phoneNumber || null,
    email: vault.email || null,
    onboardingStatus: vault.onboardingStatus || null,
    verified: vault.phoneVerified || vault.emailVerified || false,
    phoneVerified: vault.phoneVerified || false,
    emailVerified: vault.emailVerified || false,
    expertReviewStatus: vault.expertReviewStatus || null,
    expertReviewSubmittedAt: vault.expertReviewSubmittedAt || null,
    expertReviewCompletedAt: vault.expertReviewCompletedAt || null,
    expertNotes: vault.expertNotes || '',
    createdAt: vault.createdAt || null,
    updatedAt: vault.updatedAt || null
  };
}

export function BusinessesTab() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    apiService.fetchAdminVaults().then(vaults => {
      setProfiles(vaults.map(normalizeVaultToProfile).filter(Boolean));
    });
  }, []);

  const refresh = async () => {
    setLoading(true);
    const vaults = await apiService.fetchAdminVaults();
    setProfiles(vaults.map(normalizeVaultToProfile).filter(Boolean));
    setLoading(false);
  };

  const industries = ['All', ...new Set(profiles.map(p => p.businessBrain?.industry).filter(Boolean))];

  const filtered = profiles.filter(p => {
    const brain = p.businessBrain || {};
    const name = (brain.businessName || p.name || '').toLowerCase();
    const industry = (brain.industry || '').toLowerCase();
    const phone = (p.phoneNumber || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || industry.includes(q) || phone.includes(q) || email.includes(q);
    const matchIndustry = filterIndustry === 'All' || brain.industry === filterIndustry;
    
    const pStatus = getStatus(p);
    const matchStatus = filterStatus === 'All' || 
      (filterStatus === 'Active' && pStatus === 'Active') ||
      (filterStatus === 'Onboarding' && pStatus === 'Onboarding') ||
      (filterStatus === 'New' && pStatus === 'New') ||
      (filterStatus === 'Blocked' && p.blocked === true);
    
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
    
    return matchSearch && matchIndustry && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatus = (p) => {
    if (p.blocked === true) return 'Blocked';
    if (p.onboardingStatus === 'completed') return 'Active';
    if (p.verified || p.phoneVerified || p.emailVerified) return 'Onboarding';
    return 'New';
  };

  const statusColor = { Active: '#34d399', Onboarding: '#f59e0b', New: '#94a3b8', Blocked: '#ef4444' };

  const handleBlock = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'blocking' }));
    try {
      await apiService.blockUser(userId);
      await refresh();
    } catch (err) {
      alert('Failed to block user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleUnblock = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'unblocking' }));
    try {
      await apiService.unblockUser(userId);
      await refresh();
    } catch (err) {
      alert('Failed to unblock user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    setActionLoading(prev => ({ ...prev, [userId]: 'deleting' }));
    try {
      await apiService.deleteUser(userId);
      await refresh();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'approving' }));
    try {
      await apiService.approveOnboarding(userId);
      await refresh();
    } catch (err) {
      alert('Failed to approve onboarding: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    setActionLoading(prev => ({ ...prev, [userId]: 'rejecting' }));
    try {
      await apiService.rejectOnboarding(userId, reason);
      await refresh();
    } catch (err) {
      alert('Failed to reject onboarding: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterIndustry, filterStatus, dateFrom, dateTo]);

  return (
    <div className="admin-tab-content">
      {/* Filters */}
      <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            className="admin-search-input"
            placeholder="Search business name, contact, industry..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-group">
          <Filter size={15} />
          <select className="admin-select" value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
            {industries.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div className="admin-filter-group">
          <select className="admin-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Onboarding">Onboarding</option>
            <option value="New">New</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
        <div className="admin-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: '#9CA3AF' }} />
          <input
            type="date"
            className="admin-select"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="From"
            style={{ padding: '6px 10px', fontSize: '13px' }}
          />
          <span style={{ color: '#6B7280', fontSize: '12px' }}>to</span>
          <input
            type="date"
            className="admin-select"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            placeholder="To"
            style={{ padding: '6px 10px', fontSize: '13px' }}
          />
          {(dateFrom || dateTo) && (
            <button className="admin-clear-filter" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              <X size={14} />
            </button>
          )}
        </div>
        <span className="admin-count-chip">{filtered.length} businesses</span>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Industry</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Expert Review</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty-row"><Building2 size={20} /> No businesses found</td></tr>
            ) : paginated.map(p => {
              const brain = p.businessBrain || {};
              const status = getStatus(p);
              const isLoading = actionLoading[p.userId];
              return (
                <tr key={p.userId}>
                  <td className="admin-td-bold">{brain.businessName || p.name || '—'}</td>
                  <td>{brain.industry || '—'}</td>
                  <td>{p.phoneNumber || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td>
                    <span className="admin-status-chip" style={{ color: statusColor[status] || '#9CA3AF', borderColor: statusColor[status] || '#9CA3AF' }}>
                      ● {status}
                    </span>
                  </td>
                  <td>
                    {p.expertReviewStatus === 'completed'
                      ? <span className="admin-badge admin-badge-green">Completed</span>
                      : p.expertReviewStatus === 'pending'
                        ? <span className="admin-badge admin-badge-yellow">Pending</span>
                        : <span className="admin-badge admin-badge-grey">—</span>
                    }
                  </td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button className="admin-view-btn" onClick={() => setSelectedProfile(p)} title="View">
                        <Eye size={14} /> View
                      </button>
                      {status !== 'Blocked' ? (
                        <button className="admin-action-btn admin-btn-warning" onClick={() => handleBlock(p.userId)} disabled={!!isLoading} title="Block user">
                          {isLoading === 'blocking' ? '...' : <><UserX size={14} /> Block</>}
                        </button>
                      ) : (
                        <button className="admin-action-btn admin-btn-success" onClick={() => handleUnblock(p.userId)} disabled={!!isLoading} title="Unblock user">
                          {isLoading === 'unblocking' ? '...' : <><UserCheck size={14} /> Unblock</>}
                        </button>
                      )}
                      {(p.onboardingStatus === 'pending' || !p.onboardingStatus || p.onboardingStatus === 'new') && (
                        <>
                          <button className="admin-action-btn admin-btn-success" onClick={() => handleApprove(p.userId)} disabled={!!isLoading} title="Approve onboarding">
                            {isLoading === 'approving' ? '...' : 'Approve'}
                          </button>
                          <button className="admin-action-btn admin-btn-danger" onClick={() => handleReject(p.userId)} disabled={!!isLoading} title="Reject onboarding">
                            {isLoading === 'rejecting' ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      <button className="admin-action-btn admin-btn-danger" onClick={() => handleDelete(p.userId)} disabled={!!isLoading} title="Delete permanently">
                        {isLoading === 'deleting' ? '...' : <><Trash2 size={14} /> Delete</>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="admin-page-info">
            Page {currentPage} of {totalPages} ({filtered.length} total)
          </span>
          <button
            className="admin-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Profile modal */}
      {selectedProfile && (
        <BusinessProfileModal
          profile={selectedProfile}
          onClose={() => { setSelectedProfile(null); refresh(); }}
        />
      )}
    </div>
  );
}
