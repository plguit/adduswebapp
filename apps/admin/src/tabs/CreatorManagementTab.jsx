import React, { useState, useEffect } from 'react';
import {
  UserCheck, Search, Star, Award, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, MapPin, Phone, Mail, Camera, AlertTriangle,
  Eye, Download, RefreshCw, TrendingUp, Shield, Briefcase, Edit3,
  DollarSign, FileText, Calendar, MessageSquare, Filter, BarChart3,
  ThumbsUp, ThumbsDown, RotateCcw, Package, User
} from 'lucide-react';
import { creatorAuthService } from '../../../../shared/services/creatorAuthService.js';
import { creatorScoreEngine, scoreWeightConfig, DEFAULT_SCORE_WEIGHTS } from '../../../../ai/creator-score-engine/creatorScoreEngine.js';
import { matchingEngine, autoMatchConfig } from '../../../../ai/creator-score-engine/matchingEngine.js';
import { professionsService } from '../../../../shared/constants/creatorProfessions.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  submitted: { label: 'Submitted', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  under_review: { label: 'Under Review', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  approved: { label: 'Approved', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'rgba(248,113,113,0.15)' }
};

export function CreatorManagementTab({ dataSource = 'localStorage', adminReady = false }) {
  const [creators, setCreators] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [activeSection, setActiveSection] = useState('list'); // list | leaderboard | settings
  const [scoreWeights, setScoreWeights] = useState(scoreWeightConfig.getWeights());
  const [autoMatch, setAutoMatch] = useState(autoMatchConfig.get().enabled);

  const refresh = () => {
    const all = creatorAuthService.getAllCreators();
    // Recalculate scores for all approved creators
    all.filter(c => c.verificationStatus === 'approved').forEach(c => creatorScoreEngine.calculateScore(c.creatorId));
    setCreators(creatorAuthService.getAllCreators());
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('addus_creator_store_updated', handler);
    return () => window.removeEventListener('addus_creator_store_updated', handler);
  }, [dataSource, adminReady]);

  const filtered = creators.filter(c => {
    const matchFilter = filter === 'all' || c.verificationStatus === filter;
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.creatorId?.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryProfession?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) || c.email?.includes(search);
    return matchFilter && matchSearch;
  });

  const stats = {
    total: creators.length,
    submitted: creators.filter(c => c.verificationStatus === 'submitted').length,
    approved: creators.filter(c => c.verificationStatus === 'approved').length,
    rejected: creators.filter(c => c.verificationStatus === 'rejected').length,
    draft: creators.filter(c => c.verificationStatus === 'draft').length
  };

  const handleApprove = (creator) => {
    creatorAuthService.approveCreator(creator.creatorId);
    refresh();
    setSelectedCreator(creatorAuthService.getCreatorById(creator.creatorId));
  };

  const handleReject = (creator) => {
    if (!rejectReason.trim()) return;
    creatorAuthService.rejectCreator(creator.creatorId, rejectReason);
    refresh();
    setSelectedCreator(creatorAuthService.getCreatorById(creator.creatorId));
    setShowReject(false);
    setRejectReason('');
  };

  const handleRequestChanges = (creator) => {
    creatorAuthService.updateCreator(creator.creatorId, { verificationStatus: 'under_review', adminNotes: 'Changes requested by admin' });
    refresh();
  };

  const handleSaveWeights = () => {
    scoreWeightConfig.setWeights(scoreWeights);
  };

  const leaderboard = creatorScoreEngine.getLeaderboard(20);

  if (selectedCreator) {
    return (
      <CreatorDetailView
        creator={selectedCreator}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        onBack={() => { setSelectedCreator(null); refresh(); }}
        onApprove={() => handleApprove(selectedCreator)}
        onReject={() => setShowReject(true)}
        onRequestChanges={() => handleRequestChanges(selectedCreator)}
        showReject={showReject}
        setShowReject={setShowReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleReject={handleReject}
      />
    );
  }

  return (
    <div className="admin-tab-content fade-in">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2>Creator Management</h2>
          <p className="admin-section-sub">Review, approve, and manage all creator profiles.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`admin-primary-btn micro-btn ${activeSection === 'list' ? '' : 'admin-secondary-btn'}`} onClick={() => setActiveSection('list')}>
            <UserCheck size={14} /> Creator List
          </button>
          <button className={`admin-primary-btn micro-btn ${activeSection === 'leaderboard' ? '' : 'admin-secondary-btn'}`} onClick={() => setActiveSection('leaderboard')}>
            <BarChart3 size={14} /> Leaderboard
          </button>
          <button className={`admin-primary-btn micro-btn ${activeSection === 'settings' ? '' : 'admin-secondary-btn'}`} onClick={() => setActiveSection('settings')}>
            <Shield size={14} /> Score Settings
          </button>
          <button className="admin-icon-btn" onClick={refresh} title="Refresh"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="admin-kpi-grid margin-top-16">
        {[
          { label: 'Total Creators', value: stats.total, color: '#818CF8', icon: UserCheck },
          { label: 'Pending Review', value: stats.submitted, color: '#FBBF24', icon: Clock },
          { label: 'Approved', value: stats.approved, color: '#34D399', icon: CheckCircle },
          { label: 'Rejected', value: stats.rejected, color: '#F87171', icon: XCircle },
          { label: 'Drafts', value: stats.draft, color: '#6B7280', icon: Edit3 }
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="admin-kpi-card">
            <div className="kpi-icon-wrap" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="kpi-body">
              <span className="kpi-label">{label}</span>
              <h3 className="kpi-value">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── Creator List ── */}
      {activeSection === 'list' && (
        <>
          {/* Filters */}
          <div className="admin-filter-bar margin-top-20">
            <div className="admin-search-wrap">
              <Search size={16} />
              <input
                className="admin-search-input"
                placeholder="Search by name, ID, profession, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter-chips">
              {['all', 'submitted', 'approved', 'rejected', 'draft'].map(f => (
                <button key={f} className={`admin-filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Creator Cards */}
          {filtered.length === 0 ? (
            <div className="admin-empty-state margin-top-24">
              <UserCheck size={40} style={{ color: '#374151' }} />
              <p>No creators found. Creators will appear here after they register at <strong>/#/creator</strong></p>
            </div>
          ) : (
            <div className="creator-management-list margin-top-16">
              {filtered.map(creator => {
                const sc = STATUS_CONFIG[creator.verificationStatus] || STATUS_CONFIG.draft;
                const score = creatorScoreEngine.getScore(creator.creatorId);
                const scoreLabel = score ? creatorScoreEngine.getScoreLabel(score.overallScore) : null;

                return (
                  <div key={creator.creatorId} className="creator-management-card">
                    <div className="creator-mgmt-left">
                      <div className="creator-mgmt-avatar">
                        {creator.profilePhoto
                          ? <img src={creator.profilePhoto} alt="" />
                          : <User size={24} />
                        }
                      </div>
                      <div className="creator-mgmt-info">
                        <div className="creator-mgmt-name-row">
                          <strong>{creator.name || 'Name not set'}</strong>
                          <span className="creator-mgmt-id">{creator.creatorId}</span>
                        </div>
                        <div className="creator-mgmt-meta">
                          {creator.primaryProfession && <span><Briefcase size={12} /> {creator.primaryProfession}</span>}
                          {creator.location?.city && <span><MapPin size={12} /> {creator.location.city}, {creator.location.state}</span>}
                          {creator.phone && <span><Phone size={12} /> {creator.phone}</span>}
                        </div>
                        <div className="creator-mgmt-tags">
                          {creator.categories?.map((c, i) => (
                            <span key={i} className="creator-category-tag">{c.professionName}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="creator-mgmt-right">
                      {score && (
                        <div className="creator-mgmt-score" style={{ color: scoreLabel?.color }}>
                          <span className="creator-mgmt-score-num">{score.overallScore}</span>
                          <span className="creator-mgmt-score-label">{scoreLabel?.label}</span>
                        </div>
                      )}
                      <span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>
                        {sc.label}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {creator.verificationStatus === 'submitted' && (
                          <>
                            <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                              onClick={() => handleApprove(creator)}>
                              <ThumbsUp size={12} /> Approve
                            </button>
                            <button className="admin-icon-btn text-danger" onClick={() => { setSelectedCreator(creator); setShowReject(true); }} title="Reject">
                              <ThumbsDown size={14} />
                            </button>
                          </>
                        )}
                        <button className="admin-primary-btn micro-btn" onClick={() => { setSelectedCreator(creator); setDetailTab('overview'); }}>
                          <Eye size={14} /> View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Leaderboard ── */}
      {activeSection === 'leaderboard' && (
        <div className="margin-top-20">
          <h3 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
            <Star size={18} className="inline-icon" /> Top Creator Leaderboard
          </h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Creator</th>
                  <th>Score</th>
                  <th>Exp</th>
                  <th>Portfolio</th>
                  <th>Rating</th>
                  <th>Success</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, i) => {
                  const sc = c.score;
                  const sl = sc ? creatorScoreEngine.getScoreLabel(sc.overallScore) : null;
                  return (
                    <tr key={c.creatorId} className={i < 3 ? 'leaderboard-top-row' : ''}>
                      <td>
                        <span className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex-center-gap">
                          <span className="font-semibold text-white">{c.name}</span>
                          <span className="text-muted text-xs">{c.creatorId}</span>
                        </div>
                        <div className="text-xs" style={{ color: '#818CF8' }}>{c.primaryProfession}</div>
                      </td>
                      <td>
                        {sc && <span style={{ color: sl?.color, fontWeight: 700 }}>{sc.overallScore} <small style={{ opacity: 0.7 }}>{sl?.label}</small></span>}
                      </td>
                      <td>{sc?.dimensions?.experience || '—'}</td>
                      <td>{sc?.dimensions?.portfolio || '—'}</td>
                      <td>{sc?.dimensions?.customerRating || '—'}</td>
                      <td>{sc?.dimensions?.projectSuccess || '—'}</td>
                      <td><span className="admin-badge admin-badge-green">{c.verificationStatus}</span></td>
                    </tr>
                  );
                })}
                {leaderboard.length === 0 && (
                  <tr><td colSpan={8} className="admin-empty-row">No approved creators yet. Approve creators to see leaderboard.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Score Settings ── */}
      {activeSection === 'settings' && (
        <div className="margin-top-20">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}><Shield size={18} className="inline-icon" /> Score Weight Configuration</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label className="creator-toggle-label">
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Auto Creator Assignment</span>
                <div className={`creator-toggle ${autoMatch ? 'on' : ''}`} onClick={() => {
                  const newVal = !autoMatch;
                  setAutoMatch(newVal);
                  autoMatchConfig.set({ enabled: newVal });
                }}>
                  <div className="creator-toggle-knob" />
                </div>
                <span style={{ color: autoMatch ? '#34D399' : '#6B7280', fontSize: '12px' }}>{autoMatch ? 'ON' : 'OFF'}</span>
              </label>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>
            Adjust the weight of each dimension in the Creator Score formula. Total must equal 100%.
          </p>

          <div className="admin-card-box">
            {Object.entries(scoreWeights).filter(([k]) => k !== 'updatedAt').map(([key, val]) => (
              <div key={key} className="creator-weight-row">
                <span className="creator-weight-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                <div className="creator-weight-bar-wrap">
                  <div className="creator-weight-bar" style={{ width: `${val}%` }} />
                </div>
                <div className="creator-weight-input-wrap">
                  <input
                    type="number"
                    className="creator-weight-input"
                    value={val}
                    min={0}
                    max={100}
                    onChange={e => setScoreWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: Object.entries(scoreWeights).filter(([k]) => k !== 'updatedAt').reduce((s, [, v]) => s + v, 0) === 100 ? '#34D399' : '#F87171', fontSize: '13px' }}>
                Total: {Object.entries(scoreWeights).filter(([k]) => k !== 'updatedAt').reduce((s, [, v]) => s + v, 0)}%
              </span>
              <button className="admin-primary-btn" onClick={handleSaveWeights}><Shield size={16} /> Save Weights</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Creator Detail View ─────────────────────────────────────────────────────

function CreatorDetailView({ creator, detailTab, setDetailTab, onBack, onApprove, onReject, onRequestChanges, showReject, setShowReject, rejectReason, setRejectReason, handleReject }) {
  const sc = STATUS_CONFIG[creator.verificationStatus] || STATUS_CONFIG.draft;
  const score = creatorScoreEngine.getScore(creator.creatorId);
  const scoreLabel = score ? creatorScoreEngine.getScoreLabel(score.overallScore) : null;
  const improvements = creatorScoreEngine.getImprovementSuggestions(creator.creatorId);

  const DETAIL_TABS = ['overview', 'portfolio', 'pricing', 'documents', 'equipment', 'score'];

  return (
    <div className="admin-tab-content fade-in">
      {/* Back & Actions */}
      <div className="flex-between margin-bottom-16">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="duolingo-secondary-btn micro-btn" onClick={onBack}>← Back</button>
          <div>
            <h2 style={{ margin: 0 }}>{creator.name || 'Creator Profile'}</h2>
            <span style={{ color: '#818CF8', fontSize: '12px' }}>{creator.creatorId}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {creator.verificationStatus === 'submitted' || creator.verificationStatus === 'under_review' ? (
            <>
              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }} onClick={onApprove}>
                <ThumbsUp size={14} /> Approve
              </button>
              <button className="admin-primary-btn micro-btn" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }} onClick={onReject}>
                <ThumbsDown size={14} /> Reject
              </button>
              <button className="duolingo-secondary-btn micro-btn" onClick={onRequestChanges}>
                <RotateCcw size={14} /> Request Changes
              </button>
            </>
          ) : null}
          <span className="admin-badge" style={{ color: sc.color, background: sc.bg, padding: '6px 12px' }}>{sc.label}</span>
        </div>
      </div>

      {/* Rejection form */}
      {showReject && (
        <div className="creator-reject-form margin-bottom-16">
          <h4 style={{ color: '#F87171' }}>Reject Creator Profile</h4>
          <textarea
            className="creator-textarea"
            rows={3}
            placeholder="Provide a clear reason for rejection so the creator can resubmit..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="admin-primary-btn micro-btn" style={{ background: 'rgba(248,113,113,0.2)', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }}
              onClick={() => handleReject(creator)}>
              Confirm Rejection
            </button>
            <button className="duolingo-secondary-btn micro-btn" onClick={() => setShowReject(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Detail Tabs */}
      <div className="admin-tab-nav margin-bottom-16">
        {DETAIL_TABS.map(tab => (
          <button key={tab} className={`admin-tab-btn ${detailTab === tab ? 'active' : ''}`} onClick={() => setDetailTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {detailTab === 'overview' && (
        <div className="creator-detail-overview">
          <div className="creator-detail-header-card">
            <div className="creator-detail-avatar">
              {creator.profilePhoto ? <img src={creator.profilePhoto} alt="" /> : <User size={40} />}
            </div>
            <div>
              <h3>{creator.name}</h3>
              <div className="creator-detail-sub">{creator.primaryProfession}</div>
              <div className="creator-detail-meta-row">
                {creator.phone && <span><Phone size={13} /> {creator.phone}</span>}
                {creator.email && <span><Mail size={13} /> {creator.email}</span>}
                {creator.location?.city && <span><MapPin size={13} /> {creator.location.city}, {creator.location.state}</span>}
              </div>
            </div>
          </div>

          <div className="creator-detail-info-grid margin-top-16">
            <div className="creator-detail-info-card">
              <label>Creator ID</label>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{creator.creatorId}</span>
            </div>
            <div className="creator-detail-info-card">
              <label>Verification</label>
              <span style={{ color: sc.color }}>{sc.label}</span>
            </div>
            <div className="creator-detail-info-card">
              <label>Availability</label>
              <span style={{ textTransform: 'capitalize' }}>{creator.availabilityStatus || '—'}</span>
            </div>
            <div className="creator-detail-info-card">
              <label>Submitted At</label>
              <span>{creator.submittedAt ? new Date(creator.submittedAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="creator-detail-info-card">
              <label>Approved At</label>
              <span>{creator.approvedAt ? new Date(creator.approvedAt).toLocaleDateString() : '—'}</span>
            </div>
            <div className="creator-detail-info-card">
              <label>Pincode</label>
              <span>{creator.location?.pincode || '—'}</span>
            </div>
          </div>

          {creator.adminNotes && (
            <div className="creator-detail-admin-notes margin-top-16">
              <label>Admin Notes</label>
              <p>{creator.adminNotes}</p>
            </div>
          )}

          {creator.rejectionReason && (
            <div className="creator-rejection-info margin-top-12">
              <AlertTriangle size={16} />
              <div>
                <strong>Rejection Reason:</strong> {creator.rejectionReason}
              </div>
            </div>
          )}

          <div className="margin-top-16">
            <h4 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Specialisations</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(creator.categories || []).map((c, i) => (
                <span key={i} className="creator-category-tag">{c.professionName}</span>
              ))}
              {(creator.categories || []).length === 0 && <span style={{ color: '#6B7280' }}>None set</span>}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio */}
      {detailTab === 'portfolio' && (
        <div>
          {(creator.categories || []).map((cat, catIdx) => (
            <div key={catIdx} className="margin-bottom-20">
              <h4 style={{ color: '#818CF8', marginBottom: '12px' }}>{cat.professionName}</h4>
              {(cat.portfolio || []).length === 0 ? (
                <p style={{ color: '#6B7280' }}>No portfolio items in this category.</p>
              ) : (
                <div className="creator-portfolio-grid">
                  {(cat.portfolio || []).map((item, i) => (
                    <div key={i} className="creator-portfolio-card">
                      <div className="creator-portfolio-media-placeholder"><FolderOpen size={24} style={{ color: '#374151' }} /></div>
                      <div className="creator-portfolio-info">
                        <h4>{item.projectName || 'Untitled'}</h4>
                        {item.clientName && <div className="text-muted text-xs">Client: {item.clientName}</div>}
                        {item.description && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {detailTab === 'pricing' && (
        <div>
          {(creator.categories || []).map((cat, catIdx) => (
            <div key={catIdx} className="admin-card-box margin-bottom-16">
              <div className="card-box-header flex-between">
                <h4>{cat.professionName}</h4>
                {cat.pricingAdminApproved
                  ? <span className="admin-badge admin-badge-green">Approved</span>
                  : cat.pricing
                    ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="admin-badge" style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.15)' }}>Pending</span>
                        <button className="admin-primary-btn micro-btn" onClick={() => {
                          const cats = [...creator.categories];
                          cats[catIdx] = { ...cats[catIdx], pricingAdminApproved: true };
                          creatorAuthService.updateCreator(creator.creatorId, { categories: cats });
                        }}>Approve Pricing</button>
                      </div>
                    )
                    : <span style={{ color: '#6B7280', fontSize: '12px' }}>No pricing</span>}
              </div>
              {cat.pricing && (
                <div className="creator-pricing-display margin-top-12">
                  {Object.entries(cat.pricing).filter(([k]) => k !== 'customNote').map(([key, val]) => val && (
                    <div key={key} className="creator-pricing-row">
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      <span className="creator-pricing-val">₹{Number(val).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {detailTab === 'documents' && (
        <div>
          {(creator.documents || []).length === 0 ? (
            <p style={{ color: '#6B7280' }}>No documents uploaded yet.</p>
          ) : (
            <div className="creator-documents-grid">
              {(creator.documents || []).map(doc => {
                const colors = { pending: '#FBBF24', verified: '#34D399', rejected: '#F87171' };
                return (
                  <div key={doc.documentId} className="creator-doc-card">
                    <div className="creator-doc-header">
                      <div>
                        <h4 style={{ textTransform: 'capitalize' }}>{doc.type.replace(/_/g, ' ')}</h4>
                        <span style={{ color: colors[doc.status], fontSize: '12px' }}>{doc.status}</span>
                      </div>
                      {doc.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                            onClick={() => {
                              const docs = creator.documents.map(d => d.documentId === doc.documentId ? { ...d, status: 'verified' } : d);
                              creatorAuthService.updateCreator(creator.creatorId, { documents: docs });
                            }}><CheckCircle size={12} /></button>
                          <button className="admin-icon-btn text-danger" onClick={() => {
                            const docs = creator.documents.map(d => d.documentId === doc.documentId ? { ...d, status: 'rejected' } : d);
                            creatorAuthService.updateCreator(creator.creatorId, { documents: docs });
                          }}><XCircle size={12} /></button>
                        </div>
                      )}
                    </div>
                    <div className="creator-doc-filename">{doc.fileName}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Equipment */}
      {detailTab === 'equipment' && (
        <div>
          {(creator.equipment || []).length === 0 ? (
            <p style={{ color: '#6B7280' }}>No equipment listed yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Item</th><th>Category</th><th>Ownership</th><th>Condition</th><th>Verified</th></tr></thead>
                <tbody>
                  {creator.equipment.map(e => (
                    <tr key={e.equipmentId}>
                      <td className="font-semibold text-white">{e.name}</td>
                      <td>{e.category}</td>
                      <td><span className={`admin-badge ${e.ownership === 'owned' ? 'admin-badge-green' : 'admin-badge-yellow'}`}>{e.ownership === 'owned' ? 'Owned' : 'Rent Required'}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{e.condition || '—'}</td>
                      <td>{e.adminVerified ? <CheckCircle size={16} style={{ color: '#34D399' }} /> : <Clock size={16} style={{ color: '#FBBF24' }} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Score */}
      {detailTab === 'score' && (
        <div>
          {score ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="creator-score-badge" style={{ background: `${scoreLabel?.color}20`, border: `1px solid ${scoreLabel?.color}40`, padding: '16px 24px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: scoreLabel?.color }}>{score.overallScore}</span>
                  <span style={{ color: scoreLabel?.color, fontSize: '14px' }}>{scoreLabel?.label}</span>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Last calculated: {score.calculatedAt ? new Date(score.calculatedAt).toLocaleString() : '—'}</p>
                  <button className="admin-primary-btn micro-btn margin-top-8" onClick={() => creatorScoreEngine.calculateScore(creator.creatorId)}>
                    <RefreshCw size={14} /> Recalculate
                  </button>
                </div>
              </div>

              <div className="creator-score-dimensions">
                {Object.entries(score.dimensions || {}).map(([key, val]) => {
                  const w = score.weights?.[key] || 0;
                  return (
                    <div key={key} className="creator-score-dim-row">
                      <span className="creator-score-dim-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} <small style={{ color: '#6B7280' }}>({w}%)</small></span>
                      <div className="creator-score-bar-wrap">
                        <div className="creator-score-bar-fill" style={{ width: `${val}%`, background: val >= 80 ? '#34D399' : val >= 60 ? '#FBBF24' : '#F87171' }} />
                      </div>
                      <span className="creator-score-dim-val">{val}</span>
                    </div>
                  );
                })}
              </div>

              {improvements.length > 0 && (
                <div className="margin-top-20">
                  <h4 style={{ marginBottom: '12px' }}>Improvement Suggestions</h4>
                  {improvements.map((s, i) => (
                    <div key={i} className={`creator-improvement-item priority-${s.priority}`}>
                      <div className="creator-improvement-dot" /> {s.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>No score available. Creator must be approved to calculate a score.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CreatorManagementTab;

// Fix missing import
function FolderOpen({ size, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
