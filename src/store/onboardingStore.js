import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage.js';

const BASE_KEY = 'ONBOARDING_STATE';

function getStoreKey(userId) {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

const INITIAL_ONBOARDING_STATE = {
  currentStep: 'splash',
  userId: null,
  phone: '',
  email: '',
  otp: '',
  verified: false,
  name: '',
  businessProfile: {
    businessName: '',
    industry: '',
    businessStage: '',
    businessDescription: '',
    products: [],
    services: [],
    targetAudience: '',
    geographicMarket: '',
    idealCustomer: '',
    customerAge: '',
    customerType: '',
    pricingPosition: '',
    businessGoal: '',
    currentChallenge: '',
    competitiveAdvantage: '',
    timeline: '',
    budget: '',
    brandAssets: {
      website: '',
      socialLinks: [],
      photography: null,
      videos: null,
      logo: null,
      packaging: null
    },
    missingAssets: [],
    aiConfidenceScore: null,
    conversationStatus: 'discovering',
    roadmap: null,
    isConfirmed: false,
    segment: ''
  },
  intentBranch: null,
  strategicAnswers: {
    goal: '',
    category: '',
    audience: '',
    discoveryChannel: ''
  },
  aiRecommendations: [],
  selectedServices: [],
  preferredShootDate: null,
  preferredDeliveryDate: null,
  scheduleRequests: {},
  expertReviewStatus: null,
  expertReviewSubmittedAt: null,
  chatHistory: [],
  lastCreatedProject: null,
  selectedProductId: null,
};

/**
 * Global Onboarding State Store Hook — Phase 3
 * Persists state under a user-specific key so each account has isolated state.
 */
export function useOnboardingStore() {
  const [storeKey, setStoreKey] = useState(() => {
    try {
      const session = storage.get('ACTIVE_AUTH_SESSION', null);
      return getStoreKey(session?.userId || null);
    } catch {
      return BASE_KEY;
    }
  });

  const [state, setState] = useState(() => {
    try {
      const session = storage.get('ACTIVE_AUTH_SESSION', null);
      const key = getStoreKey(session?.userId || null);
      return storage.get(key, INITIAL_ONBOARDING_STATE);
    } catch {
      return INITIAL_ONBOARDING_STATE;
    }
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) {
        setState(e.detail);
      }
    };
    window.addEventListener('addus_onboarding_state_updated', handleSync);
    return () => window.removeEventListener('addus_onboarding_state_updated', handleSync);
  }, []);

  useEffect(() => {
    storage.set(storeKey, state);
  }, [state, storeKey]);

  const updateState = useCallback((patch) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      storage.set(storeKey, next);
      window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: next }));
      return next;
    });
  }, [storeKey]);

  const bindToUser = useCallback((userId, savedState = null) => {
    const key = getStoreKey(userId);
    setStoreKey(key);
    const loaded = savedState || storage.get(key, { ...INITIAL_ONBOARDING_STATE, userId });
    const merged = { ...INITIAL_ONBOARDING_STATE, ...loaded, userId };
    setState(merged);
    storage.set(key, merged);
    window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: merged }));
    return merged;
  }, []);

  const resetState = useCallback(() => {
    storage.remove(storeKey);
    storage.remove(BASE_KEY);
    setState(INITIAL_ONBOARDING_STATE);
    setStoreKey(BASE_KEY);
    window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: INITIAL_ONBOARDING_STATE }));
  }, [storeKey]);

  return {
    state,
    updateState,
    bindToUser,
    resetState,
    INITIAL_ONBOARDING_STATE,
  };
}
