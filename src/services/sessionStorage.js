/**
 * Onboarding Session Persistence Service
 * Manages saving, restoring, and resetting user onboarding progress in localStorage.
 */

const STORAGE_KEY = 'ADDUS_ONBOARDING_SESSION';

export const sessionStorageService = {
  /**
   * Saves onboarding state to storage.
   * @param {Object} onboardingState 
   */
  saveSession(onboardingState) {
    try {
      if (!onboardingState) return;
      const serializableState = {
        ...onboardingState,
        // Exclude Non-serializable DOM files if any
        business: {
          ...onboardingState.business,
          file: null
        },
        project: {
          ...onboardingState.project,
          referenceFile: null
        },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
    } catch (e) {
      console.warn('[SessionStorage Warning] Failed to save session:', e);
    }
  },

  /**
   * Restores onboarding state from storage.
   * @returns {Object|null}
   */
  loadSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.warn('[SessionStorage Warning] Failed to load session:', e);
      return null;
    }
  },

  /**
   * Clears saved onboarding session.
   */
  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[SessionStorage Warning] Failed to clear session:', e);
    }
  }
};
