import express from 'express';
import { executeAIRequest, REQUEST_TYPES } from '../services/aiRequestManager.js';
import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';
import { extractAndSyncBusinessProfile } from '../../ai/summary-engine/profileExtractor.js';
import { PROMPT_TEMPLATES } from '../../ai/prompts/index.js';
import { analyzeUrlFast, triggerDeepAnalysis, WEBSITE_CLASSES } from '../services/urlIntelligenceService.js';
import { requireAuth, requireActiveUser, requireOwnership } from '../middleware/auth.js';
import { requireActiveCreator } from '../middleware/creatorAuth.js';
import { runAIIntelligencePipeline, flagForHumanReview, buildStrategicIntelligence } from '../services/aiIntelligenceService.js';
import { evidenceStore } from '../services/evidenceService.js';
import { writeMemoryFromTurn, buildKnownInformationPrompt } from '../services/memoryWriter.js';
import { buildDiagnosis } from '../services/diagnosisEngine.js';
import { buildPresenceEvaluation } from '../services/presenceEvaluationEngine.js';
import { urlAnalysisStore } from '../services/urlAnalysisStore.js';

const router = express.Router();

// Public health/status endpoints could be mounted here if needed
// AI endpoints require authentication per-route below

function loadPersistedEvidence(userId) {
  const vault = getBusinessVault(userId);
  evidenceStore.loadFromVault(vault);
}

function extractIndustryFromEvidence(primaryPage, url) {
  const text = `${primaryPage.title || ''} ${primaryPage.metaDescription || ''} ${primaryPage.og?.description || ''} ${primaryPage.headings?.map(h => h.text).join(' ') || ''} ${primaryPage.bodyText || ''}`.toLowerCase();
  
  const industryScores = {
    'News & Media': {
      primary: ['news', 'breaking news', 'journalist', 'newsroom', 'media', 'newspaper', 'magazine', 'editorial', 'correspondent', 'reporter'],
      secondary: ['article', 'story', 'coverage', 'politics', 'sports news', 'entertainment news', 'current affairs', 'daily news'],
      weight: 2.0,
      exclusionTerms: ['shop', 'store', 'buy', 'product', 'ecommerce']
    },
    'Hospitality': {
      primary: ['hotel', 'resort', 'inn', 'lodge', 'accommodation', 'stay', 'rooms', 'suites', 'villa', 'cottage', 'backwater', 'hospitality', 'check-in', 'checkout'],
      secondary: ['restaurant', 'cafe', 'menu', 'dining', 'cuisine', 'banquet', 'ayurveda', 'spa', 'wellness retreat'],
      weight: 1.8,
      exclusionTerms: ['apple', 'iphone', 'macbook', 'ipad', 'tech', 'software']
    },
    'E-commerce': {
      primary: ['shop', 'store', 'cart', 'checkout', 'ecommerce', 'e-commerce', 'online store', 'product catalog', 'buy now'],
      secondary: ['product', 'price', 'discount', 'offer', 'sale', 'shipping', 'delivery'],
      weight: 1.8,
      exclusionTerms: ['news', 'media', 'article', 'breaking']
    },
    'SaaS': {
      primary: ['software', 'saas', 'platform', 'dashboard', 'subscription', 'cloud', 'api', 'enterprise software', 'business software'],
      secondary: ['service', 'solution', 'tool', 'integration', 'enterprise'],
      weight: 1.6,
      exclusionTerms: ['shop', 'store', 'buy', 'product']
    },
    'Healthcare': {
      primary: ['hospital', 'clinic', 'medical center', 'healthcare', 'doctor', 'pharmacy', 'diagnostic', 'patient care'],
      secondary: ['health', 'medical', 'wellness', 'therapy', 'treatment', 'appointment'],
      weight: 1.7,
      exclusionTerms: ['resort', 'hotel', 'spa retreat']
    },
    'Real Estate': {
      primary: ['real estate', 'property', 'realtor', 'realty', 'property management', 'homes for sale', 'listings'],
      secondary: ['homes', 'rental', 'lease', 'mortgage', 'commercial property'],
      weight: 1.6,
      exclusionTerms: ['hotel', 'resort', 'accommodation']
    },
    'Food & Beverage': {
      primary: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'cuisine', 'beverage', 'bakery', 'catering', 'pub', 'bar'],
      secondary: ['chef', 'recipe', 'taste', 'fresh', 'organic', 'drink', 'coffee', 'tea'],
      weight: 1.5,
      exclusionTerms: ['apple', 'tech', 'software', 'device']
    },
    'Finance': {
      primary: ['bank', 'insurance', 'investment', 'wealth management', 'financial services', 'fintech', 'trading', 'brokerage'],
      secondary: ['finance', 'banking', 'insurance', 'wealth', 'capital', 'portfolio'],
      weight: 1.6,
      exclusionTerms: ['shop', 'store', 'product']
    },
    'Education': {
      primary: ['university', 'college', 'school', 'academy', 'institute', 'educational institution', 'learning platform'],
      secondary: ['education', 'learning', 'course', 'training', 'students', 'faculty'],
      weight: 1.5,
      exclusionTerms: []
    },
    'Entertainment': {
      primary: ['streaming', 'movies', 'tv shows', 'music', 'entertainment', 'film', 'series', 'theater', 'gaming'],
      secondary: ['watch', 'listen', 'play', 'stream', 'download', 'subtitles'],
      weight: 1.5,
      exclusionTerms: ['shop', 'store', 'buy']
    },
    'Technology': {
      primary: ['technology company', 'tech company', 'innovation lab', 'hardware manufacturer', 'semiconductor', 'electronics manufacturer'],
      secondary: ['technology', 'tech', 'innovation', 'electronics', 'gadget', 'device'],
      weight: 1.4,
      exclusionTerms: ['shop', 'store', 'buy']
    },
    'Agency': {
      primary: ['agency', 'creative', 'marketing', 'design', 'branding', 'digital agency', 'production house', 'advertising agency'],
      secondary: ['services', 'solutions', 'campaign', 'client'],
      weight: 1.3,
      exclusionTerms: []
    },
    'Manufacturing': {
      primary: ['manufacturing', 'factory', 'production', 'industrial', 'manufacturer', 'plant', 'assembly'],
      secondary: ['wholesale', 'supply', 'distribution', 'machinery', 'equipment'],
      weight: 1.4,
      exclusionTerms: ['shop', 'store', 'buy']
    },
    'Consulting': {
      primary: ['consulting', 'advisory', 'strategy', 'expertise', 'professional services', 'consulting firm'],
      secondary: ['services', 'solutions', 'advisory', 'client services'],
      weight: 1.3,
      exclusionTerms: ['shop', 'store', 'buy', 'product']
    }
  };

  let bestIndustry = null;
  let bestScore = 0;

  for (const [industry, config] of Object.entries(industryScores)) {
    let score = 0;
    let matchedPrimary = 0;
    
    for (const keyword of config.primary) {
      if (text.includes(keyword)) {
        score += 3.0;
        matchedPrimary++;
      }
    }
    
    for (const keyword of config.secondary) {
      if (text.includes(keyword)) {
        score += 1.0;
      }
    }

    if (config.exclusionTerms && config.exclusionTerms.some(term => text.includes(term))) {
      score *= 0.3;
    }
    
    if (matchedPrimary >= 2) {
      score *= 1.5;
    }
    
    score *= config.weight;

    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  if (bestScore >= 4.0) {
    return bestIndustry;
  }

  if (url) {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('shop') || hostname.includes('store')) return 'E-commerce';
    if (hostname.includes('saas') || hostname.includes('app')) return 'SaaS';
    if (hostname.includes('agency') || hostname.includes('studio')) return 'Agency';
    if (hostname.includes('hotel') || hostname.includes('resort') || hostname.includes('inn')) return 'Hospitality';
    if (hostname.includes('hospital') || hostname.includes('clinic')) return 'Healthcare';
    if (hostname.includes('news') || hostname.includes('media')) return 'News & Media';
    if (hostname.includes('bank') || hostname.includes('finance')) return 'Finance';
    if (hostname.includes('edu') || hostname.includes('learn')) return 'Education';
  }

  return null;
}

function extractBusinessStageFromEvidence(primaryPage) {
  const text = `${primaryPage.title || ''} ${primaryPage.metaDescription || ''} ${primaryPage.og?.description || ''} ${primaryPage.bodyText || ''} ${primaryPage.headings?.map(h => h.text).join(' ') || ''}`.toLowerCase();
  if (text.includes('startup') || text.includes('launch') || text.includes('founding') || text.includes('early stage') || text.includes('seed')) return 'Startup';
  if (text.includes('growing') || text.includes('expanding') || text.includes('scaling') || text.includes('growth') || text.includes('scale')) return 'Growth';
  if (text.includes('established') || text.includes('leading') || text.includes('market leader') || text.includes('since') || text.includes('years')) return 'Established';
  if (text.includes('enterprise') || text.includes('corporate') || text.includes('global')) return 'Enterprise';
  return null;
}

// ─────────────────────────────────────────────────────────
// Business Summary Generation
// ─────────────────────────────────────────────────────────

function generateBusinessSummary(profile, evidenceItems, primaryPage) {
  const placeholderPatterns = [
    /^under\s+construction$/i,
    /^coming\s+soon$/i,
    /^site\s+under\s+construction$/i,
    /^website\s+under\s+construction$/i,
    /^new\s+website$/i,
    /^default\s+page$/i,
    /^placeholder$/i,
    /^test\s+page$/i,
    /^welcome\s+to\s+our\s+website$/i,
    /^under\s+renovation$/i,
    /^maintenance$/i,
    /^temp$/i,
    /^temporary$/i
  ];

  function isPlaceholder(name) {
    if (!name || typeof name !== 'string') return true;
    const trimmed = name.trim();
    if (trimmed.length < 2) return true;
    return placeholderPatterns.some(pattern => pattern.test(trimmed));
  }

  const rawName = profile.businessName || primaryPage.title || null;
  const name = isPlaceholder(rawName) ? null : rawName;
  const industry = profile.industry || null;
  const location = profile.location || null;
  const description = profile.businessDescription || primaryPage.metaDescription || primaryPage.og?.description || null;
  const services = Array.isArray(profile.services) ? profile.services : [];
  const products = Array.isArray(profile.products) ? profile.products : [];

  const parts = [];

  if (name) {
    const cleanName = name.replace(/\s*\|.*$/, '').trim();
    parts.push(cleanName);
  }

  if (industry) {
    const industryLower = industry.toLowerCase();
    if (industryLower === 'hospitality') {
      parts.push('is a hospitality property');
    } else if (industryLower === 'restaurant') {
      parts.push('is a restaurant');
    } else if (industryLower === 'e-commerce') {
      parts.push('is an e-commerce business');
    } else if (industryLower === 'saas') {
      parts.push('is a software company');
    } else if (industryLower === 'healthcare') {
      parts.push('is a healthcare provider');
    } else if (industryLower === 'finance') {
      parts.push('is a financial services provider');
    } else if (industryLower === 'education') {
      parts.push('is an education provider');
    } else if (industryLower === 'real estate') {
      parts.push('is a real estate business');
    } else if (industryLower === 'manufacturing') {
      parts.push('is a manufacturing business');
    } else if (industryLower === 'technology') {
      parts.push('is a technology company');
    } else if (industryLower === 'consulting') {
      parts.push('is a consulting firm');
    } else if (industryLower === 'agency') {
      parts.push('is a creative agency');
    } else {
      parts.push(`is a ${industry.toLowerCase()} business`);
    }
  } else if (name) {
    parts.push('is a business');
  }

  if (location) {
    const cleanLocation = location.replace(/\s*\|.*$/, '').trim();
    parts.push(`based in ${cleanLocation}`);
  }

  const offerings = [];
  for (const service of services.slice(0, 5)) {
    const cleanService = service.replace(/\s*\|.*$/, '').trim();
    if (cleanService.length > 2 && cleanService.length < 60) {
      offerings.push(cleanService.toLowerCase());
    }
  }
  for (const product of products.slice(0, 3)) {
    const cleanProduct = product.replace(/\s*\|.*$/, '').trim();
    if (cleanProduct.length > 2 && cleanProduct.length < 60) {
      offerings.push(cleanProduct.toLowerCase());
    }
  }

  if (offerings.length > 0) {
    if (offerings.length === 1) {
      parts.push(`specializing in ${offerings[0]}`);
    } else if (offerings.length === 2) {
      parts.push(`specializing in ${offerings[0]} and ${offerings[1]}`);
    } else {
      parts.push(`specializing in ${offerings.slice(0, -1).join(', ')} and ${offerings[offerings.length - 1]}`);
    }
  }

  const cleanDescription = description ? description.replace(/\s*\|.*$/, '').trim() : null;
  if (cleanDescription && cleanDescription.length > 20) {
    const sentences = cleanDescription.match(/[^.!?]+[.!?]+/g) || [cleanDescription];
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 20 && firstSentence.length < 200) {
      parts.push(firstSentence);
    }
  }

  const summary = parts.join(' ') + '.';
  const confidence = (name ? 1 : 0) + (industry ? 1 : 0) + (cleanDescription ? 1 : 0) + (services.length > 0 ? 1 : 0) + (location ? 1 : 0);
  const confidenceScore = Math.round((confidence / 5) * 100);

  return {
    summary: parts.length > 0 ? summary : null,
    provenance: 'EVIDENCE_ANCHORED',
    confidence: Math.max(confidenceScore, 30)
  };
}

// ─────────────────────────────────────────────────────────
// Canonical Profile Contract Builder
// ─────────────────────────────────────────────────────────

function buildCanonicalProfile(rawProfile, evidenceItems, primaryPage, url, aiUsed, aiTriggerReason) {
  const placeholderPatterns = [
    /^under\s+construction$/i,
    /^coming\s+soon$/i,
    /^site\s+under\s+construction$/i,
    /^website\s+under\s+construction$/i,
    /^new\s+website$/i,
    /^default\s+page$/i,
    /^placeholder$/i,
    /^test\s+page$/i,
    /^welcome\s+to\s+our\s+website$/i,
    /^under\s+renovation$/i,
    /^maintenance$/i,
    /^temp$/i,
    /^temporary$/i
  ];

  function isPlaceholderBusinessName(name) {
    if (!name || typeof name !== 'string') return true;
    const trimmed = name.trim();
    if (trimmed.length < 2) return true;
    return placeholderPatterns.some(pattern => pattern.test(trimmed));
  }

  const businessName = isPlaceholderBusinessName(rawProfile.businessName) ? null : (rawProfile.businessName || null);
  const fieldProvenance = {
    businessName: businessName ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    industry: rawProfile.industry ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    businessDescription: rawProfile.businessDescription ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    location: rawProfile.location ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    services: (rawProfile.services && rawProfile.services.length > 0) ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    products: (rawProfile.products && rawProfile.products.length > 0) ? 'OBSERVED_WEBSITE' : 'UNKNOWN',
    targetAudience: rawProfile.targetAudience ? (aiUsed ? 'AI_GENERATED' : 'UNKNOWN') : 'UNKNOWN',
    businessStage: rawProfile.businessStage ? (aiUsed ? 'AI_GENERATED' : 'OBSERVED_WEBSITE') : 'UNKNOWN',
    brandPersonality: rawProfile.brandPersonality ? (aiUsed ? 'AI_GENERATED' : 'UNKNOWN') : 'UNKNOWN'
  };

  const evidencePriority = [
    'CUSTOMER_PROVIDED',
    'OBSERVED_WEBSITE',
    'VERIFIED_EXTERNAL',
    'INFERRED',
    'AI_GENERATED'
  ];

  const discoveredAssets = [];
  const assetTypes = new Set();

  for (const item of evidenceItems) {
    if (item.evidenceType === 'brand' && item.content && !assetTypes.has('brand')) {
      discoveredAssets.push({ type: 'Brand / Logo', status: 'detected', source: item.sourceUrl });
      assetTypes.add('brand');
    }
    if (item.evidenceType === 'social_presence' && item.content && !assetTypes.has('social')) {
      discoveredAssets.push({ type: 'Social Presence', status: 'detected', source: item.content });
      assetTypes.add('social');
    }
    if (item.evidenceType === 'contact' && item.content && !assetTypes.has('contact')) {
      discoveredAssets.push({ type: 'Contact Information', status: 'detected', source: item.sourceUrl });
      assetTypes.add('contact');
    }
    if (item.evidenceType === 'identity' && item.content && !assetTypes.has('website')) {
      discoveredAssets.push({ type: 'Website', status: 'verified', source: url });
      assetTypes.add('website');
    }
  }

  const summaryResult = generateBusinessSummary(rawProfile, evidenceItems, primaryPage);

  const rawContact = rawProfile.contactInfo || {};
  const normalizedContact = {
    email: Array.isArray(rawContact?.emails) && rawContact.emails.length > 0
      ? rawContact.emails.join(', ')
      : (rawContact?.email || null),
    phone: Array.isArray(rawContact?.phones) && rawContact.phones.length > 0
      ? rawContact.phones.join(', ')
      : (rawContact?.phone || null)
  };

  return {
    businessName: businessName,
    industry: rawProfile.industry || null,
    businessDescription: rawProfile.businessDescription || null,
    location: rawProfile.location || null,
    services: Array.isArray(rawProfile.services) ? rawProfile.services : [],
    products: Array.isArray(rawProfile.products) ? rawProfile.products : [],
    targetAudience: rawProfile.targetAudience || null,
    businessStage: rawProfile.businessStage || null,
    brandPersonality: rawProfile.brandPersonality || null,
    contactInfo: normalizedContact,
    socialLinks: Array.isArray(rawProfile.socialLinks) ? rawProfile.socialLinks : [],
    assets: discoveredAssets,
    confidence: {
      score: rawProfile.aiConfidenceScore || summaryResult.confidence,
      status: rawProfile.confidenceStatus || 'UNKNOWN',
      reason: rawProfile.confidenceReason || 'Website analysis completed'
    },
    fieldProvenance,
    evidencePriority,
    evidence: evidenceItems.map(e => ({
      evidenceId: e.evidenceId,
      evidenceType: e.evidenceType,
      title: e.title,
      content: e.content,
      confidence: e.confidence,
      provenance: e.provenance,
      qualityScore: e.qualityScore
    })),
    aiUsed,
    aiTriggerReason,
    insufficientFields: rawProfile.insufficientFields || [],
    summary: summaryResult.summary,
    summaryProvenance: summaryResult.provenance,
    summaryConfidence: summaryResult.confidence,
    sourceType: rawProfile.sourceType || 'VERIFIED_WEBSITE',
    website: rawProfile.website || url
  };
}

import { extractAndRepairJson } from '../utils/jsonRepair.js';
import { generateWebsiteHash } from '../utils/contentHash.js';
import { buildStructuredIntelligenceOutput } from '../services/opportunityEngine.js';
import { buildRecommendationSummary } from '../services/recommendationEngine.js';
import { generateRecommendations } from '../services/recommendationEngine.js';
import { evaluateResearchNeed } from '../services/researchDecisionEngine.js';
import { createAuditEntry, appendAuditTrail } from '../services/auditLogger.js';

// ─────────────────────────────────────────────────────────
// Chat Endpoint (streaming SSE) — context-aware
// ─────────────────────────────────────────────────────────
router.post('/chat', requireAuth, requireActiveUser, async (req, res) => {
  const { message, currentStep = '', brainContext = null, conversationId = null, productId = null, projectId = null, context = 'business' } = req.body;
  const userId = req.auth.userId;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message payload is required.' });
  }

  loadPersistedEvidence(userId);

  // Fire async extraction
  extractAndSyncBusinessProfile(userId, message).catch(() => {});

  if (brainContext && typeof brainContext === 'object') {
    updateBusinessVault(userId, brainContext);
  }

  // Persist conversation metadata if provided
  if (conversationId) {
    const vault = getBusinessVault(userId);
    const conversations = (vault.conversations || []).map(c =>
      c.conversationId === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c
    );
    if (!conversations.find(c => c.conversationId === conversationId)) {
      conversations.push({
        conversationId,
        context,
        productId: productId || null,
        projectId: projectId || null,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    updateBusinessVault(userId, { conversations });
  }

  // Build context-aware system prompt
  const vault = getBusinessVault(userId);
  const businessName = vault.businessName || null;
  const industry = vault.industry || null;
  const businessStage = vault.businessStage || null;
  const products = vault.products || [];
  const selectedProduct = productId ? products.find(p => p.productId === productId) : null;
  const projects = vault.projects || [];
  const selectedProject = projectId ? projects.find(p => p.projectId === projectId || p.id === projectId) : null;
  const strategicIntelligence = vault.strategicIntelligence || [];

  let contextBlock = `You are ADDI, ADDUS's business-aware creative advisor for ${businessName || 'the customer'}.\n`;
  if (industry) contextBlock += `Industry: ${industry}.\n`;
  if (businessStage) contextBlock += `Business stage: ${businessStage}.\n`;
  if (selectedProduct) contextBlock += `Current product context: ${selectedProduct.name} — ${selectedProduct.category || ''} ${selectedProduct.description || ''}\n`;
  if (selectedProject) contextBlock += `Current project context: ${selectedProject.service} (${selectedProject.type}) — Status: ${selectedProject.status || 'Submitted'}\n`;
  
  if (strategicIntelligence.length > 0) {
    contextBlock += `\n### PREVIOUS STRATEGIC INTELLIGENCE (USE THIS TO INFORM YOUR RESPONSE)\n`;
    contextBlock += `The following assessments were previously made. Use them as memory. Do not repeat them unless asked.\n`;
    const recentIntelligence = strategicIntelligence.slice(-10);
    for (const intel of recentIntelligence) {
      contextBlock += `\n[${intel.serviceName || intel.serviceId}]\n`;
      contextBlock += `Status: ${intel.status}\n`;
      if (intel.why) contextBlock += `Why: ${intel.why}\n`;
      if (intel.businessGap) contextBlock += `Gap: ${intel.businessGap}\n`;
      if (intel.observedEvidence) contextBlock += `Evidence: ${intel.observedEvidence}\n`;
      if (intel.inference) contextBlock += `Inference: ${intel.inference}\n`;
      if (intel.businessImpact) contextBlock += `Impact: ${intel.businessImpact}\n`;
      if (intel.recommendation) contextBlock += `Recommendation: ${intel.recommendation}\n`;
      if (intel.priority) contextBlock += `Priority: ${intel.priority}\n`;
      if (intel.confidence) contextBlock += `Confidence: ${intel.confidence}\n`;
      if (intel.existingAssetStatus) contextBlock += `Asset Status: ${intel.existingAssetStatus}\n`;
      if (intel.expectedOutcome) contextBlock += `Expected Outcome: ${intel.expectedOutcome}\n`;
      if (intel.nextAction) contextBlock += `Next Action: ${intel.nextAction}\n`;
      if (intel.objective) contextBlock += `Objective: ${intel.objective}\n`;
      if (intel.keyResults && intel.keyResults.length > 0) contextBlock += `Key Results: ${intel.keyResults.join('; ')}\n`;
    }
    contextBlock += `\nWhen the user asks about a previously assessed area, reference this intelligence. If they want to change course, acknowledge the previous assessment and explain the change.\n`;
  }
  
  contextBlock += `\n${buildKnownInformationPrompt(vault)}\n`;
  
  contextBlock += `\nRules:\n- Use the most specific available context (project > product > business).\n- Distinguish FACT, INFERENCE, and RECOMMENDATION.\n- Do not fabricate business information.\n- If evidence is insufficient, say so.\n- Be concise and strategic.\n`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

   try {
     const result = await executeAIRequest(
       REQUEST_TYPES.CHAT_RESPONSE.name,
       userId,
       [
         { role: 'system', content: contextBlock },
         { role: 'user', content: message }
       ],
       {
         userId,
         currentStep,
         stream: true,
         onChunk: (token) => {
           res.write(`data: ${JSON.stringify({ token })}\n\n`);
         },
         context: {
           businessName: vault.businessName,
           industry: vault.industry,
           businessStage: vault.businessStage,
           selectedProduct: productId ? (vault.products || []).find(p => p.productId === productId) : null,
           selectedProject: projectId ? (vault.projects || []).find(p => p.projectId === projectId || p.id === projectId) : null,
           strategicIntelligence: (vault.strategicIntelligence || []).slice(-5)
         }
       }
     );

      res.write(`data: ${JSON.stringify({ done: true, content: result.content, modelUsed: result.modelUsed || 'unknown' })}\n\n`);
      res.end();

      // Write durable facts to Business Brain asynchronously
      writeMemoryFromTurn(userId, message, result.content).catch(() => {});
    } catch (err) {
      res.write(`data: ${JSON.stringify({ done: true, error: err.message })}\n\n`);
      res.end();
    }
  });

// ─────────────────────────────────────────────────────────
// Vault Endpoint
// ─────────────────────────────────────────────────────────
router.get('/vault/:userId', requireAuth, requireActiveUser, requireOwnership, (req, res) => {
  const vault = getBusinessVault(req.auth.userId);
  res.json(vault);
});

// ─────────────────────────────────────────────────────────
// Strategic Intelligence Endpoint
// Returns persisted strategic intelligence for a user
// ─────────────────────────────────────────────────────────
router.get('/intelligence/:userId', requireAuth, requireActiveUser, requireOwnership, (req, res) => {
  const vault = getBusinessVault(req.auth.userId);
  res.json({
    success: true,
    strategicIntelligence: vault.strategicIntelligence || [],
    addiRecommendations: vault.addiRecommendations || null,
    totalItems: (vault.strategicIntelligence || []).length
  });
});

// ─────────────────────────────────────────────────────────
// Website Analysis Endpoint — REAL HTTP Retrieval
//
// ARCHITECTURE:
//   1. Validate URL
//   2. Server-side HTTP fetch (Node.js native fetch)
//   3. Parse HTML, extract evidence
//   4. Inspect relevant sub-pages (max 5)
//   5. Build verified evidence set
//   6. Pass actual retrieved evidence to GROQ AI
//   7. Persist evidence items to vault (for /recommend to use)
//   8. Return structured profile + evidence
//
// The LLM receives actual retrieved content, NOT the URL.
// ─────────────────────────────────────────────────────────
router.post('/analyze-website', requireAuth, requireActiveUser, async (req, res) => {
  const { url } = req.body;
  const userId = req.auth.userId;

  console.log('[ADDI_TRACE:BACKEND_RECEIVED]', {
    requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    url,
    userId,
    businessId: userId,
    stage: 'FAST_PATH',
  });

  loadPersistedEvidence(userId);

  const safeRespond = (body, statusCode = 200) => {
    if (res.headersSent) return;
    res.status(statusCode).json(body);
  };

  // Input validation
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return safeRespond({ error: 'URL is required.' }, 400);
  }

  // ── URL ANALYSIS ACTIVITY LOG ───────────────────────────
  let urlLogId = null;
  try {
    const vault = getBusinessVault(userId);
    const urlLog = urlAnalysisStore.create({
      url: url.trim(),
      status: 'PROCESSING',
      submitted_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      user_id: userId,
      user_name: vault?.name || null,
      user_mobile: vault?.phoneNumber || null,
      user_email: vault?.email || null,
      business_id: vault?.businessName ? userId : null,
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      analysis_method: 'FAST_PATH'
    });
    urlLogId = urlLog.id;
  } catch (logErr) {
    console.warn('[UrlAnalysisLog] Failed to create log:', logErr.message);
  }

  // ── STAGE 1: FAST PATH ─────────────────────────────────
  let fastResult;
  try {
    fastResult = await analyzeUrlFast(url.trim());
    console.log('[ADDI_TRACE:FAST_PATH]', {
      url: url.trim(),
      success: fastResult?.success,
      classification: fastResult?.classification?.class,
      durationMs: fastResult?.durationMs,
      evidenceCount: fastResult?.evidenceItems?.length,
      deepQueued: fastResult?.deepAnalysisQueued,
    });
  } catch (err) {
    console.error('[analyze-website] Fast path error:', err.message);
    if (urlLogId) {
      try {
        urlAnalysisStore.update(urlLogId, {
          status: 'FAILED',
          completed_at: new Date().toISOString(),
          duration_ms: fastResult?.durationMs || null,
          error_category: 'UNKNOWN_ERROR',
          error_message: err.message || 'Unexpected error during analysis',
          failure_category: 'UNKNOWN_ERROR',
          website_classification: fastResult?.classification?.class || null,
          analysis_method: 'FAST_PATH',
          pages_analyzed: 0,
          http_status: 0
        });
      } catch (logErr) {
        console.warn('[UrlAnalysisLog] Update failed:', logErr.message);
      }
    }
    return safeRespond({
      success: false,
      profile: null,
      retrievalMeta: { requestedUrl: url, httpStatus: 0, checkedAt: new Date().toISOString(), error: err.message },
      evidenceItems: [],
      insufficientEvidence: true,
      requiresExpertReview: true,
      addiMessage: "ADDI couldn't confidently verify enough information from this website. The publicly available information is limited, so we'll share it with an ADDUS expert for review and get back to you with a more reliable recommendation."
    });
  }

  // Fast path failure
  if (!fastResult.success || fastResult.sourceStatus === 'REJECTED_SOURCE' || fastResult.classification?.class === WEBSITE_CLASSES.RESTRICTED) {
    if (urlLogId) {
      try {
        const failureCategory = fastResult.sourceStatus === 'REJECTED_SOURCE' ? 'INVALID_URL' :
                               fastResult.classification?.class === 'RESTRICTED' ? 'ACCESS_BLOCKED' :
                               fastResult.failureReason || 'RETRIEVAL_FAILED';
        urlAnalysisStore.update(urlLogId, {
          status: 'FAILED',
          completed_at: new Date().toISOString(),
          duration_ms: fastResult.durationMs || null,
          error_category: failureCategory,
          error_message: fastResult.userMessage || fastResult.failureReason || 'Website analysis failed',
          failure_category: failureCategory,
          website_classification: fastResult.classification?.class || null,
          analysis_method: 'FAST_PATH',
          http_status: fastResult.retrievalMeta?.httpStatus || null,
          pages_analyzed: fastResult.retrievalMeta?.pagesInspected?.length || 0
        });
      } catch (logErr) {
        console.warn('[UrlAnalysisLog] Update failed:', logErr.message);
      }
    }
    return safeRespond({
      success: false,
      profile: null,
      retrievalMeta: fastResult.retrievalMeta,
      evidenceItems: fastResult.evidenceItems || [],
      sourceStatus: fastResult.sourceStatus || 'RETRIEVAL_FAILED',
      failureReason: fastResult.failureReason || null,
      userMessage: fastResult.userMessage || null,
      insufficientEvidence: true,
      requiresExpertReview: true,
      addiMessage: fastResult.userMessage || "ADDI couldn't access this website. Please type the details manually or upload a document."
    });
  }

  // ── Build deterministic profile from fast path evidence ──
  const primaryPage = fastResult.primaryPage || {};
  const evidenceItems = fastResult.evidenceItems || [];

  const deterministicProfile = {
    businessName: primaryPage.title || null,
    industry: fastResult.profile?.industry || null,
    businessDescription: primaryPage.metaDescription || primaryPage.og?.description || null,
    location: null,
    services: fastResult.profile?.services || [],
    products: [],
    targetAudience: null,
    businessStage: fastResult.profile?.businessStage || null,
    brandPersonality: null,
    website: fastResult.retrievalMeta?.finalUrl || url,
    contactInfo: {
      email: primaryPage.contactInfo?.emails?.[0] || null,
      phone: primaryPage.contactInfo?.phones?.[0] || null,
    },
    socialLinks: primaryPage.socialLinks || []
  };

  // Count resolved fields
  const allFields = ['businessName', 'industry', 'businessDescription', 'location', 'services', 'products', 'targetAudience', 'businessStage', 'brandPersonality'];
  const resolvedCount = allFields.filter(f => {
    const val = deterministicProfile[f];
    if (Array.isArray(val)) return val.length > 0;
    return val != null && val !== '';
  }).length;
  const resolutionRatio = resolvedCount / allFields.length;

  // AI GATE: Skip AI if >= 90% fields resolved deterministically
  let aiUsed = false;
  let aiTriggerReason = 'DETERMINISTIC_EVIDENCE_SUFFICIENT';
  let aiProfile = null;

  if (resolutionRatio < 0.9) {
    const unresolvedFields = allFields.filter(f => {
      const val = deterministicProfile[f];
      if (Array.isArray(val)) return val.length === 0;
      return val == null || val === '';
    });

    if (unresolvedFields.length > 0) {
      aiUsed = true;
      aiTriggerReason = `UNRESOLVED_FIELDS: ${unresolvedFields.join(', ')}`;

      const evidenceSummary = evidenceItems
        .map(e => `[${e.evidenceType || e.field || 'evidence'}] ${e.observation}\nEvidence: "${e.evidence || e.content || ''}"`)
        .join('\n\n');

      const systemPrompt = `You are ADDI, ADDUS's business intelligence AI.
You have been provided with VERIFIED website evidence retrieved directly from the customer's website via HTTP.
Your task is to fill ONLY the missing fields in the partial profile below.

PARTIAL PROFILE (already known from deterministic extraction):
${JSON.stringify(deterministicProfile, null, 2)}

Rules:
- Only fill fields that are null or empty in the partial profile above.
- Do NOT overwrite existing values.
- Only use the provided evidence. Do not invent or assume anything not in the evidence.
- If a field cannot be determined from evidence, set it to null.
- Respond ONLY with a valid JSON object (no markdown, no explanation).

Required JSON structure:
{
  "businessName": string or null,
  "industry": string or null,
  "businessDescription": string or null,
  "services": array of strings (or empty array),
  "products": array of strings (or empty array),
  "targetAudience": string or null,
  "businessStage": string or null,
  "brandPersonality": string or null,
  "website": string,
  "contactInfo": { "email": string or null, "phone": string or null },
  "socialLinks": array of strings,
  "aiConfidenceScore": number 0-100,
  "insufficientFields": array of field names that had no evidence,
  "evidenceNotes": string (brief note on what was found)
}`;

      const userPrompt = `Website URL: ${fastResult.retrievalMeta?.finalUrl || url}

RETRIEVED EVIDENCE (from actual HTTP inspection of ${fastResult.retrievalMeta?.pagesInspected?.length || 1} pages):

${evidenceSummary}

Extract ONLY the missing fields from the above verified evidence. Do not change existing values.`;

      try {
        const result = await executeAIRequest(
          REQUEST_TYPES.BUSINESS_PROFILE.name,
          userId,
          [],
          {
            userId,
            businessId: userId,
            websiteUrl: url,
            evidenceVersion: '1',
            systemPrompt,
            userPrompt,
            context: {
              evidenceItems: evidenceItems.slice(0, 12),
              retrievalMeta: fastResult.retrievalMeta
            }
          }
        );

        let parsed = {};
        try {
          const repaired = extractAndRepairJson(result.content);
          if (repaired) {
            parsed = JSON.parse(repaired);
          }
        } catch {
          aiTriggerReason = 'AI_RESPONSE_PARSE_FAILED';
        }

        if (parsed && Object.keys(parsed).length > 0) {
          aiProfile = { ...deterministicProfile };
          for (const [key, value] of Object.entries(parsed)) {
            if (key === 'aiConfidenceScore' || key === 'insufficientFields' || key === 'evidenceNotes') continue;
            const currentVal = aiProfile[key];
            const isEmpty = currentVal == null || currentVal === '' || (Array.isArray(currentVal) && currentVal.length === 0);
            if (isEmpty && value != null && value !== '') {
              aiProfile[key] = value;
            }
          }
          aiProfile.website = fastResult.retrievalMeta?.finalUrl || url;
          const aiContact = parsed.contactInfo || deterministicProfile.contactInfo;
          aiProfile.contactInfo = {
            email: Array.isArray(aiContact?.emails) && aiContact.emails.length > 0
              ? aiContact.emails.join(', ')
              : (aiContact?.email || deterministicProfile.contactInfo?.email || null),
            phone: Array.isArray(aiContact?.phones) && aiContact.phones.length > 0
              ? aiContact.phones.join(', ')
              : (aiContact?.phone || deterministicProfile.contactInfo?.phone || null)
          };
          aiProfile.socialLinks = Array.isArray(parsed.socialLinks) ? parsed.socialLinks : deterministicProfile.socialLinks;
          aiProfile.aiConfidenceScore = parsed.aiConfidenceScore || null;
          aiProfile.confidenceStatus = 'PARTIAL_EVIDENCE';
          aiProfile.confidenceReason = 'AI enriched partial deterministic profile';
          aiProfile.sourceType = 'VERIFIED_WEBSITE';
          aiProfile.insufficientFields = Array.isArray(parsed.insufficientFields) ? parsed.insufficientFields : [];
          aiProfile.evidenceNotes = parsed.evidenceNotes || 'AI completed partial enrichment';
        }
      } catch (err) {
        aiTriggerReason = `AI_UNAVAILABLE: ${err.message}`;
        console.error('[analyze-website] AI analysis error:', err.message);
      }
    }
  }

  // Final profile: prefer AI-enriched if available, otherwise deterministic
  const profile = aiProfile || deterministicProfile;
  if (!profile.aiConfidenceScore && profile.aiConfidenceScore !== 0) {
    profile.aiConfidenceScore = aiUsed ? 60 : 50;
  }
  if (!profile.confidenceStatus) {
    profile.confidenceStatus = aiUsed ? 'PARTIAL_EVIDENCE' : 'SUFFICIENT_EVIDENCE';
  }
  if (!profile.confidenceReason) {
    profile.confidenceReason = aiUsed ? 'AI enriched partial deterministic profile' : 'Deterministic evidence sufficient';
  }
  if (!profile.sourceType) {
    profile.sourceType = 'VERIFIED_WEBSITE';
  }
  if (!profile.insufficientFields) {
    profile.insufficientFields = allFields.filter(f => {
      const val = profile[f];
      if (Array.isArray(val)) return val.length === 0;
      return val == null || val === '';
    });
  }
  if (!profile.evidenceNotes) {
    profile.evidenceNotes = aiUsed ? 'AI completed partial enrichment' : 'Deterministic website evidence used';
  }

  // Build canonical response
  const canonical = buildCanonicalProfile(profile, evidenceItems, primaryPage, url, aiUsed, aiTriggerReason);

  // ── PERSIST evidence items and business profile to vault ──────────────
  const contentHash = generateWebsiteHash(evidenceItems, primaryPage);
  const vaultUpdate = {
    websiteUrl: url,
    websiteAnalyzedAt: new Date().toISOString(),
    websiteContentHash: contentHash,
    websiteEvidenceItems: evidenceItems,
    websiteRetrievalMeta: {
      finalUrl: fastResult.retrievalMeta?.finalUrl,
      httpStatus: fastResult.retrievalMeta?.httpStatus,
      pagesInspected: fastResult.retrievalMeta?.pagesInspected || [fastResult.retrievalMeta?.finalUrl].filter(Boolean),
      checkedAt: fastResult.retrievalMeta?.checkedAt
    },
    businessName: profile?.businessName || undefined,
    industry: profile?.industry || undefined,
    businessDescription: profile?.businessDescription || undefined,
    location: profile?.location || undefined,
    services: profile?.services || undefined,
    products: profile?.products || undefined,
    targetAudience: profile?.targetAudience || undefined,
    businessStage: profile?.businessStage || undefined,
    brandPersonality: profile?.brandPersonality || undefined,
    contactInfo: profile?.contactInfo || undefined,
    socialLinks: profile?.socialLinks || undefined,
    aiConfidenceScore: profile?.aiConfidenceScore || undefined,
    confidenceStatus: profile?.confidenceStatus || undefined,
    confidenceReason: profile?.confidenceReason || undefined,
    sourceType: profile?.sourceType || undefined,
    summary: canonical.summary,
    summaryProvenance: canonical.summaryProvenance,
    summaryConfidence: canonical.summaryConfidence,
    discoveredAssets: canonical.assets,
    analysisStage: 'FAST_PATH',
    classification: fastResult.classification,
  };

  updateBusinessVault(userId, vaultUpdate);

  // ── STAGE 2: DEEP PATH (async, non-blocking) ─────────────
  if (fastResult.deepAnalysisQueued && fastResult.deepJobId) {
    console.log(`[ADDI_TRACE:DEEP_PATH_QUEUED] job=${fastResult.deepJobId} url=${url}`);
  }

  if (urlLogId) {
    try {
      const resolvedFields = ['businessName', 'industry', 'businessDescription', 'location', 'services', 'products', 'targetAudience', 'businessStage', 'brandPersonality'];
      const resolvedCount = resolvedFields.filter(f => {
        const val = profile[f];
        if (Array.isArray(val)) return val.length > 0;
        return val != null && val !== '';
      }).length;
      const status = resolvedCount >= 3 ? 'SUCCESS' : resolvedCount >= 1 ? 'PARTIAL' : 'FAILED';
      urlAnalysisStore.update(urlLogId, {
        status,
        completed_at: new Date().toISOString(),
        duration_ms: fastResult.durationMs || null,
        website_classification: fastResult.classification?.class || null,
        analysis_method: fastResult.deepAnalysisQueued ? 'FAST_AND_DEEP' : 'FAST_PATH',
        analysis_job_id: fastResult.deepJobId || null,
        http_status: fastResult.retrievalMeta?.httpStatus || null,
        pages_analyzed: fastResult.retrievalMeta?.pagesInspected?.length || 1
      });
    } catch (logErr) {
      console.warn('[UrlAnalysisLog] Update failed:', logErr.message);
    }
  }

  safeRespond({
    success: true,
    sourceStatus: fastResult.sourceStatus,
    profile: canonical,
    retrievalMeta: fastResult.retrievalMeta,
    evidenceItems: evidenceItems,
    insufficientEvidence: false,
    requiresExpertReview: canonical.confidence?.score == null || canonical.confidence?.score < 40,
    addiMessage: null,
    analysisStage: 'FAST_PATH',
    deepAnalysisQueued: fastResult.deepAnalysisQueued || false,
    deepJobId: fastResult.deepJobId || null,
    durationMs: fastResult.durationMs || null,
    classification: fastResult.classification || null,
    failureReason: fastResult.failureReason || null,
    userMessage: fastResult.userMessage || null,
    retryable: fastResult.retryable || false,
    requiresManualInput: fastResult.requiresManualInput || false,
  });
  console.log('[ADDI:E2E:BACKEND_RESPONSE] profile fields:', Object.keys(canonical).join(', '));
});

// ─────────────────────────────────────────────────────────
// Document Analysis Endpoint
// Uses actual document text content, not just filename
// ─────────────────────────────────────────────────────────
router.post('/analyze-document', requireAuth, requireActiveUser, async (req, res) => {
  const { fileName, documentText, sourceType = 'company_profile' } = req.body;
  const userId = req.auth.userId;

  loadPersistedEvidence(userId);

  let docUrlLogId = null;
  try {
    const vault = getBusinessVault(userId);
    docUrlLogId = urlAnalysisStore.create({
      url: `doc:${fileName}`,
      status: 'PROCESSING',
      submitted_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      user_id: userId,
      user_name: vault?.name || null,
      user_mobile: vault?.phoneNumber || null,
      user_email: vault?.email || null,
      business_id: vault?.businessName ? userId : null,
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      analysis_method: 'DOCUMENT_UPLOAD'
    }).id;
  } catch (logErr) {
    console.warn('[UrlAnalysisLog] Document log create failed:', logErr.message);
  }

  const hasRealText = documentText && documentText.trim().length > 50 && !documentText.startsWith('Uploaded document filename');

  let profile;

  if (hasRealText) {
    // Real document text: analyze with AI
    const systemPrompt = `You are ADDI, ADDUS's business intelligence AI.
You have been provided with actual text extracted from a customer's business document.
Extract a structured business profile from this document text.

Rules:
- Only use information from the provided document text.
- If a field is not in the document, set it to null.
- Do NOT fabricate competitors or statistics.
- Respond ONLY with valid JSON (no markdown).

Required JSON structure:
{
  "businessName": string or null,
  "industry": string or null,
  "businessDescription": string or null,
  "services": array of strings,
  "products": array of strings,
  "targetAudience": string or null,
  "businessStage": string or null,
  "brandPersonality": string or null,
  "aiConfidenceScore": number 0-100,
  "insufficientFields": array of strings,
  "evidenceNotes": string
}`;

    const userPrompt = `Document: "${fileName}"\n\nDocument text:\n${documentText.slice(0, 3000)}`;

    try {
      const result = await executeAIRequest(
        REQUEST_TYPES.BUSINESS_PROFILE.name,
        userId,
        [],
        {
          userId,
          businessId: userId,
          systemPrompt,
          userPrompt,
          context: {
            documentText: documentText.slice(0, 3000),
            fileName
          }
        }
      );

      let parsed = {};
      try {
        const repaired = extractAndRepairJson(result.content);
        if (!repaired) throw new Error('No JSON object found in AI response');
        parsed = JSON.parse(repaired);
      } catch {
        console.error('[analyze-document] AI response parse failed. Raw:', result.content?.slice(0, 200));
      }

      profile = { ...parsed, sourceType: 'VERIFIED_DOCUMENT', uploadedDocuments: [fileName] };
    } catch (err) {
      console.error('[analyze-document] AI error:', err.message);
      profile = {
        businessName: null,
        businessDescription: null,
        services: [],
        products: [],
        sourceType: 'VERIFIED_DOCUMENT',
        uploadedDocuments: [fileName],
        aiConfidenceScore: null,
        confidenceStatus: 'UNKNOWN',
        confidenceReason: 'AI analysis failed for document',
        evidenceNotes: 'Document received but AI analysis failed.'
      };
    }
  } else {
    // No extractable text (binary file or filename only)
    profile = {
      businessName: null,
      businessDescription: `Document "${fileName}" uploaded. Text extraction was limited.`,
      services: [],
      products: [],
      sourceType: 'CUSTOMER_PROVIDED',
      uploadedDocuments: [fileName],
      aiConfidenceScore: null,
      confidenceStatus: 'UNKNOWN',
      confidenceReason: 'Insufficient text extracted from document for analysis',
      evidenceNotes: 'Document filename recorded. Text could not be extracted for analysis.'
    };
  }

   updateBusinessVault(userId, { uploadedDocuments: [fileName] });
   res.json({ profile });
});

// ─────────────────────────────────────────────────────────
// Business Description Analysis Endpoint
// Analyzes free-text business description provided by the user
// ─────────────────────────────────────────────────────────
router.post('/analyze-description', requireAuth, requireActiveUser, async (req, res) => {
  const { description, sourceType = 'manual' } = req.body;
  const userId = req.auth.userId;

  loadPersistedEvidence(userId);

  const hasRealText = description && description.trim().length > 10;

  let profile;

  if (hasRealText) {
    const systemPrompt = `You are ADDI, ADDUS's business intelligence AI.
You have been provided with a customer's free-text business description.
Extract a structured business profile from this description.

Rules:
- Only use information from the provided description.
- If a field is not mentioned, set it to null.
- Do NOT fabricate competitors or statistics.
- Respond ONLY with valid JSON (no markdown).

Required JSON structure:
{
  "businessName": string or null,
  "industry": string or null,
  "businessDescription": string or null,
  "services": array of strings,
  "products": array of strings,
  "targetAudience": string or null,
  "businessStage": string or null,
  "brandPersonality": string or null,
  "aiConfidenceScore": number 0-100,
  "insufficientFields": array of strings,
  "evidenceNotes": string
}`;

    const userPrompt = `Business description:\n${description.slice(0, 3000)}`;

    try {
      const result = await executeAIRequest(
        REQUEST_TYPES.BUSINESS_PROFILE.name,
        userId,
        [],
        {
          userId,
          businessId: userId,
          systemPrompt,
          userPrompt,
          context: {
            description: description.slice(0, 3000)
          }
        }
      );

      let parsed = {};
      try {
        const repaired = extractAndRepairJson(result.content);
        if (!repaired) throw new Error('No JSON object found in AI response');
        parsed = JSON.parse(repaired);
      } catch {
        console.error('[analyze-description] AI response parse failed. Raw:', result.content?.slice(0, 200));
      }

      profile = { ...parsed, sourceType: 'CUSTOMER_PROVIDED' };
    } catch (err) {
      console.error('[analyze-description] AI error:', err.message);
      profile = {
        businessName: null,
        businessDescription: description.slice(0, 200),
        services: [],
        products: [],
        sourceType: 'CUSTOMER_PROVIDED',
        aiConfidenceScore: null,
        confidenceStatus: 'UNKNOWN',
        confidenceReason: 'AI analysis failed for description',
        evidenceNotes: 'Description received but AI analysis failed.'
      };
    }
  } else {
    profile = {
      businessName: null,
      businessDescription: description || 'No description provided.',
      services: [],
      products: [],
      sourceType: 'CUSTOMER_PROVIDED',
      aiConfidenceScore: null,
      confidenceStatus: 'UNKNOWN',
      confidenceReason: 'Insufficient description text for analysis',
      evidenceNotes: 'Description too short for meaningful analysis.'
    };
  }

  updateBusinessVault(userId, { customerProvidedDescription: description });

  try {
    const vault = getBusinessVault(userId);
    const descLogId = urlAnalysisStore.create({
      url: `manual:${(description || '').slice(0, 80)}`,
      status: profile.businessName ? 'SUCCESS' : 'PARTIAL',
      submitted_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      user_id: userId,
      user_name: vault?.name || null,
      user_mobile: vault?.phoneNumber || null,
      user_email: vault?.email || null,
      business_id: vault?.businessName ? userId : null,
      request_id: `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
      analysis_method: 'MANUAL_INPUT',
      website_classification: null,
      http_status: null,
      pages_analyzed: 0
    }).id;
  } catch (logErr) {
    console.warn('[UrlAnalysisLog] Description log create failed:', logErr.message);
  }

  res.json({ profile });
});

// ─────────────────────────────────────────────────────────
// Recommendation Endpoint — Evidence-Driven, Bias-Free
//
// ARCHITECTURE:
//   1. Load vault (includes websiteEvidenceItems if website was analyzed)
//   2. Build full evidence context (website evidence + vault + customer info)
//   3. Call AI with ADDI_RECOMMENDATION_ENGINE prompt (supports negative recs)
//   4. Persist result to vault so Admin and Customer read the SAME object
//   5. Return structured serviceAssessments[]
//
// This is the SINGLE SOURCE OF TRUTH for recommendations.
// Customer dashboard and Admin CRM both read from the persisted result.
// ─────────────────────────────────────────────────────────
router.post('/recommend', requireAuth, requireActiveUser, async (req, res) => {
  const { context = {} } = req.body;
  const userId = req.auth.userId;

  loadPersistedEvidence(userId);

  try {
    const vault = getBusinessVault(userId);
    const evidenceItems = evidenceStore.getAllEvidence();

    // Run the structured AI intelligence pipeline
    const analysisId = `ANALYSIS_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    let analysisResult = await runAIIntelligencePipeline({
      userId,
      vault,
      evidenceItems,
      analysisId,
      promptType: 'ADDI_RECOMMENDATION_ENGINE'
    });

    // Phase 2: Generate recommendations using recommendation engine
    const gaps = analysisResult.structuredIntelligence?.gaps || [];
    const opportunities = analysisResult.structuredIntelligence?.opportunities || [];
    analysisResult.recommendations = generateRecommendations(
      gaps,
      opportunities,
      getEvidenceSummary(evidenceItems),
      vault.discoveredAssets || [],
      vault.industry || null
    );
    analysisResult.recommendationSummary = buildRecommendationSummary(analysisResult.recommendations);

    // Flag for human review if confidence is low or evidence is insufficient
    if (analysisResult.insufficientEvidence || analysisResult.confidence === 'low') {
      analysisResult = flagForHumanReview(analysisResult, [
        analysisResult.insufficientEvidence ? 'Insufficient evidence for reliable analysis' : 'Low confidence in AI-generated recommendations',
        'Expert review recommended before acting on recommendations'
      ]);
    }

    // Attach metadata
    analysisResult.generatedAt = new Date().toISOString();
    analysisResult.userId = userId;
    analysisResult.websiteInspectionPerformed = !!(vault.websiteRetrievalMeta && vault.websiteRetrievalMeta.pagesInspected?.length > 0);
    analysisResult.budgetStatus = 'requires_admin_pricing';

    // ── PERSIST to vault (backend) so future calls get same result ─────────────
    const strategicIntelligence = buildStrategicIntelligence(analysisResult.recommendations, analysisId);
    const existingIntelligence = (vault.strategicIntelligence || []).filter(
      item => item.analysisId !== analysisId
    );
    updateBusinessVault(userId, { 
      addiRecommendations: analysisResult,
      strategicIntelligence: [...existingIntelligence, ...strategicIntelligence]
    });

    // ── Return to frontend which will persist to localStorage (profile.businessBrain) ──
    res.json({ result: analysisResult });

  } catch(e) {
    console.error('[AI Routes Error] /recommend:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

// ─────────────────────────────────────────────────────────
// Business Intelligence Endpoint — Full Diagnostic
// Returns structured business intelligence with provenance,
// evidence quality, snapshot, recommendations, and questions.
// ─────────────────────────────────────────────────────────
router.post('/intelligence', requireAuth, requireActiveUser, async (req, res) => {
  const { context = {} } = req.body;
  const userId = req.auth.userId;

  loadPersistedEvidence(userId);

  try {
    const vault = getBusinessVault(userId);
    const evidenceItems = evidenceStore.getAllEvidence();

    const analysisId = `INTEL_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    let analysisResult = await runAIIntelligencePipeline({
      userId,
      vault,
      evidenceItems,
      analysisId,
      promptType: 'ADDI_RECOMMENDATION_ENGINE'
    });

    if (analysisResult.insufficientEvidence || analysisResult.confidence === 'low') {
      analysisResult = flagForHumanReview(analysisResult, [
        analysisResult.insufficientEvidence ? 'Insufficient evidence for reliable analysis' : 'Low confidence in AI-generated recommendations',
        'Expert review recommended before acting on recommendations'
      ]);
    }

    // Phase 2: Enhance with recommendation engine
    const intelGaps = analysisResult.structuredIntelligence?.gaps || [];
    const intelOpportunities = analysisResult.structuredIntelligence?.opportunities || [];
    analysisResult.recommendations = generateRecommendations(
      intelGaps,
      intelOpportunities,
      evidenceItems,
      vault.discoveredAssets || [],
      vault.industry || null
    );
    analysisResult.recommendationSummary = buildRecommendationSummary(analysisResult.recommendations);

    analysisResult.generatedAt = new Date().toISOString();
    analysisResult.userId = userId;
    analysisResult.websiteInspectionPerformed = !!(vault.websiteRetrievalMeta && vault.websiteRetrievalMeta.pagesInspected?.length > 0);
    analysisResult.budgetStatus = 'requires_admin_pricing';

    updateBusinessVault(userId, { addiRecommendations: analysisResult });
    const strategicIntelligence = buildStrategicIntelligence(analysisResult.serviceAssessments, analysisId);
    const existingIntelligence = (vault.strategicIntelligence || []).filter(
      item => item.analysisId !== analysisId
    );
    updateBusinessVault(userId, { 
      strategicIntelligence: [...existingIntelligence, ...strategicIntelligence]
    });

    const diagnosis = buildDiagnosis(vault, evidenceItems);
    updateBusinessVault(userId, { diagnosis });

    const presenceEvaluation = buildPresenceEvaluation(vault, evidenceItems);
    updateBusinessVault(userId, { presenceEvaluation });

    analysisResult.diagnosis = diagnosis.diagnosis;
    analysisResult.presenceEvaluation = presenceEvaluation.evaluation;

    res.json({ result: analysisResult });
  } catch (e) {
    console.error('[AI Routes Error] /intelligence:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

export default router;
