import React, { useState } from 'react';
import { Rocket, Calendar, MapPin, DollarSign, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { useProjectStore } from '../../store/projectStore.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { Button } from '../common/Button.jsx';

/**
 * Step 10: Final Review & Project Submission Component
 * Displays comprehensive project parameters and submits project draft to Dashboard.
 */
export function FinalReviewStep() {
  const { state, updateState } = useOnboardingStore();
  const { createDraftProject } = useProjectStore();
  const { navigateTo } = useNavigation();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { name, phone, project, booking } = state;

  const projectCategory = project?.category || 'Video Advertisement';
  const projectType = project?.subType || 'Brand Film';
  const location = project?.location || 'Client On-site Location';
  const budget = project?.budget || '$2,500 - $5,000';
  const shootDate = booking?.shootDate || 'Selected Shoot Date';
  const estimatedDelivery = booking?.estimatedDelivery || '5 days post-shoot';

  const handleSubmit = () => {
    // Create Project Draft in global store
    createDraftProject({
      service: projectCategory,
      type: projectType,
      location,
      budget,
      shootDate,
      estimatedDelivery,
      notes: project?.notes || ''
    });

    updateState({ verified: true });
    setIsSubmitted(true);

    setTimeout(() => {
      updateState({ currentStep: 'dashboard' });
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="onboarding-card-wrapper fade-in">
        <div className="addi-avatar-badge" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
          <CheckCircle2 size={32} className="success-icon" />
        </div>
        <h2 className="step-title">Project Submitted! 🎉</h2>
        <p className="step-subtitle">
          ADDI and the ADDUS team are reviewing your project.<br />
          Taking you to your dashboard...
        </p>

        <div className="summary-pill-card margin-top-20 flex-center" style={{ background: 'rgba(52, 211, 153, 0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
          <Sparkles size={16} style={{ color: '#34D399' }} />
          <span>Your business profile has been saved. Your workspace is ready.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <Rocket size={24} className="accent-icon" />
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
          <span className="review-label">Project:</span>
          <span className="review-val highlight-val">{projectCategory} ({projectType})</span>
        </div>

        <div className="review-row">
          <span className="review-label"><MapPin size={14} /> Location:</span>
          <span className="review-val">{location}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><DollarSign size={14} /> Budget:</span>
          <span className="review-val">{budget}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><Calendar size={14} /> Shoot Date:</span>
          <span className="review-val">{shootDate}</span>
        </div>

        <div className="review-row">
          <span className="review-label"><Clock size={14} /> Est. Delivery:</span>
          <span className="review-val success-val">{estimatedDelivery}</span>
        </div>
      </div>

      <div className="margin-top-20">
        <Button onClick={handleSubmit} icon={Rocket}>
          Confirm Project
        </Button>
      </div>
    </div>
  );
}
