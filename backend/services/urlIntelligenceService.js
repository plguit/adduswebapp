/**
 * URL Intelligence Service
 * 
 * Two-stage URL analysis architecture:
 * 
 * STAGE 1 — FAST PATH (synchronous):
 *   - URL validation and normalization
 *   - Lightweight homepage fetch
 *   - Basic HTML parsing
 *   - Fast business information extraction
 *   - Website complexity classification
 *   - Return initial business understanding
 * 
 * STAGE 2 — DEEP PATH (asynchronous):
 *   - Queued for background processing
 *   - Additional page discovery
 *   - Deeper content extraction
 *   - AI enrichment
 *   - Business Brain update
 * 
 * The customer never waits for Stage 2.
 */

import { fetchWithRedirectValidation, validateAndNormalizeUrl } from '../routes/websiteRetrievalService.js';
import { analysisQueue, JOB_STATES } from './analysisQueue.js';
import { validateHostnameForFetch } from '../utils/ssrfProtection.js';
import { chromium } from 'playwright';

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const FAST_PATH_TIMEOUT_MS = 25000;
const FAST_PATH_MAX_BODY_CHARS = 3000;
const DEEP_PATH_PRIORITY = 'NORMAL';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─────────────────────────────────────────────────────────
// Simple In-Memory Cache
// ─────────────────────────────────────────────────────────

const fastPathCache = new Map();

function getCacheKey(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function getCachedResult(cacheKey) {
  const cached = fastPathCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    fastPathCache.delete(cacheKey);
    return null;
  }
  return cached.result;
}

function setCachedResult(cacheKey, result) {
  fastPathCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fastPathCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      fastPathCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// ─────────────────────────────────────────────────────────
// Website Complexity Classification
// ─────────────────────────────────────────────────────────

export const WEBSITE_CLASSES = {
  SIMPLE: 'SIMPLE',
  STANDARD: 'STANDARD',
  DYNAMIC: 'DYNAMIC',
  LARGE: 'LARGE',
  RESTRICTED: 'RESTRICTED',
};

function classifyWebsite(fetchResult, parsed, url) {
  if (!fetchResult.success || !fetchResult.html) {
    return { class: WEBSITE_CLASSES.RESTRICTED, reason: fetchResult.error || 'FETCH_FAILED' };
  }

  const html = fetchResult.html;
  const bodyText = parsed.bodyText || '';
  const scriptCount = (html.match(/<script[\s\S]*?<\/script>/gi) || []).length;
  const linkCount = (html.match(/<a\s/gi) || []).length;
  const bodyLength = bodyText.length;

  // Detect obvious dynamic frameworks
  const frameworkIndicators = [
    /react\s*data-reactroot/i,
    /__next\s*data/i,
    /vue-app/i,
    /ng-app/i,
    /angular/i,
    /ember/i,
    /svelte/i,
    /next\.js/i,
    /nuxt/i,
    /gatsby/i,
    /__NUXT__/i,
    /data-v-app/i,
  ];
  const hasFramework = frameworkIndicators.some(rx => rx.test(html));

  // Bot protection
  const botIndicators = [
    'captcha', 'cloudflare', 'verify you\'re not a robot', 'are you a robot',
    'incapsula', 'akamai', 'distil networks', 'access denied', 'forbidden'
  ];
  const hasBotProtection = botIndicators.some(ind => bodyText.toLowerCase().includes(ind));

  if (hasBotProtection) {
    return { class: WEBSITE_CLASSES.RESTRICTED, reason: 'BOT_PROTECTION' };
  }

  // Classification logic
  if (hasFramework || scriptCount > 15) {
    return { class: WEBSITE_CLASSES.DYNAMIC, reason: 'HEAVY_JS_OR_FRAMEWORK' };
  }

  if (bodyLength > 15000 || linkCount > 100) {
    return { class: WEBSITE_CLASSES.LARGE, reason: 'HIGH_CONTENT_VOLUME' };
  }

  if (scriptCount > 5 || linkCount > 30) {
    return { class: WEBSITE_CLASSES.STANDARD, reason: 'MODERATE_COMPLEXITY' };
  }

  return { class: WEBSITE_CLASSES.SIMPLE, reason: 'STATIC_OR_MINIMAL' };
}

// ─────────────────────────────────────────────────────────
// Fast Path: Lightweight homepage analysis
// ─────────────────────────────────────────────────────────

async function fastPathAnalysis(normalizedUrl) {
  const startTime = Date.now();
  
  let fetchResult;
  try {
    fetchResult = await fetchWithRedirectValidation(normalizedUrl, FAST_PATH_TIMEOUT_MS);
  } catch (err) {
    return {
      success: false,
      classification: { class: WEBSITE_CLASSES.RESTRICTED, reason: 'FETCH_ERROR' },
      fetchResult: { success: false, error: err.message, httpStatus: 0 },
      parsed: {},
      primaryPage: {},
      evidenceItems: [],
      durationMs: Date.now() - startTime,
    };
  }

  // Parse HTML (limited)
  const parsed = parseFastPathHtml(fetchResult.html || '', normalizedUrl);
  
  // Classify
  let classification = classifyWebsite(fetchResult, parsed, normalizedUrl);

  // Fallback to Headless Browser if DYNAMIC
  if (classification.class === WEBSITE_CLASSES.DYNAMIC) {
    try {
      console.log(`[URLIntelligence] DYNAMIC site detected for ${normalizedUrl}, launching Playwright fallback...`);
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; ADDUS-BusinessIntelligence/1.0; +https://addus.in/bot)',
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      
      // Navigate and wait for network idle to allow JS frameworks to render
      await page.goto(normalizedUrl, { waitUntil: 'networkidle', timeout: 15000 });
      
      const fullyRenderedHtml = await page.content();
      await browser.close();

      if (fullyRenderedHtml && fullyRenderedHtml.length > fetchResult.html.length) {
        console.log(`[URLIntelligence] Playwright fallback successful for ${normalizedUrl}. Original: ${fetchResult.html.length} chars, New: ${fullyRenderedHtml.length} chars.`);
        fetchResult.html = fullyRenderedHtml;
        parsed = parseFastPathHtml(fullyRenderedHtml, normalizedUrl);
        classification = classifyWebsite(fetchResult, parsed, normalizedUrl);
      }
    } catch (pwErr) {
      console.warn(`[URLIntelligence] Playwright fallback failed for ${normalizedUrl}:`, pwErr.message);
      // Fail silently and continue with the original limited parsed result
    }
  }
  
  // Build basic evidence
  const evidenceItems = buildFastPathEvidence(parsed, normalizedUrl, fetchResult);
  
  return {
    success: fetchResult.success && !!fetchResult.html,
    classification,
    fetchResult: {
      success: fetchResult.success,
      httpStatus: fetchResult.httpStatus,
      finalUrl: fetchResult.finalUrl,
      contentType: fetchResult.contentType,
      responseTimeMs: fetchResult.responseTimeMs,
      error: fetchResult.error,
    },
    parsed,
    primaryPage: {
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      og: parsed.og,
      contactInfo: parsed.contactInfo,
      socialLinks: parsed.socialLinks,
      headings: (parsed.headings || []).slice(0, 5),
      bodyText: parsed.bodyText,
    },
    evidenceItems,
    durationMs: Date.now() - startTime,
  };
}

// ─────────────────────────────────────────────────────────
// Fast Path HTML Parser (lightweight)
// ─────────────────────────────────────────────────────────

function parseFastPathHtml(html, baseUrl) {
  if (!html) return {};

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

  const headings = [];
  const headingMatches = html.matchAll(/<h([123])[^>]*>([^<]*(?:<(?!\/h\1)[^>]*>[^<]*)*)<\/h\1>/gi);
  for (const m of headingMatches) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 2) headings.push({ level: parseInt(m[1]), text: text.slice(0, 100) });
    if (headings.length >= 8) break;
  }

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, FAST_PATH_MAX_BODY_CHARS);

  const emails = [...new Set((bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || []))].slice(0, 3);
  const phones = [...new Set((bodyText.match(/[\+\d][\d\s\-().]{8,15}\d/g) || []).filter(p => p.replace(/\D/g, '').length >= 7))].slice(0, 3);
  
  const socialDomains = ['instagram.com', 'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
  const socialLinks = [];
  const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"'>]+)["'][^>]*>/gi)];
  for (const m of linkMatches) {
    try {
      const abs = new URL(m[1], baseUrl).href;
      if (socialDomains.some(s => abs.includes(s))) {
        socialLinks.push(abs);
      }
    } catch {}
    if (socialLinks.length >= 5) break;
  }

  return {
    title,
    metaDescription,
    headings,
    bodyText,
    contactInfo: { emails, phones },
    socialLinks: [...new Set(socialLinks)],
  };
}

// ─────────────────────────────────────────────────────────
// Fast Path Evidence Builder
// ─────────────────────────────────────────────────────────

function buildFastPathEvidence(parsed, sourceUrl, fetchResult) {
  const items = [];
  const ts = new Date().toISOString();

  if (parsed.title) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_title`,
      observation: `Page title: "${parsed.title}"`,
      evidence: parsed.title.slice(0, 200),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'identity',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  if (parsed.metaDescription) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_meta`,
      observation: 'Meta description found',
      evidence: parsed.metaDescription.slice(0, 200),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'business_description',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  if (parsed.headings?.length > 0) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_headings`,
      observation: `Page headings: ${parsed.headings.length} headings found`,
      evidence: parsed.headings.map(h => h.text).join(' | ').slice(0, 200),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'services',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  if (parsed.bodyText && parsed.bodyText.length > 100) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_body`,
      observation: 'Main page body text retrieved',
      evidence: parsed.bodyText.slice(0, 200),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'general',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  if (parsed.contactInfo?.emails?.length > 0) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_email`,
      observation: 'Contact email found',
      evidence: parsed.contactInfo.emails.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'contact',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  if (parsed.socialLinks?.length > 0) {
    items.push({
      evidenceId: `FAST_EV_${Date.now()}_social`,
      observation: `Social media presence: ${parsed.socialLinks.length} profiles`,
      evidence: parsed.socialLinks.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'social_presence',
      checkedAt: ts,
      stage: 'FAST_PATH',
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

export async function analyzeUrlFast(url) {
  const startTime = Date.now();
  
  // Validate URL
  const { isValid, normalizedUrl, error: validationError } = validateAndNormalizeUrl(url);
  if (!isValid) {
    return {
      success: false,
      sourceStatus: 'REJECTED_SOURCE',
      failureReason: 'INVALID_URL',
      userMessage: validationError || 'This website address doesn\'t appear to be valid.',
      profile: null,
      evidenceItems: [],
      classification: { class: WEBSITE_CLASSES.RESTRICTED, reason: 'INVALID_URL' },
      requiresManualInput: true,
      retryable: false,
      durationMs: Date.now() - startTime,
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(normalizedUrl);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult && cachedResult.success) {
    console.log(`[URLIntelligence] Cache hit for ${normalizedUrl}`);
    return {
      ...cachedResult,
      durationMs: Date.now() - startTime,
      cached: true,
      deepAnalysisQueued: false,
      deepJobId: null,
      stage: 'FAST_PATH',
    };
  }

  // Run fast path
  let fastResult;
  try {
    fastResult = await fastPathAnalysis(normalizedUrl);
  } catch (err) {
    console.error('[URLIntelligence] Fast path analysis error:', err);
    return {
      success: false,
      sourceStatus: 'RETRIEVAL_FAILED',
      failureReason: 'FAST_PATH_ERROR',
      userMessage: 'We couldn\'t analyze this website. Please try again or enter your business details manually.',
      profile: null,
      evidenceItems: [],
      classification: { class: WEBSITE_CLASSES.RESTRICTED, reason: 'ERROR' },
      requiresManualInput: true,
      retryable: true,
      durationMs: Date.now() - startTime,
    };
  }

  // Cache successful results
  if (fastResult.success) {
    setCachedResult(cacheKey, fastResult);
  }
  
  // Cache successful results (before adding deep analysis fields)
  if (fastResult.success) {
    setCachedResult(cacheKey, fastResult);
  }

  // Determine if deep analysis should be queued
  const shouldDeepAnalyze = fastResult.success && 
    fastResult.classification.class !== WEBSITE_CLASSES.RESTRICTED &&
    fastResult.evidenceItems.length < 5;

  let deepJobId = null;
  if (shouldDeepAnalyze) {
    try {
      const job = analysisQueue.enqueue({
        url,
        normalizedUrl,
        priority: 'NORMAL',
        existingEvidence: fastResult.evidenceItems,
        classification: fastResult.classification,
      });
      deepJobId = job.jobId;
    } catch (e) {
      console.warn('[URLIntelligence] Failed to enqueue deep analysis:', e.message);
    }
  }

  // Build initial profile from fast path
  const profile = buildFastPathProfile(fastResult);

  return {
    success: fastResult.success,
    sourceStatus: fastResult.success ? 'LIKELY_BUSINESS_WEBSITE' : 'RETRIEVAL_FAILED',
    failureReason: fastResult.success ? null : (fastResult.fetchResult.error || 'FAST_PATH_FAILED'),
    userMessage: fastResult.success ? null : (fastResult.fetchResult.error || 'We couldn\'t access this website.'),
    profile,
    evidenceItems: fastResult.evidenceItems,
    classification: fastResult.classification,
    retrievalMeta: fastResult.fetchResult,
    deepAnalysisQueued: !!deepJobId,
    deepJobId,
    requiresManualInput: !fastResult.success,
    retryable: fastResult.success ? false : true,
    durationMs: Date.now() - startTime,
    stage: 'FAST_PATH',
  };
}

// ─────────────────────────────────────────────────────────
// Profile Builder (Fast Path)
// ─────────────────────────────────────────────────────────

function buildFastPathProfile(fastResult) {
  const primaryPage = fastResult.primaryPage || {};
  const evidenceItems = fastResult.evidenceItems || [];
  
  const businessName = primaryPage.title || null;
  const industry = extractIndustryFast(primaryPage, fastResult.fetchResult?.finalUrl) || null;
  const businessDescription = primaryPage.metaDescription || null;
  const services = extractServicesFast(primaryPage);
  const businessStage = extractBusinessStageFast(primaryPage) || null;
  
  const contactInfo = {
    email: primaryPage.contactInfo?.emails?.[0] || null,
    phone: primaryPage.contactInfo?.phones?.[0] || null,
  };

  const socialLinks = primaryPage.socialLinks || [];

  const allFields = ['businessName', 'industry', 'businessDescription', 'services', 'businessStage', 'contactInfo', 'socialLinks'];
  const resolvedCount = allFields.filter(f => {
    if (f === 'contactInfo') return !!(contactInfo.email || contactInfo.phone);
    if (f === 'services') return services.length > 0;
    if (f === 'socialLinks') return socialLinks.length > 0;
    const fieldVal = primaryPage[f];
    return fieldVal != null && fieldVal !== '';
  }).length;
  const confidenceScore = Math.round((resolvedCount / allFields.length) * 100);

  return {
    businessName,
    industry,
    businessDescription,
    location: null,
    services,
    products: [],
    targetAudience: null,
    businessStage,
    brandPersonality: null,
    website: fastResult.fetchResult?.finalUrl || null,
    contactInfo,
    socialLinks,
    aiConfidenceScore: confidenceScore,
    confidenceStatus: confidenceScore >= 60 ? 'SUFFICIENT_EVIDENCE' : 'PARTIAL_EVIDENCE',
    confidenceReason: confidenceScore >= 60 ? 'Fast-path evidence sufficient' : 'Fast-path partial evidence',
    sourceType: 'VERIFIED_WEBSITE',
    insufficientFields: allFields.filter(f => {
      if (f === 'contactInfo') return !(contactInfo.email || contactInfo.phone);
      if (f === 'services') return services.length === 0;
      if (f === 'socialLinks') return socialLinks.length === 0;
      return !primaryPage[f];
    }),
    evidenceNotes: `Fast analysis completed in ${fastResult.durationMs}ms`,
    isConfirmed: false,
    stage: 'FAST_PATH',
  };
}

// ─────────────────────────────────────────────────────────
// Fast Extraction Helpers
// ─────────────────────────────────────────────────────────

function extractIndustryFast(primaryPage, url) {
  const text = `${primaryPage.title || ''} ${primaryPage.metaDescription || ''} ${primaryPage.bodyText || ''}`.toLowerCase();
  
  const industryScores = {
    'Hospitality': { keywords: ['hotel', 'resort', 'inn', 'lodge', 'accommodation', 'stay', 'rooms', 'suites', 'villa', 'cottage', 'backwater', 'hospitality', 'check-in', 'checkout', 'restaurant', 'cafe', 'menu', 'dining', 'cuisine', 'banquet', 'ayurveda', 'spa', 'wellness'], weight: 1.5 },
    'E-commerce': { keywords: ['shop', 'store', 'cart', 'checkout', 'ecommerce', 'e-commerce', 'online store', 'product catalog', 'buy now', 'product', 'price', 'discount', 'offer', 'sale', 'shipping'], weight: 1.4 },
    'Healthcare': { keywords: ['hospital', 'clinic', 'medical center', 'healthcare', 'doctor', 'pharmacy', 'diagnostic', 'patient care', 'health', 'medical', 'wellness', 'therapy', 'treatment', 'appointment'], weight: 1.4 },
    'Real Estate': { keywords: ['real estate', 'property', 'realtor', 'realty', 'property management', 'homes for sale', 'listings', 'homes', 'rental', 'lease', 'mortgage'], weight: 1.3 },
    'Food & Beverage': { keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'cuisine', 'beverage', 'bakery', 'catering', 'pub', 'bar', 'chef', 'recipe', 'taste', 'fresh', 'organic'], weight: 1.3 },
    'Finance': { keywords: ['bank', 'insurance', 'investment', 'wealth management', 'financial services', 'fintech', 'trading', 'brokerage', 'finance', 'banking', 'capital', 'portfolio'], weight: 1.3 },
    'Education': { keywords: ['university', 'college', 'school', 'academy', 'institute', 'educational', 'learning', 'course', 'training', 'students', 'faculty'], weight: 1.2 },
    'Technology': { keywords: ['software', 'saas', 'platform', 'dashboard', 'subscription', 'cloud', 'api', 'enterprise software', 'technology', 'tech', 'innovation', 'gadget', 'device'], weight: 1.2 },
    'Agency': { keywords: ['agency', 'creative', 'marketing', 'design', 'branding', 'digital agency', 'production house', 'advertising', 'campaign', 'client'], weight: 1.2 },
    'Manufacturing': { keywords: ['manufacturing', 'factory', 'production', 'industrial', 'manufacturer', 'plant', 'assembly', 'wholesale', 'supply', 'distribution'], weight: 1.2 },
    'Consulting': { keywords: ['consulting', 'advisory', 'strategy', 'expertise', 'professional services', 'consulting firm', 'advisory', 'client services'], weight: 1.1 },
    'News & Media': { keywords: ['news', 'breaking news', 'journalist', 'newsroom', 'media', 'newspaper', 'magazine', 'editorial', 'correspondent', 'reporter', 'article', 'story', 'coverage'], weight: 1.1 },
  };

  let bestIndustry = null;
  let bestScore = 0;

  for (const [industry, config] of Object.entries(industryScores)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (text.includes(keyword)) {
        score += config.weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestScore >= 2 ? bestIndustry : null;
}

function extractServicesFast(primaryPage) {
  const services = [];
  const headingTexts = (primaryPage.headings || [])
    .filter(h => /service|accommodation|dining|ayurveda|banquet|facility|amenity|room|product|collection|solution|offer/i.test(h.text))
    .map(h => h.text.replace(/\s*\|\s*/g, ', ').trim())
    .filter(t => t.length > 2 && t.length < 60);

  if (headingTexts.length > 0) {
    services.push(...headingTexts.slice(0, 5));
  }

  return [...new Set(services)];
}

function extractBusinessStageFast(primaryPage) {
  const text = `${primaryPage.title || ''} ${primaryPage.metaDescription || ''} ${primaryPage.bodyText || ''}`.toLowerCase();
  if (text.includes('startup') || text.includes('launch') || text.includes('founding') || text.includes('early stage') || text.includes('seed')) return 'Startup';
  if (text.includes('growing') || text.includes('expanding') || text.includes('scaling') || text.includes('growth') || text.includes('scale')) return 'Growth';
  if (text.includes('established') || text.includes('leading') || text.includes('market leader') || text.includes('since') || text.includes('years')) return 'Established';
  if (text.includes('enterprise') || text.includes('corporate') || text.includes('global')) return 'Enterprise';
  return null;
}

// ─────────────────────────────────────────────────────────
// Deep Analysis Trigger
// ─────────────────────────────────────────────────────────

export async function triggerDeepAnalysis(userId, url, normalizedUrl, classification, existingEvidence) {
  try {
    const job = analysisQueue.enqueue({
      userId,
      url,
      normalizedUrl,
      priority: 'NORMAL',
      existingEvidence,
      classification,
    });
    return { success: true, jobId: job.jobId };
  } catch (e) {
    console.warn('[URLIntelligence] Deep analysis enqueue failed:', e.message);
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────
// Cache Key Generation
// ─────────────────────────────────────────────────────────

export function generateCacheKey(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export function getCacheDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}
