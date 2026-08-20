import { apiService } from './apiService.js';
import { businessProfileService } from './businessProfileService.js';
import { sessionManager } from './sessionManager.js';
import { syncService } from './syncService.js';

/**
 * Business Analysis Service (Phase 2 AI Integrated)
 * 
 * Provides AI analysis for:
 * - Website URL
 * - Social Media Profile
 * - Google Business Profile
 * - Company Profile / Brochure Documents (PDF, DOCX, Images)
 * - Free-text Business Description
 */

function formatProfileResponse(resProfile, fallbackType, inputVal) {
  const profile = resProfile || {};

  const services = Array.isArray(profile.services) && profile.services.length > 0
    ? profile.services
    : (profile.services ? profile.services.split(',').map(s => s.trim()) : []);

  const products = Array.isArray(profile.products) && profile.products.length > 0
    ? profile.products
    : (profile.products ? profile.products.split(',').map(p => p.trim()) : []);

  const derivedName = profile.businessName || null;

  const derivedIndustry = profile.industry || null;

  const stageVal = profile.businessStage || null;

  const fieldSources = {
    businessName: profile.businessName ? (fallbackType === 'website' ? 'WEBSITE_DERIVED' : 'USER_PROVIDED') : 'UNKNOWN',
    industry: profile.industry ? 'WEBSITE_DERIVED' : 'UNKNOWN',
    businessStage: profile.businessStage ? 'WEBSITE_DERIVED' : 'UNKNOWN',
    services: (services && services.length > 0) ? 'WEBSITE_DERIVED' : 'UNKNOWN',
    products: (products && products.length > 0) ? 'WEBSITE_DERIVED' : 'UNKNOWN',
    targetAudience: profile.targetAudience ? 'AI_INFERRED' : 'UNKNOWN'
  };

  return {
    businessName: derivedName,
    industry: derivedIndustry,
    businessDescription: profile.businessDescription || null,
    location: profile.location || null,
    services: services.length > 0 ? services : [],
    products: products.length > 0 ? products : [],
    targetAudience: profile.targetAudience || null,
    businessStage: stageVal,
    brandPersonality: profile.brandPersonality || null,
    website: profile.website || (fallbackType === 'website' ? inputVal : ''),
    socialLinks: profile.socialLinks || (fallbackType === 'social' ? [inputVal] : []),
    googleBusiness: profile.googleBusiness || (fallbackType === 'google' ? inputVal : ''),
    uploadedDocuments: profile.uploadedDocuments || [],
    aiConfidenceScore: profile.aiConfidenceScore || null,
    sourceType: profile.sourceType || fallbackType,
    sourceStatus: profile.sourceStatus || null,
    failureReason: profile.failureReason || null,
    userMessage: profile.userMessage || null,
    fieldSources,
    assets: profile.assets || [],
    confidence: profile.confidence || {},
    evidence: profile.evidence || [],
    aiUsed: profile.aiUsed || false,
    aiTriggerReason: profile.aiTriggerReason || null,
    summary: profile.summary || null,
    summaryProvenance: profile.summaryProvenance || null,
    summaryConfidence: profile.summaryConfidence || null,
    isConfirmed: false
  };
}

export const businessAnalysisService = {
  /**
   * Analyzes Website URL content using Groq AI.
   */
  async analyzeWebsite(url) {
    try {
      console.log('[ADDI:E2E:REQUEST] analyzeWebsite called:', { url });
      const evidenceResponse = await apiService.post('/analyze-website', {
        url
      });
      console.log('[ADDI:E2E:RESPONSE]', JSON.stringify(evidenceResponse, null, 2));

      // Handle retrieval failures with structured failure info
      if (evidenceResponse?.success === false) {
        return {
          businessName: null,
          industry: null,
          businessDescription: null,
          location: null,
          services: [],
          products: [],
          targetAudience: null,
          businessStage: null,
          brandPersonality: null,
          website: url,
          contactInfo: {},
          socialLinks: [],
          assets: [],
          fieldSources: {},
          aiConfidenceScore: null,
          confidenceStatus: 'UNKNOWN',
          confidenceReason: 'Website retrieval failed',
          sourceType: 'VERIFIED_WEBSITE',
          sourceStatus: evidenceResponse.sourceStatus || 'RETRIEVAL_FAILED',
          failureReason: evidenceResponse.failureReason || null,
          userMessage: evidenceResponse.userMessage || 'We couldn\'t access enough information from this website. Please try again or describe your business manually.',
          retryable: evidenceResponse.retryable || false,
          requiresManualInput: evidenceResponse.requiresManualInput || true,
          evidenceCount: evidenceResponse.evidenceCount ?? evidenceResponse.evidenceItems?.length ?? 0,
          retrievalMeta: evidenceResponse.retrievalMeta || null,
          isConfirmed: false
        };
      }

      const profile = evidenceResponse?.profile || {};
      const evidence = evidenceResponse?.evidenceItems || [];

      const resolved = {
        businessName: profile.businessName || null,
        industry: profile.industry || null,
        services: Array.isArray(profile.services) ? profile.services : [],
        location: profile.location || null,
        businessDescription: profile.businessDescription || profile.summary || null,
        products: Array.isArray(profile.products) ? profile.products : [],
        targetAudience: profile.targetAudience || null,
        businessStage: profile.businessStage || null,
        brandPersonality: profile.brandPersonality || null,
        website: profile.website || url,
        contactInfo: profile.contactInfo || {},
        socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
        assets: Array.isArray(profile.assets) ? profile.assets : [],
        confidence: profile.confidence || {},
        fieldProvenance: profile.fieldProvenance || {},
        evidence: evidence,
        aiUsed: profile.aiUsed || false,
        aiTriggerReason: profile.aiTriggerReason || null,
        summary: profile.summary || null,
        summaryProvenance: profile.summaryProvenance || null,
        summaryConfidence: profile.summaryConfidence || null
      };

      const fieldSources = {
        businessName: resolved.fieldProvenance.businessName || (resolved.businessName ? 'WEBSITE_DERIVED' : 'UNKNOWN'),
        industry: resolved.fieldProvenance.industry || (resolved.industry ? 'WEBSITE_DERIVED' : 'UNKNOWN'),
        businessStage: resolved.fieldProvenance.businessStage || (resolved.businessStage ? 'WEBSITE_DERIVED' : 'UNKNOWN'),
        services: resolved.fieldProvenance.services || (resolved.services.length > 0 ? 'WEBSITE_DERIVED' : 'UNKNOWN'),
        products: resolved.fieldProvenance.products || (resolved.products.length > 0 ? 'WEBSITE_DERIVED' : 'UNKNOWN'),
        targetAudience: resolved.fieldProvenance.targetAudience || (resolved.targetAudience ? 'WEBSITE_DERIVED' : 'UNKNOWN')
      };

      const aiConfidenceScore = resolved.confidence?.score ?? profile.aiConfidenceScore ?? null;

      return {
        businessName: resolved.businessName,
        industry: resolved.industry,
        businessDescription: resolved.businessDescription,
        location: resolved.location,
        services: resolved.services,
        products: resolved.products,
        targetAudience: resolved.targetAudience,
        businessStage: resolved.businessStage,
        brandPersonality: resolved.brandPersonality,
        website: resolved.website,
        contactInfo: resolved.contactInfo,
        socialLinks: resolved.socialLinks,
        assets: resolved.assets,
        fieldSources,
        aiConfidenceScore,
        confidenceStatus: resolved.confidence?.status || 'SUFFICIENT_EVIDENCE',
        confidenceReason: resolved.confidence?.reason || 'Website analysis completed',
        sourceType: profile.sourceType || 'VERIFIED_WEBSITE',
        evidence: resolved.evidence,
        aiUsed: resolved.aiUsed,
        aiTriggerReason: resolved.aiTriggerReason,
        summary: resolved.summary,
        summaryProvenance: resolved.summaryProvenance,
        summaryConfidence: resolved.summaryConfidence,
        sourceStatus: evidenceResponse.sourceStatus || 'LIKELY_BUSINESS_WEBSITE',
        failureReason: evidenceResponse.failureReason || null,
        userMessage: evidenceResponse.userMessage || null,
        retryable: evidenceResponse.retryable || false,
        requiresManualInput: evidenceResponse.requiresManualInput || false,
        evidenceCount: evidenceResponse.evidenceCount ?? evidence.length,
        retrievalMeta: evidenceResponse.retrievalMeta || null,
        isConfirmed: false
      };
    } catch (err) {
      console.warn('[BusinessAnalysisService Website Error]', err);
      return {
        businessName: null,
        industry: null,
        businessDescription: null,
        location: null,
        services: [],
        products: [],
        targetAudience: null,
        businessStage: null,
        brandPersonality: null,
        website: url,
        contactInfo: {},
        socialLinks: [],
        assets: [],
        fieldSources: {},
        aiConfidenceScore: null,
        confidenceStatus: 'UNKNOWN',
        confidenceReason: 'Website analysis failed',
        sourceType: 'VERIFIED_WEBSITE',
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: err.message || 'NETWORK_ERROR',
        userMessage: 'We couldn\'t connect to the analysis service. Please try again or enter your business details manually.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0,
        retrievalMeta: null,
        isConfirmed: false
      };
    }
  },

  /**
   * Analyzes Social Media Profile link using Groq AI.
   */
  async analyzeSocial(url) {
    try {
      const response = await apiService.post('/analyze-social', {
        url
      });
      return formatProfileResponse(response.profile, 'social', url);
    } catch (err) {
      console.warn('[BusinessAnalysisService Social Error]', err);
    }
    return formatProfileResponse(null, 'social', url);
  },

  /**
   * Analyzes Google Business Profile link using Groq AI.
   */
  async analyzeGoogleBusiness(url) {
    try {
      const response = await apiService.post('/analyze-google-business', {
        url
      });
      return formatProfileResponse(response.profile, 'google', url);
    } catch (err) {
      console.warn('[BusinessAnalysisService Google Business Error]', err);
    }
    return formatProfileResponse(null, 'google', url);
  },

  /**
   * Analyzes uploaded document (PDF, DOCX, JPG, PNG) using Groq AI.
   */
  async analyzeDocument(file, docType = 'company_profile') {
    const fileName = typeof file === 'object' && file?.name ? file.name : 'Company Profile Document';
    let documentText = '';

    if (typeof file === 'object' && file && file.text) {
      try {
        documentText = await file.text();
      } catch (e) {
        documentText = `Uploaded document filename: ${fileName}`;
      }
    } else {
      documentText = `Uploaded document filename: ${fileName}`;
    }

    try {
      const response = await apiService.post('/analyze-document', {
        fileName,
        documentText: documentText.slice(0, 3000),
        sourceType: docType
      });
      if (response && response.profile) {
        return formatProfileResponse(response.profile, docType, fileName);
      }
    } catch (err) {
      console.warn('[BusinessAnalysisService Document Error]', err);
    }
    return formatProfileResponse(null, docType, fileName);
  },

  /**
   * Analyzes free-text user description using Groq AI.
   */
  async analyzeBusinessDescription(text) {
    try {
      const response = await apiService.post('/analyze-description', {
        description: text
      });
      if (response && response.profile) {
        return formatProfileResponse(response.profile, 'manual', text);
      }
    } catch (err) {
      console.warn('[BusinessAnalysisService Description Error]', err);
    }
    return formatProfileResponse(null, 'manual', text);
  },

  /**
   * Auto-routing dispatcher: detects whether input is a URL or plain text
   * and routes to the appropriate analysis method.
   * Fixes ConversationalOnboarding step 3 which calls this directly.
   */
  async analyzeUrlOrText(input) {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();
    console.log('[ADDI_TRACE:ANALYZE_URL_OR_TEXT]', {
      rawInput: input,
      trimmed,
    });

    // Detect social links
    if (/instagram\.com|facebook\.com|twitter\.com|linkedin\.com|x\.com/i.test(trimmed)) {
      console.log('[ADDI_TRACE:DETECTED_SOCIAL]', trimmed);
      return this.analyzeSocial(trimmed);
    }

    // Detect Google Maps / Business
    if (/maps\.google|g\.page|goo\.gl\/maps/i.test(trimmed)) {
      console.log('[ADDI_TRACE:DETECTED_GOOGLE_BUSINESS]', trimmed);
      return this.analyzeGoogleBusiness(trimmed);
    }

    // Detect URL-like input: has a TLD after a dot, no internal spaces
    const looksLikeUrl = /^https?:\/\//i.test(trimmed) ||
      (/\.[a-z]{2,}(\b|\/)/i.test(trimmed) && !trimmed.includes(' '));

    if (looksLikeUrl) {
      console.log('[ADDI_TRACE:DETECTED_URL]', trimmed);
      return this.analyzeWebsite(trimmed);
    }

    // Fallback: treat as free-text description
    console.log('[ADDI_TRACE:DETECTED_TEXT]', trimmed);
    return this.analyzeBusinessDescription(trimmed);
  },
  /**
   * Handle AI gateway with evidence-first approach
   * Only sends unresolved fields to AI after token budget check
   */
   async handleAIGateWay(resolvedFields) {
     // Prepare unresolved fields for AI processing
     const unresolvedFields = Object.entries(resolvedFields)
       .filter(([_, field]) => !field.value || field.provenance === 'UNKNOWN')
       .map(([key, field]) => ({ key, field }));
     
     // If all fields resolved, return early (shouldn't happen in this path)
     if (unresolvedFields.length === 0) {
       return resolvedFields;
     }
   }
};