import React from 'react';

export function ProgressBar({ currentStep }) {
  const stepMap = {
    splash: { pct: 0, label: 'Initializing' },
    welcome: { pct: 8, label: 'Welcome' },
    phone: { pct: 16, label: 'Mobile Verification' },
    otp: { pct: 24, label: 'OTP Verification' },
    name: { pct: 32, label: 'Client Identity' },
    business_input: { pct: 40, label: 'Business Profile' },
    business_analysis: { pct: 48, label: 'AI Strategy Audit' },
    expectation: { pct: 56, label: 'Expectations & Goals' },
    business_summary: { pct: 64, label: 'Business Snapshot' },
    project_shortcut: { pct: 72, label: 'Deliverables' },
    inspiration_gallery: { pct: 80, label: 'Inspiration Gallery' },
    booking: { pct: 88, label: 'Execution Calendar' },
    project_details: { pct: 94, label: 'Project Logistics' },
    final_review: { pct: 100, label: 'Final Submission' }
  };

  const stepInfo = stepMap[currentStep] || { pct: 0, label: 'Onboarding' };

  if (currentStep === 'splash') return null;

  return (
    <div className="top-progress-container fade-in">
      <div className="progress-info-row flex-between">
        <span className="progress-stage-label">Step: {stepInfo.label}</span>
        <span className="progress-pct">{stepInfo.pct}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${stepInfo.pct}%` }}
        ></div>
      </div>
    </div>
  );
}
