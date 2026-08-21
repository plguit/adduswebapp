import { storage } from '../utils/storage.js';
import { idGeneratorService } from './idGeneratorService.js';

const ACCOUNTS_STORAGE_KEY = 'USER_ACCOUNTS_DB';

/**
 * User Profile Service — Enterprise Identity Edition
 * Manages user profiles with ACA Customer IDs, ABA Business IDs, full Business Brain, and session state.
 */
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
    if (!clean) return null;
    return this.getAllProfiles().find((p) => {
      const pPhone = (p.phoneNumber || p.phone || '').replace(/\D/g, '');
      return pPhone && (pPhone === clean || pPhone.endsWith(clean) || clean.endsWith(pPhone));
    }) || null;
  },

  findProfileByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return this.getAllProfiles().find((p) => (p.email || '').trim().toLowerCase() === clean) || null;
  },

  getProfileById(userId) {
    if (!userId) return null;
    return this.getAllProfiles().find((p) => p.userId === userId || p.customerId === userId) || null;
  },

  saveProfile(profileData) {
    const profiles = this.getAllProfiles();
    const now = new Date().toISOString();

    let customerId = profileData.customerId;
    if (!customerId) {
      customerId = idGeneratorService.getNextId('ACA');
    }

    let userId = profileData.userId || customerId;

    let businessId = profileData.businessId;
    if (!businessId) {
      businessId = idGeneratorService.getNextId('ABA');
    }

    const existingIndex = profiles.findIndex((p) => p.userId === userId || p.customerId === customerId);
    const existing = existingIndex >= 0 ? profiles[existingIndex] : {};

    const rawPhone = profileData.phoneNumber || profileData.phone || existing.phoneNumber || existing.phone || '';
    const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : '';

    const mergedProfile = {
      userId,
      customerId: existing.customerId || customerId,
      businessId: existing.businessId || businessId,
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      email: (profileData.email ?? existing.email ?? '').trim().toLowerCase(),
      name: profileData.name ?? existing.name ?? '',
      onboardingStatus: profileData.onboardingStatus ?? existing.onboardingStatus ?? 'in_progress',
      currentStep: profileData.currentStep ?? existing.currentStep ?? 'name',
      lastVisitedScreen: profileData.lastVisitedScreen ?? existing.lastVisitedScreen ?? 'name',
      phoneVerified: profileData.phoneVerified ?? existing.phoneVerified ?? false,
      emailVerified: profileData.emailVerified ?? existing.emailVerified ?? false,
      authProvider: profileData.authProvider ?? existing.authProvider ?? 'phone',
      // Business Brain
      businessBrain: profileData.businessBrain ?? existing.businessBrain ?? {},
      // Expert Review
      expertReviewStatus: profileData.expertReviewStatus ?? existing.expertReviewStatus ?? null,
      expertReviewSubmittedAt: profileData.expertReviewSubmittedAt ?? existing.expertReviewSubmittedAt ?? null,
      expertNotes: profileData.expertNotes ?? existing.expertNotes ?? '',
      expertReviewCompletedAt: profileData.expertReviewCompletedAt ?? existing.expertReviewCompletedAt ?? null,
      // Chat history (array of message objects)
      chatHistory: profileData.chatHistory ?? existing.chatHistory ?? [],
      // Projects
      projects: profileData.projects ?? existing.projects ?? [],
      // Uploaded files metadata
      uploadedFiles: profileData.uploadedFiles ?? existing.uploadedFiles ?? [],
      // Notifications from admin
      notifications: profileData.notifications ?? existing.notifications ?? [],
      // Timestamps
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

  /**
   * Deep-merges a partial patch into the user's businessBrain.
   * Arrays are merged (unique values). Strings overwrite.
   */
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
        // Merge unique values
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

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts(userId) {
    if (!userId) return [];
    const profile = this.getProfileById(userId);
    return profile?.products || [];
  },

  addProduct(userId, product) {
    if (!userId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const products = [...(profile.products || []), { ...product, productId: product.productId || idGeneratorService.getNextId('APD'), createdAt: new Date().toISOString() }];
    return this.saveProfile({ ...profile, products });
  },

  updateProduct(userId, productId, patch) {
    if (!userId || !productId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const products = (profile.products || []).map(p =>
      p.productId === productId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
    );
    return this.saveProfile({ ...profile, products });
  },

  deleteProduct(userId, productId) {
    if (!userId || !productId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const products = (profile.products || []).filter(p => p.productId !== productId);
    return this.saveProfile({ ...profile, products });
  },

  // ── Conversations ─────────────────────────────────────────────────────────
  getConversations(userId) {
    if (!userId) return [];
    const profile = this.getProfileById(userId);
    return profile?.conversations || [];
  },

  addConversation(userId, conversation) {
    if (!userId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const conversations = [...(profile.conversations || []), { ...conversation, conversationId: conversation.conversationId || `CONV_${Date.now()}`, createdAt: new Date().toISOString() }];
    return this.saveProfile({ ...profile, conversations });
  },

  updateConversation(userId, conversationId, patch) {
    if (!userId || !conversationId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const conversations = (profile.conversations || []).map(c =>
      c.conversationId === conversationId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
    );
    return this.saveProfile({ ...profile, conversations });
  },

  deleteConversation(userId, conversationId) {
    if (!userId || !conversationId) return null;
    const profile = this.getProfileById(userId);
    if (!profile) return null;
    const conversations = (profile.conversations || []).filter(c => c.conversationId !== conversationId);
    return this.saveProfile({ ...profile, conversations });
  },

  migrateProfile(oldUserId, newUserId) {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return false;
    const profiles = this.getAllProfiles();
    const idx = profiles.findIndex(p => p.userId === oldUserId || p.customerId === oldUserId);
    if (idx === -1) return false;

    const profile = profiles[idx];
    const updated = {
      ...profile,
      userId: newUserId,
      customerId: newUserId,
      businessId: profile.businessId || newUserId,
    };

    const filtered = profiles.filter(p => p.userId !== oldUserId && p.customerId !== oldUserId);
    filtered.push(updated);
    storage.set(ACCOUNTS_STORAGE_KEY, filtered);
    return true;
  }
};
