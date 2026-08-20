import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  RotateCcw, RefreshCw, Star, BarChart3, TrendingUp, Filter,
  ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { qualityBrainService, qualityConfig } from '../../../../ai/quality-brain/qualityBrainService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';
import { planningBrainService } from '../../../../ai/planning-brain/planningBrainService.js';
import { adminApiService } from '../services/adminApiService.js';

const VERDICT_CONFIG = {
  approved: { label: 'Approved', color: '#34D399', bg: 'rgba(52,211,153,0.15)', icon: CheckCircle },
  auto_approved: { label: 'Auto Approved', color: '#34D399', bg: 'rgba(52,211,153,0.15)', icon: CheckCircle },
  pending_manual_review: { label: 'Manual Review', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', icon: Clock },
  revision_required: { label: 'Revision Required', color: '#F87171', bg: 'rgba(248,113,113,0.15)', icon: AlertTriangle },
  rejected: { label: 'Rejected', color: '#F87171', bg: 'rgba(248,113,113,0.15)', icon: XCircle }
};

export function QualityBrainTab({ dataSource = 'localStorage', adminReady = false }) {
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filter, setFilter] = useState('all');
  const [section, setSection] = useState('reviews'); // reviews | run | config
  const [reviewProjectId, setReviewProjectId] = useState('');
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState(qualityConfig.get());
  const stats = qualityBrainService.getDashboardStats();

  const refresh = async () => {
    try {
      setReviews(qualityBrainService.getAllReviews());
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getProjects();
        setProjects(res.projects || []);
      } else {
        setProjects(getAllProjectsAcrossUsers());
      }
    } catch (e) {
      console.warn('[QualityBrainTab] backend load failed, falling back to localStorage:', e.message);
      setReviews(qualityBrainService.getAllReviews());
      setProjects(getAllProjectsAcrossUsers());
    }
  };

  useEffect(() => { refresh(); }, [dataSource, adminReady]);

  const filtered = reviews.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.verdict === 'pending_manual_review';
    if (filter === 'approved') return r.verdict === 'approved' || r.autoApproved;
    if (filter === 'revision') return r.verdict === 'revision_required';
    return true;
  });

  const handleRunReview = () => {
    if (!reviewProjectId) return;
    const project = projects.find(p => p.id === reviewProjectId);
    if (!project) return;
    setRunning(true);
    setTimeout(() => {
      const template = planningBrainService.getTemplateByService(project.service);
      const review = qualityBrainService.reviewProject(project, template);
      refresh();
      setSelectedReview(review);
      setSection('reviews');
      setRunning(false);
    }, 1800);
  };

  const handleOverride = (reviewId, decision) => {
    qualityBrainService.adminOverride(reviewId, decision);
    refresh();
    if (selectedReview?.reviewId === reviewId) {
      setSelectedReview(qualityBrainService.getAllReviews().find(r => r.reviewId === reviewId));
    }
  };

  const handleSaveConfig = () => {
    qualityConfig.set(config);
    alert('Quality Brain configuration saved.');
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Quality Brain</h2>
          <p className="admin-section-sub">AI quality review engine. Review deliverables before customer delivery.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['reviews', 'run', 'config'].map(s => (
            <button key={s} className={`admin-primary-btn micro-btn ${section === s ? '' : 'duolingo-secondary-btn'}`} onClick={() => { setSection(s); setSelectedReview(null); }}>
              {s === 'reviews' ? 'Reviews' : s === 'run' ? 'Run Review' : 'Config'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="admin-kpi-grid margin-top-16">
        {[
          { label: 'Total Reviews', value: stats.total, color: '#818CF8', icon: ShieldCheck },
          { label: 'Pending Review', value: stats.pending, color: '#FBBF24', icon: Clock },
          { label: 'Approved', value: stats.approved, color: '#34D399', icon: CheckCircle },
          { label: 'Revision', value: stats.revision, color: '#F87171', icon: AlertTriangle },
          { label: 'Avg Score', value: stats.avgScore || '—', color: '#60A5FA', icon: Star }
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

      {/* ── Run Review ── */}
      {section === 'run' && (
        <div className="admin-card-box margin-top-20">
          <div className="card-box-header"><h3>Run Quality Review</h3></div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '8px' }}>
            Select a project to run the Quality Brain review on its deliverables.
          </p>
          <div className="creator-form-field margin-top-16">
            <label>Select Project</label>
            <select className="creator-select" value={reviewProjectId} onChange={e => setReviewProjectId(e.target.value)}>
              <option value="">-- Select a project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} — {p.service || 'Unknown'} ({p.status})</option>
              ))}
            </select>
          </div>
          <button
            className="admin-primary-btn margin-top-12"
            onClick={handleRunReview}
            disabled={!reviewProjectId || running}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {running ? <><RefreshCw size={16} className="spin-icon" /> Quality Brain is reviewing...</> : <><ShieldCheck size={16} /> Run Quality Review</>}
          </button>
        </div>
      )}

      {/* ── Config ── */}
      {section === 'config' && (
        <div className="admin-card-box margin-top-20">
          <div className="card-box-header"><h3>Quality Thresholds</h3></div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px' }}>
            Configure when deliverables are auto-approved, sent for manual review, or require revision.
          </p>
          {[
            { key: 'autoApproveThreshold', label: 'Auto Approve Threshold', desc: 'Score at or above this is automatically approved', color: '#34D399' },
            { key: 'manualReviewThreshold', label: 'Manual Review Threshold', desc: 'Score at or above this requires admin review', color: '#FBBF24' },
            { key: 'revisionThreshold', label: 'Revision Required Below', desc: 'Score below this requires creator revision', color: '#F87171' }
          ].map(({ key, label, desc, color }) => (
            <div key={key} className="creator-weight-row" style={{ marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{desc}</div>
              </div>
              <div className="creator-weight-input-wrap">
                <input
                  type="number"
                  className="creator-weight-input"
                  value={config[key]}
                  min={0}
                  max={100}
                  onChange={e => setConfig(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                  style={{ borderColor: `${color}40` }}
                />
                <span style={{ color }}>/ 100</span>
              </div>
            </div>
          ))}
          <button className="admin-primary-btn" onClick={handleSaveConfig}><ShieldCheck size={16} /> Save Configuration</button>
        </div>
      )}

      {/* ── Reviews List ── */}
      {section === 'reviews' && !selectedReview && (
        <div className="margin-top-20">
          <div className="admin-filter-bar">
            {['all', 'pending', 'approved', 'revision'].map(f => (
              <button key={f} className={`admin-filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="admin-empty-state margin-top-20">
              <ShieldCheck size={40} style={{ color: '#374151' }} />
              <p>No quality reviews yet. Use "Run Review" to review a project's deliverables.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
              {filtered.map(review => {
                const vc = VERDICT_CONFIG[review.verdict] || VERDICT_CONFIG.pending_manual_review;
                const VIcon = vc.icon;
                return (
                  <div key={review.reviewId} className="admin-review-card">
                    <div className="arc-header">
                      <div>
                        <div className="arc-business-name">Project: {review.projectId}</div>
                        <div className="arc-meta">Review: <strong style={{ color: '#818CF8' }}>{review.reviewId}</strong></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 800, color: vc.color }}>{review.overallScore}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Overall</div>
                        </div>
                        <span className="admin-badge" style={{ color: vc.color, background: vc.bg }}>
                          <VIcon size={12} className="inline-icon" /> {vc.label}
                        </span>
                      </div>
                    </div>

                    <div className="arc-brain-snapshot margin-top-10">
                      {Object.entries(review.scores || {}).map(([key, val]) => (
                        <div key={key} className="arc-brain-row">
                          <span className="arc-brain-label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                          <span style={{ color: val >= 80 ? '#34D399' : val >= 60 ? '#FBBF24' : '#F87171' }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="admin-primary-btn micro-btn" onClick={() => setSelectedReview(review)}><Eye size={14} /> Details</button>
                      {review.verdict === 'pending_manual_review' && (
                        <>
                          <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                            onClick={() => handleOverride(review.reviewId, 'approved')}><ThumbsUp size={12} /> Approve</button>
                          <button className="admin-primary-btn micro-btn" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                            onClick={() => handleOverride(review.reviewId, 'revision_required')}><ThumbsDown size={12} /> Revision</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Review Detail ── */}
      {section === 'reviews' && selectedReview && (
        <div className="margin-top-20">
          <button className="duolingo-secondary-btn micro-btn margin-bottom-16" onClick={() => setSelectedReview(null)}>← Back</button>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: VERDICT_CONFIG[selectedReview.verdict]?.color }}>{selectedReview.overallScore}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Overall</div>
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Quality Review: {selectedReview.reviewId}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Project: {selectedReview.projectId} · Evaluated: {new Date(selectedReview.evaluatedAt).toLocaleString()}</p>
              {selectedReview.autoApproved && <span className="admin-badge admin-badge-green" style={{ fontSize: '11px' }}>⚡ Auto-Approved</span>}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="admin-card-box margin-bottom-16">
            <div className="card-box-header"><h4>Score Breakdown</h4></div>
            <div className="creator-score-dimensions margin-top-12">
              {Object.entries(selectedReview.scores || {}).map(([key, val]) => (
                <div key={key} className="creator-score-dim-row">
                  <span className="creator-score-dim-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <div className="creator-score-bar-wrap">
                    <div className="creator-score-bar-fill" style={{ width: `${val}%`, background: val >= 80 ? '#34D399' : val >= 60 ? '#FBBF24' : '#F87171' }} />
                  </div>
                  <span className="creator-score-dim-val">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {(selectedReview.suggestions || []).length > 0 && (
            <div className="admin-card-box margin-bottom-16">
              <div className="card-box-header"><h4>AI Improvement Suggestions</h4></div>
              {selectedReview.suggestions.map((s, i) => (
                <div key={i} className="creator-improvement-item priority-medium margin-top-8">
                  <div className="creator-improvement-dot" /> {s}
                </div>
              ))}
            </div>
          )}

          {/* Missing Items */}
          {(selectedReview.missingItems || []).length > 0 && (
            <div className="admin-card-box margin-bottom-16">
              <div className="card-box-header"><h4 style={{ color: '#F87171' }}>Missing Deliverables</h4></div>
              {selectedReview.missingItems.map((item, i) => (
                <div key={i} style={{ color: '#F87171', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  ✗ {item}
                </div>
              ))}
            </div>
          )}

          {/* Admin Actions */}
          {selectedReview.verdict === 'pending_manual_review' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="admin-primary-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                onClick={() => handleOverride(selectedReview.reviewId, 'approved')}><ThumbsUp size={16} /> Approve Delivery</button>
              <button className="admin-primary-btn" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }}
                onClick={() => handleOverride(selectedReview.reviewId, 'revision_required')}><RotateCcw size={16} /> Request Revision</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QualityBrainTab;
