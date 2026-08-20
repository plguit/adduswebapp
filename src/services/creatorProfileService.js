/**
 * ADDUS Platform — Creator Profile Service (Frontend)
 *
 * Frontend business logic for creator profile operations.
 */

import { creatorApiService } from './creatorApiService.js';

export const creatorProfileService = {
  async loadProfile(creatorId) {
    try {
      const profile = await creatorApiService.getProfile(creatorId);
      return profile;
    } catch (err) {
      console.error('Failed to load creator profile:', err);
      return null;
    }
  },

  async saveProfile(creatorId, updates) {
    try {
      const result = await creatorApiService.updateProfile(creatorId, updates);
      return result.profile;
    } catch (err) {
      console.error('Failed to save creator profile:', err);
      throw err;
    }
  },

  async submitForReview(creatorId) {
    try {
      const result = await creatorApiService.submitForReview();
      return result.profile;
    } catch (err) {
      console.error('Failed to submit for review:', err);
      throw err;
    }
  },

  async loadProjects(creatorId) {
    try {
      return await creatorApiService.getProjects(creatorId);
    } catch (err) {
      console.error('Failed to load projects:', err);
      return [];
    }
  },

  async loadEquipment(creatorId) {
    try {
      return await creatorApiService.getEquipment(creatorId);
    } catch (err) {
      console.error('Failed to load equipment:', err);
      return [];
    }
  },

  async saveEquipment(creatorId, equipment) {
    try {
      const result = await creatorApiService.updateEquipment(creatorId, equipment);
      return result.equipment;
    } catch (err) {
      console.error('Failed to save equipment:', err);
      throw err;
    }
  },

  async loadEarnings(creatorId) {
    try {
      return await creatorApiService.getEarnings(creatorId);
    } catch (err) {
      console.error('Failed to load earnings:', err);
      return { earnings: [], totalEarnings: 0 };
    }
  },

  async loadNotifications(creatorId) {
    try {
      return await creatorApiService.getNotifications(creatorId);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      return [];
    }
  },

  async loadDocuments(creatorId) {
    try {
      return await creatorApiService.getDocuments(creatorId);
    } catch (err) {
      console.error('Failed to load documents:', err);
      return [];
    }
  },

  async loadScore(creatorId) {
    try {
      return await creatorApiService.getScore(creatorId);
    } catch (err) {
      console.error('Failed to load score:', err);
      return null;
    }
  },

  async uploadDocument(creatorId, type, file, fileName) {
    try {
      return await creatorApiService.uploadDocument({ type, file, fileName });
    } catch (err) {
      console.error('Failed to upload document:', err);
      throw err;
    }
  },

  async updateAvailability(creatorId, status, note, date, projectId) {
    try {
      return await creatorApiService.updateAvailability(creatorId, status, note, date, projectId);
    } catch (err) {
      console.error('Failed to update availability:', err);
      throw err;
    }
  }
};
