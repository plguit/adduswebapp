import React from 'react';
import { Sparkles, Check, Edit2, ArrowRight } from 'lucide-react';

export function BusinessAnalysis({ analysisData, onContinue, onEdit }) {
  const recommendedServices = [
    '🌐 Website',
    '📸 Commercial Photography',
    '🎨 Brand Identity',
    '🎬 Product Video',
    '📦 Packaging Design'
  ];

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="addi-avatar-badge" style={{ width: 48, height: 48, marginBottom: 12 }}>
          <Sparkles className="sparkle-icon" size={18} />
        </div>
        <h2 className="step-title">Here's what I understood about your business.</h2>
        <p className="step-subtitle">Review your business profile before we continue.</p>
      </div>

      <div className="analysis-result-card">
        <div className="result-row">
          <span className="result-label">Business Name:</span>
          <span className="result-val">{analysisData.businessName || 'Your Company'}</span>
        </div>

        <div className="result-row">
          <span className="result-label">Industry:</span>
          <span className="result-val">{analysisData.industry || 'Hospitality & Services'}</span>
        </div>

        <div className="result-row">
          <span className="result-label">Key Services:</span>
          <span className="result-val">{analysisData.services || 'Luxury Services'}</span>
        </div>
      </div>

      <div className="recommended-services-wrap">
        <h4 className="rec-title">Recommended for your business</h4>
        <div className="chips-grid">
          {recommendedServices.map((service, idx) => (
            <span key={idx} className="service-chip">
              <Check size={12} /> {service}
            </span>
          ))}
        </div>
      </div>

      <div className="action-buttons-row">
        <button type="button" className="secondary-btn" onClick={onEdit}>
          <Edit2 size={16} />
          <span>Edit</span>
        </button>

        <button type="button" className="primary-btn" onClick={onContinue}>
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
