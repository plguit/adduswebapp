import React from 'react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { ProgressBar } from '../../components/common/ProgressBar.jsx';

export function OnboardingPage() {
  const { state, updateState } = useOnboardingStore();

  return (
    <div className="onboarding-viewport">
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>

      <main className="onboarding-main-container">
        <ProgressBar currentStep={state.currentStep} />
        {/* Onboarding step modules mounted dynamically */}
      </main>
    </div>
  );
}
