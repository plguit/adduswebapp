import { useState, useCallback, useEffect } from 'react';
import { sessionStorageService } from '../services/sessionStorage.js';

const INITIAL_ONBOARDING_STATE = {
  currentStep: 'splash',
  phone: '',
  otp: '',
  verified: false,
  name: '',
  business: {
    inputMethod: null,
    url: '',
    rawText: '',
    file: null,
    extractedData: {
      businessName: '',
      industry: '',
      services: '',
      description: '',
      targetCustomers: ''
    }
  },
  businessAnalysis: {},
  expectation: null,
  goal: null,
  recommendedServices: [],
  project: {
    category: '',
    subType: '',
    location: '',
    environment: '',
    budget: '',
    referenceFile: null,
    notes: ''
  },
  booking: {
    shootDate: null,
    estimatedDelivery: ''
  }
};

const STEP_SEQUENCE = [
  'splash',
  'welcome',
  'phone',
  'otp',
  'name',
  'business_input',
  'business_analysis',
  'expectation',
  'goal',
  'business_summary',
  'project_shortcut',
  'inspiration_gallery',
  'booking',
  'project_details',
  'final_review'
];

export function useOnboarding() {
  const [onboarding, setOnboarding] = useState(() => {
    const saved = sessionStorageService.loadSession();
    if (saved && saved.currentStep && saved.currentStep !== 'splash') {
      return saved;
    }
    return INITIAL_ONBOARDING_STATE;
  });

  // Auto-persist session state on change
  useEffect(() => {
    sessionStorageService.saveSession(onboarding);
  }, [onboarding]);

  const updateOnboarding = useCallback((patch) => {
    setOnboarding((prev) => {
      let newState;
      if (typeof patch === 'function') {
        newState = patch(prev);
      } else {
        newState = {
          ...prev,
          ...patch,
          business: patch.business ? { ...prev.business, ...patch.business } : prev.business,
          project: patch.project ? { ...prev.project, ...patch.project } : prev.project,
          booking: patch.booking ? { ...prev.booking, ...patch.booking } : prev.booking
        };
      }
      sessionStorageService.saveSession(newState);
      return newState;
    });
  }, []);

  const goToStep = useCallback((stepName) => {
    setOnboarding((prev) => {
      const newState = { ...prev, currentStep: stepName };
      sessionStorageService.saveSession(newState);
      return newState;
    });
  }, []);

  const nextStep = useCallback(() => {
    setOnboarding((prev) => {
      const currentIndex = STEP_SEQUENCE.indexOf(prev.currentStep);
      if (currentIndex >= 0 && currentIndex < STEP_SEQUENCE.length - 1) {
        const newState = { ...prev, currentStep: STEP_SEQUENCE[currentIndex + 1] };
        sessionStorageService.saveSession(newState);
        return newState;
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setOnboarding((prev) => {
      const currentIndex = STEP_SEQUENCE.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        const newState = { ...prev, currentStep: STEP_SEQUENCE[currentIndex - 1] };
        sessionStorageService.saveSession(newState);
        return newState;
      }
      return prev;
    });
  }, []);

  const resetSession = useCallback(() => {
    sessionStorageService.clearSession();
    setOnboarding(INITIAL_ONBOARDING_STATE);
  }, []);

  return {
    onboarding,
    updateOnboarding,
    goToStep,
    nextStep,
    prevStep,
    resetSession
  };
}
