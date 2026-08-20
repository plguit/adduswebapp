import React from 'react';
import { CheckCircle, Clock, Star, ChevronRight } from 'lucide-react';

export function ExpertReviewCard({ status, submittedAt, completedAt, expertNotes }) {
  const isPending = status === 'pending';
  const isCompleted = status === 'completed';

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!isPending && !isCompleted) return null;

  return (
    <div className={`expert-review-card ${isCompleted ? 'erc-completed' : 'erc-pending'}`}>
      <div className="erc-header">
        <div className="erc-icon">
          {isCompleted ? <Star size={16} style={{ color: '#f59e0b' }} /> : <Clock size={16} />}
        </div>
        <div className="erc-title-block">
          <div className="erc-title">
            {isCompleted ? 'Expert Review Completed' : 'Expert Review In Progress'}
          </div>
          <div className="erc-subtitle">
            {isCompleted
              ? `Completed ${formatTime(completedAt)}`
              : `Submitted ${formatTime(submittedAt)} · ~3 hours`}
          </div>
        </div>
        <div className={`erc-status-dot ${isPending ? 'erc-dot-pending' : 'erc-dot-done'}`} />
      </div>

      {isCompleted && expertNotes && (
        <div className="erc-notes">
          <div className="erc-notes-label">Expert Recommendations</div>
          <div className="erc-notes-text">{expertNotes}</div>
        </div>
      )}

      {isPending && (
        <div className="erc-pending-info">
          <div className="erc-step erc-step-done"><CheckCircle size={13} /> AI Profile submitted</div>
          <div className="erc-step erc-step-active"><Clock size={13} /> Branding expert reviewing</div>
          <div className="erc-step erc-step-pending"><ChevronRight size={13} /> Recommendations ready</div>
        </div>
      )}
    </div>
  );
}
