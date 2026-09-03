import React, { useState, useEffect } from 'react';
import { Search, Eye, Building2, Filter, Edit3, UserCheck, Archive, FileText, MessageSquare, BrainCircuit, X, Download } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { adminApiService } from '../services/adminApiService.js';
import { validation, ALLOWED_STAGES } from '../../../../src/services/validation.js';
import { BusinessProfileModal } from './BusinessProfileModal.jsx';

const safeStr = (val, fallback = '') => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object') {
    return val.userId || val.customerId || val.id || val.name || val.businessName || val.title || val.role || fallback;
  }
  return fallback;
};

export function BusinessesTab({ dataSource = 'localStorage', adminReady = false }) {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filterIndustry, setFilterIndustry] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [confidenceModalScore, setConfidenceModalScore] = useState(null);
  
  // Assign Strategist state
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [strategistName, setStrategistName] = useState('');
  
  // Editing Business State
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');

  const refresh = async () => {
    try {
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getUsers();
        setProfiles(res.users || []);
      } else {
        setProfiles(profileService.getAllProfiles());
      }
    } catch (e) {
      console.warn('[BusinessesTab] backend load failed, falling back to localStorage:', e.message);
      setProfiles(profileService.getAllProfiles());
    }
  };

  useEffect(() => {
    refresh();
  }, [dataSource, adminReady]);

  const industries = ['All', ...new Set(profiles.map(p => safeStr(p.businessBrain?.industry)).filter(Boolean))];

  const filtered = profiles.filter(p => {
    const brain = p.businessBrain || {};
    const name = safeStr(brain.businessName || p.name).toLowerCase();
    const custName = safeStr(p.name || brain.customerName).toLowerCase();
    const industry = safeStr(brain.industry).toLowerCase();
    const phone = safeStr(p.phoneNumber || p.phone).toLowerCase();
    const email = safeStr(p.email).toLowerCase();
    const strategist = safeStr(p.assignedStrategist).toLowerCase();
    const q = search.toLowerCase();

    const matchSearch = !q || name.includes(q) || custName.includes(q) || industry.includes(q) || phone.includes(q) || email.includes(q) || strategist.includes(q);
    const matchIndustry = filterIndustry === 'All' || safeStr(brain.industry) === filterIndustry;
    const matchStatus = filterStatus === 'All'
      ? !p.archived
      : filterStatus === 'Archived'
        ? !!p.archived
        : !p.archived && (p.onboardingStatus === filterStatus.toLowerCase() || (filterStatus === 'Active' && p.onboardingStatus === 'completed'));

    return matchSearch && matchIndustry && matchStatus;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert('No business records available to export.');
      return;
    }

    const headers = [
      'Business ID',
      'User Name',
      'Business Name',
      'Business Description',
      'Customer ID',
      'Contact Number',
      'Email',
      'Industry',
      'Business Stage',
      'AI Confidence',
      'Date & Time',
      'Assigned Strategist',
      'Status'
    ];

    const rows = filtered.map(p => {
      const brain = p.businessBrain || {};
      const userName = p.name || brain.customerName || 'Valued User';
      const dateStr = p.createdAt
        ? `${new Date(p.createdAt).toLocaleDateString('en-GB')} ${new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '03 Sep 2026, 10:00 AM';

      return [
        `"${p.businessId || p.userId || ''}"`,
        `"${userName.replace(/"/g, '""')}"`,
        `"${(brain.businessName || p.name || 'Unnamed Business').replace(/"/g, '""')}"`,
        `"${(brain.businessDescription || '').replace(/"/g, '""')}"`,
        `"${p.customerId || p.userId || ''}"`,
        `"${p.phoneNumber || ''}"`,
        `"${p.email || ''}"`,
        `"${brain.industry || 'General'}"`,
        `"${brain.businessStage || 'Growing'}"`,
        `"${brain.aiConfidenceScore || 0}%"`,
        `"${dateStr}"`,
        `"${p.assignedStrategist || 'Unassigned'}"`,
        `"${p.archived ? 'Archived' : (p.onboardingStatus === 'completed' ? 'Active' : 'Onboarded')}"`
      ];
    });

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ADDUS_CRM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveStrategist = (userId) => {
    if (!strategistName.trim()) return;
    profileService.saveProfile({
      userId,
      assignedStrategist: strategistName.trim()
    });
    setAssigningUserId(null);
    setStrategistName('');
    refresh();
  };

  const handleStartEdit = (p) => {
    const brain = p.businessBrain || {};
    setEditingProfile(p);
    setEditError('');
    setEditForm({
      businessName: brain.businessName || p.name || '',
      contactPerson: p.name || '',
      industry: brain.industry || '',
      businessStage: brain.businessStage || '',
      businessSummary: brain.businessDescription || '',
      phoneNumber: p.phoneNumber || '',
      email: p.email || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingProfile) return;

    // Validate Business Name
    const bizVal = validation.validateBusinessName(editForm.businessName);
    if (!bizVal.isValid) {
      setEditError(bizVal.error);
      return;
    }

    const existingBrain = editingProfile.businessBrain || {};
    profileService.saveProfile({
      userId: editingProfile.userId,
      name: editForm.contactPerson,
      phoneNumber: editForm.phoneNumber,
      email: editForm.email,
      businessBrain: {
        ...existingBrain,
        businessName: bizVal.sanitized,
        industry: editForm.industry,
        businessStage: editForm.businessStage,
        businessDescription: editForm.businessSummary
      }
    });
    setEditingProfile(null);
    refresh();
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Business Management</h2>
          <p className="admin-section-sub">Comprehensive registry of every business account on ADDUS.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            onClick={handleExportCSV} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #10B981, #059669)', 
              border: 'none', 
              color: '#FFFFFF', 
              fontSize: '13px', 
              fontWeight: '700', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Download size={15} /> Export Excel (CSV)
          </button>
          <span className="admin-count-chip">{filtered.length} Businesses</span>
        </div>
      </div>

      <div className="admin-filter-bar margin-top-16">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            className="admin-search-input"
            placeholder="Search business name, customer name, contact, industry, strategist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <Filter size={15} />
          <select className="admin-select" value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
            {industries.map(i => <option key={i} value={i}>Industry: {i}</option>)}
          </select>
        </div>

        <div className="admin-filter-group">
          <select className="admin-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Active Accounts</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Main Business Table */}
      <div className="admin-table-wrap margin-top-16">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business ID</th>
              <th>User Name</th>
              <th>Business Name</th>
              <th>Customer ID</th>
              <th>Industry &amp; Stage</th>
              <th>AI Confidence</th>
              <th>Date &amp; Time</th>
              <th>Assigned Strategist</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="admin-empty-row">
                  <Building2 size={24} />
                  <p>No businesses matching search criteria.</p>
                </td>
              </tr>
            ) : filtered.map((p, pIdx) => {
              const brain = p.businessBrain || {};
              const confScore = brain.aiConfidenceScore || null;
              const isArchived = !!p.archived;
              const rawUserIdKey = safeStr(p.userId || p.customerId || p.businessId || `user_row_${pIdx}`);
              const bizId = safeStr(p.businessId || p.userId || p.id, 'BIZ-1');
              const custId = safeStr(p.customerId || p.userId || p.id, '—');
              const userName = safeStr(p.name || brain.customerName, 'Valued User');
              const contactSubText = safeStr(p.phoneNumber || p.phone || p.email, 'No contact');
              const bizName = safeStr(brain.businessName || p.name, 'Unnamed Business');
              const bizDesc = safeStr(brain.businessDescription, '');
              const industryStr = safeStr(brain.industry, 'General');
              const stageStr = safeStr(brain.businessStage, 'Growing');
              const strategistStr = safeStr(p.assignedStrategist, 'Unassigned (Click)');

              return (
                <tr key={rawUserIdKey} className={isArchived ? 'archived-row' : ''}>
                  <td>
                    <div className="id-badge-pill-group">
                      <span
                        className="id-badge-pill"
                        title="Click to open Business Vault"
                        onClick={() => setSelectedProfile(p)}
                      >
                        {bizId}
                      </span>
                      <button
                        className="id-copy-btn"
                        title="Copy Business ID"
                        onClick={() => {
                          navigator.clipboard.writeText(bizId);
                          alert(`Copied ${bizId} to clipboard`);
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="td-primary-text">{userName}</div>
                    <div className="td-sub-text">{contactSubText}</div>
                  </td>
                  <td>
                    <div className="td-primary-text">{bizName}</div>
                    <div className="td-sub-text">{bizDesc ? `${bizDesc.slice(0, 45)}...` : 'No summary provided'}</div>
                  </td>
                  <td>
                    <div className="id-badge-pill-group">
                      <span className="id-badge-pill cust-id-pill" title="Customer ID">
                        {custId}
                      </span>
                      <button
                        className="id-copy-btn"
                        title="Copy Customer ID"
                        onClick={() => {
                          navigator.clipboard.writeText(custId);
                          alert(`Copied ${custId} to clipboard`);
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="td-primary-text">{industryStr}</div>
                    <span className="admin-badge admin-badge-indigo">{stageStr}</span>
                  </td>
                  <td>
                    <span
                      className="ai-confidence-tag"
                      style={{ cursor: 'pointer' }}
                      title="Click to view AI Confidence Breakdown"
                      onClick={() => setConfidenceModalScore(confScore)}
                    >
                      🧠 {confScore}%
                    </span>
                  </td>
                  <td>
                    <div className="td-primary-text">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '03 Sep 2026'}
                    </div>
                    <div className="td-sub-text">
                      {p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}
                    </div>
                  </td>
                  <td>
                    {assigningUserId === rawUserIdKey ? (
                      <div className="assign-input-flex">
                        <input
                          type="text"
                          className="admin-field-input micro-input"
                          placeholder="Strategist Name"
                          value={strategistName}
                          onChange={e => setStrategistName(e.target.value)}
                        />
                        <button type="button" className="btn-micro-save" onClick={() => handleSaveStrategist(rawUserIdKey)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="strategist-tag-wrap" onClick={() => { setAssigningUserId(rawUserIdKey); setStrategistName(strategistStr === 'Unassigned (Click)' ? '' : strategistStr); }}>
                        <UserCheck size={14} className="inline-icon" />
                        <span>{strategistStr}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`admin-status-chip ${isArchived ? 'chip-grey' : 'chip-green'}`}>
                      ● {isArchived ? 'Archived' : (p.onboardingStatus === 'completed' ? 'Active' : 'Onboarded')}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-btn-group">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        title="View Full Profile & Brain"
                        onClick={() => setSelectedProfile(p)}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        className="admin-icon-btn"
                        title="Edit Business Details"
                        onClick={() => handleStartEdit(p)}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        className={`admin-icon-btn ${isArchived ? 'btn-red' : ''}`}
                        title={isArchived ? 'Restore Business' : 'Archive Business'}
                        onClick={() => handleToggleArchive(p.userId, isArchived)}
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Business Profile Modal */}
      {editingProfile && (
        <div className="admin-modal-overlay" onClick={() => setEditingProfile(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">✏️ Edit Business Details</h3>
            <form onSubmit={handleSaveEdit} className="admin-edit-form margin-top-16">
              {editError && (
                <div className="admin-error-msg margin-bottom-12" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                  ❌ {editError}
                </div>
              )}
              <div className="admin-field-group">
                <label className="admin-field-label">Business Name</label>
                <input
                  type="text"
                  className="admin-field-input"
                  value={editForm.businessName}
                  onChange={e => { setEditForm({ ...editForm, businessName: e.target.value }); setEditError(''); }}
                  required
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Contact Person</label>
                <input
                  type="text"
                  className="admin-field-input"
                  value={editForm.contactPerson}
                  onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
                />
              </div>

              <div className="admin-grid-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Mobile Number</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    value={editForm.phoneNumber}
                    onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Email</label>
                  <input
                    type="email"
                    className="admin-field-input"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-grid-2col">
                <div className="admin-field-group">
                  <label className="admin-field-label">Industry</label>
                  <input
                    type="text"
                    className="admin-field-input"
                    value={editForm.industry}
                    onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">Business Stage</label>
                  <select
                    className="admin-field-input"
                    value={editForm.businessStage}
                    onChange={e => setEditForm({ ...editForm, businessStage: e.target.value })}
                  >
                    <option value="Idea / Early">Idea / Early</option>
                    <option value="Growing">Growing</option>
                    <option value="Established">Established</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Business Summary</label>
                <textarea
                  className="admin-field-textarea"
                  rows={3}
                  value={editForm.businessSummary}
                  onChange={e => setEditForm({ ...editForm, businessSummary: e.target.value })}
                />
              </div>

              <div className="margin-top-16 flex-end-gap">
                <button type="button" className="duolingo-secondary-btn" onClick={() => setEditingProfile(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Business Drawer / Modal */}
      {selectedProfile && (
        <BusinessProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* AI Confidence Breakdown Modal */}
      {confidenceModalScore !== null && (
        <div className="admin-modal-overlay" onClick={() => setConfidenceModalScore(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="flex-between">
              <h3 className="modal-title">🧠 ADDI Analysis Confidence Breakdown</h3>
              <button className="admin-icon-btn" onClick={() => setConfidenceModalScore(null)}>
                <X size={18} />
              </button>
            </div>

              <div className="confidence-breakdown-card margin-top-16">
                <div className="breakdown-score-header">
                  <span className="score-big font-bold text-highlight">{confidenceModalScore}%</span>
                  <span className="score-sub">Overall AI Confidence Index</span>
                </div>

                <div className="breakdown-metrics-list margin-top-16">
                  <div className="metric-row">
                    <span>Business Understanding Confidence:</span>
                    <strong className="text-emerald">{confidenceModalScore || '—'}%</strong>
                  </div>
                  <div className="metric-row">
                    <span>Industry Classification Confidence:</span>
                    <strong className="text-emerald">{confidenceModalScore || '—'}%</strong>
                  </div>
                  <div className="metric-row">
                    <span>Target Audience Alignment:</span>
                    <strong className="text-highlight">{confidenceModalScore || '—'}%</strong>
                  </div>
                  <div className="metric-row">
                    <span>Production Recommendation Confidence:</span>
                    <strong className="text-emerald">{confidenceModalScore || '—'}%</strong>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessesTab;
