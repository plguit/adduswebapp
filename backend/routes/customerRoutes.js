import express from 'express';
import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { requireAuth, requireActiveUser, requireOwnership } from '../middleware/auth.js';

const router = express.Router();

// All customer routes require authentication and active status
router.use(requireAuth);
router.use(requireActiveUser);

// Customer Profile Endpoint — reads from backend vault (canonical source)
router.get('/profile/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const vault = getBusinessVault(userId);
  res.json({
    success: true,
    userId,
    profile: {
      businessName: vault.businessName || null,
      industry: vault.industry || null,
      businessStage: vault.businessStage || null,
      businessDescription: vault.businessDescription || null,
      products: vault.products || [],
      services: vault.services || [],
      targetAudience: vault.targetAudience || null,
      website: vault.websiteUrl || vault.brandAssets?.website || null,
      businessBrain: {
        businessName: vault.businessName || null,
        industry: vault.industry || null,
        businessStage: vault.businessStage || null,
        businessDescription: vault.businessDescription || null,
        products: vault.products || [],
        services: vault.services || [],
        targetAudience: vault.targetAudience || null,
        website: vault.websiteUrl || null,
        addiRecommendations: vault.addiRecommendations || null,
        addiRecommendationsGeneratedAt: vault.addiRecommendationsGeneratedAt || null,
        websiteEvidenceItems: vault.websiteEvidenceItems || [],
        websiteRetrievalMeta: vault.websiteRetrievalMeta || null
      }
    }
  });
});

// Customer Profile Update Endpoint — syncs customer data to backend vault
router.post('/profile/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const { profile } = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'profile object is required.' });
  }

  const vaultPatch = {
    businessName: profile.businessName || profile.businessBrain?.businessName || undefined,
    industry: profile.industry || profile.businessBrain?.industry || undefined,
    businessStage: profile.businessStage || profile.businessBrain?.businessStage || undefined,
    businessDescription: profile.businessDescription || profile.businessBrain?.businessDescription || undefined,
    products: profile.products || profile.businessBrain?.products || undefined,
    services: profile.services || profile.businessBrain?.services || undefined,
    targetAudience: profile.targetAudience || profile.businessBrain?.targetAudience || undefined,
    websiteUrl: profile.website || profile.businessBrain?.website || undefined,
    addiRecommendations: profile.businessBrain?.addiRecommendations || undefined,
    addiRecommendationsGeneratedAt: profile.businessBrain?.addiRecommendationsGeneratedAt || undefined,
    websiteEvidenceItems: profile.businessBrain?.websiteEvidenceItems || undefined,
    websiteRetrievalMeta: profile.businessBrain?.websiteRetrievalMeta || undefined
  };
  Object.keys(vaultPatch).forEach(k => { if (vaultPatch[k] === undefined) delete vaultPatch[k]; });

  const updatedVault = updateBusinessVault(userId, vaultPatch);
  res.json({ success: true, userId, profile: updatedVault });
});

// Customer Projects Endpoint — reads projects from backend vault
router.get('/projects/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const vault = getBusinessVault(userId);
  res.json({ success: true, projects: vault.projects || [] });
});

// Customer Projects Update Endpoint
router.post('/projects/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'projects must be an array.' });
  }
  const updatedVault = updateBusinessVault(userId, { projects });
  res.json({ success: true, projects: updatedVault.projects || [] });
});

// Customer Project Add Endpoint — adds a single project to the existing array
router.post('/project/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const { project } = req.body;
  if (!project || typeof project !== 'object') {
    return res.status(400).json({ error: 'project object is required.' });
  }
  const vault = getBusinessVault(userId);
  const updatedVault = updateBusinessVault(userId, {
    projects: [...(vault.projects || []), project]
  });
  res.json({ success: true, project, projects: updatedVault.projects || [] });
});

// Customer Recommendations Endpoint — reads persisted ADDI recommendations
router.get('/recommendations/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const vault = getBusinessVault(userId);
  res.json({
    success: true,
    recommendations: vault.addiRecommendations || null,
    generatedAt: vault.addiRecommendationsGeneratedAt || null
  });
});

// ── Products ───────────────────────────────────────────────────────────────
router.get('/products/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const vault = getBusinessVault(userId);
  res.json({ success: true, products: vault.products || [] });
});

router.post('/products/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const product = req.body || {};
  if (!product.name || !product.name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  const vault = getBusinessVault(userId);
  const products = [...(vault.products || []), { ...product, productId: product.productId || `PROD_${Date.now()}`, createdAt: new Date().toISOString() }];
  const updated = updateBusinessVault(userId, { products });
  res.json({ success: true, products: updated.products || [] });
});

router.put('/products/:userId/:productId', requireOwnership, (req, res) => {
  const { userId, productId } = req.params;
  const patch = req.body || {};
  const vault = getBusinessVault(userId);
  const products = (vault.products || []).map(p =>
    p.productId === productId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
  );
  const updated = updateBusinessVault(userId, { products });
  res.json({ success: true, products: updated.products || [] });
});

router.delete('/products/:userId/:productId', requireOwnership, (req, res) => {
  const { userId, productId } = req.params;
  const vault = getBusinessVault(userId);
  const products = (vault.products || []).filter(p => p.productId !== productId);
  const updated = updateBusinessVault(userId, { products });
  res.json({ success: true, products: updated.products || [] });
});

// ── Conversations ──────────────────────────────────────────────────────────
router.get('/conversations/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const vault = getBusinessVault(userId);
  res.json({ success: true, conversations: vault.conversations || [] });
});

router.post('/conversations/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const conversation = req.body || {};
  if (!conversation.context) {
    return res.status(400).json({ error: 'Conversation context is required.' });
  }
  const vault = getBusinessVault(userId);
  const conversations = [...(vault.conversations || []), { ...conversation, conversationId: conversation.conversationId || `CONV_${Date.now()}`, createdAt: new Date().toISOString() }];
  const updated = updateBusinessVault(userId, { conversations });
  res.json({ success: true, conversations: updated.conversations || [] });
});

router.put('/conversations/:userId/:conversationId', requireOwnership, (req, res) => {
  const { userId, conversationId } = req.params;
  const patch = req.body || {};
  const vault = getBusinessVault(userId);
  const conversations = (vault.conversations || []).map(c =>
    c.conversationId === conversationId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
  );
  const updated = updateBusinessVault(userId, { conversations });
  res.json({ success: true, conversations: updated.conversations || [] });
});

// ── Customer Chat ──────────────────────────────────────────────────────────
router.get('/chat/messages/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  let vault = getBusinessVault(userId);
  if (!vault || (!vault.chatMessages && !vault.chatHistory)) {
    const all = getAllVaults();
    const normUser = userId.replace(/\D/g, '').slice(-10);
    const matched = all.find(item => {
      const vPhone = (item.vault?.phoneNumber || item.vault?.phone || '').replace(/\D/g, '').slice(-10);
      return item.userId === userId ||
        item.vault?.customerId === userId ||
        (normUser && vPhone && normUser.length === 10 && vPhone.length === 10 && normUser === vPhone);
    });
    if (matched) {
      vault = matched.vault;
    }
  }

  const rawMessages = vault?.chatMessages || [];
  const rawHistory = vault?.chatHistory || [];

  // Merge chatMessages and chatHistory for complete coverage
  const msgMap = new Map();
  rawMessages.forEach(m => {
    const key = m.id || `${m.content || m.text}_${m.timestamp}`;
    msgMap.set(key, {
      id: m.id,
      senderId: m.senderId || (m.role === 'admin' || m.sender === 'admin' ? 'admin' : userId),
      senderRole: m.senderRole || (m.role === 'admin' || m.sender === 'admin' ? 'ADMIN' : 'CUSTOMER'),
      senderName: m.senderName || (m.role === 'admin' || m.sender === 'admin' ? 'Admin Team' : 'You'),
      content: m.content || m.text || '',
      timestamp: m.timestamp || new Date().toISOString()
    });
  });

  rawHistory.forEach((h, idx) => {
    const text = h.text || h.content || '';
    const ts = h.timestamp || new Date().toISOString();
    const key = h.id || `${text}_${ts}`;
    if (!msgMap.has(key)) {
      const isAdmin = h.role === 'admin' || h.sender === 'admin';
      msgMap.set(key, {
        id: h.id || `hist_${idx}`,
        senderId: isAdmin ? 'admin' : (h.sender === 'user' ? userId : 'addi_bot'),
        senderRole: isAdmin ? 'ADMIN' : (h.sender === 'user' ? 'CUSTOMER' : 'AI_STRATEGIST'),
        senderName: h.senderName || (isAdmin ? 'Admin Team' : (h.sender === 'user' ? 'You' : 'ADDI')),
        content: text,
        timestamp: ts
      });
    }
  });

  const messages = Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json({ success: true, messages });
});

router.post('/chat/send/:userId', requireOwnership, (req, res) => {
  const { userId } = req.params;
  const { content, senderName, recipientId } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const vault = getBusinessVault(userId);
  const messages = vault.chatMessages || [];
  const chatHistory = vault.chatHistory || [];

  const newMsg = {
    id: `msg_cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    senderId: userId,
    senderRole: 'CUSTOMER',
    senderName: senderName || vault.name || 'Customer',
    recipientId: recipientId || 'admin',
    recipientRole: 'ADMIN',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    conversationId: `admin_${userId}`
  };

  messages.push(newMsg);
  chatHistory.push({
    id: newMsg.id,
    sender: 'user',
    role: 'user',
    senderName: newMsg.senderName,
    text: newMsg.content,
    timestamp: newMsg.timestamp
  });

  updateBusinessVault(userId, { chatMessages: messages, chatHistory });
  res.json({ success: true, message: newMsg });
});

export default router;
