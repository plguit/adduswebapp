import { apiService } from './apiService.js';

export const syncService = {
  async syncProfile(userId, profile) {
    if (!userId || !profile) return;
    try {
      await apiService.post(`/customer/profile/${encodeURIComponent(userId)}`, { profile });
    } catch (e) {
      console.warn('[Sync] Profile sync failed:', e.message);
    }
  },

  async syncProjects(userId, projects) {
    if (!userId || !projects) return;
    try {
      await apiService.post(`/customer/projects/${encodeURIComponent(userId)}`, { projects });
    } catch (e) {
      console.warn('[Sync] Projects sync failed:', e.message);
    }
  },

  async syncConversations(userId, conversations) {
    if (!userId || !conversations) return;
    try {
      await apiService.post(`/customer/conversations/${encodeURIComponent(userId)}`, { conversations });
    } catch (e) {
      console.warn('[Sync] Conversations sync failed:', e.message);
    }
  }
};
