import { storage } from '../utils/storage.js';
import { profileService } from './profileService.js';
import { paymentService } from './paymentService.js';

const ACCOUNTS_STORAGE_KEY = 'USER_ACCOUNTS_DB';
const MERGE_LOGS_KEY = 'ADDUS_RECORD_MERGE_LOGS_DB';

/**
 * Enterprise Duplicate Prevention & CRM Record Integrity Service
 * Calculates string similarity, checks for existing customer/business records,
 * and provides Admin Record Merging (ACA/ABA).
 */
export const duplicatePreventionService = {
  /**
   * Calculates similarity percentage between two strings (0% - 100%)
   */
  calculateSimilarity(str1 = '', str2 = '') {
    const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    if (!s1 || !s2) return 0;
    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 90;

    // Levenshtein distance calculation
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

  /**
   * Scans existing profiles for similar business (>90% similarity)
   */
  checkSimilarBusiness(businessName = '', phoneNumber = '', email = '') {
    const profiles = profileService.getAllProfiles();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    for (const p of profiles) {
      const brain = p.businessBrain || {};
      const existingName = brain.businessName || p.name || '';

      // Direct mobile or email match
      if (cleanPhone && p.phoneNumber === cleanPhone) {
        return { isSimilar: true, existingProfile: p, reason: 'Same Mobile Number' };
      }
      if (cleanEmail && p.email?.toLowerCase() === cleanEmail) {
        return { isSimilar: true, existingProfile: p, reason: 'Same Email Address' };
      }

      // Name similarity match >90%
      const sim = this.calculateSimilarity(businessName, existingName);
      if (sim >= 90) {
        return { isSimilar: true, existingProfile: p, similarityPercent: sim, reason: `Similar Business Name (${sim}% match)` };
      }
    }

    return { isSimilar: false, existingProfile: null };
  },

  /**
   * Returns list of potential duplicate customer accounts for Admin Dashboard
   */
  getPotentialDuplicateCustomers() {
    const profiles = profileService.getAllProfiles();
    const duplicates = [];

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const p1 = profiles[i];
        const p2 = profiles[j];

        const samePhone = p1.phoneNumber && p2.phoneNumber && p1.phoneNumber === p2.phoneNumber;
        const sameEmail = p1.email && p2.email && p1.email.toLowerCase() === p2.email.toLowerCase();
        const simName = this.calculateSimilarity(p1.name, p2.name) >= 90;

        if (samePhone || sameEmail || simName) {
          duplicates.push({
            id: `dup_cust_${p1.customerId}_${p2.customerId}`,
            primary: p1,
            duplicate: p2,
            reason: samePhone ? 'Same Mobile Number' : (sameEmail ? 'Same Email Address' : 'Similar Customer Name')
          });
        }
      }
    }

    return duplicates;
  },

  /**
   * Admin Record Merge: Merges duplicate customer into primary customer account
   */
  mergeCustomerRecords(primaryCustId, duplicateCustId, reason = 'Admin Record Consolidation') {
    const profiles = profileService.getAllProfiles();
    const primary = profiles.find(p => p.customerId === primaryCustId || p.userId === primaryCustId);
    const duplicate = profiles.find(p => p.customerId === duplicateCustId || p.userId === duplicateCustId);

    if (!primary || !duplicate) return false;

    // Transfer projects, chat history, and uploaded files
    const mergedProjects = [...(primary.projects || []), ...(duplicate.projects || [])];
    const mergedChat = [...(primary.chatHistory || []), ...(duplicate.chatHistory || [])];
    const mergedFiles = [...(primary.uploadedFiles || []), ...(duplicate.uploadedFiles || [])];

    // Merge Business Vault memories
    const mergedBrain = {
      ...(duplicate.businessBrain || {}),
      ...(primary.businessBrain || {})
    };

    // Update primary profile
    profileService.saveProfile({
      ...primary,
      userId: primary.customerId || primary.userId,
      projects: mergedProjects,
      chatHistory: mergedChat,
      uploadedFiles: mergedFiles,
      businessBrain: mergedBrain
    });

    // Remove duplicate profile from storage
    const updatedProfiles = profileService.getAllProfiles().filter(p => p.customerId !== duplicateCustId && p.userId !== duplicateCustId);
    storage.set(ACCOUNTS_STORAGE_KEY, updatedProfiles);

    // Log merge action
    const logs = storage.get(MERGE_LOGS_KEY, []);
    logs.unshift({
      id: `MERGE_${Date.now()}`,
      primaryCustId,
      duplicateCustId,
      reason,
      timestamp: new Date().toISOString()
    });
    storage.set(MERGE_LOGS_KEY, logs);

    return true;
  }
};
