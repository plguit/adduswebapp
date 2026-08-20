import { storage } from '../../utils/storage.js';
import { profileService } from '../profileService.js';

/**
 * Business Understanding Engine — Maintains a continuous 20+ dimension business profile
 * All fallbacks return empty/null values. No demo/Aura Skincare data injected.
 */
export const BusinessUnderstandingEngine = {
  /**
   * Retrieves the comprehensive 20+ dimension business profile for a user
   */
  getBusinessProfile(userId) {
    if (!userId) return this.getDefaultProfile();
    const profile = profileService.getProfileById(userId);
    const brain = profile?.businessBrain || {};

    return {
      businessName: brain.businessName || profile?.name || '',
      industry: brain.industry || '',
      businessStage: brain.businessStage || '',
      brandPersonality: brain.brandPersonality || '',
      vision: brain.vision || '',
      mission: brain.mission || '',
      businessGoals: brain.businessGoals || '',
      targetAudience: brain.targetAudience || '',
      usp: brain.usp || '',
      services: Array.isArray(brain.services) ? brain.services : [],
      products: brain.products || [],
      competitors: brain.competitors || [],
      currentAssets: brain.currentAssets || [],
      marketingStatus: brain.marketingStatus || '',
      preferredStyle: brain.preferredStyle || '',
      preferredColours: brain.preferredColours || [],
      preferredCreators: brain.preferredCreators || [],
      preferredBudget: brain.preferredBudget || '',
      previousProjects: brain.previousProjects || [],
      communicationHistory: brain.communicationHistory || [],
      businessTimeline: brain.businessTimeline || [],
      growthHistory: brain.growthHistory || {},
      lastEnrichedAt: brain.lastEnrichedAt || new Date().toISOString()
    };
  },

  /**
   * Deep-enrich the business profile automatically from completed project insights or AI analysis
   */
  enrichBusinessProfile(userId, enrichmentData = {}) {
    if (!userId) return null;
    const current = this.getBusinessProfile(userId);
    const updated = {
      ...current,
      ...enrichmentData,
      previousProjects: [...new Set([...(current.previousProjects || []), ...(enrichmentData.newProject ? [enrichmentData.newProject] : [])])],
      lastEnrichedAt: new Date().toISOString()
    };

    profileService.updateBusinessBrain(userId, updated);
    return updated;
  },

  getDefaultProfile() {
    return {
      businessName: '',
      industry: '',
      businessStage: '',
      brandPersonality: '',
      vision: '',
      mission: '',
      businessGoals: '',
      targetAudience: '',
      usp: '',
      services: [],
      products: [],
      competitors: [],
      currentAssets: [],
      marketingStatus: '',
      preferredStyle: '',
      preferredColours: [],
      preferredCreators: [],
      preferredBudget: '',
      previousProjects: [],
      communicationHistory: [],
      businessTimeline: [],
      growthHistory: {},
      lastEnrichedAt: new Date().toISOString()
    };
  }
};

export default BusinessUnderstandingEngine;
