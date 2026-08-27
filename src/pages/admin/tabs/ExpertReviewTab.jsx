import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Clock, User } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import { NotificationEngine } from '../../../services/brain/UniversalNotificationEngine.js';
export function ExpertReviewTab() {
  const [profiles, setProfiles] = useState([]);
  const [assignees, setAssignees] = useState({});
  const [notes, setNotes] = useState({});
  const [completing, setCompleting] = useState({});
  const [done, setDone] = useState({});

  const refresh = () => {
    apiService.fetchAdminExpertReviews().then(setProfiles);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleReviewAction = async (userId, actionStatus) => {
    const isReject = actionStatus === 'rejected';
    let rejectionNotes = notes[userId] || '';

    if (isReject && !rejectionNotes.trim()) {
      const promptNotes = prompt('Please enter the reason for rejecting this user profile / onboarding:');
      if (promptNotes === null) return; // cancelled
      rejectionNotes = promptNotes.trim() || 'Submission does not meet our minimum onboarding requirements.';
    }

    setCompleting(c => ({ ...c, [userId]: true }));
    try {
      await apiService.request('/api/admin/expert-review/' + userId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionStatus, notes: rejectionNotes })
      });
      try {
        NotificationEngine.notify({
          userId,
          role: 'Admin',
          type: isReject ? 'profile_rejected' : 'expert_review_complete',
          title: isReject ? '⚠️ Onboarding Not Approved' : '🎉 Profile Approved by Creative Directors',
          message: isReject
            ? (rejectionNotes || 'Your onboarding was not approved. Please contact support.')
            : 'Your business profile has been approved! ADDI has updated your workspace recommendations.',
          priority: 'high'
        });
      } catch (notifErr) {
        console.warn('[ExpertReviewTab] Notification failed:', notifErr);
      }
      await new Promise(r => setTimeout(r, 400));
      setCompleting(c => ({ ...c, [userId]: false }));
      setDone(d => ({ ...d, [userId]: actionStatus }));
      setTimeout(refresh, 800);
    } catch (err) {
      console.error('[ExpertReviewTab] Action failed:', err);
      alert('Failed to update review: ' + (err.message || 'Unknown error'));
      setCompleting(c => ({ ...c, [userId]: false }));
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <Star size={18} style={{ color: '#f59e0b' }} />
        <h2>Expert Review Queue ({profiles.length} pending)</h2>
      </div>

      {profiles.length === 0 ? (
        <div className="admin-empty-state">
          <CheckCircle size={32} style={{ color: '#34d399' }} />
          <p>All expert reviews are up to date.</p>
        </div>
      ) : profiles.map(p => {
        const brain = p.businessBrain || {};
        const isDone = done[p.userId];
        const currentStatus = isDone || p.expertReviewStatus || 'pending';
        return (
          <div key={p.userId} className={`admin-review-card ${isDone ? 'admin-review-done' : ''}`}>
            <div className="arc-header">
              <div>
                <div className="arc-business-name">{brain.businessName || p.name || 'Unknown Business'}</div>
                <div className="arc-meta">{brain.industry || '—'} · Submitted {p.expertReviewSubmittedAt ? new Date(p.expertReviewSubmittedAt).toLocaleString() : 'recently'}</div>
              </div>
              <span className={`admin-badge ${currentStatus === 'completed' || currentStatus === 'approved' ? 'admin-badge-green' : (currentStatus === 'rejected' ? 'admin-badge-red' : 'admin-badge-yellow')}`} style={{ background: currentStatus === 'rejected' ? 'rgba(239,68,68,0.2)' : undefined, color: currentStatus === 'rejected' ? '#EF4444' : undefined, border: currentStatus === 'rejected' ? '1px solid rgba(239,68,68,0.4)' : undefined }}>
                {currentStatus === 'completed' || currentStatus === 'approved' ? '✓ Approved' : (currentStatus === 'rejected' ? '✕ Rejected / Restricted' : '⏳ Pending Approval')}
              </span>
            </div>

            {!isDone && (
              <>
                {/* AI Summary snapshot */}
                <div className="arc-brain-snapshot">
                  {[
                    ['Target Audience', brain.targetAudience],
                    ['Services', Array.isArray(brain.services) ? brain.services.join(', ') : brain.services],
                    ['Business Goal', brain.businessGoal],
                    ['Brand Personality', brain.brandPersonality],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} className="arc-brain-row">
                      <span className="arc-brain-label">{label}</span>
                      <span className="arc-brain-val">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Assign reviewer */}
                <div className="arc-assign-row">
                  <User size={14} />
                  <input
                    className="admin-field-input arc-assign-input"
                    placeholder="Assign reviewer name..."
                    value={assignees[p.userId] || ''}
                    onChange={e => setAssignees(a => ({ ...a, [p.userId]: e.target.value }))}
                  />
                </div>

                {/* Expert notes */}
                <textarea
                  className="admin-field-textarea"
                  rows={3}
                  placeholder="Add approval notes or rejection reason..."
                  value={notes[p.userId] || ''}
                  onChange={e => setNotes(n => ({ ...n, [p.userId]: e.target.value }))}
                  style={{ marginTop: 10 }}
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    className="admin-primary-btn"
                    style={{ background: '#10B981', flex: 1, minWidth: '160px' }}
                    disabled={completing[p.userId]}
                    onClick={() => handleReviewAction(p.userId, 'completed')}
                  >
                    {completing[p.userId] ? 'Updating...' : '✓ Approve & Activate User'}
                  </button>
                  <button
                    className="admin-secondary-btn"
                    style={{ borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.1)', flex: 1, minWidth: '160px' }}
                    disabled={completing[p.userId]}
                    onClick={() => handleReviewAction(p.userId, 'rejected')}
                  >
                    {completing[p.userId] ? 'Updating...' : '✕ Reject & Restrict User'}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
