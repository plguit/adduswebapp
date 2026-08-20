/**
 * Business Vault Service (Internal Business Memory)
 * 
 * PERSISTENCE: File-based JSON storage on disk.
 * This ensures vault data survives server restarts.
 * No external database dependency required.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory: <project>/data/vaults/
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'vaults');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[VaultService] Could not create data directory:', e.message);
}

function getVaultFilePath(userId) {
  // Sanitize userId to prevent path traversal
  const safeId = String(userId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safeId}.json`);
}

function loadVaultFromDisk(userId) {
  try {
    const filePath = getVaultFilePath(userId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[VaultService] Failed to load vault for ${userId}:`, e.message);
  }
  return null;
}

function saveVaultToDisk(userId, vault) {
  try {
    const filePath = getVaultFilePath(userId);
    fs.writeFileSync(filePath, JSON.stringify(vault, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[VaultService] Failed to save vault for ${userId}:`, e.message);
  }
}

export function createEmptyVault() {
  return {
    businessName: null,
    industry: null,
    businessStage: null,
    businessDescription: null,
    products: [],
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
      packaging: null,
      favicon: null
    },
    discoveredAssets: [],
    missingAssets: [],
    aiConfidenceScore: null,
    conversationStatus: 'discovering',
    lastUpdated: new Date().toISOString(),
    websiteUrl: null,
    websiteAnalyzedAt: null,
    websiteContentHash: null,
    websiteEvidenceItems: [],
    websiteRetrievalMeta: null,
    addiRecommendations: null,
    addiRecommendationsGeneratedAt: null,
    diagnosis: null,
    diagnosisGeneratedAt: null,
    strategicIntelligence: [],
    auditLog: [],
    name: null,
    phoneNumber: null,
    email: null,
    authProvider: null,
    onboardingStatus: null,
    projects: [],
    products: [],
    conversations: [],
    chatHistory: [],
    uploadedFiles: [],
    notifications: [],
    expertReviewStatus: null,
    expertReviewSubmittedAt: null,
    expertReviewCompletedAt: null,
    expertNotes: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    fieldProvenance: {},
    customerPreferences: {
      communicationStyle: null,
      visualPreference: null,
      approvalStyle: null,
      notificationChannels: []
    },
    memory: {
      durableFacts: [],
      lastFactExtractedAt: null
    }
  };
}

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

export function getBusinessVault(userId) {
  if (!userId) return createEmptyVault();

  // Try disk first (durable persistence)
  const diskVault = loadVaultFromDisk(userId);
  if (diskVault) {
    return diskVault;
  }

  // Create new vault and persist
  const newVault = createEmptyVault();
  saveVaultToDisk(userId, newVault);
  return newVault;
}

export function updateBusinessVault(userId, partialVaultData = {}, provenance = 'AI_GENERATED') {
  if (!userId) return createEmptyVault();

  const currentVault = getBusinessVault(userId);
  let updated = false;

  for (const [key, value] of Object.entries(partialVaultData)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.trim() !== '') {
        const cleanVal = value.trim();
        if (currentVault[key] !== cleanVal) {
          currentVault[key] = cleanVal;
          setFieldProvenance(currentVault, key, provenance, cleanVal);
          updated = true;
        }
      } else if (Array.isArray(value) || typeof value === 'object') {
        currentVault[key] = value;
        setFieldProvenance(currentVault, key, provenance, value);
        updated = true;
      }
    }
  }

  currentVault.aiConfidenceScore = calculateConfidenceScore(currentVault);
  if (updated) {
    currentVault.lastUpdated = new Date().toISOString();
    const auditEntry = {
      timestamp: new Date().toISOString(),
      actor: 'system',
      action: 'vault_update',
      fields: Object.keys(partialVaultData),
      data: partialVaultData,
      provenance
    };
    currentVault.auditLog = [auditEntry, ...(currentVault.auditLog || [])].slice(0, 50);
  }

  saveVaultToDisk(userId, currentVault);
  return currentVault;
}

export function setFieldProvenance(vault, field, provenance, value) {
  if (!vault.fieldProvenance) vault.fieldProvenance = {};
  vault.fieldProvenance[field] = {
    provenance,
    confidence: provenance === 'OBSERVED' ? 0.95 : provenance === 'CUSTOMER_PROVIDED' ? 1.0 : provenance === 'INFERRED' ? 0.6 : 0.4,
    lastVerifiedAt: new Date().toISOString(),
    valueSummary: typeof value === 'string' ? value.slice(0, 100) : Array.isArray(value) ? `${value.length} items` : JSON.stringify(value).slice(0, 100)
  };
}

export function getFieldProvenance(vault, field) {
  if (!vault || !vault.fieldProvenance) return null;
  return vault.fieldProvenance[field] || null;
}

export function addDurableFact(vault, fact, source = 'conversation', confidence = 0.8) {
  if (!vault.memory) vault.memory = { durableFacts: [], lastFactExtractedAt: null };
  
  const existing = vault.memory.durableFacts.findIndex(f => f.fact.toLowerCase() === fact.toLowerCase());
  if (existing >= 0) {
    vault.memory.durableFacts[existing] = {
      ...vault.memory.durableFacts[existing],
      lastConfirmedAt: new Date().toISOString(),
      confidence: Math.max(vault.memory.durableFacts[existing].confidence, confidence)
    };
  } else {
    vault.memory.durableFacts.push({
      fact,
      source,
      confidence,
      createdAt: new Date().toISOString(),
      lastConfirmedAt: new Date().toISOString()
    });
  }
  vault.memory.lastFactExtractedAt = new Date().toISOString();
  return vault;
}

export function hasDurableFact(vault, keyword) {
  if (!vault || !vault.memory || !Array.isArray(vault.memory.durableFacts)) return false;
  return vault.memory.durableFacts.some(f => f.fact.toLowerCase().includes(keyword.toLowerCase()));
}

export function addCustomerPreference(vault, category, value) {
  if (!vault.customerPreferences) vault.customerPreferences = {};
  vault.customerPreferences[category] = value;
  return vault;
}

export function getCustomerPreference(vault, category) {
  if (!vault || !vault.customerPreferences) return null;
  return vault.customerPreferences[category] || null;
}

export function hasWebsiteChanged(vault, newHash) {
  if (!vault) return true;
  if (!vault.websiteContentHash) return true;
  return vault.websiteContentHash !== newHash;
}

export function setWebsiteHash(vault, hash) {
  if (!vault) return;
  vault.websiteContentHash = hash;
  vault.websiteAnalyzedAt = new Date().toISOString();
}

export function clearBusinessVault(userId) {
  if (userId) {
    try {
      const filePath = getVaultFilePath(userId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn(`[VaultService] Failed to clear vault for ${userId}:`, e.message);
    }
  }
}

export function getAllVaults() {
  const vaults = [];
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
            const vault = JSON.parse(raw);
            vaults.push({ userId: file.replace('.json', ''), vault });
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('[VaultService] Failed to list vaults:', e.message);
  }
  return vaults;
}
