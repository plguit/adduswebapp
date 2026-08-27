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
  const getActiveKey = useCallback(() => {
    try {
      const session = storage.get('ACTIVE_AUTH_SESSION', null);
      return getStoreKey(session?.userId || null);
    } catch {
      return BASE_KEY;
    }
  }, []);

  const [storeKey, setStoreKey] = useState(getActiveKey);

  const [state, setState] = useState(() => {
    try {
      const key = getActiveKey();
      return storage.get(key, INITIAL_ONBOARDING_STATE);
    } catch {
      return INITIAL_ONBOARDING_STATE;
    }
  });

  // Cross-component state synchronization via custom event
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && typeof e.detail === 'object') {
        setState((prev) => {
          // Only update if state actually changed to avoid re-render loops
          if (JSON.stringify(prev) === JSON.stringify(e.detail)) {
            return prev;
          }
          return e.detail;
        });
      }
    };
    window.addEventListener('addus_onboarding_state_updated', handleSync);
    return () => window.removeEventListener('addus_onboarding_state_updated', handleSync);
  }, []);

  const updateState = useCallback((patch) => {
    setState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      const currentKey = next.userId ? getStoreKey(next.userId) : getActiveKey();
      storage.set(currentKey, next);
      window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: next }));
      return next;
    });
  }, [getActiveKey]);

  const bindToUser = useCallback((userId, savedState = null) => {
    if (!userId) return null;
    const newKey = getStoreKey(userId);
    setStoreKey(newKey);

    const existing = storage.get(newKey, null);
    const merged = {
      ...INITIAL_ONBOARDING_STATE,
      ...(existing || {}),
      ...(savedState || {}),
      userId
    };

    storage.set(newKey, merged);
    setState(merged);
    window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: merged }));
    return merged;
  }, []);

  const resetState = useCallback(() => {
    const currentKey = getActiveKey();
    storage.remove(currentKey);
    storage.remove(BASE_KEY);
    setState(INITIAL_ONBOARDING_STATE);
    setStoreKey(BASE_KEY);
    window.dispatchEvent(new CustomEvent('addus_onboarding_state_updated', { detail: INITIAL_ONBOARDING_STATE }));
  }, [getActiveKey]);

  return {
    state,
    updateState,
    bindToUser,
    resetState,
    INITIAL_ONBOARDING_STATE,
  };
}
