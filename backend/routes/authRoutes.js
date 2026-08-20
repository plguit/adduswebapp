/**
 * ADDUS Platform — Authentication Routes
 *
 * Phase 4 implementation:
 *  - Customer login (phone/email)
 *  - Admin login
 *  - Token refresh
 *  - Current user profile
 *
 * Integrates with existing vault/profile system.
 */

import express from 'express';
import { generateToken, verifyToken, extractBearerToken } from '../utils/tokenService.js';
import { getBusinessVault, updateBusinessVault, getAllVaults } from '../../ai/business-brain/vaultService.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────
// Duplicate Account Check
// ─────────────────────────────────────────────────────────

router.post('/check-duplicate', (req, res) => {
  const { phone, email, website, businessName, userId: currentUserId } = req.body || {};

  if (!phone && !email && !website && !businessName) {
    return res.status(400).json({ error: 'Phone, email, website, or business name is required for duplicate check' });
  }

  const vaults = getAllVaults();
  const matches = [];

  const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  
  const extractDomain = (url) => {
    if (!url) return null;
    let u = url.trim().toLowerCase();
    u = u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0].split('#')[0];
    return u || null;
  };

  const websiteDomain = extractDomain(website);
  const cleanBusinessName = businessName ? businessName.trim().toLowerCase() : null;

  const GENERIC_DOMAINS = new Set([
    'zoho.in', 'zoho.com', 'google.com', 'gmail.com', 'yahoo.com', 'hotmail.com',
    'outlook.com', 'icloud.com', 'live.com', 'msn.com', 'facebook.com', 'instagram.com',
    'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'whatsapp.com', 'telegram.org',
    'github.com', 'gitlab.com', 'bitbucket.org', 'wordpress.com', 'wix.com', 'shopify.com',
    'amazon.com', 'flipkart.com', 'snapdeal.com', 'paytm.com', 'phonepe.com', 'gpay.com'
  ]);

  for (const { userId, vault } of vaults) {
    if (!vault) continue;
    // Do not compare a user against their own existing ID
    if (currentUserId && (userId === currentUserId || vault.userId === currentUserId || vault.customerId === currentUserId)) {
      continue;
    }

    const rawVaultPhone = vault.phoneNumber || vault.phone || '';
    const vaultPhone = rawVaultPhone ? rawVaultPhone.replace(/\D/g, '') : null;
    const vaultEmail = (vault.email || '').trim().toLowerCase() || null;
    const rawVaultWebsite = vault.websiteUrl || vault.website || vault.brandAssets?.website || '';
    const vaultDomain = extractDomain(rawVaultWebsite);
    const vaultBusinessName = (vault.businessName || '').trim().toLowerCase() || null;

    // Phone match
    if (cleanPhone && vaultPhone && cleanPhone.length >= 10 && (cleanPhone === vaultPhone || vaultPhone.endsWith(cleanPhone) || cleanPhone.endsWith(vaultPhone))) {
      matches.push({
        matchType: 'EXACT_PHONE',
        confidence: 'HIGH',
        message: 'This mobile number is already linked to an existing account.',
        existingUserId: userId,
        existingBusinessName: vault.businessName || null,
        existingEmail: vault.email || null,
        existingPhoneNumber: rawVaultPhone || null
      });
    }

    // Email match
    if (cleanEmail && vaultEmail && cleanEmail === vaultEmail) {
      matches.push({
        matchType: 'EXACT_EMAIL',
        confidence: 'HIGH',
        message: 'This email address is already linked to an existing account.',
        existingUserId: userId,
        existingBusinessName: vault.businessName || null,
        existingEmail: vault.email || null,
        existingPhoneNumber: rawVaultPhone || null
      });
    }

    // Website/domain match - only flag if not a generic/public domain
    if (websiteDomain && vaultDomain && websiteDomain === vaultDomain && !GENERIC_DOMAINS.has(websiteDomain)) {
      matches.push({
        matchType: 'EXACT_URL',
        confidence: 'HIGH',
        message: `An account already exists with website domain "${websiteDomain}".`,
        existingUserId: userId,
        existingBusinessName: vault.businessName || null,
        existingEmail: vault.email || null,
        existingPhoneNumber: rawVaultPhone || null
      });
    }

    // Business name match
    if (cleanBusinessName && vaultBusinessName && cleanBusinessName.length > 3 && cleanBusinessName === vaultBusinessName && websiteDomain && vaultDomain && websiteDomain === vaultDomain) {
      matches.push({
        matchType: 'NAME_AND_DOMAIN',
        confidence: 'HIGH',
        message: `We found an existing account named "${vault.businessName}" sharing domain details.`,
        existingUserId: userId,
        existingBusinessName: vault.businessName || null,
        existingEmail: vault.email || null,
        existingPhoneNumber: rawVaultPhone || null
      });
    }
  }

  // Deduplicate matches by matchType
  const uniqueMatches = [];
  const seenTypes = new Set();
  for (const match of matches) {
    if (!seenTypes.has(match.matchType)) {
      seenTypes.add(match.matchType);
      uniqueMatches.push(match);
    }
  }

  return res.json({
    isDuplicate: uniqueMatches.length > 0,
    matchCount: uniqueMatches.length,
    matches: uniqueMatches
  });
});
    }
  }

  res.json({
    success: true,
    isDuplicate: uniqueMatches.length > 0,
    matches: uniqueMatches
  });
});

// ─────────────────────────────────────────────────────────
// Customer Login
// ─────────────────────────────────────────────────────────

router.post('/login/customer', (req, res) => {
  const { phone, email, preferredUserId } = req.body || {};

  if (!phone && !email) {
    return res.status(400).json({ error: 'Phone or email is required' });
  }

  let userId = preferredUserId || null;
  let accountData = {};

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!userId) userId = `customer_${cleanPhone}`;
    accountData = { phoneNumber: cleanPhone, authProvider: 'phone' };
  } else if (email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!userId) userId = `customer_${cleanEmail}`;
    accountData = { email: cleanEmail, authProvider: 'email' };
  }

  const existingVault = getBusinessVault(userId);
  const isNewUser = !existingVault;

  if (existingVault && existingVault.blocked === true) {
    return res.status(403).json({ 
      error: 'Your account has been blocked. Please contact support at addusindia@gmail.com',
      blocked: true 
    });
  }

  if (existingVault && existingVault.onboardingStatus === 'rejected') {
    return res.status(403).json({ 
      error: 'Your onboarding was rejected. Please complete the onboarding process again.',
      onboardingRejected: true 
    });
  }

  if (isNewUser) {
    res.json({
      success: true,
      isNewUser: true,
      userId,
      role: 'CUSTOMER',
      expiresIn: '7d',
      profile: {
        userId,
        name: null,
        phoneNumber: accountData.phoneNumber || null,
        email: accountData.email || null,
        authProvider: accountData.authProvider || null,
        onboardingStatus: null,
        businessName: null,
        industry: null,
        businessStage: null,
        businessDescription: null,
        products: [],
        services: [],
        targetAudience: null,
        website: null,
        businessBrain: {
          businessName: null,
          industry: null,
          businessStage: null,
          businessDescription: null,
          products: [],
          services: [],
          targetAudience: null,
          website: null,
          addiRecommendations: null,
          addiRecommendationsGeneratedAt: null,
          websiteEvidenceItems: [],
          websiteRetrievalMeta: null
        }
      }
    });
    return;
  }

  const updatedVault = updateBusinessVault(userId, {
    ...accountData,
    userId,
    lastLoginAt: new Date().toISOString()
  });

  const token = generateToken({ userId, role: 'CUSTOMER' });

  res.json({
    success: true,
    isNewUser: false,
    token,
    userId,
    role: 'CUSTOMER',
    expiresIn: '7d',
    profile: {
      userId: updatedVault.userId,
      name: updatedVault.name || null,
      phoneNumber: updatedVault.phoneNumber || null,
      email: updatedVault.email || null,
      authProvider: updatedVault.authProvider || null,
      onboardingStatus: updatedVault.onboardingStatus || null,
      businessName: updatedVault.businessName || null,
      industry: updatedVault.industry || null,
      businessStage: updatedVault.businessStage || null,
      businessDescription: updatedVault.businessDescription || null,
      products: updatedVault.products || [],
      services: updatedVault.services || [],
      targetAudience: updatedVault.targetAudience || null,
      website: updatedVault.websiteUrl || null,
      businessBrain: {
        businessName: updatedVault.businessName || null,
        industry: updatedVault.industry || null,
        businessStage: updatedVault.businessStage || null,
        businessDescription: updatedVault.businessDescription || null,
        products: updatedVault.products || [],
        services: updatedVault.services || [],
        targetAudience: updatedVault.targetAudience || null,
        website: updatedVault.websiteUrl || null,
        addiRecommendations: updatedVault.addiRecommendations || null,
        addiRecommendationsGeneratedAt: updatedVault.addiRecommendationsGeneratedAt || null,
        websiteEvidenceItems: updatedVault.websiteEvidenceItems || [],
        websiteRetrievalMeta: updatedVault.websiteRetrievalMeta || null
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// Complete Onboarding — creates backend vault for new users
// ─────────────────────────────────────────────────────────

router.post('/customer/complete-onboarding', (req, res) => {
  const { userId, profile } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const existingVault = getBusinessVault(userId);

  const vaultData = {
    userId,
    name: profile?.name || existingVault?.name || null,
    phoneNumber: profile?.phoneNumber || existingVault?.phoneNumber || null,
    email: profile?.email || existingVault?.email || null,
    authProvider: profile?.authProvider || existingVault?.authProvider || 'phone',
    onboardingStatus: 'completed',
    lastVisitedScreen: 'dashboard',
    businessName: profile?.businessName || existingVault?.businessName || null,
    industry: profile?.industry || existingVault?.industry || null,
    businessStage: profile?.businessStage || existingVault?.businessStage || null,
    businessDescription: profile?.businessDescription || existingVault?.businessDescription || null,
    products: profile?.products || existingVault?.products || [],
    services: profile?.services || existingVault?.services || [],
    targetAudience: profile?.targetAudience || existingVault?.targetAudience || null,
    websiteUrl: profile?.website || existingVault?.websiteUrl || null,
    brandAssets: profile?.brandAssets || existingVault?.brandAssets || {},
    businessBrain: profile?.businessBrain || existingVault?.businessBrain || {},
    websiteEvidenceItems: profile?.websiteEvidenceItems || existingVault?.websiteEvidenceItems || [],
    websiteRetrievalMeta: profile?.websiteRetrievalMeta || existingVault?.websiteRetrievalMeta || null,
    addiRecommendations: profile?.addiRecommendations || existingVault?.addiRecommendations || null,
    addiRecommendationsGeneratedAt: profile?.addiRecommendationsGeneratedAt || existingVault?.addiRecommendationsGeneratedAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  };

  const updatedVault = updateBusinessVault(userId, vaultData);

  res.json({
    success: true,
    message: 'Onboarding completed. User vault created.',
    userId: updatedVault.userId,
    onboardingStatus: updatedVault.onboardingStatus,
    lastVisitedScreen: updatedVault.lastVisitedScreen
  });
});

// ─────────────────────────────────────────────────────────
// Admin Login
// ─────────────────────────────────────────────────────────

router.post('/login/admin', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ error: 'Admin credentials are not configured on the server.' });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const adminUserId = `admin_${adminEmail}`;
  const token = generateToken({ userId: adminUserId, role: 'ADMIN' });

  res.json({
    success: true,
    token,
    userId: adminUserId,
    role: 'ADMIN',
    expiresIn: '7d'
  });
});

// ─────────────────────────────────────────────────────────
// Expert Login
// ─────────────────────────────────────────────────────────

router.post('/login/expert', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const expertEmail = process.env.EXPERT_EMAIL;
  const expertPassword = process.env.EXPERT_PASSWORD;

  if (!expertEmail || !expertPassword) {
    return res.status(500).json({ error: 'Expert credentials are not configured on the server.' });
  }

  if (email !== expertEmail || password !== expertPassword) {
    return res.status(401).json({ error: 'Invalid expert credentials' });
  }

  const expertUserId = `expert_${email}`;
  const token = generateToken({ userId: expertUserId, role: 'EXPERT' });

  res.json({
    success: true,
    token,
    userId: expertUserId,
    role: 'EXPERT',
    expiresIn: '7d'
  });
});

// ─────────────────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────────────────

router.post('/refresh', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid token' });
  }

  const newToken = generateToken({
    userId: result.payload.userId,
    role: result.payload.role
  });

  res.json({
    success: true,
    token: newToken,
    userId: result.payload.userId,
    role: result.payload.role,
    expiresIn: '7d'
  });
});

// ─────────────────────────────────────────────────────────
// Current User Profile
// ─────────────────────────────────────────────────────────

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid token' });
  }

  const vault = getBusinessVault(result.payload.userId);

  res.json({
    success: true,
    userId: result.payload.userId,
    role: result.payload.role,
    profile: {
      businessName: vault.businessName || null,
      industry: vault.industry || null,
      businessStage: vault.businessStage || null,
      businessDescription: vault.businessDescription || null,
      products: vault.products || [],
      services: vault.services || [],
      targetAudience: vault.targetAudience || null,
      website: vault.websiteUrl || null
    }
  });
});

export default router;
