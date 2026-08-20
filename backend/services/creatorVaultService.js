/**
 * ADDUS Platform — Creator Vault Service
 *
 * Persistence layer for creator profiles using file-based JSON storage.
 * Mirrors the pattern of vaultService.js for business vaults.
 * Storage: data/vaults/creators/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'vaults', 'creators');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[CreatorVaultService] Could not create data directory:', e.message);
}

function getVaultFilePath(creatorId) {
  const safeId = String(creatorId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `${safeId}.json`);
}

function loadVaultFromDisk(creatorId) {
  try {
    const filePath = getVaultFilePath(creatorId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[CreatorVaultService] Failed to load vault for ${creatorId}:`, e.message);
  }
  return null;
}

function saveVaultToDisk(creatorId, vault) {
  try {
    const filePath = getVaultFilePath(creatorId);
    fs.writeFileSync(filePath, JSON.stringify(vault, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[CreatorVaultService] Failed to save vault for ${creatorId}:`, e.message);
  }
}

export function createEmptyCreatorVault() {
  return {
    creatorId: null,
    name: null,
    phone: null,
    email: null,
    profilePhoto: null,
    verificationStatus: 'draft',
    rejectionReason: null,
    location: {
      country: 'India',
      state: '',
      district: '',
      city: '',
      pincode: ''
    },
    primaryProfession: null,
    categories: [],
    availabilityStatus: 'available',
    documents: [],
    scoreCard: {
      overallScore: null,
      breakdown: {},
      message: 'Score will appear after your first completed project.'
    },
    adminNotes: null,
    submittedAt: null,
    approvedAt: null,
    kycStatus: 'not_started',
    financialStatus: 'not_started',
    projects: [],
    equipment: [],
    notifications: [],
    chatHistory: [],
    portfolio: [],
    pricing: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getCreatorVault(creatorId) {
  if (!creatorId) return createEmptyCreatorVault();

  const diskVault = loadVaultFromDisk(creatorId);
  if (diskVault) {
    return diskVault;
  }

  const newVault = createEmptyCreatorVault();
  saveVaultToDisk(creatorId, newVault);
  return newVault;
}

export function updateCreatorVault(creatorId, partialData = {}) {
  if (!creatorId) return createEmptyCreatorVault();

  const currentVault = getCreatorVault(creatorId);
  let updated = false;

  for (const [key, value] of Object.entries(partialData)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.trim() !== '') {
        currentVault[key] = value.trim();
        updated = true;
      } else if (Array.isArray(value) || typeof value === 'object') {
        currentVault[key] = value;
        updated = true;
      }
    }
  }

  if (updated) {
    currentVault.updatedAt = new Date().toISOString();
  }

  saveVaultToDisk(creatorId, currentVault);
  return currentVault;
}

export function clearCreatorVault(creatorId) {
  if (creatorId) {
    try {
      const filePath = getVaultFilePath(creatorId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn(`[CreatorVaultService] Failed to clear vault for ${creatorId}:`, e.message);
    }
  }
}

export function getAllCreatorVaults() {
  const vaults = [];
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
            const vault = JSON.parse(raw);
            vaults.push({ creatorId: file.replace('.json', ''), vault });
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('[CreatorVaultService] Failed to list vaults:', e.message);
  }
  return vaults;
}

export function creatorExists(creatorId) {
  const filePath = getVaultFilePath(creatorId);
  return fs.existsSync(filePath);
}
