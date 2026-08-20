import { storage } from '../utils/storage.js';
import { profileService } from './profileService.js';

const SESSION_STORAGE_KEY = 'ACTIVE_AUTH_SESSION';

export const sessionManager = {
  getSession() {
    return storage.get(SESSION_STORAGE_KEY, null);
  },

  isAuthenticated() {
    const session = this.getSession();
    return !!(session && session.userId && session.token);
  },

  getCurrentUser() {
    const session = this.getSession();
    if (!session || !session.userId) return null;
    return profileService.getProfileById(session.userId);
  },

  setSession(userId, lastVisitedScreen = 'welcome') {
    const token = `sess_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sessionData = {
      token,
      userId,
      lastVisitedScreen,
      loginTime: new Date().toISOString()
    };
    storage.set(SESSION_STORAGE_KEY, sessionData);
    return sessionData;
  },

  createSession(payload = {}) {
    const finalUserId = payload.userId || `user_${Date.now()}`;
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

    if (profileService && typeof profileService.saveProfile === 'function') {
      profileService.saveProfile({
        userId: finalUserId,
        phone: payload.phone || null,
        email: payload.email || null,
        verified: true,
        updatedAt: new Date().toISOString()
      });
    }

    return sessionData;
  },

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

  logout() {
    storage.remove(SESSION_STORAGE_KEY);
  }
};
