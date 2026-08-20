/**
 * ADDUS Platform — Creator Service
 *
 * Core creator CRUD operations and business logic.
 */

import { getCreatorVault, updateCreatorVault, getAllCreatorVaults, clearCreatorVault, creatorExists } from './creatorVaultService.js';
import { createAuditEntry, appendAuditTrail } from './auditLogger.js';

export function createCreatorProfile({ creatorId, phone, email, authType }) {
  const vault = getCreatorVault(creatorId);
  vault.creatorId = creatorId;
  vault.phone = phone || null;
  vault.email = email || null;
  vault.authType = authType;
  vault.createdAt = new Date().toISOString();
  vault.updatedAt = new Date().toISOString();

  const audit = createAuditEntry({
    userId: creatorId,
    action: 'creator_created',
    status: 'SUCCESS'
  });
  appendAuditTrail(vault, audit);

  updateCreatorVault(creatorId, vault);
  return vault;
}

export function getCreatorProfile(creatorId) {
  return getCreatorVault(creatorId);
}

export function getAllCreatorProfiles(filters = {}) {
  const vaults = getAllCreatorVaults();
  let profiles = vaults.map(({ creatorId, vault }) => ({ ...vault, creatorId }));

  if (filters.status) {
    profiles = profiles.filter(p => p.verificationStatus === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    profiles = profiles.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.creatorId && p.creatorId.toLowerCase().includes(q))
    );
  }

  if (filters.profession) {
    profiles = profiles.filter(p => p.primaryProfession === filters.profession);
  }

  if (filters.fromDate) {
    const from = new Date(filters.fromDate);
    profiles = profiles.filter(p => new Date(p.createdAt) >= from);
  }

  if (filters.toDate) {
    const to = new Date(filters.toDate);
    to.setHours(23, 59, 59, 999);
    profiles = profiles.filter(p => new Date(p.createdAt) <= to);
  }

  if (filters.blocked !== undefined) {
    profiles = profiles.filter(p => p.blocked === filters.blocked);
  }

  return profiles;
}

export function updateCreatorProfile(creatorId, updates, actor = 'self') {
  const vault = getCreatorVault(creatorId);
  const allowedFields = [
    'name', 'phone', 'email', 'profilePhoto', 'location',
    'primaryProfession', 'categories', 'availabilityStatus',
    'documents', 'equipment', 'portfolio', 'pricing', 'scoreCard',
    'adminNotes', 'verificationStatus', 'rejectionReason',
    'submittedAt', 'approvedAt', 'kycStatus', 'financialStatus',
    'projects', 'notifications', 'chatHistory', 'blocked'
  ];

  const cleanUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      cleanUpdates[key] = value;
    }
  }

  const updated = updateCreatorVault(creatorId, cleanUpdates);

  const audit = createAuditEntry({
    userId: creatorId,
    action: 'creator_profile_updated',
    status: 'SUCCESS',
    data: cleanUpdates
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function submitCreatorForReview(creatorId) {
  const vault = getCreatorVault(creatorId);
  const updated = updateCreatorVault(creatorId, {
    verificationStatus: 'submitted',
    submittedAt: new Date().toISOString()
  });

  const audit = createAuditEntry({
    userId: creatorId,
    action: 'creator_submitted_for_review',
    status: 'SUCCESS'
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function approveCreator(creatorId, adminId = 'admin') {
  const vault = getCreatorVault(creatorId);
  const updated = updateCreatorVault(creatorId, {
    verificationStatus: 'approved',
    approvedAt: new Date().toISOString(),
    adminNotes: `Approved by ${adminId}`
  });

  const audit = createAuditEntry({
    userId: creatorId,
    actor: adminId,
    action: 'creator_approved',
    status: 'SUCCESS'
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function rejectCreator(creatorId, reason, adminId = 'admin') {
  const vault = getCreatorVault(creatorId);
  const updated = updateCreatorVault(creatorId, {
    verificationStatus: 'rejected',
    rejectionReason: reason,
    adminNotes: `Rejected by ${adminId}: ${reason}`
  });

  const audit = createAuditEntry({
    userId: creatorId,
    actor: adminId,
    action: 'creator_rejected',
    status: 'SUCCESS',
    data: { reason }
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function blockCreator(creatorId, adminId = 'admin') {
  const vault = getCreatorVault(creatorId);
  const updated = updateCreatorVault(creatorId, {
    blocked: true,
    adminNotes: `Blocked by ${adminId}`
  });

  const audit = createAuditEntry({
    userId: creatorId,
    actor: adminId,
    action: 'creator_blocked',
    status: 'SUCCESS'
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function unblockCreator(creatorId, adminId = 'admin') {
  const vault = getCreatorVault(creatorId);
  const updated = updateCreatorVault(creatorId, {
    blocked: false,
    adminNotes: `Unblocked by ${adminId}`
  });

  const audit = createAuditEntry({
    userId: creatorId,
    actor: adminId,
    action: 'creator_unblocked',
    status: 'SUCCESS'
  });
  appendAuditTrail(updated, audit);

  return updated;
}

export function deleteCreator(creatorId) {
  clearCreatorVault(creatorId);
}

export function addNotificationToCreator(creatorId, notification) {
  const vault = getCreatorVault(creatorId);
  const notifications = vault.notifications || [];
  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...notification,
    createdAt: new Date().toISOString()
  };
  return updateCreatorVault(creatorId, {
    notifications: [...notifications, newNotification]
  });
}

export function addMessageToCreator(creatorId, message) {
  const vault = getCreatorVault(creatorId);
  const chatHistory = vault.chatHistory || [];
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    ...message,
    timestamp: new Date().toISOString()
  };
  return updateCreatorVault(creatorId, {
    chatHistory: [...chatHistory, newMessage]
  });
}
