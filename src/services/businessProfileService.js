import { profileService } from './profileService.js';
import { sessionManager } from './sessionManager.js';
import { storage } from '../utils/storage.js';

const BUSINESS_PROFILE_KEY = 'ADDUS_BUSINESS_PROFILE';

/**
 * Centralized Business Profile Service
 * 
 * Single source of truth for business profile operations.
 * All business profile reads/writes go through this service.
 * 
 * Responsibilities:
 * - Get/set/update business profile
 * - Persist to localStorage and profile service
 * - Restore from backend on session restore
 * - Normalize profile data
 * - Track analysis state
 */

export const businessProfileService = {
  /**
   * Get the current business profile from all sources.
   * Priority: sessionStorage > onboarding store > profile service
   */
  getBusinessProfile() {
    try {
      const session = sessionManager.getSession();
      if (!session?.userId) return null;

      const profile = profileService.getProfileById(session.userId);
      if (!profile) return null;

      return profile.businessBrain || profile.businessProfile || null;
    } catch (e) {
      console.warn('[BusinessProfileService] Error getting profile:', e);
      return null;
    }
  },

  /**
   * Save business profile to all persistent stores.
   */
  saveBusinessProfile(userId, profileData) {
    if (!userId) return null;

    try {
      const profile = profileService.getProfileById(userId) || {};
      const updated = {
        ...profile,
        businessBrain: {
          ...profileData,
          lastUpdated: new Date().toISOString()
        }
      };

      const saved = profileService.saveProfile(updated);

      try {
        storage.set(BUSINESS_PROFILE_KEY, saved.businessBrain);
      } catch (e) {}

      return saved.businessBrain;
    } catch (e) {
      console.warn('[BusinessProfileService] Error saving profile:', e);
      return null;
    }
  },

  /**
   * Update business profile with a partial patch.
   * Merges with existing data without overwriting unrelated fields.
   */
  updateBusinessProfile(userId, patch) {
    if (!userId || !patch) return null;

    const current = this.getBusinessProfile() || {};
    const merged = { ...current };

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) {
        merged[key] = null;
        continue;
      }
      if (Array.isArray(value)) {
        const existing = Array.isArray(merged[key]) ? merged[key] : [];
        merged[key] = [...new Set([...existing, ...value])];
      } else if (typeof value === 'object') {
        merged[key] = { ...(merged[key] || {}), ...value };
      } else {
        merged[key] = value;
      }
    }

    merged.lastUpdated = new Date().toISOString();
    return this.saveBusinessProfile(userId, merged);
  },

  /**
   * Confirm the business profile (user reviewed and approved).
   */
  confirmBusinessProfile(userId, profileData = {}) {
    if (!userId) return null;

    const current = this.getBusinessProfile() || {};
    const confirmed = {
      ...current,
      ...profileData,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    return this.saveBusinessProfile(userId, confirmed);
  },

  /**
   * Get business profile by user ID (alias for getBusinessProfile with explicit userId).
   */
  getProfileById(userId) {
    if (!userId) return null;
    const profile = profileService.getProfileById(userId);
    return profile?.businessBrain || profile?.businessProfile || null;
  },

  /**
   * Clear business profile (for logout/reset).
   */
  clearBusinessProfile(userId) {
    if (!userId) return;
    try {
      storage.remove(BUSINESS_PROFILE_KEY);
      const profile = profileService.getProfileById(userId);
      if (profile) {
        profileService.saveProfile({
          ...profile,
          businessBrain: {},
          currentStep: 'welcome',
          lastVisitedScreen: 'welcome'
        });
      }
    } catch (e) {
      console.warn('[BusinessProfileService] Error clearing profile:', e);
    }
  },

  /**
   * Check if business profile has sufficient data for proceeding.
   */
  hasSufficientData(profile = null) {
    const p = profile || this.getBusinessProfile();
    if (!p) return false;

    return !!(
      p.businessName ||
      p.industry ||
      (Array.isArray(p.services) && p.services.length > 0) ||
      p.businessDescription
    );
  },

  /**
   * Get business analysis state.
   */
  getAnalysisState(profile = null) {
    const p = profile || this.getBusinessProfile();
    if (!p) return 'NOT_STARTED';

    if (p.isConfirmed) return 'CONFIRMED';
    if (p.analysisStatus === 'analyzing') return 'ANALYZING';
    if (p.analysisStatus === 'failed') return 'FAILED';

    const hasAnyData = p.businessName || p.industry || p.services?.length > 0 || p.businessDescription;
    if (!hasAnyData) return 'NOT_STARTED';

    const hasEnough = p.businessName && p.industry && (p.services?.length > 0 || p.businessDescription);
    if (hasEnough) return 'READY';

    return 'PARTIAL';
  }
};
