/**
 * Business Vault Service (Internal Business Memory)
 * 
 * Manages the persistent internal Business Profile for each user session.
 * Tracks 20+ key business attributes and calculates a live AI Confidence Score (0-100).
 */

const vaultStore = new Map();

// Default empty vault structure matching Phase 2 PRD requirements
export function createEmptyVault() {
  return {
    businessName: null,
    industry: null,
    businessStage: null,
    businessDescription: null,
    products: null,
    services: null,
    targetAudience: null,
    geographicMarket: null,
    idealCustomer: null,
    customerAge: null,
    customerType: null,
    pricingPosition: null,
    businessGoal: null,
    currentChallenge: null,
    competitiveAdvantage: null,
    timeline: null,
    budget: null,
    brandAssets: {
      website: null,
      socialLinks: null,
      photography: null,
      videos: null,
      logo: null,
      packaging: null
    },
    missingAssets: [],
    aiConfidenceScore: null,
    conversationStatus: 'discovering', // 'discovering' | 'understood' | 'roadmap_generated'
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Calculates live AI Confidence Score (0-100) based on Business Memory completeness.
 */
export function calculateConfidenceScore(vault) {
  if (!vault) return null;

  const weightedFields = [
    { key: 'businessName', weight: 10 },
    { key: 'industry', weight: 10 },
    { key: 'businessDescription', weight: 15 },
    { key: 'products', weight: 10 },
    { key: 'services', weight: 10 },
    { key: 'targetAudience', weight: 15 },
    { key: 'geographicMarket', weight: 5 },
    { key: 'idealCustomer', weight: 5 },
    { key: 'businessGoal', weight: 10 },
    { key: 'currentChallenge', weight: 5 },
    { key: 'competitiveAdvantage', weight: 5 }
  ];

  let totalScore = 0;
  for (const item of weightedFields) {
    const val = vault[item.key];
    if (val && typeof val === 'string' && val.trim().length > 2) {
      totalScore += item.weight;
    } else if (Array.isArray(val) && val.length > 0) {
      totalScore += item.weight;
    }
  }

  if (vault.brandAssets?.website || vault.website) totalScore = Math.min(100, totalScore + 10);
  return Math.min(100, Math.max(0, totalScore));
}

/**
 * Gets the Business Vault for a user.
 * @param {string} userId
 * @returns {Object} Vault object
 */
export function getBusinessVault(userId) {
  if (!userId) return createEmptyVault();
  if (!vaultStore.has(userId)) {
    vaultStore.set(userId, createEmptyVault());
  }
  return vaultStore.get(userId);
}

/**
 * Merges updated fields into the user's Business Vault and updates AI Confidence Score.
 * @param {string} userId
 * @param {Object} partialVaultData
 * @returns {Object} Updated Vault
 */
export function updateBusinessVault(userId, partialVaultData = {}) {
  if (!userId) return createEmptyVault();

  const currentVault = getBusinessVault(userId);
  let updated = false;

  for (const [key, value] of Object.entries(partialVaultData)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.trim() !== '') {
        const cleanVal = value.trim();
        if (currentVault[key] !== cleanVal) {
          currentVault[key] = cleanVal;
          updated = true;
        }
      } else if (Array.isArray(value) || typeof value === 'object') {
        currentVault[key] = value;
        updated = true;
      }
    }
  }

  // Recalculate confidence score
  currentVault.aiConfidenceScore = calculateConfidenceScore(currentVault);

  if (updated) {
    currentVault.lastUpdated = new Date().toISOString();
    console.log(`[Business Vault Memory Log] Updated Vault for User "${userId}" (Confidence: ${currentVault.aiConfidenceScore}%):`, partialVaultData);
  }

  return currentVault;
}

/**
 * Clears/Resets the Business Vault for a user.
 * @param {string} userId
 */
export function clearBusinessVault(userId) {
  if (userId) {
    vaultStore.delete(userId);
  }
}

