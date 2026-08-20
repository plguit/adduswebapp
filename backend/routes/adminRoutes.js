import express from 'express';
import { getBusinessVault, getAllVaults, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateToken } from '../utils/tokenService.js';
import { getObservations, getObservationStats, clearObservations } from '../services/observationStore.js';
import { auditStore } from '../services/auditStore.js';
import {
  getAllCreatorProfiles,
  getCreatorProfile,
  approveCreator,
  rejectCreator,
  blockCreator,
  unblockCreator,
  deleteCreator
} from '../services/creatorService.js';
import { urlAnalysisStore } from '../services/urlAnalysisStore.js';

const router = express.Router();

// Public admin login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Invalid credentials.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ error: 'Admin credentials are not configured on the server.' });
  }

  if (email === adminEmail && password === adminPassword) {
    const adminUserId = `admin_${adminEmail}`;
    const token = generateToken({ userId: adminUserId, role: 'ADMIN' });
    return res.json({ success: true, token, userId: adminUserId, role: 'ADMIN', expiresIn: '7d' });
  }
  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

// All admin routes below require ADMIN role
router.use(requireAuth, requireRole(['ADMIN']));

// All Business Vaults — for admin dashboard
router.get('/vaults', (req, res) => {
  const vaults = getAllVaults();
  res.json({ success: true, vaults });
});

router.get('/users', (req, res) => {
  const vaults = getAllVaults();
  const users = vaults
    .map(({ userId, vault }) => ({
      userId: vault.userId || userId,
      name: vault.name || null,
      phoneNumber: vault.phoneNumber || null,
      email: vault.email || null,
      authProvider: vault.authProvider || null,
      onboardingStatus: vault.onboardingStatus || null,
      businessName: vault.businessName || null,
      industry: vault.industry || null,
      businessStage: vault.businessStage || null,
      businessDescription: vault.businessDescription || null,
      services: vault.services || [],
      products: vault.products || [],
      targetAudience: vault.targetAudience || null,
      projects: vault.projects || [],
      chatHistory: vault.chatHistory || [],
      uploadedFiles: vault.uploadedFiles || [],
      notifications: vault.notifications || [],
      expertReviewStatus: vault.expertReviewStatus || null,
      expertReviewSubmittedAt: vault.expertReviewSubmittedAt || null,
      expertReviewCompletedAt: vault.expertReviewCompletedAt || null,
      expertNotes: vault.expertNotes || null,
      createdAt: vault.createdAt || null,
      lastLoginAt: vault.lastLoginAt || null,
      lastUpdated: vault.lastUpdated || null,
      aiConfidenceScore: vault.aiConfidenceScore || null,
      websiteUrl: vault.websiteUrl || null,
      websiteAnalyzedAt: vault.websiteAnalyzedAt || null,
      websiteEvidenceCount: (vault.websiteEvidenceItems || []).length,
      summary: vault.summary || null,
      summaryProvenance: vault.summaryProvenance || null,
      summaryConfidence: vault.summaryConfidence || null,
      discoveredAssets: vault.discoveredAssets || [],
      aiUsed: vault.aiUsed || null,
      aiTriggerReason: vault.aiTriggerReason || null,
      fieldProvenance: vault.fieldProvenance || {},
      durableFactsCount: (vault.memory?.durableFacts || []).length
    }))
    .filter(u => u.name || u.email || u.phoneNumber || u.businessName || (u.projects && u.projects.length > 0));
  res.json({ success: true, users });
});

router.get('/notifications', (req, res) => {
  const vaults = getAllVaults();
  const allNotifications = [];
  for (const { userId, vault } of vaults) {
    const userName = vault.name || vault.phoneNumber || vault.email || userId;
    for (const n of (vault.notifications || [])) {
      allNotifications.push({ ...n, userId, userName });
    }
  }
  allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, notifications: allNotifications });
});

router.get('/expert-reviews', (req, res) => {
  const vaults = getAllVaults();
  const pending = vaults
    .filter(({ vault }) => vault.expertReviewStatus === 'pending' || !vault.expertReviewStatus)
    .filter(({ vault }) => vault.businessBrain && Object.keys(vault.businessBrain || {}).length > 0)
    .map(({ userId, vault }) => ({
      userId: vault.userId || userId,
      businessBrain: vault.businessBrain || {},
      expertReviewStatus: vault.expertReviewStatus || null,
      expertReviewSubmittedAt: vault.expertReviewSubmittedAt || null,
      name: vault.name || null,
      phoneNumber: vault.phoneNumber || null,
      email: vault.email || null,
      businessName: vault.businessName || null,
      industry: vault.industry || null
    }));
  res.json({ success: true, reviews: pending });
});

router.get('/projects', (req, res) => {
  const vaults = getAllVaults();
  const allProjects = [];
  for (const { userId, vault } of vaults) {
    for (const p of (vault.projects || [])) {
      allProjects.push({ ...p, userId: vault.userId || userId });
    }
  }
  allProjects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ success: true, projects: allProjects });
});

router.get('/analytics', (req, res) => {
  const vaults = getAllVaults();
  const stats = {
    totalBusinesses: vaults.length,
    totalProjects: vaults.reduce((sum, { vault }) => sum + (vault.projects || []).length, 0),
    pendingReviews: vaults.filter(({ vault }) => vault.expertReviewStatus === 'pending' || !vault.expertReviewStatus).length,
    completedReviews: vaults.filter(({ vault }) => vault.expertReviewStatus === 'completed').length,
    industries: {}
  };
  for (const { vault } of vaults) {
    const ind = vault.industry || 'Unknown';
    stats.industries[ind] = (stats.industries[ind] || 0) + 1;
  }
  res.json({ success: true, analytics: stats });
});

router.post('/expert-review/:userId', (req, res) => {
  const { userId } = req.params;
  const { status, notes } = req.body || {};
  const allowed = ['pending', 'completed', 'approved', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid expert review status' });
  }
  const isApproved = status === 'completed' || status === 'approved';
  const isRejected = status === 'rejected';

  const vault = getBusinessVault(userId);
  const notifs = vault.notifications || [];
  if (isApproved) {
    notifs.push({
      id: `notif_${Date.now()}`,
      title: '🎉 Business Profile Approved',
      message: notes || 'Your business profile and onboarding have been reviewed and approved by our expert creative directors.',
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (isRejected) {
    notifs.push({
      id: `notif_${Date.now()}`,
      title: '⚠️ Profile Not Approved',
      message: notes || 'Your business onboarding submission was not approved by our review team. Please review notes or contact support.',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  const updated = updateBusinessVault(userId, {
    expertReviewStatus: isApproved ? 'completed' : (isRejected ? 'rejected' : 'pending'),
    approvalStatus: isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending'),
    onboardingStatus: isRejected ? 'rejected' : (vault.onboardingStatus || 'completed'),
    expertNotes: notes || '',
    notifications: notifs,
    ...(isApproved || isRejected ? { expertReviewCompletedAt: new Date().toISOString() } : {}),
    ...(status === 'pending' ? { expertReviewSubmittedAt: new Date().toISOString() } : {})
  });
  res.json({ success: true, profile: updated });
});

router.post('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const patch = req.body || {};
  const allowedFields = ['name', 'phoneNumber', 'email', 'onboardingStatus', 'approvalStatus', 'expertReviewStatus', 'businessName', 'industry', 'businessStage', 'businessDescription', 'products', 'services', 'targetAudience', 'websiteUrl', 'status', 'blocked'];
  const cleanPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (allowedFields.includes(key)) {
      cleanPatch[key] = value;
    }
  }
  const updated = updateBusinessVault(userId, cleanPatch);
  res.json({ success: true, profile: updated });
});

router.post('/user/:userId/block', (req, res) => {
  const { userId } = req.params;
  const updated = updateBusinessVault(userId, { blocked: true, status: 'blocked', approvalStatus: 'rejected' });
  auditStore.log('BLOCK_USER', req.auth?.userId || 'admin', 'AdminBusinessesTab', 'User', { userId, entity: 'user' });
  res.json({ success: true, profile: updated });
});

router.post('/user/:userId/unblock', (req, res) => {
  const { userId } = req.params;
  const updated = updateBusinessVault(userId, { blocked: false, status: 'active', approvalStatus: 'approved' });
  auditStore.log('UNBLOCK_USER', req.auth?.userId || 'admin', 'AdminBusinessesTab', 'User', { userId, entity: 'user' });
  res.json({ success: true, profile: updated });
});

    res.json({ success: true, message: 'User deleted permanently' });
  } catch (err) {
    auditStore.logError('DELETE_USER_FAILED', req.auth?.userId || 'admin', 'AdminBusinessesTab', 'User', err, { userId, entity: 'user' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/onboarding/:userId/approve', (req, res) => {
  const { userId } = req.params;
  const updated = updateBusinessVault(userId, {
    onboardingStatus: 'completed',
    verified: true,
    phoneVerified: true,
    emailVerified: true,
    approvedAt: new Date().toISOString(),
    approvedBy: req.auth?.userId || 'admin'
  });
  auditStore.log('APPROVE_ONBOARDING', req.auth?.userId || 'admin', 'AdminBusinessesTab', 'User', { userId, entity: 'user' });
  res.json({ success: true, profile: updated });
});

router.post('/onboarding/:userId/reject', (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body || {};
  const updated = updateBusinessVault(userId, {
    onboardingStatus: 'rejected',
    verified: false,
    phoneVerified: false,
    emailVerified: false,
    rejectionReason: reason || 'Onboarding rejected by admin',
    rejectedAt: new Date().toISOString(),
    rejectedBy: req.auth?.userId || 'admin'
  });
  auditStore.log('REJECT_ONBOARDING', req.auth?.userId || 'admin', 'AdminBusinessesTab', 'User', { userId, reason, entity: 'user' });
  res.json({ success: true, profile: updated });
});

// ─────────────────────────────────────────────────────────
// Admin Chat Room
// ─────────────────────────────────────────────────────────

router.get('/chat/messages', (req, res) => {
  const { userId, conversationId } = req.query;
  const vaults = getAllVaults();
  const allMessages = [];
  
  for (const { userId: vaultUserId, vault } of vaults) {
    const messages = vault.chatMessages || [];
    const filtered = userId 
      ? messages.filter(m => m.senderId === userId || m.recipientId === userId)
      : messages;
    
    for (const msg of filtered) {
      allMessages.push({
        ...msg,
        vaultUserId,
        businessName: vault.businessName || null,
        userName: vault.name || null
      });
    }
  }
  
  allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json({ success: true, messages: allMessages });
});

router.post('/chat/send', (req, res) => {
  const { recipientId, content, conversationId, senderId: bodySenderId, senderName: bodySenderName } = req.body || {};
  const authUserId = req.auth?.userId || 'admin';
  const senderId = bodySenderId || authUserId;
  const isCustomerSender = recipientId === 'admin' || (conversationId && conversationId.startsWith('admin_') && senderId !== 'admin');
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    senderId,
    senderRole: isCustomerSender ? 'CUSTOMER' : 'ADMIN',
    senderName: bodySenderName || (isCustomerSender ? 'Customer' : 'Admin Team'),
    recipientId: recipientId || 'admin',
    recipientRole: isCustomerSender ? 'ADMIN' : 'CUSTOMER',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    deleted: false,
    conversationId: conversationId || (isCustomerSender ? `admin_${senderId}` : `admin_${recipientId}`)
  };
  
  // 1. If message is sent to a specific customer (Admin replying to customer)
  if (!isCustomerSender && recipientId && recipientId !== 'admin' && recipientId !== 'global') {
    const vault = getBusinessVault(recipientId);
    const messages = vault.chatMessages || [];
    messages.push(message);

    const chatHistory = vault.chatHistory || [];
    chatHistory.push({
      id: message.id,
      sender: 'admin',
      role: 'admin',
      senderName: 'Admin Team',
      text: content.trim(),
      timestamp: message.timestamp
    });

    const notifs = vault.notifications || [];
    notifs.push({
      id: `notif_${Date.now()}`,
      title: 'Message from ADDUS Team',
      message: content.trim().length > 80 ? content.trim().slice(0, 77) + '...' : content.trim(),
      read: false,
      createdAt: message.timestamp
    });

    updateBusinessVault(recipientId, { chatMessages: messages, chatHistory, notifications: notifs });
  }

  // 2. If message is sent by a customer to Admin
  if (isCustomerSender && senderId && senderId !== 'admin') {
    const vault = getBusinessVault(senderId);
    const messages = vault.chatMessages || [];
    messages.push(message);

    const chatHistory = vault.chatHistory || [];
    chatHistory.push({
      id: message.id,
      sender: 'user',
      role: 'user',
      senderName: bodySenderName || vault.businessName || 'Customer',
      text: content.trim(),
      timestamp: message.timestamp
    });

    updateBusinessVault(senderId, { chatMessages: messages, chatHistory });
  }
  
  auditStore.log('SEND_CHAT_MESSAGE', senderId, 'AdminChatTab', 'ChatMessage', { messageId: message.id, recipientId, conversationId, entity: 'chat' });
  res.json({ success: true, message });
});

router.delete('/chat/message/:messageId', (req, res) => {
  const { messageId } = req.params;
  const vaults = getAllVaults();
  
  for (const { userId, vault } of vaults) {
    const messages = (vault.chatMessages || []).map(m => {
      if (m.id === messageId) {
        return { ...m, deleted: true, deletedBy: req.auth.userId, deletedAt: new Date().toISOString() };
      }
      return m;
    });
    if (messages !== vault.chatMessages) {
      updateBusinessVault(userId, { chatMessages: messages });
    }
  }
  
  auditStore.log('DELETE_CHAT_MESSAGE', req.auth?.userId || 'admin', 'AdminChatTab', 'ChatMessage', { messageId, entity: 'chat' });
  res.json({ success: true, message: 'Message deleted' });
});

router.post('/chat/restrict', (req, res) => {
  const { userId } = req.params;
  const { restricted } = req.body || {};
  const updated = updateBusinessVault(userId, {
    chatRestricted: restricted !== false,
    chatRestrictedAt: restricted !== false ? new Date().toISOString() : null
  });
  res.json({ success: true, profile: updated });
});

// ─────────────────────────────────────────────────────────
// Admin Observation Room
// ─────────────────────────────────────────────────────────

router.get('/observations', (req, res) => {
  const filters = {
    category: req.query.category,
    userId: req.query.userId,
    businessId: req.query.businessId,
    status: req.query.status,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 100
  };

  const observations = getObservations(filters);
  res.json({ success: true, observations, count: observations.length });
});

router.get('/observations/stats', (req, res) => {
  const stats = getObservationStats();
  res.json({ success: true, stats });
});

router.delete('/observations', (req, res) => {
  clearObservations();
  res.json({ success: true, message: 'Observation log cleared' });
});

// ─────────────────────────────────────────────────────────
// Admin Bulk Onboarding
// ─────────────────────────────────────────────────────────

router.get('/onboarding/template', (req, res) => {
  const csv = `Name,Phone,Email,Industry,BusinessName,BusinessDescription,Website,Stage,Products,Services,TargetAudience,GeographicMarket\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=addus_onboarding_template.csv');
  res.send(csv);
});

router.post('/onboarding/bulk', (req, res) => {
  const { users } = req.body || [];
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'users array is required' });
  }

  const results = [];
  for (const u of users.slice(0, 100)) {
    try {
      const userId = u.phone ? `customer_${u.phone.replace(/\D/g, '')}` : (u.email ? `customer_${u.email.replace(/[^a-zA-Z0-9]/g, '_')}` : `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
      
      const vault = updateBusinessVault(userId, {
        userId,
        name: u.name || null,
        phoneNumber: u.phone || null,
        email: u.email || null,
        businessName: u.businessName || null,
        industry: u.industry || null,
        businessDescription: u.businessDescription || null,
        websiteUrl: u.website || null,
        businessStage: u.stage || 'Growing',
        products: u.products ? u.products.split(',').map(s => s.trim()) : [],
        services: u.services ? u.services.split(',').map(s => s.trim()) : [],
        targetAudience: u.targetAudience || null,
        geographicMarket: u.geographicMarket || null,
        onboardingStatus: 'completed',
        verified: true,
        phoneVerified: !!u.phone,
        emailVerified: !!u.email,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      results.push({ userId, status: 'success', businessName: vault.businessName });
    } catch (err) {
      results.push({ userId: u.phone || u.email || 'unknown', status: 'error', error: err.message });
    }
  }

  res.json({ success: true, results, total: results.length, successful: results.filter(r => r.status === 'success').length });
  auditStore.log('BULK_ONBOARD', req.auth?.userId || 'admin', 'AdminOnboardingTab', 'User', { total: results.length, successful: results.filter(r => r.status === 'success').length, entity: 'user' });
});

// ─────────────────────────────────────────────────────────
// Admin Push Notifications
// ─────────────────────────────────────────────────────────

router.post('/push/send', (req, res) => {
  const { userIds, title, message, deepLink } = req.body || {};
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const targets = Array.isArray(userIds) ? userIds : [];
  const results = [];

  if (targets.length === 0) {
    const vaults = getAllVaults();
    for (const { userId, vault } of vaults) {
      if (vault.blocked === true) continue;
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId,
        type: 'admin_push',
        title,
        message,
        unread: true,
        priority: 'high',
        createdAt: new Date().toISOString(),
        deepLink: deepLink || '/#'
      };
      const updated = updateBusinessVault(userId, {
        notifications: [...(vault.notifications || []), notif]
      });
      results.push({ userId, status: 'sent' });
    }
  } else {
    for (const uid of targets) {
      const vault = getBusinessVault(uid);
      if (vault.blocked === true) {
        results.push({ userId: uid, status: 'skipped', reason: 'blocked' });
        continue;
      }
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: uid,
        type: 'admin_push',
        title,
        message,
        unread: true,
        priority: 'high',
        createdAt: new Date().toISOString(),
        deepLink: deepLink || '/#'
      };
      const updated = updateBusinessVault(uid, {
        notifications: [...(vault.notifications || []), notif]
      });
      results.push({ userId: uid, status: 'sent' });
    }
  }

  auditStore.log('SEND_PUSH_NOTIFICATION', req.auth?.userId || 'admin', 'AdminPushTab', 'Notification', { title, targetCount: results.length, sentCount: results.filter(r => r.status === 'sent').length, entity: 'notification' });
  res.json({ success: true, results, totalSent: results.filter(r => r.status === 'sent').length });
});

// ─────────────────────────────────────────────────────────
// Admin Creator Management
// ─────────────────────────────────────────────────────────

router.get('/creators', (req, res) => {
  const filters = {
    status: req.query.status,
    search: req.query.search,
    profession: req.query.profession,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    blocked: req.query.blocked !== undefined ? req.query.blocked === 'true' : undefined
  };

  const profiles = getAllCreatorProfiles(filters);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const start = (page - 1) * limit;
  const paginated = profiles.slice(start, start + limit);

  res.json({
    success: true,
    creators: paginated,
    total: profiles.length,
    page,
    totalPages: Math.ceil(profiles.length / limit)
  });
});

router.get('/creators/:creatorId', (req, res) => {
  const profile = getCreatorProfile(req.params.creatorId);
  if (!profile) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/approve', (req, res) => {
  const { adminId } = req.body || {};
  const profile = approveCreator(req.params.creatorId, adminId || req.auth.userId);
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/reject', (req, res) => {
  const { reason, adminId } = req.body || {};
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  const profile = rejectCreator(req.params.creatorId, reason, adminId || req.auth.userId);
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/kyc-approve', (req, res) => {
  const profile = updateCreatorProfile(req.params.creatorId, {
    kycStatus: 'approved',
    kycApprovedAt: new Date().toISOString()
  });
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/kyc-reject', (req, res) => {
  const { reason } = req.body || {};
  const profile = updateCreatorProfile(req.params.creatorId, {
    kycStatus: 'rejected',
    kycRejectionReason: reason || 'KYC documents rejected'
  });
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/financial-approve', (req, res) => {
  const profile = updateCreatorProfile(req.params.creatorId, {
    financialStatus: 'approved',
    financialApprovedAt: new Date().toISOString()
  });
  res.json({ success: true, profile });
});

router.delete('/creators/:creatorId', (req, res) => {
  deleteCreator(req.params.creatorId);
  res.json({ success: true, message: 'Creator deleted permanently' });
});

router.post('/creators/:creatorId/block', (req, res) => {
  const { adminId } = req.body || {};
  const profile = blockCreator(req.params.creatorId, adminId || req.auth.userId);
  res.json({ success: true, profile });
});

router.post('/creators/:creatorId/unblock', (req, res) => {
  const { adminId } = req.body || {};
  const profile = unblockCreator(req.params.creatorId, adminId || req.auth.userId);
  res.json({ success: true, profile });
});

router.get('/creators/template', (req, res) => {
  const csv = `CreatorID,Name,Phone,Email,Location,Profession,Status,CreatedAt\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=addus_creators_template.csv');
  res.send(csv);
});

router.post('/creators/bulk', (req, res) => {
  const { creators } = req.body || [];
  if (!Array.isArray(creators) || creators.length === 0) {
    return res.status(400).json({ error: 'creators array is required' });
  }

  const results = [];
  for (const c of creators.slice(0, 100)) {
    try {
      const creatorId = c.phone ? `ACRA${String(c.phone).replace(/\D/g, '').slice(-6)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}` : `ACRA${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const vault = updateCreatorVault(creatorId, {
        creatorId,
        name: c.name || null,
        phone: c.phone || null,
        email: c.email || null,
        location: c.location || null,
        primaryProfession: c.profession || null,
        verificationStatus: c.status || 'draft',
        createdAt: new Date().toISOString()
      });
      results.push({ creatorId, status: 'success', name: vault.name });
    } catch (err) {
      results.push({ creatorId: c.phone || c.email || 'unknown', status: 'error', error: err.message });
    }
  }

  res.json({ success: true, results, total: results.length, successful: results.filter(r => r.status === 'success').length });
});

router.get('/creators/reports', (req, res) => {
  const filters = {
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    status: req.query.status
  };

  const profiles = getAllCreatorProfiles(filters);

  const report = {
    total: profiles.length,
    byStatus: {},
    byProfession: {},
    byKycStatus: {},
    byFinancialStatus: {},
    generatedAt: new Date().toISOString()
  };

  for (const p of profiles) {
    const status = p.verificationStatus || 'unknown';
    report.byStatus[status] = (report.byStatus[status] || 0) + 1;

    const prof = p.primaryProfession || 'unknown';
    report.byProfession[prof] = (report.byProfession[prof] || 0) + 1;

    const kyc = p.kycStatus || 'not_started';
    report.byKycStatus[kyc] = (report.byKycStatus[kyc] || 0) + 1;

    const fin = p.financialStatus || 'not_started';
    report.byFinancialStatus[fin] = (report.byFinancialStatus[fin] || 0) + 1;
  }

  res.json({ success: true, report });
});

router.get('/audit-logs', (req, res) => {
  const filters = {
    user: req.query.user,
    component: req.query.component,
    action: req.query.action,
    entity: req.query.entity,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    limit: req.query.limit || 100
  };
  const logs = auditStore.getAll(filters);
  res.json({ success: true, logs, count: logs.length });
});

router.get('/audit-logs/stats', (req, res) => {
  const stats = auditStore.getStats();
  res.json({ success: true, stats });
});

router.delete('/audit-logs', (req, res) => {
  auditStore.clear();
  res.json({ success: true, message: 'Audit logs cleared' });
});

// ─────────────────────────────────────────────────────────
// URL Analysis Activity Log — Admin Observability
// Isolated from customer/business lifecycle
// ─────────────────────────────────────────────────────────

router.get('/url-analysis', (req, res) => {
  const filters = {
    status: req.query.status || null,
    website_classification: req.query.website_classification || null,
    analysis_method: req.query.analysis_method || null,
    failure_category: req.query.failure_category || null,
    domain: req.query.domain || null,
    user_id: req.query.user_id || null,
    business_id: req.query.business_id || null,
    q: req.query.q || null,
    fromDate: req.query.fromDate || null,
    toDate: req.query.toDate || null,
    sortField: req.query.sortField || 'submitted_at',
    sortDir: req.query.sortDir || 'desc',
    page: req.query.page || 1,
    limit: req.query.limit || 50
  };

  const result = urlAnalysisStore.getAll(filters);
  res.json({ success: true, ...result });
});

router.get('/url-analysis/stats', (req, res) => {
  const stats = urlAnalysisStore.getStats();
  res.json({ success: true, stats });
});

router.get('/url-analysis/:id', (req, res) => {
  const entry = urlAnalysisStore.getById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'URL analysis log not found' });
  }
  res.json({ success: true, entry });
});

export default router;
