import React, { useState } from 'react';
import { X, Building2, Star, MessageSquare, CheckCircle, FileText, Clock } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export function BusinessProfileModal({ profile, onClose }) {
  const brain = profile.businessBrain || {};
  const [notes, setNotes] = useState(profile.expertNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleReviewAction = async (status) => {
    setSaving(true);
    let finalNotes = notes;
    if (status === 'rejected' && !finalNotes.trim()) {
      const reason = prompt('Please enter rejection reason:');
      if (reason === null) {
        setSaving(false);
        return;
      }
      finalNotes = reason.trim() || 'Submission rejected by admin.';
      setNotes(finalNotes);
    }

    await apiService.request('/api/admin/expert-review/' + profile.userId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes: finalNotes })
    });
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(status);
    setTimeout(onClose, 1000);
  };

  const projects = profile.projects || [];
  const chatHistory = profile.chatHistory || [];

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <Building2 size={18} />
            <span>{brain.businessName || profile.name || 'Business Profile'}</span>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="admin-modal-body">
          {/* AI Summary */}
          <section className="admin-section">
            <h3 className="admin-section-title">🧠 Business Brain</h3>
            <div className="admin-brain-grid">
              {[
                ['Business Name', brain.businessName],
                ['Industry', brain.industry],
                ['Stage', brain.stage],
                ['Target Audience', brain.targetAudience],
                ['Brand Personality', brain.brandPersonality],
                ['Website', brain.website],
                ['Business Description', brain.businessDescription],
                ['Products', Array.isArray(brain.products) ? brain.products.join(', ') : brain.products],
                ['Services', Array.isArray(brain.services) ? brain.services.join(', ') : brain.services],
                ['Business Goal', brain.businessGoal],
                ['Challenges', brain.currentChallenge],
                ['AI Confidence', brain.aiConfidenceScore ? `${brain.aiConfidenceScore}%` : null],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="admin-brain-field">
                  <div className="admin-brain-label">{label}</div>
                  <div className="admin-brain-value">{val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Uploaded files */}
          {(profile.uploadedFiles || []).length > 0 && (
            <section className="admin-section">
              <h3 className="admin-section-title"><FileText size={16} /> Uploaded Files & Vault Assets</h3>
              {profile.uploadedFiles.map((f, i) => (
                <div key={i} className="admin-file-row" style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFF' }}><FileText size={14} /> <strong>{f.name}</strong></span>
                    <span className="admin-file-date">{f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', paddingLeft: '20px' }}>
                    Category: <span style={{ color: '#00D1FF' }}>{f.category || 'General'}</span>
                    {f.projectId && ` · Project: ${f.projectId}`}
                    {f.productId && ` · Product ID: ${f.productId}`}
                  </div>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#a78bfa', paddingLeft: '20px', textDecoration: 'none' }}>
                      Download / Open Vault Document →
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Expert Review */}
          <section className="admin-section">
            <h3 className="admin-section-title"><Star size={16} /> Expert Review</h3>
            <div className="admin-review-status">
              Status: <strong>{profile.expertReviewStatus || 'Not submitted'}</strong>
              {profile.expertReviewSubmittedAt && (
                <span className="admin-review-time">Submitted: {new Date(profile.expertReviewSubmittedAt).toLocaleString()}</span>
              )}
            </div>
            <div className="admin-field-group" style={{ marginTop: 12 }}>
              <label className="admin-field-label">Expert Notes / Recommendations</label>
              <textarea
                className="admin-field-textarea"
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add your expert recommendations for this business..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: 12, flexWrap: 'wrap' }}>
              <button
                className="admin-primary-btn"
                onClick={() => handleReviewAction('completed')}
                disabled={saving || Boolean(saved)}
                style={{ background: '#10B981', flex: 1, minWidth: '140px' }}
              >
                {saved === 'completed' ? '✓ Profile Approved' : saving ? 'Publishing...' : '✓ Approve Profile'}
              </button>
              <button
                className="admin-secondary-btn"
                onClick={() => handleReviewAction('rejected')}
                disabled={saving || Boolean(saved)}
                style={{ borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.1)', flex: 1, minWidth: '140px' }}
              >
                {saved === 'rejected' ? '✕ Profile Rejected' : saving ? 'Updating...' : '✕ Reject Profile'}
              </button>
            </div>
          </section>

          {/* Projects */}
          {projects.length > 0 && (
            <section className="admin-section">
              <h3 className="admin-section-title"><CheckCircle size={16} /> Project History ({projects.length})</h3>
              {projects.map(p => (
                <div key={p.id} className="admin-project-row">
                  <span className="admin-project-id">{p.id}</span>
                  <span>{p.service}</span>
                  <span className="admin-badge admin-badge-grey">{p.status}</span>
                  <span className="admin-project-date">{p.shootDate || '—'}</span>
                </div>
              ))}
            </section>
          )}

          {/* Chat history */}
          {chatHistory.length > 0 && (
            <section className="admin-section">
              <h3 className="admin-section-title"><MessageSquare size={16} /> Chat History ({chatHistory.length} messages)</h3>
              <div className="admin-chat-log">
                {chatHistory.slice(-10).map((m, i) => (
                  <div key={i} className={`admin-chat-msg ${m.sender === 'user' ? 'admin-msg-user' : 'admin-msg-ai'}`}>
                    <span className="admin-msg-sender">{m.sender === 'user' ? '👤' : '🤖'}</span>
                    <span>{m.text?.slice(0, 200)}{m.text?.length > 200 ? '...' : ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
