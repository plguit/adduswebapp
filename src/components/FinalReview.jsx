import React, { useState } from 'react';
import { CheckCircle2, Rocket, Calendar, MapPin, DollarSign, Clock, Sparkles } from 'lucide-react';

export function FinalReview({ onboarding, onSubmitFinal }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    if (typeof onSubmitFinal === 'function') {
      onSubmitFinal();
    }
  };

  if (submitted) {
    return (
      <div className="onboarding-card-wrapper fade-in">
        <div className="addi-avatar-badge" style={{ width: 64, height: 64, marginBottom: 20 }}>
          <CheckCircle2 size={32} className="success-icon" />
        </div>
        <h2 className="step-title">Project Submitted! 🎉</h2>
        <p className="step-subtitle">
          ADDI and the ADDUS team are reviewing your project parameters.<br />
          Your project plan is being prepared.
        </p>

        <div className="summary-pill-card margin-top-20" style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
          <Sparkles size={18} style={{ color: '#34D399' }} />
          <span>Your business profile has been saved. Your workspace is ready.</span>
        </div>
      </div>
    );
  }

  const { name, phone, business, project, booking } = onboarding;
  const projectTitle = project.subType ? `${project.subType} (${project.category})` : (project.category || 'Creative Production');

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <Rocket size={22} className="accent-icon" />
        </div>
        <h2 className="step-title">Review Your Project</h2>
        <p className="step-subtitle">Review your project details before submitting.</p>
      </div>

      <div className="review-summary-card">
        <div className="review-row">
          <span className="review-label">Client</span>
          <span className="review-val">{name || 'Client'} (+91 {phone})</span>
        </div>

        <div className="review-row">
          <span className="review-label">Project</span>
          <span className="review-val highlight-val">{projectTitle}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><Calendar size={14} /> Shoot Date:</span>
          <span className="review-val">{booking.shootDate || 'Selected Date'}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><MapPin size={14} /> Location:</span>
          <span className="review-val">{project.location || 'On-site Location'}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><DollarSign size={14} /> Budget:</span>
          <span className="review-val">{project.budget || '$2,500 - $5,000'}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><Clock size={14} /> Est. Delivery:</span>
          <span className="review-val success-val">{booking.estimatedDelivery || '5 days post-shoot'}</span>
        </div>
      </div>

      <button type="button" className="primary-btn pulse-glow margin-top-20" onClick={handleSubmit}>
        <span>Confirm Project</span>
        <Rocket size={18} />
      </button>
    </div>
  );
}
