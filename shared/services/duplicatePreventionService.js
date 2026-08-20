import { storage } from '../../src/utils/storage.js';
import { profileService } from './profileService.js';

const ACCOUNTS_STORAGE_KEY = 'USER_ACCOUNTS_DB';
const MERGE_LOGS_KEY = 'ADDUS_RECORD_MERGE_LOGS_DB';

export const duplicatePreventionService = {
  calculateSimilarity(str1 = '', str2 = '') {
    const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    if (!s1 || !s2) return 0;
    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 90;

    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = Math.round(((maxLength - distance) / maxLength) * 100);
    return Math.max(0, similarity);
  },

  checkSimilarBusiness(businessName = '', phoneNumber = '', email = '') {
    const profiles = profileService.getAllProfiles();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    for (const p of profiles) {
      const brain = p.businessBrain || {};
      const existingName = brain.businessName || p.name || '';

      if (cleanPhone && p.phoneNumber === cleanPhone) {
        return { isSimilar: true, existingProfile: p, reason: 'Same Mobile Number' };
      }
      if (cleanEmail && p.email?.toLowerCase() === cleanEmail) {
        return { isSimilar: true, existingProfile: p, reason: 'Same Email Address' };
      }

      const sim = this.calculateSimilarity(businessName, existingName);
      if (sim >= 90) {
        return { isSimilar: true, existingProfile: p, similarityPercent: sim, reason: `Similar Business Name (${sim}% match)` };
      }
    }

    return { isSimilar: false, existingProfile: null };
  },

  mergeCustomerRecords(primaryCustId, duplicateCustId, reason = 'Admin Record Consolidation') {
    const profiles = profileService.getAllProfiles();
    const primary = profiles.find(p => p.customerId === primaryCustId || p.userId === primaryCustId);
    const duplicate = profiles.find(p => p.customerId === duplicateCustId || p.userId === duplicateCustId);

    if (!primary || !duplicate) return false;

    const mergedProjects = [...(primary.projects || []), ...(duplicate.projects || [])];
    const mergedChat = [...(primary.chatHistory || []), ...(duplicate.chatHistory || [])];
    const mergedFiles = [...(primary.uploadedFiles || []), ...(duplicate.uploadedFiles || [])];

    const mergedBrain = {
      ...(duplicate.businessBrain || {}),
      ...(primary.businessBrain || {})
    };

    profileService.saveProfile({
      ...primary,
      userId: primary.customerId || primary.userId,
      projects: mergedProjects,
      chatHistory: mergedChat,
      uploadedFiles: mergedFiles,
      businessBrain: mergedBrain
    });

    const updatedProfiles = profileService.getAllProfiles().filter(p => p.customerId !== duplicateCustId && p.userId !== duplicateCustId);
    storage.set(ACCOUNTS_STORAGE_KEY, updatedProfiles);
    return true;
  }
};
