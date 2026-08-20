import { storage } from '../utils/storage.js';

const ACCOUNTS_STORAGE_KEY = 'USER_ACCOUNTS_DB';

export const profileService = {
  getAllProfiles() {
    const raw = storage.get(ACCOUNTS_STORAGE_KEY, []);
    return raw.map((p, idx) => {
      const brain = p.businessBrain || {};
      return {
        ...p,
        customerId: p.customerId || `ACA000${idx + 1}`,
        businessId: p.businessId || `ABA000${idx + 1}`,
        userId: p.userId || p.customerId || `ACA000${idx + 1}`,
        businessBrain: { ...brain }
      };
    });
  },

  findProfileByPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    return this.getAllProfiles().find((p) => p.phoneNumber === clean) || null;
  },

  findProfileByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return this.getAllProfiles().find((p) => p.email === clean) || null;
  },

  getProfileById(userId) {
    if (!userId) return null;
    return this.getAllProfiles().find((p) => p.userId === userId) || null;
  },

  saveProfile(profileData) {
    const profiles = this.getAllProfiles();
    const now = new Date().toISOString();

    let userId = profileData.userId;
    if (!userId) {
      if (profileData.phoneNumber) {
        userId = `usr_phone_${profileData.phoneNumber.replace(/\D/g, '')}`;
      } else if (profileData.email) {
        userId = `usr_email_${profileData.email.replace(/[@.]/g, '_')}`;
      } else {
        userId = `usr_${Date.now()}`;
      }
    }

    const existingIndex = profiles.findIndex((p) => p.userId === userId);
    const existing = existingIndex >= 0 ? profiles[existingIndex] : {};

    const mergedProfile = {
      userId,
      phoneNumber: profileData.phoneNumber ?? existing.phoneNumber ?? '',
      email: profileData.email ?? existing.email ?? '',
      name: profileData.name ?? existing.name ?? '',
      onboardingStatus: profileData.onboardingStatus ?? existing.onboardingStatus ?? 'in_progress',
      currentStep: profileData.currentStep ?? existing.currentStep ?? 'name',
      lastVisitedScreen: profileData.lastVisitedScreen ?? existing.lastVisitedScreen ?? 'name',
      phoneVerified: profileData.phoneVerified ?? existing.phoneVerified ?? false,
      emailVerified: profileData.emailVerified ?? existing.emailVerified ?? false,
      authProvider: profileData.authProvider ?? existing.authProvider ?? 'phone',
      businessBrain: profileData.businessBrain ?? existing.businessBrain ?? {},
      expertReviewStatus: profileData.expertReviewStatus ?? existing.expertReviewStatus ?? null,
      expertReviewSubmittedAt: profileData.expertReviewSubmittedAt ?? existing.expertReviewSubmittedAt ?? null,
      expertNotes: profileData.expertNotes ?? existing.expertNotes ?? '',
      expertReviewCompletedAt: profileData.expertReviewCompletedAt ?? existing.expertReviewCompletedAt ?? null,
      chatHistory: profileData.chatHistory ?? existing.chatHistory ?? [],
      projects: profileData.projects ?? existing.projects ?? [],
      uploadedFiles: profileData.uploadedFiles ?? existing.uploadedFiles ?? [],
      notifications: profileData.notifications ?? existing.notifications ?? [],
      createdAt: existing.createdAt ?? now,
      updatedAt: now,
      lastLoginAt: profileData.lastLoginAt ?? now,
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = mergedProfile;
    } else {
      profiles.push(mergedProfile);
    }

    storage.set(ACCOUNTS_STORAGE_KEY, profiles);
    return mergedProfile;
  },

  updateBusinessBrain(userId, patch = {}) {
    if (!userId || !patch) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;

    const current = profile.businessBrain || {};
    const merged = { ...current };

    for (const [key, val] of Object.entries(patch)) {
      if (val === null || val === undefined) continue;
      if (Array.isArray(val)) {
        const existing = Array.isArray(merged[key]) ? merged[key] : [];
        merged[key] = [...new Set([...existing, ...val])];
      } else if (typeof val === 'object') {
        merged[key] = { ...(merged[key] || {}), ...val };
      } else {
        merged[key] = val;
      }
    }

    merged.lastUpdated = new Date().toISOString();
    return this.saveProfile({ ...profile, businessBrain: merged });
  },

  getBusinessBrain(userId) {
    if (!userId) return {};
    const profile = this.getProfileById(userId);
    return profile?.businessBrain || {};
  },

  saveChatHistory(userId, history) {
    if (!userId) return;
    const profile = this.getProfileById(userId);
    if (!profile) return;
    this.saveProfile({ ...profile, chatHistory: history });
  },

  getChatHistory(userId) {
    if (!userId) return [];
    const profile = this.getProfileById(userId);
    return profile?.chatHistory || [];
  },

  saveProjects(userId, projects) {
    if (!userId) return;
    const profile = this.getProfileById(userId);
    if (!profile) return;
    this.saveProfile({ ...profile, projects });
  },

  getProjects(userId) {
    if (!userId) return [];
    const profile = this.getProfileById(userId);
    return profile?.projects || [];
  },

  setExpertReviewStatus(userId, status, notes = '') {
    if (!userId) return;
    const profile = this.getProfileById(userId);
    if (!profile) return;
    const now = new Date().toISOString();
    this.saveProfile({
      ...profile,
      expertReviewStatus: status,
      expertNotes: notes || profile.expertNotes || '',
      ...(status === 'pending' ? { expertReviewSubmittedAt: now } : {}),
      ...(status === 'completed' ? { expertReviewCompletedAt: now } : {}),
    });
  },

  addNotification(userId, notification) {
    if (!userId) return;
    const profile = this.getProfileById(userId);
    if (!profile) return;
    const notifications = [...(profile.notifications || []), {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    }];
    this.saveProfile({ ...profile, notifications });
  },

  markNotificationRead(userId, notifId) {
    if (!userId) return;
    const profile = this.getProfileById(userId);
    if (!profile) return;
    const notifications = (profile.notifications || []).map(n =>
      n.id === notifId ? { ...n, read: true } : n
    );
    this.saveProfile({ ...profile, notifications });
  },

  saveAllProfiles(profiles) {
    if (!Array.isArray(profiles)) return;
    storage.set(ACCOUNTS_STORAGE_KEY, profiles);
  }
};
