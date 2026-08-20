import React from 'react';
import { Layers, Lightbulb, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function BusinessSummary({ businessData, onContinue }) {
  return (
    <div className="onboarding-card-wrapper fade-in" style={{ maxWidth: 480 }}>
      <div className="step-header">
        <div className="icon-badge">
          <Layers size={22} className="accent-icon" />
        </div>
        <h2 className="step-title">Here's what I understood about your business.</h2>
        <p className="step-subtitle">Review your business profile before we continue.</p>
      </div>

      <div className="snapshot-cards-list">
        <div className="snapshot-item">
          <span className="snapshot-label">Industry</span>
          <span className="snapshot-val">{businessData.industry || 'Hospitality & Luxury'}</span>
        </div>

        <div className="snapshot-item">
          <span className="snapshot-label">Stage</span>
          <span className="snapshot-val">{businessData.businessStage || 'Pre-Launch / Growth'}</span>
        </div>

        <div className="snapshot-block">
          <h4 className="block-title"><Lightbulb size={16} /> What ADDI recommends</h4>
          <ul className="bullet-list">
            <li>A professional website that builds trust and converts visitors</li>
            <li>High-quality photography that showcases your brand professionally</li>
            <li>A cohesive visual identity that positions you in the market</li>
          </ul>
        </div>

        <div className="snapshot-block">
          <h4 className="block-title"><TrendingUp size={16} /> Based on your business context</h4>
          <p className="snapshot-text">Target customers in your sector prioritize visual credibility, premium video hooks, and instant booking friction-reduction.</p>
        </div>
      </div>

      <div className="expert-notice-banner">
        <Clock size={16} className="notice-icon" />
        <span>Our team is reviewing your business profile. Additional recommendations will follow.</span>
      </div>

      <button type="button" className="primary-btn pulse-glow" onClick={onContinue}>
        <span>Continue</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
