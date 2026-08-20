import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, User, ArrowRight, Check, Edit3, Send } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { adminApiService } from '../services/adminApiService.js';

export function ExpertReviewTab({ dataSource = 'localStorage', adminReady = false }) {
  const [profiles, setProfiles] = useState([]);
  const [assignees, setAssignees] = useState({});
  const [notes, setNotes] = useState({});
  const [customRecs, setCustomRecs] = useState({});
  const [completing, setCompleting] = useState({});
  const [done, setDone] = useState({});

  const refresh = async () => {
    try {
      let all = [];
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getUsers();
        all = res.users || [];
      } else {
        all = profileService.getAllProfiles();
      }
      const pending = all.filter(p => p.expertReviewStatus === 'pending' || !p.expertReviewStatus);
      const pendingWithBrain = pending.filter(p => p.businessBrain && Object.keys(p.businessBrain).length > 0);
      setProfiles(pendingWithBrain);
    } catch (e) {
      console.warn('[ExpertReviewTab] backend load failed, falling back to localStorage:', e.message);
      const all = profileService.getAllProfiles();
      const pending = all.filter(p => p.expertReviewStatus === 'pending' || !p.expertReviewStatus);
      const pendingWithBrain = pending.filter(p => p.businessBrain && Object.keys(p.businessBrain).length > 0);
      setProfiles(pendingWithBrain);
    }
  };

  useEffect(refresh, []);

  const handleApproveAndSend = async (userId) => {
    setCompleting(c => ({ ...c, [userId]: true }));
    const expertNote = notes[userId] || 'Strategic recommendations approved by senior strategist.';
    
    profileService.setExpertReviewStatus(userId, 'completed', expertNote);
    
    // Add notification to customer dashboard
    profileService.addNotification(userId, {
      type: 'expert_review_complete',
      message: 'Your Expert Strategy Review is complete! ADDI has updated your project roadmap.',
      expertNotes: expertNote,
      approvedAt: new Date().toISOString()
    });

    await new Promise(r => setTimeout(r, 400));
    setCompleting(c => ({ ...c, [userId]: false }));
    setDone(d => ({ ...d, [userId]: true }));
    setTimeout(refresh, 1000);
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Expert Strategy Review Queue</h2>
          <p className="admin-section-sub">Validate AI business analysis, refine recommendations, and approve customer strategies.</p>
        </div>
        <span className="admin-count-chip">{profiles.length} Pending Review</span>
      </div>

      {profiles.length === 0 ? (
        <div className="admin-empty-state margin-top-24">
          <CheckCircle size={40} style={{ color: '#10B981' }} />
          <h3>Review Queue Clear</h3>
          <p className="admin-empty-sub">All incoming business submissions have been reviewed and approved by strategists.</p>
        </div>
      ) : profiles.map(p => {
        const brain = p.businessBrain || {};
        const isDone = done[p.userId];
        return (
          <div key={p.userId} className={`admin-review-card margin-top-16 ${isDone ? 'admin-review-done' : ''}`}>
            
            {/* Header: Business & Status */}
            <div className="arc-header">
              <div>
                <div className="arc-business-name">{brain.businessName || p.name || 'Unknown Business'}</div>
                <div className="arc-meta">
                  Industry: <strong>{brain.industry || 'General'}</strong> · Submitted: {p.expertReviewSubmittedAt ? new Date(p.expertReviewSubmittedAt).toLocaleString() : 'Recently'}
                </div>
              </div>
              <span className={`admin-badge ${isDone ? 'admin-badge-green' : 'admin-badge-yellow'}`}>
                {isDone ? '✓ Approved & Sent' : '⏳ Pending Review'}
              </span>
            </div>

            {!isDone && (
              <div className="arc-review-body margin-top-16">
                
                {/* 4-Step Review Stream */}
                <div className="review-stream-grid">
                  
                   {/* Step 1: Business Profile */}
                  <div className="review-box">
                    <span className="review-step-tag">1. Business Profile</span>
                    <div className="review-box-content">
                      <p><strong>Stage:</strong> {brain.businessStage || '—'}</p>
                      <p><strong>Services:</strong> {Array.isArray(brain.services) ? brain.services.join(', ') : brain.services || '—'}</p>
                      <p><strong>Contact:</strong> {p.name || '—'} ({p.phoneNumber || p.email || '—'})</p>
                    </div>
                  </div>

                  {/* Step 2: AI Analysis & Confidence */}
                  <div className="review-box">
                    <span className="review-step-tag">2. AI Analysis</span>
                    <div className="review-box-content">
                      <p><strong>AI Confidence:</strong> <span className="green-text">{brain.aiConfidenceScore ?? '—'}% Score</span></p>
                      <p><strong>Description:</strong> {brain.businessDescription ? `${brain.businessDescription.slice(0, 80)}...` : '—'}</p>
                    </div>
                  </div>

                  {/* Step 3: Customer Goal */}
                  <div className="review-box">
                    <span className="review-step-tag">3. Customer Goal</span>
                    <div className="review-box-content">
                      <p><strong>Primary Goal:</strong> {brain.businessGoal || '—'}</p>
                      <p><strong>Target Audience:</strong> {brain.targetAudience || '—'}</p>
                    </div>
                  </div>

                  {/* Step 4: AI Recommendations */}
                  <div className="review-box">
                    <span className="review-step-tag">4. Recommended Strategy</span>
                    <div className="review-box-content">
                      {(brain.serviceAssessments || brain.recommendations || []).length > 0 ? (
                        (brain.serviceAssessments || brain.recommendations || []).slice(0, 3).map((s, i) => (
                          <p key={i}>🎯 <strong>{s.serviceName || s.title || 'Service'}</strong> <span style={{ fontSize: '11px', color: '#9CA3AF' }}>({s.status || 'recommended'})</span></p>
                        ))
                      ) : (
                        <p style={{ color: '#9CA3AF' }}>No recommendations available yet.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Strategist Notes & Modification Input */}
                <div className="arc-editor-section margin-top-16">
                  <div className="arc-assign-row">
                    <User size={16} />
                    <input
                      className="admin-field-input arc-assign-input"
                      placeholder="Assign Senior Strategist Name (e.g. Rahul Sharma)..."
                      value={assignees[p.userId] || ''}
                      onChange={e => setAssignees(a => ({ ...a, [p.userId]: e.target.value }))}
                    />
                  </div>

                  <div className="margin-top-10">
                    <label className="admin-field-label">Strategist Recommendations &amp; Custom Instructions</label>
                    <textarea
                      className="admin-field-textarea"
                      rows={3}
                      placeholder="Add strategic adjustments or customized roadmap notes for the customer..."
                      value={notes[p.userId] || ''}
                      onChange={e => setNotes(n => ({ ...n, [p.userId]: e.target.value }))}
                    />
                  </div>

                  {/* Actions: Approve & Send to Customer */}
                  <div className="margin-top-14 flex-end-gap">
                    <button
                      type="button"
                      className="admin-primary-btn"
                      disabled={completing[p.userId]}
                      onClick={() => handleApproveAndSend(p.userId)}
                    >
                      <Send size={16} />
                      <span>Approve &amp; Send Strategy to Customer</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default ExpertReviewTab;
