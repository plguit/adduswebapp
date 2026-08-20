import { profileService } from './profileService.js';
import { sessionManager } from './sessionManager.js';
import { storage } from '../utils/storage.js';
import { apiService } from './apiService.js';

/**
 * Unified Authentication Service Layer
 * Supports Phone OTP, Email OTP, Account Lookup ("Welcome Back"), and Future OAuth Stubs.
 */
export const authService = {
  /**
   * Complete Mobile Phone Verification Login
   * Checks for existing account or creates a new user profile.
   * @param {string} phoneNumber 
   * @returns {Object} { isReturningUser: boolean, profile: Object }
   */
  async loginWithPhone(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const existing = profileService.findProfileByPhone(cleanPhone);

    const preferredUserId = existing?.customerId || existing?.userId || null;

    let backendRes = null;
    try {
      backendRes = await this.backendLogin(cleanPhone, 'phone', preferredUserId);
    } catch (e) {
      console.warn('[authService] Backend API connection notice:', e.message);
    }

    const fallbackUserId = preferredUserId || `customer_${cleanPhone}`;
    const backendUserId = backendRes?.userId || null;
    const isNewUser = backendRes?.isNewUser || false;
    const canonicalUserId = backendUserId || fallbackUserId;

    if (existing) {
      existing.phoneVerified = true;
      existing.updatedAt = new Date().toISOString();
      const updated = profileService.saveProfile({
        ...existing,
        userId: canonicalUserId,
        customerId: canonicalUserId
      });
      if (backendRes?.token) {
        sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome', backendRes.token);
      } else {
        sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome');
      }

      return {
        isReturningUser: true,
        isNewUser: false,
        message: 'Welcome back! Resuming your account...',
        profile: updated
      };
    }

    const newProfile = profileService.saveProfile({
      phoneNumber: cleanPhone,
      phoneVerified: true,
      authProvider: 'phone',
      currentStep: 'name',
      lastVisitedScreen: 'name',
      onboardingStatus: 'in_progress',
      userId: canonicalUserId,
      customerId: canonicalUserId
    });

    if (backendRes?.token) {
      sessionManager.setSession(newProfile.userId, 'name', backendRes.token);
    } else {
      sessionManager.setSession(newProfile.userId, 'name');
    }

    return {
      isReturningUser: false,
      isNewUser,
      message: isNewUser 
        ? 'Account created successfully! Let\'s set up your profile.' 
        : 'Welcome back! Resuming your account...',
      profile: newProfile
    };
  },

  /**
   * Complete Email Verification Login
   * Checks for existing account or creates a new user profile.
   * @param {string} email 
   * @returns {Object} { isReturningUser: boolean, profile: Object }
   */
  async loginWithEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = profileService.findProfileByEmail(cleanEmail);

    const preferredUserId = existing?.customerId || existing?.userId || null;

    let backendRes = null;
    try {
      backendRes = await this.backendLogin(cleanEmail, 'email', preferredUserId);
    } catch (e) {
      console.warn('[authService] Backend API connection notice:', e.message);
    }

    const backendUserId = backendRes?.userId || null;
    const isNewUser = backendRes?.isNewUser || false;

    const fallbackEmailUserId = preferredUserId || `customer_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const canonicalUserId = backendUserId || fallbackEmailUserId;

    if (existing) {
      existing.emailVerified = true;
      existing.updatedAt = new Date().toISOString();
      const updated = profileService.saveProfile({
        ...existing,
        userId: canonicalUserId,
        customerId: canonicalUserId
      });
      if (backendRes?.token) {
        sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome', backendRes.token);
      } else {
        sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome');
      }

      return {
        isReturningUser: true,
        isNewUser: false,
        message: 'Welcome back! Resuming your account...',
        profile: updated
      };
    }

    const newProfile = profileService.saveProfile({
      email: cleanEmail,
      emailVerified: true,
      authProvider: 'email',
      currentStep: 'name',
      lastVisitedScreen: 'name',
      onboardingStatus: 'in_progress',
      userId: canonicalUserId,
      customerId: canonicalUserId
    });

    if (backendRes?.token) {
      sessionManager.setSession(newProfile.userId, 'name', backendRes.token);
    } else {
      sessionManager.setSession(newProfile.userId, 'name');
    }

    return {
      isReturningUser: false,
      isNewUser,
      message: isNewUser 
        ? 'Account created successfully! Let\'s set up your profile.' 
        : 'Welcome back! Resuming your account...',
      profile: newProfile
    };
  },

  /**
   * Authenticate with backend API using phone/email and receive a JWT token.
   * @param {string} identifier - phone or email
   * @param {string} method - 'phone' | 'email'
   * @returns {Promise<Object>}
   */
  async backendLogin(identifier, method = 'phone', preferredUserId = null) {
    const endpoint = '/auth/login/customer';
    const body = method === 'email'
      ? { email: identifier, preferredUserId }
      : { phone: identifier, preferredUserId };

    const result = await apiService.post(endpoint, body);
    if (result.success && result.token) {
      sessionManager.setSession(result.userId, 'welcome', result.token);
    }
    return result;
  },

  /**
   * Refresh backend token using current session token.
   * @returns {Promise<Object>}
   */
  async refreshToken() {
    const session = sessionManager.getSession();
    if (!session?.token) {
      throw new Error('No session token available');
    }

    const result = await apiService.post('/auth/refresh', {});
    if (result.success && result.token) {
      sessionManager.getSession().token = result.token;
    }
    return result;
  },

  /**
   * Logout active session while preserving user account DB.
   */
  logout() {
    sessionManager.logout();
  }
};
