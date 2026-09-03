import express from 'express';
import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { requireAuth, requireActiveUser, requireOwnership } from '../middleware/auth.js';
import { User, Business, Project } from '../models/index.js';

const router = express.Router();

// All customer routes require authentication and active status
router.use(requireAuth);
router.use(requireActiveUser);

// Customer Profile Endpoint — reads from SQLite
router.get('/profile/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  
  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      business = await Business.create({ ownerUserId: userId, name: null, industry: null });
    }
    
    // Fallback to vault for unstructured businessBrain stuff to not break UI immediately
    const vault = getBusinessVault(userId);

    res.json({
      success: true,
      userId,
      profile: {
        businessName: business.name || vault.businessName || null,
        industry: business.industry || vault.industry || null,
        businessStage: vault.businessStage || null,
        businessDescription: vault.businessDescription || null,
        products: vault.products || [],
        services: vault.services || [],
        targetAudience: vault.targetAudience || null,
        website: vault.websiteUrl || vault.brandAssets?.website || null,
        businessBrain: { ...vault.businessBrain }
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Customer Profile Update Endpoint — syncs customer data to DB
router.post('/profile/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  const { profile } = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'profile object is required.' });
  }

  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      business = await Business.create({ ownerUserId: userId });
    }
    
    business.name = profile.businessName || business.name;
    business.industry = profile.industry || business.industry;
    await business.save();

    // Fallback sync to Vault for non-relational fields
    const vaultPatch = {
      businessName: business.name,
      industry: business.industry,
      businessStage: profile.businessStage,
      businessDescription: profile.businessDescription,
      websiteUrl: profile.website
    };
    Object.keys(vaultPatch).forEach(k => { if (vaultPatch[k] === undefined) delete vaultPatch[k]; });
    updateBusinessVault(userId, vaultPatch);

    if (req.io) req.io.emit('state_updated', { userId });
    res.json({ success: true, userId, profile: business });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Customer Projects Endpoint — reads projects from DB
router.get('/projects/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  
  try {
    const business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      return res.json({ success: true, projects: [] });
    }
    
    const projects = await Project.findAll({ where: { businessId: business.id } });
    
    // Map Sequelize objects to plain JSON for the UI
    const mappedProjects = projects.map(p => ({
      id: p.id,
      service: p.service,
      status: p.status,
      creativeBrief: p.creativeBrief,
      deliverables: p.deliverables
    }));
    
    res.json({ success: true, projects: mappedProjects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Customer Projects Update Endpoint
router.post('/projects/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'projects must be an array.' });
  }
  
  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      business = await Business.create({ ownerUserId: userId });
    }
    
    // For Phase 4, we just iterate and upsert projects
    const savedProjects = [];
    for (const p of projects) {
      let proj = await Project.findOne({ where: { id: p.id } });
      if (!proj) {
        proj = await Project.create({
          id: p.id,
          businessId: business.id,
          service: p.service || 'Unknown',
          status: p.status || 'Draft',
          creativeBrief: p.creativeBrief,
          deliverables: p.deliverables
        });
      } else {
        proj.status = p.status || proj.status;
        proj.creativeBrief = p.creativeBrief || proj.creativeBrief;
        proj.deliverables = p.deliverables || proj.deliverables;
        await proj.save();
      }
      savedProjects.push(proj);
    }
    
    // Fallback array to vault to not break non-migrated UI
    updateBusinessVault(userId, { projects });
    
    if (req.io) req.io.emit('state_updated', { userId });
    res.json({ success: true, projects: savedProjects });
  } catch (err) {
    console.error('Error updating projects:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Customer Project Add Endpoint
router.post('/project/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  const { project } = req.body;
  if (!project || typeof project !== 'object') {
    return res.status(400).json({ error: 'project object is required.' });
  }
  
  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      business = await Business.create({ ownerUserId: userId });
    }
    
    const proj = await Project.create({
      id: project.id || undefined,
      businessId: business.id,
      service: project.service || 'Unknown',
      status: project.status || 'Draft',
      creativeBrief: project.creativeBrief,
      deliverables: project.deliverables
    });
    
    const vault = getBusinessVault(userId);
    const updatedVault = updateBusinessVault(userId, {
      projects: [...(vault.projects || []), project]
    });
    
    if (req.io) req.io.emit('state_updated', { userId });
    res.json({ success: true, project: proj, projects: updatedVault.projects || [] });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).json({ error: 'Database error' });
  }
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
router.get('/chat/messages/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  
  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      return res.json({ success: true, messages: [] });
    }
    
    const dbMessages = await Message.findAll({
      where: { businessId: business.id },
      order: [['timestamp', 'ASC']]
    });

    const messages = dbMessages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderRole: m.senderRole,
      senderName: m.senderName,
      content: m.content,
      timestamp: m.timestamp
    }));
    
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/chat/send/:userId', requireOwnership, async (req, res) => {
  const { userId } = req.params;
  const { content, senderName } = req.body || {};
  
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    let business = await Business.findOne({ where: { ownerUserId: userId } });
    if (!business) {
      business = await Business.create({ ownerUserId: userId });
    }
    
    const newMsg = await Message.create({
      senderId: userId,
      senderRole: 'CUSTOMER',
      senderName: senderName || 'Customer',
      content: content.trim(),
      businessId: business.id
    });
    
    if (req.io) req.io.emit('state_updated', { userId });
    res.json({ success: true, message: newMsg });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

