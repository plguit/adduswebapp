import { storage } from '../../utils/storage.js';
import { profileService } from '../profileService.js';

/**
 * Business Vault Service — Permanent Memory Layer for Business Assets & History
 * All fallbacks return empty arrays. No demo/Aura Skincare files injected.
 */
export const BusinessVaultService = {
  /**
   * Retrieves full Business Vault contents for a user
   */
  getVault(userId) {
    if (!userId) return this.getDefaultVault();
    const profile = profileService.getProfileById(userId);
    const brain = profile?.businessBrain || {};
    const vault = brain.businessVaultData || {};

    return {
      logos: vault.logos || [],
      brandIdentity: vault.brandIdentity || [],
      website: vault.website || [],
      photography: vault.photography || [],
      videos: vault.videos || [],
      brandGuidelines: vault.brandGuidelines || [],
      marketingAssets: vault.marketingAssets || [],
      socialMediaAssets: vault.socialMediaAssets || [],
      packaging: vault.packaging || [],
      documents: vault.documents || [],
      invoices: vault.invoices || [],
      approvals: vault.approvals || [],
      meetingNotes: vault.meetingNotes || [],
      feedback: vault.feedback || [],
      aiRecommendations: vault.aiRecommendations || [],
      projectHistory: vault.projectHistory || [],
      creatorHistory: vault.creatorHistory || [],
      preferredVendors: vault.preferredVendors || [],
      communicationLogs: vault.communicationLogs || [],
      lastUpdated: vault.lastUpdated || new Date().toISOString()
    };
  },

  /**
   * Store asset or document into Business Vault without duplicating
   */
  storeAsset(userId, category, assetData) {
    if (!userId || !category) return null;
    const currentVault = this.getVault(userId);
    const categoryFiles = currentVault[category] || [];

    const fileEntry = typeof assetData === 'string' ? assetData : (assetData.name || assetData.title || JSON.stringify(assetData));
    const updatedCategory = [...new Set([...categoryFiles, fileEntry])];

    const updatedVault = {
      ...currentVault,
      [category]: updatedCategory,
      lastUpdated: new Date().toISOString()
    };

    profileService.updateBusinessBrain(userId, { businessVaultData: updatedVault });
    return updatedVault;
  },

  /**
   * Query Business Vault to verify if information already exists before asking customer
   */
  queryVault(userId, queryTerm) {
    const vault = this.getVault(userId);
    const q = (queryTerm || '').toLowerCase();
    const results = [];

    Object.entries(vault).forEach(([cat, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          const text = typeof item === 'string' ? item : JSON.stringify(item);
          if (text.toLowerCase().includes(q)) {
            results.push({ category: cat, item });
          }
        });
      }
    });

    return results;
  },

  getDefaultVault() {
    return {
      logos: [], brandIdentity: [], website: [], photography: [], videos: [],
      brandGuidelines: [], marketingAssets: [], socialMediaAssets: [], packaging: [],
      documents: [], invoices: [], approvals: [], meetingNotes: [], feedback: [],
      aiRecommendations: [], projectHistory: [], creatorHistory: [], preferredVendors: [],
      communicationLogs: [], lastUpdated: new Date().toISOString()
    };
  }
};

export default BusinessVaultService;
