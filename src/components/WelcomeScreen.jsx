import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function WelcomeScreen({ onNext }) {
  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="addi-avatar-badge">
        <Sparkles className="sparkle-icon" size={20} />
      </div>

      <div className="welcome-content">
        <h2 className="welcome-heading">
          Hi 👋 <br />
          I'm ADDI.
        </h2>
        <p className="welcome-subtext">
          I'll understand your business and help you build everything needed for a professional presence people trust.
        </p>

        <div className="cta-container">
          <button className="primary-btn pulse-glow" onClick={onNext}>
            <span>Let's Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
