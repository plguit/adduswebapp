import React, { useState, useEffect } from 'react';
import { Search, Eye, Building2, Filter, Edit3, UserCheck, Archive, FileText, MessageSquare, BrainCircuit, X } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { adminApiService } from '../services/adminApiService.js';
import { validation, ALLOWED_STAGES } from '../../../../src/services/validation.js';
import { BusinessProfileModal } from './BusinessProfileModal.jsx';

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

  const industries = ['All', ...new Set(profiles.map(p => p.businessBrain?.industry).filter(Boolean))];

  const filtered = profiles.filter(p => {
    const brain = p.businessBrain || {};
    const name = (brain.businessName || p.name || '').toLowerCase();
    const industry = (brain.industry || '').toLowerCase();
    const phone = (p.phoneNumber || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const strategist = (p.assignedStrategist || '').toLowerCase();
    const q = search.toLowerCase();

    const matchSearch = !q || name.includes(q) || industry.includes(q) || phone.includes(q) || email.includes(q) || strategist.includes(q);
    const matchIndustry = filterIndustry === 'All' || brain.industry === filterIndustry;
    const matchStatus = filterStatus === 'All'
      ? !p.archived
      : filterStatus === 'Archived'
        ? !!p.archived
        : !p.archived && (p.onboardingStatus === filterStatus.toLowerCase() || (filterStatus === 'Active' && p.onboardingStatus === 'completed'));

    return matchSearch && matchIndustry && matchStatus;
  });

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
        <span className="admin-count-chip">{filtered.length} Businesses</span>
      </div>

      <div className="admin-filter-bar margin-top-16">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            className="admin-search-input"
            placeholder="Search business name, contact, industry, strategist..."
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
              <th>Business Name</th>
              <th>Customer ID</th>
              <th>Industry &amp; Stage</th>
              <th>AI Confidence</th>
              <th>Assigned Strategist</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-empty-row">
                  <Building2 size={24} />
                  <p>No businesses matching search criteria.</p>
                </td>
              </tr>
            ) : filtered.map(p => {
              const brain = p.businessBrain || {};
              const confScore = brain.aiConfidenceScore || null;
              const isArchived = !!p.archived;
              const bizId = p.businessId || p.userId;
              const custId = p.customerId || p.userId || '—';

              return (
                <tr key={p.userId} className={isArchived ? 'archived-row' : ''}>
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
                    <div className="td-primary-text">{brain.businessName || p.name || 'Unnamed Business'}</div>
                    <div className="td-sub-text">{brain.businessDescription ? `${brain.businessDescription.slice(0, 45)}...` : 'No summary provided'}</div>
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
                    <div className="td-primary-text">{brain.industry || 'General'}</div>
                    <span className="admin-badge admin-badge-indigo">{brain.businessStage || 'Growing'}</span>
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
                    {assigningUserId === p.userId ? (
                      <div className="assign-input-flex">
                        <input
                          type="text"
                          className="admin-field-input micro-input"
                          placeholder="Strategist Name"
                          value={strategistName}
                          onChange={e => setStrategistName(e.target.value)}
                        />
                        <button type="button" className="btn-micro-save" onClick={() => handleSaveStrategist(p.userId)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="strategist-tag-wrap" onClick={() => { setAssigningUserId(p.userId); setStrategistName(p.assignedStrategist || ''); }}>
                        <UserCheck size={14} className="inline-icon" />
                        <span>{p.assignedStrategist || 'Unassigned (Click)'}</span>
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
