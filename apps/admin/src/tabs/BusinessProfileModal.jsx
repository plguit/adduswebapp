import React, { useState } from 'react';
import { X, Building2, Star, MessageSquare, CheckCircle, FileText } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';

export function BusinessProfileModal({ profile, onClose }) {
  const brain = profile.businessBrain || {};
  const [notes, setNotes] = useState(profile.expertNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCompleteReview = async () => {
    setSaving(true);
    profileService.setExpertReviewStatus(profile.userId, 'completed', notes);
    profileService.addNotification(profile.userId, {
      type: 'expert_review_complete',
      message: 'Your Expert Review is complete! Check your dashboard for personalized recommendations.',
      expertNotes: notes,
    });
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 1000);
  };

  const projects = profileService.getProjects(profile.userId);
  const chatHistory = profileService.getChatHistory(profile.userId);

  const safeVal = (v) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) return v.map(x => safeVal(x)).filter(Boolean).join(', ');
    if (v && typeof v === 'object') return v.name || v.title || v.userId || v.id || v.role || '';
    return '';
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <Building2 size={18} />
            <span>{safeVal(brain.businessName || profile.name) || 'Business Profile'}</span>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="admin-modal-body">
          <section className="admin-section">
            <h3 className="admin-section-title">🧠 Business Brain</h3>
            <div className="admin-brain-grid">
              {[
                ['Business Name', safeVal(brain.businessName)],
                ['Industry', safeVal(brain.industry)],
                ['Stage', safeVal(brain.businessStage)],
                ['Target Audience', safeVal(brain.targetAudience)],
                ['Brand Personality', safeVal(brain.brandPersonality)],
                ['Website', safeVal(brain.website)],
                ['Business Description', safeVal(brain.businessDescription)],
                ['Products', safeVal(brain.products)],
                ['Services', safeVal(brain.services)],
                ['Business Goal', safeVal(brain.businessGoal)],
                ['Challenges', safeVal(brain.currentChallenge)],
                ['AI Confidence', brain.aiConfidenceScore ? `${brain.aiConfidenceScore}%` : null],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="admin-brain-field">
                  <div className="admin-brain-label">{label}</div>
                  <div className="admin-brain-value">{val}</div>
                </div>
              ))}
            </div>
          </section>

          {(profile.uploadedFiles || []).length > 0 && (
            <section className="admin-section">
              <h3 className="admin-section-title"><FileText size={16} /> Uploaded Files</h3>
              {profile.uploadedFiles.map((f, i) => (
                <div key={i} className="admin-file-row">
                  <FileText size={14} /><span>{f.name}</span>
                  <span className="admin-file-date">{f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </section>
          )}

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
            <button
              className="admin-primary-btn"
              onClick={handleCompleteReview}
              disabled={saving || saved}
              style={{ marginTop: 10 }}
            >
              {saved ? '✓ Review Published' : saving ? 'Publishing...' : '✓ Mark Expert Review Completed'}
            </button>
          </section>

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
