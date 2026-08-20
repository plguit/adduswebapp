/**
 * ADDUS Platform — Creator Routes
 *
 * Full creator API endpoints for the Creator Onboarding & Operations system.
 */

import express from 'express';
import { requireCreatorAuth, requireActiveCreator, requireCreatorOwnership, requireCreatorRole } from '../middleware/creatorAuth.js';
import { createCreatorProfile, getCreatorProfile, updateCreatorProfile, submitCreatorForReview, getAllCreatorProfiles } from '../services/creatorService.js';
import { getCreatorVault, updateCreatorVault } from '../services/creatorVaultService.js';
import { validateCreatorRegistration, validateCreatorProfileUpdate, validateFullName, validatePhone, validateEmail, validateLocation, validateExperienceRange, validateEquipmentItems, validateSoftwareSelections, validateSpecializationSelections, validateDocumentType, validateFileUpload, validateCreatorId, validatePincode, validateEquipmentItem, validateDocument, DOCUMENT_TYPES, AVAILABILITY_STATUSES } from '../validation/creatorValidation.js';
import { generateToken, verifyToken, extractBearerToken } from '../utils/tokenService.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────

router.post('/register', (req, res) => {
  const { phone, email, authType, name } = req.body || {};

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email is required' });
  }

  const authTypeFinal = authType || (phone ? 'mobile' : 'email');
  const identifier = phone || email;

  const existingVaults = getAllCreatorProfiles();
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const existing = existingVaults.find(v =>
    (cleanPhone && v.phone === cleanPhone) ||
    (cleanEmail && v.email === cleanEmail)
  );
  if (existing) {
    return res.status(409).json({ error: 'Already registered with this phone or email. Please login.' });
  }

  const nameValidation = name ? validateFullName(name) : { valid: true };
  if (name && !nameValidation.valid) {
    return res.status(400).json({ error: nameValidation.error });
  }

  const phoneValidation = cleanPhone ? validatePhone(cleanPhone) : { valid: true };
  if (cleanPhone && !phoneValidation.valid) {
    return res.status(400).json({ error: phoneValidation.error });
  }

  const emailValidation = cleanEmail ? validateEmail(cleanEmail) : { valid: true };
  if (cleanEmail && !emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }

  const creatorId = `ACRA${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  const vault = createCreatorProfile({
    creatorId,
    phone: phoneValidation.valid ? phoneValidation.value : cleanPhone,
    email: emailValidation.valid ? emailValidation.value : cleanEmail,
    authType: authTypeFinal,
    name: nameValidation.valid ? (nameValidation.value || null) : null
  });

  res.status(201).json({
    success: true,
    creatorId: vault.creatorId,
    verificationStatus: vault.verificationStatus,
    message: 'Creator profile created. Please complete your registration.'
  });
});

router.post('/login', (req, res) => {
  const { phone, email } = req.body || {};

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email is required' });
  }

  const vaults = getAllCreatorProfiles();
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  const matched = vaults.find(v =>
    (cleanPhone && v.phone === cleanPhone) ||
    (cleanEmail && v.email === cleanEmail)
  );

  if (!matched) {
    return res.status(404).json({ error: 'Creator not found. Please register first.' });
  }

  const token = generateToken({
    userId: matched.creatorId,
    role: 'CREATOR',
    creatorId: matched.creatorId
  });

  res.json({
    success: true,
    token,
    creatorId: matched.creatorId,
    role: 'CREATOR',
    expiresIn: '7d',
    profile: {
      creatorId: matched.creatorId,
      name: matched.name || null,
      phone: matched.phone || null,
      email: matched.email || null,
      verificationStatus: matched.verificationStatus,
      primaryProfession: matched.primaryProfession || null,
      availabilityStatus: matched.availabilityStatus || 'available',
      blocked: matched.blocked || false
    }
  });
});

router.post('/refresh', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid token' });
  }

  if (result.payload.role !== 'CREATOR') {
    return res.status(403).json({ error: 'Creator access required' });
  }

  const newToken = generateToken({
    userId: result.payload.userId,
    role: 'CREATOR',
    creatorId: result.payload.creatorId
  });

  res.json({
    success: true,
    token: newToken,
    creatorId: result.payload.creatorId,
    role: 'CREATOR',
    expiresIn: '7d'
  });
});

// ─────────────────────────────────────────────────────────
// Authenticated Creator Routes
// ─────────────────────────────────────────────────────────

router.get('/profile/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorProfile(req.params.creatorId);
  res.json({ success: true, profile: vault });
});

router.put('/profile/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const validation = validateCreatorProfileUpdate(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const updated = updateCreatorProfile(req.params.creatorId, req.body);
  res.json({ success: true, profile: updated });
});

router.post('/submit-for-review', requireCreatorAuth, requireActiveCreator, (req, res) => {
  const creatorId = req.auth.creatorId;
  const vault = getCreatorVault(creatorId);

  if (vault.verificationStatus === 'approved') {
    return res.status(400).json({ error: 'Profile is already approved' });
  }

  const updated = submitCreatorForReview(creatorId);
  res.json({ success: true, profile: updated });
});

router.get('/projects/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  res.json({ success: true, projects: vault.projects || [] });
});

router.get('/equipment/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  res.json({ success: true, equipment: vault.equipment || [] });
});

router.put('/equipment/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const { equipment } = req.body || {};
  const validation = validateEquipmentItems(equipment);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const updated = updateCreatorVault(req.params.creatorId, { equipment: validation.value });
  res.json({ success: true, equipment: updated.equipment });
});

router.get('/earnings/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  const earnings = vault.projects?.filter(p => p.status === 'completed') || [];
  const totalEarnings = earnings.reduce((sum, p) => sum + (p.amount || 0), 0);
  res.json({ success: true, earnings, totalEarnings, currency: 'INR' });
});

router.get('/notifications/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  res.json({ success: true, notifications: vault.notifications || [] });
});

router.post('/documents', requireCreatorAuth, requireActiveCreator, (req, res) => {
  const { documentId, type, fileName, fileUrl, status } = req.body || {};

  if (!type || !fileName || !fileUrl) {
    return res.status(400).json({ error: 'Type, fileName, and fileUrl are required' });
  }

  const docValidation = validateDocumentType(type);
  if (!docValidation.valid) {
    return res.status(400).json({ error: docValidation.error });
  }

  const creatorId = req.auth.creatorId;
  const vault = getCreatorVault(creatorId);
  const documents = vault.documents || [];

  const existingIdx = documents.findIndex(d => d.type === type);
  const newDoc = {
    documentId: documentId || `doc_${Date.now()}`,
    type,
    fileName,
    fileUrl,
    status: status || 'pending',
    uploadedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    documents[existingIdx] = newDoc;
  } else {
    documents.push(newDoc);
  }

  const updated = updateCreatorVault(creatorId, { documents });
  res.status(201).json({ success: true, document: newDoc });
});

router.get('/documents/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  res.json({ success: true, documents: vault.documents || [] });
});

router.post('/availability/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const { status, note, date, projectId } = req.body || {};

  if (!AVAILABILITY_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid availability status' });
  }

  const creatorId = req.params.creatorId;
  const vault = getCreatorVault(creatorId);
  const availability = vault.availability || [];

  const newAvailability = {
    availabilityId: `avail_${Date.now()}`,
    status,
    note: note || null,
    date: date || new Date().toISOString().split('T')[0],
    projectId: projectId || null,
    createdAt: new Date().toISOString()
  };

  const updated = updateCreatorVault(creatorId, {
    availabilityStatus: status,
    availability: [...availability, newAvailability]
  });

  res.json({ success: true, availability: updated.availability });
});

router.get('/score/:creatorId', requireCreatorAuth, requireCreatorOwnership, (req, res) => {
  const vault = getCreatorVault(req.params.creatorId);
  const score = vault.scoreCard || {
    overallScore: null,
    breakdown: {},
    message: 'Score will appear after your first completed project.'
  };
  res.json({ success: true, score });
});

export default router;
