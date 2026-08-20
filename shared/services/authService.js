import { profileService } from './profileService.js';
import { sessionManager } from './sessionManager.js';

export const authService = {
  async loginWithPhone(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const existing = profileService.findProfileByPhone(cleanPhone);

    if (existing) {
      existing.phoneVerified = true;
      existing.updatedAt = new Date().toISOString();
      const updated = profileService.saveProfile(existing);
      sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome');

      return {
        isReturningUser: true,
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
      onboardingStatus: 'in_progress'
    });

    sessionManager.setSession(newProfile.userId, 'name');

    return {
      isReturningUser: false,
      message: "Account created successfully! Let's set up your profile.",
      profile: newProfile
    };
  },

  async loginWithEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = profileService.findProfileByEmail(cleanEmail);

    if (existing) {
      existing.emailVerified = true;
      existing.updatedAt = new Date().toISOString();
      const updated = profileService.saveProfile(existing);
      sessionManager.setSession(updated.userId, updated.lastVisitedScreen || 'welcome');

      return {
        isReturningUser: true,
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
      onboardingStatus: 'in_progress'
    });

    sessionManager.setSession(newProfile.userId, 'name');

    return {
      isReturningUser: false,
      message: "Account created successfully! Let's set up your profile.",
      profile: newProfile
    };
  },

  logout() {
    sessionManager.logout();
  }
};
