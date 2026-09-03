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
    const canonicalUserId = backendUserId || fallbackUserId;

    if (canonicalUserId !== preferredUserId && preferredUserId) {
      const migrated = profileService.migrateProfile(preferredUserId, canonicalUserId);
      if (migrated) {
        console.log(`[authService] Migrated profile from ${preferredUserId} to ${canonicalUserId}`);
      }
    }

    if (backendRes && !backendRes.isNewUser && backendRes.profile) {
      const backendProf = backendRes.profile;
      const hasBiz = Boolean(
        backendProf.businessName ||
        (Array.isArray(backendProf.services) && backendProf.services.length > 0) ||
        backendProf.website
      );

      const targetStatus = (backendProf.onboardingStatus === 'completed' || hasBiz)
        ? 'completed'
        : (backendProf.onboardingStatus || existing?.onboardingStatus || 'in_progress');
      const targetScreen = (backendProf.lastVisitedScreen === 'dashboard' || hasBiz)
        ? 'dashboard'
        : (backendProf.lastVisitedScreen || existing?.lastVisitedScreen || 'welcome');

      const mergedProfile = profileService.saveProfile({
        ...(existing || {}),
        ...backendProf,
        userId: canonicalUserId,
        customerId: backendProf.customerId || existing?.customerId || canonicalUserId,
        businessId: backendProf.businessId || existing?.businessId || null,
        phoneNumber: cleanPhone,
        phone: cleanPhone,
        phoneVerified: true,
        businessName: backendProf.businessName || existing?.businessName,
        industry: backendProf.industry || existing?.industry,
        services: backendProf.services?.length > 0 ? backendProf.services : (existing?.services || []),
        products: backendProf.products?.length > 0 ? backendProf.products : (existing?.products || []),
        businessDescription: backendProf.businessDescription || existing?.businessDescription,
        businessBrain: {
          ...(existing?.businessBrain || {}),
          ...(backendProf.businessBrain || {}),
          businessName: backendProf.businessName || existing?.businessBrain?.businessName,
          industry: backendProf.industry || existing?.businessBrain?.industry,
          services: backendProf.services?.length > 0 ? backendProf.services : (existing?.businessBrain?.services || []),
          products: backendProf.products?.length > 0 ? backendProf.products : (existing?.businessBrain?.products || []),
          businessDescription: backendProf.businessDescription || existing?.businessBrain?.businessDescription,
          website: backendProf.website || existing?.businessBrain?.website
        },
        projects: backendProf.projects?.length > 0 ? backendProf.projects : (existing?.projects || []),
        onboardingStatus: targetStatus,
        lastVisitedScreen: targetScreen,
        updatedAt: new Date().toISOString()
      });

      sessionManager.setSession(
        mergedProfile.userId,
        targetScreen,
        backendRes.token
      );

      return {
        isReturningUser: true,
        isNewUser: false,
        message: 'Welcome back! Resuming your account...',
        profile: mergedProfile
      };
    }

    if (existing && (!backendRes || !backendRes.isNewUser)) {
      existing.phoneVerified = true;
      existing.updatedAt = new Date().toISOString();
      
      const targetStatus = 'completed';
      const targetScreen = 'dashboard';

      const updated = profileService.saveProfile({
        ...existing,
        userId: canonicalUserId,
        customerId: existing.customerId || canonicalUserId,
        onboardingStatus: targetStatus,
        lastVisitedScreen: targetScreen,
        currentStep: targetScreen
      });
      if (backendRes?.token) {
        sessionManager.setSession(updated.userId, targetScreen, backendRes.token);
      } else {
        sessionManager.setSession(updated.userId, targetScreen);
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
      currentStep: 'business_input',
      lastVisitedScreen: 'business_input',
      onboardingStatus: 'in_progress',
      userId: canonicalUserId,
      customerId: canonicalUserId
    });

    if (backendRes?.token) {
      sessionManager.setSession(newProfile.userId, 'business_input', backendRes.token);
    } else {
      sessionManager.setSession(newProfile.userId, 'business_input');
    }

    return {
      isReturningUser: false,
      isNewUser: true,
      message: 'Account created successfully! Let\'s set up your profile.',
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

    if (canonicalUserId !== preferredUserId && preferredUserId) {
      const migrated = profileService.migrateProfile(preferredUserId, canonicalUserId);
      if (migrated) {
        console.log(`[authService] Migrated profile from ${preferredUserId} to ${canonicalUserId}`);
      }
    }

    // 1. If backend returned an existing user/vault, hydrate and save to local profileService
    if (backendRes && !backendRes.isNewUser && backendRes.profile) {
      const backendProf = backendRes.profile;
      const hasBiz = Boolean(
        backendProf.businessName ||
        (Array.isArray(backendProf.services) && backendProf.services.length > 0) ||
        backendProf.website
      );

      const targetStatus = backendProf.onboardingStatus || (hasBiz ? 'completed' : (existing?.onboardingStatus || 'in_progress'));
      const targetScreen = backendProf.lastVisitedScreen || (hasBiz ? 'dashboard' : (existing?.lastVisitedScreen || 'welcome'));

      const mergedProfile = profileService.saveProfile({
        ...(existing || {}),
        ...backendProf,
        userId: canonicalUserId,
        customerId: backendProf.customerId || existing?.customerId || canonicalUserId,
        businessId: backendProf.businessId || existing?.businessId || null,
        email: cleanEmail,
        emailVerified: true,
        businessName: backendProf.businessName || existing?.businessName,
        industry: backendProf.industry || existing?.industry,
        services: backendProf.services?.length > 0 ? backendProf.services : (existing?.services || []),
        products: backendProf.products?.length > 0 ? backendProf.products : (existing?.products || []),
        businessDescription: backendProf.businessDescription || existing?.businessDescription,
        businessBrain: {
          ...(existing?.businessBrain || {}),
          ...(backendProf.businessBrain || {}),
          businessName: backendProf.businessName || existing?.businessBrain?.businessName,
          industry: backendProf.industry || existing?.businessBrain?.industry,
          services: backendProf.services?.length > 0 ? backendProf.services : (existing?.businessBrain?.services || []),
          products: backendProf.products?.length > 0 ? backendProf.products : (existing?.businessBrain?.products || []),
          businessDescription: backendProf.businessDescription || existing?.businessBrain?.businessDescription,
          website: backendProf.website || existing?.businessBrain?.website
        },
        projects: backendProf.projects?.length > 0 ? backendProf.projects : (existing?.projects || []),
        onboardingStatus: targetStatus,
        lastVisitedScreen: targetScreen,
        updatedAt: new Date().toISOString()
      });

      sessionManager.setSession(
        mergedProfile.userId,
        targetScreen,
        backendRes.token
      );

      return {
        isReturningUser: true,
        isNewUser: false,
        message: 'Welcome back! Resuming your account...',
        profile: mergedProfile
      };
    }

    if (existing && (!backendRes || !backendRes.isNewUser)) {
      existing.emailVerified = true;
      existing.updatedAt = new Date().toISOString();
      
      const targetStatus = 'completed';
      const targetScreen = 'dashboard';

      const updated = profileService.saveProfile({
        ...existing,
        userId: canonicalUserId,
        customerId: canonicalUserId,
        onboardingStatus: targetStatus,
        lastVisitedScreen: targetScreen,
        currentStep: targetScreen
      });
      if (backendRes?.token) {
        sessionManager.setSession(updated.userId, targetScreen, backendRes.token);
      } else {
        sessionManager.setSession(updated.userId, targetScreen);
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
      currentStep: 'business_input',
      lastVisitedScreen: 'business_input',
      onboardingStatus: 'in_progress',
      userId: canonicalUserId,
      customerId: canonicalUserId
    });

    if (backendRes?.token) {
      sessionManager.setSession(newProfile.userId, 'business_input', backendRes.token);
    } else {
      sessionManager.setSession(newProfile.userId, 'business_input');
    }

    return {
      isReturningUser: false,
      isNewUser: true,
      message: 'Account created successfully! Let\'s set up your profile.',
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

    const result = await apiService.post(endpoint, body, { timeout: 1500 });
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
    storage.remove('ONBOARDING_STATE');
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('ONBOARDING_STATE') || k === 'ACTIVE_AUTH_SESSION') {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }
};
