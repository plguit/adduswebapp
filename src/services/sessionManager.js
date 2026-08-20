import { storage } from '../utils/storage.js';
import { profileService } from './profileService.js';

const SESSION_STORAGE_KEY = 'ACTIVE_AUTH_SESSION';

/**
 * Session Manager Service
 * Manages active user session tokens, auto-restore on startup, and device persistence.
 */
export const sessionManager = {
  /**
   * Retrieves active session payload.
   * @returns {{ token: string, userId: string, lastVisitedScreen: string }|null}
   */
  getSession() {
    return storage.get(SESSION_STORAGE_KEY, null);
  },

  /**
   * Checks if user has a valid active authenticated session.
   * @returns {boolean}
   */
  isAuthenticated() {
    const session = this.getSession();
    return !!(session && session.userId && session.token);
  },

  /**
   * Gets current logged-in user profile.
   * @returns {Object|null}
   */
  getCurrentUser() {
    const session = this.getSession();
    if (!session || !session.userId) return null;
    return profileService.getProfileById(session.userId);
  },

  /**
   * Sets active user session.
   * @param {string} userId 
   * @param {string} lastVisitedScreen 
   */
  setSession(userId, lastVisitedScreen = 'welcome', token = null) {
    const sessionToken = token || `sess_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sessionData = {
      token: sessionToken,
      userId,
      lastVisitedScreen,
      loginTime: new Date().toISOString()
    };
    storage.set(SESSION_STORAGE_KEY, sessionData);
    return sessionData;
  },

  /**
   * Creates or updates a full user auth session payload.
   * @param {Object} payload 
   */
  createSession(payload = {}) {
    let finalUserId = payload.userId;

    if (profileService && typeof profileService.saveProfile === 'function') {
      const savedProfile = profileService.saveProfile({
        ...payload,
        verified: payload.verified !== undefined ? payload.verified : true,
        updatedAt: new Date().toISOString()
      });
      finalUserId = savedProfile.userId;
    }

    const token = payload.token || `sess_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sessionData = {
      token,
      userId: finalUserId,
      phone: payload.phone || null,
      email: payload.email || null,
      verified: payload.verified !== undefined ? payload.verified : true,
      lastVisitedScreen: payload.lastVisitedScreen || 'welcome',
      loginTime: new Date().toISOString()
    };
    storage.set(SESSION_STORAGE_KEY, sessionData);
    return sessionData;
  },

  /**
   * Updates last visited screen in active session and user profile.
   * @param {string} screenId 
   */
  updateLastVisitedScreen(screenId) {
    const session = this.getSession();
    if (!session) return;

    session.lastVisitedScreen = screenId;
    storage.set(SESSION_STORAGE_KEY, session);

    if (session.userId) {
      profileService.saveProfile({
        userId: session.userId,
        lastVisitedScreen: screenId,
        currentStep: screenId
      });
    }
  },

  /**
   * Logout user. Clears active local device session while preserving account DB.
   */
  logout() {
    storage.remove(SESSION_STORAGE_KEY);
    console.log('[Session Manager] Active session cleared.');
  }
};
