/**
 * ADDUS Platform — Professional Presence Evaluation Engine
 *
 * Phase 7 implementation:
 *  - Evidence-based professional presence scoring
 *  - Multi-dimensional evaluation
 *  - Confidence-weighted assessments
 *  - Provenance tracking for all scores
 */

import { EVIDENCE_TYPES, PROVENANCE_STATES, CONFIDENCE_LEVELS, getEvidenceSummary, aggregateEvidenceByType } from './evidenceService.js';

export const PRESENCE_DIMENSIONS = {
  BRAND_IDENTITY: 'Brand Identity',
  WEBSITE: 'Website',
  CONTENT: 'Content',
  COMMUNICATION: 'Communication',
  CUSTOMER_FACING: 'Customer-Facing Experience',
  TRUST_SIGNALS: 'Trust Signals',
  CONSISTENCY: 'Consistency',
  DISCOVERABILITY: 'Discoverability'
};

export function buildPresenceEvaluation(vault, evidenceItems = []) {
  const safeVault = vault || {};
  const evidenceSummary = getEvidenceSummary(evidenceItems);
  const aggregated = aggregateEvidenceByType(evidenceItems);
  
  const dimensions = {};
  const scores = [];

  // ─────────────────────────────────────────────────────────
  // 1. Brand Identity
  // ─────────────────────────────────────────────────────────
  const brandAssets = safeVault.brandAssets || {};
  const hasLogo = !!brandAssets.logo;
  const hasPackaging = !!brandAssets.packaging;
  const hasBrandDescription = !!(safeVault.brandPersonality || safeVault.businessDescription);
  const brandEvidence = aggregated[EVIDENCE_TYPES.BRAND] || [];
  
  let brandScore = null;
  let brandConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let brandStrengths = [];
  let brandGaps = [];
  let brandEvidenceRefs = [];
  let brandReason = 'Insufficient evidence to evaluate.';

  if (brandEvidence.length > 0 || hasLogo || hasBrandDescription) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasLogo) { scoreVal += 25; maxScore += 25; brandStrengths.push('Logo asset present'); }
    else { brandGaps.push('No logo detected'); }
    
    if (hasPackaging) { scoreVal += 15; maxScore += 15; brandStrengths.push('Packaging asset present'); }
    else { brandGaps.push('No packaging detected'); }
    
    if (hasBrandDescription) { scoreVal += 20; maxScore += 20; brandStrengths.push('Brand personality or description documented'); }
    else { brandGaps.push('No brand personality documented'); }
    
    if (brandEvidence.length > 0) { scoreVal += 20; maxScore += 20; brandEvidenceRefs = brandEvidence.slice(0, 2).map(e => e.evidenceId); }
    else { brandGaps.push('No brand-related evidence retrieved'); }
    
    maxScore += 20; // For general brand coherence
    if (brandStrengths.length >= 3) scoreVal += 20;
    
    brandScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    brandConfidence = brandEvidence.length > 0 ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    brandReason = brandGaps.length === 0 
      ? 'Strong brand identity foundation with documented assets and personality.'
      : `Brand identity is partial. ${brandGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.BRAND_IDENTITY] = {
    dimension: PRESENCE_DIMENSIONS.BRAND_IDENTITY,
    score: brandScore,
    confidence: brandConfidence,
    strengths: brandStrengths,
    gaps: brandGaps,
    evidence: brandEvidenceRefs,
    reason: brandReason,
    provenance: brandEvidence.length > 0 ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (brandScore !== null) scores.push(brandScore);

  // ─────────────────────────────────────────────────────────
  // 2. Website
  // ─────────────────────────────────────────────────────────
  const websiteMeta = safeVault.websiteRetrievalMeta || null;
  const websiteEvidence = aggregated[EVIDENCE_TYPES.METADATA] || aggregated[EVIDENCE_TYPES.GENERAL] || [];
  const hasWebsite = !!(safeVault.websiteUrl || safeVault.website || brandAssets.website);
  
  let websiteScore = null;
  let websiteConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let websiteStrengths = [];
  let websiteGaps = [];
  let websiteEvidenceRefs = [];
  let websiteReason = 'Insufficient evidence to evaluate.';

  if (hasWebsite || websiteMeta) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasWebsite) { scoreVal += 20; maxScore += 20; websiteStrengths.push('Website URL documented'); }
    else { websiteGaps.push('No website URL found'); }
    
    if (websiteMeta && websiteMeta.retrievalSuccess) {
      scoreVal += 30; maxScore += 30;
      websiteStrengths.push('Website successfully retrieved and analyzed');
      websiteEvidenceRefs = websiteEvidence.slice(0, 3).map(e => e.evidenceId);
    } else if (websiteMeta && websiteMeta.sourceStatus === 'ACCESS_BLOCKED') {
      websiteGaps.push('Website access is blocked');
    } else if (websiteMeta && websiteMeta.sourceStatus === 'RETRIEVAL_FAILED') {
      websiteGaps.push('Website retrieval failed');
    } else if (websiteMeta && websiteMeta.sourceStatus === 'INSUFFICIENT_EVIDENCE') {
      websiteGaps.push('Website has insufficient content');
    } else {
      websiteGaps.push('Website not yet analyzed');
    }
    
    if (websiteEvidence.length > 0 && !websiteMeta?.retrievalSuccess) {
      scoreVal += 20; maxScore += 20;
      websiteEvidenceRefs = websiteEvidence.slice(0, 2).map(e => e.evidenceId);
    }
    
    maxScore += 30; // For design/UX quality (requires evidence or inspection)
    if (websiteStrengths.length >= 2) scoreVal += 20;
    
    websiteScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    websiteConfidence = websiteMeta?.retrievalSuccess ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    websiteReason = websiteGaps.length === 0
      ? 'Website is accessible and provides a solid digital foundation.'
      : `Website evaluation incomplete. ${websiteGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.WEBSITE] = {
    dimension: PRESENCE_DIMENSIONS.WEBSITE,
    score: websiteScore,
    confidence: websiteConfidence,
    strengths: websiteStrengths,
    gaps: websiteGaps,
    evidence: websiteEvidenceRefs,
    reason: websiteReason,
    provenance: websiteMeta?.retrievalSuccess ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (websiteScore !== null) scores.push(websiteScore);

  // ─────────────────────────────────────────────────────────
  // 3. Content
  // ─────────────────────────────────────────────────────────
  const contentEvidence = aggregated[EVIDENCE_TYPES.CONTENT] || [];
  const hasServices = Array.isArray(safeVault.services) && safeVault.services.length > 0;
  const hasProducts = Array.isArray(safeVault.products) && safeVault.products.length > 0;
  const hasDescription = !!(safeVault.businessDescription && safeVault.businessDescription.length >= 20);
  
  let contentScore = null;
  let contentConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let contentStrengths = [];
  let contentGaps = [];
  let contentEvidenceRefs = [];
  let contentReason = 'Insufficient evidence to evaluate.';

  if (contentEvidence.length > 0 || hasDescription || hasServices) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasDescription) { scoreVal += 25; maxScore += 25; contentStrengths.push('Business description available'); }
    else { contentGaps.push('No business description'); }
    
    if (hasServices) { scoreVal += 25; maxScore += 25; contentStrengths.push('Services documented'); }
    else { contentGaps.push('No services documented'); }
    
    if (hasProducts) { scoreVal += 15; maxScore += 15; contentStrengths.push('Products documented'); }
    else { contentGaps.push('No products documented'); }
    
    if (contentEvidence.length > 0) { scoreVal += 20; maxScore += 20; contentEvidenceRefs = contentEvidence.slice(0, 2).map(e => e.evidenceId); }
    else { contentGaps.push('No content evidence retrieved'); }
    
    maxScore += 15; // For content quality/consistency
    if (contentStrengths.length >= 3) scoreVal += 15;
    
    contentScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    contentConfidence = contentEvidence.length > 0 ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    contentReason = contentGaps.length === 0
      ? 'Content is well-documented with clear offerings.'
      : `Content evaluation partial. ${contentGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.CONTENT] = {
    dimension: PRESENCE_DIMENSIONS.CONTENT,
    score: contentScore,
    confidence: contentConfidence,
    strengths: contentStrengths,
    gaps: contentGaps,
    evidence: contentEvidenceRefs,
    reason: contentReason,
    provenance: contentEvidence.length > 0 ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (contentScore !== null) scores.push(contentScore);

  // ─────────────────────────────────────────────────────────
  // 4. Communication
  // ─────────────────────────────────────────────────────────
  const contactEvidence = aggregated[EVIDENCE_TYPES.CONTACT] || [];
  const hasEmail = !!(safeVault.email || safeVault.contactInfo?.email);
  const hasPhone = !!(safeVault.phoneNumber || safeVault.contactInfo?.phone);
  const hasSocial = Array.isArray(brandAssets.socialLinks) && brandAssets.socialLinks.length > 0;
  
  let communicationScore = null;
  let communicationConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let communicationStrengths = [];
  let communicationGaps = [];
  let communicationEvidenceRefs = [];
  let communicationReason = 'Insufficient evidence to evaluate.';

  if (contactEvidence.length > 0 || hasEmail || hasPhone) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasEmail) { scoreVal += 25; maxScore += 25; communicationStrengths.push('Email contact available'); }
    else { communicationGaps.push('No email contact found'); }
    
    if (hasPhone) { scoreVal += 25; maxScore += 25; communicationStrengths.push('Phone contact available'); }
    else { communicationGaps.push('No phone contact found'); }
    
    if (hasSocial) { scoreVal += 20; maxScore += 20; communicationStrengths.push('Social media presence detected'); }
    else { communicationGaps.push('No social media links found'); }
    
    if (contactEvidence.length > 0) { scoreVal += 20; maxScore += 20; communicationEvidenceRefs = contactEvidence.slice(0, 2).map(e => e.evidenceId); }
    else { communicationGaps.push('No contact evidence retrieved'); }
    
    maxScore += 10; // For communication clarity
    if (communicationStrengths.length >= 3) scoreVal += 10;
    
    communicationScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    communicationConfidence = contactEvidence.length > 0 ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    communicationReason = communicationGaps.length === 0
      ? 'Multiple communication channels are available and accessible.'
      : `Communication channels incomplete. ${communicationGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.COMMUNICATION] = {
    dimension: PRESENCE_DIMENSIONS.COMMUNICATION,
    score: communicationScore,
    confidence: communicationConfidence,
    strengths: communicationStrengths,
    gaps: communicationGaps,
    evidence: communicationEvidenceRefs,
    reason: communicationReason,
    provenance: contactEvidence.length > 0 ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (communicationScore !== null) scores.push(communicationScore);

  // ─────────────────────────────────────────────────────────
  // 5. Customer-Facing Experience
  // ─────────────────────────────────────────────────────────
  const hasPricing = evidenceItems.some(e => e.evidenceType === EVIDENCE_TYPES.PRICING);
  const hasReviews = evidenceItems.some(e => e.evidenceType === EVIDENCE_TYPES.REVIEWS);
  
  let customerFacingScore = null;
  let customerFacingConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let customerFacingStrengths = [];
  let customerFacingGaps = [];
  let customerFacingEvidenceRefs = [];
  let customerFacingReason = 'Insufficient evidence to evaluate.';

  if (websiteMeta?.retrievalSuccess || hasPricing || hasReviews) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (websiteMeta?.retrievalSuccess) { scoreVal += 30; maxScore += 30; customerFacingStrengths.push('Website is accessible'); }
    else { customerFacingGaps.push('Website not analyzed'); }
    
    if (hasPricing) { scoreVal += 25; maxScore += 25; customerFacingStrengths.push('Pricing information found'); }
    else { customerFacingGaps.push('No pricing information found'); }
    
    if (hasReviews) { scoreVal += 25; maxScore += 25; customerFacingStrengths.push('Customer reviews or testimonials found'); }
    else { customerFacingGaps.push('No reviews or testimonials found'); }
    
    maxScore += 20; // For overall UX experience
    if (customerFacingStrengths.length >= 2) scoreVal += 20;
    
    customerFacingScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    customerFacingConfidence = websiteMeta?.retrievalSuccess ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    customerFacingReason = customerFacingGaps.length === 0
      ? 'Customer-facing experience appears well-structured.'
      : `Customer-facing experience has gaps. ${customerFacingGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.CUSTOMER_FACING] = {
    dimension: PRESENCE_DIMENSIONS.CUSTOMER_FACING,
    score: customerFacingScore,
    confidence: customerFacingConfidence,
    strengths: customerFacingStrengths,
    gaps: customerFacingGaps,
    evidence: customerFacingEvidenceRefs,
    reason: customerFacingReason,
    provenance: websiteMeta?.retrievalSuccess ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (customerFacingScore !== null) scores.push(customerFacingScore);

  // ─────────────────────────────────────────────────────────
  // 6. Trust Signals
  // ─────────────────────────────────────────────────────────
  const trustEvidence = evidenceItems.filter(e => 
    e.evidenceType === EVIDENCE_TYPES.REVIEWS || 
    e.evidenceType === EVIDENCE_TYPES.STRUCTURED_DATA ||
    (e.title && e.title.toLowerCase().includes('trust'))
  );
  
  let trustScore = null;
  let trustConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let trustStrengths = [];
  let trustGaps = [];
  let trustEvidenceRefs = [];
  let trustReason = 'Insufficient evidence to evaluate.';

  if (trustEvidence.length > 0 || websiteMeta?.retrievalSuccess) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasReviews) { scoreVal += 30; maxScore += 30; trustStrengths.push('Customer reviews detected'); }
    else { trustGaps.push('No customer reviews found'); }
    
    if (trustEvidence.length > 0) { scoreVal += 30; maxScore += 30; trustEvidenceRefs = trustEvidence.slice(0, 2).map(e => e.evidenceId); }
    else { trustGaps.push('No trust-related evidence retrieved'); }
    
    maxScore += 40; // For certifications, security, etc.
    if (trustStrengths.length >= 1) scoreVal += 20;
    
    trustScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    trustConfidence = trustEvidence.length > 0 ? CONFIDENCE_LEVELS.HIGH : CONFIDENCE_LEVELS.MEDIUM;
    trustReason = trustGaps.length === 0
      ? 'Trust signals are present and verifiable.'
      : `Limited trust signals detected. ${trustGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.TRUST_SIGNALS] = {
    dimension: PRESENCE_DIMENSIONS.TRUST_SIGNALS,
    score: trustScore,
    confidence: trustConfidence,
    strengths: trustStrengths,
    gaps: trustGaps,
    evidence: trustEvidenceRefs,
    reason: trustReason,
    provenance: trustEvidence.length > 0 ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (trustScore !== null) scores.push(trustScore);

  // ─────────────────────────────────────────────────────────
  // 7. Consistency
  // ─────────────────────────────────────────────────────────
  const hasConsistentName = !!(safeVault.businessName && safeVault.website);
  const socialLinks = Array.isArray(brandAssets.socialLinks) ? brandAssets.socialLinks : [];
  const hasMultipleSocial = socialLinks.length > 1;
  
  let consistencyScore = null;
  let consistencyConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let consistencyStrengths = [];
  let consistencyGaps = [];
  let consistencyEvidenceRefs = [];
  let consistencyReason = 'Insufficient evidence to evaluate.';

  if (hasConsistentName || socialLinks.length > 0) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (hasConsistentName) { scoreVal += 30; maxScore += 30; consistencyStrengths.push('Business name and website are documented'); }
    else { consistencyGaps.push('Inconsistent or missing business identity'); }
    
    if (hasMultipleSocial) { scoreVal += 30; maxScore += 30; consistencyStrengths.push('Multiple social channels present'); }
    else if (socialLinks.length === 1) { scoreVal += 15; maxScore += 30; consistencyStrengths.push('At least one social channel present'); }
    else { consistencyGaps.push('No social channels found'); }
    
    maxScore += 40; // For cross-channel consistency
    if (consistencyStrengths.length >= 2) scoreVal += 30;
    
    consistencyScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    consistencyConfidence = hasConsistentName ? CONFIDENCE_LEVELS.MEDIUM : CONFIDENCE_LEVELS.LOW;
    consistencyReason = consistencyGaps.length === 0
      ? 'Brand presence appears consistent across channels.'
      : `Consistency gaps detected. ${consistencyGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.CONSISTENCY] = {
    dimension: PRESENCE_DIMENSIONS.CONSISTENCY,
    score: consistencyScore,
    confidence: consistencyConfidence,
    strengths: consistencyStrengths,
    gaps: consistencyGaps,
    evidence: consistencyEvidenceRefs,
    reason: consistencyReason,
    provenance: hasConsistentName ? PROVENANCE_STATES.INFERRED : PROVENANCE_STATES.INFERRED
  };
  if (consistencyScore !== null) scores.push(consistencyScore);

  // ─────────────────────────────────────────────────────────
  // 8. Discoverability
  // ─────────────────────────────────────────────────────────
  const hasSEOEvidence = evidenceItems.some(e => 
    e.evidenceType === EVIDENCE_TYPES.METADATA || 
    e.evidenceType === EVIDENCE_TYPES.STRUCTURED_DATA ||
    (e.title && e.title.toLowerCase().includes('meta'))
  );
  
  let discoverabilityScore = null;
  let discoverabilityConfidence = CONFIDENCE_LEVELS.UNKNOWN;
  let discoverabilityStrengths = [];
  let discoverabilityGaps = [];
  let discoverabilityEvidenceRefs = [];
  let discoverabilityReason = 'Insufficient evidence to evaluate.';

  if (websiteMeta?.retrievalSuccess || hasSEOEvidence) {
    let scoreVal = 0;
    let maxScore = 0;
    
    if (websiteMeta?.retrievalSuccess) { scoreVal += 30; maxScore += 30; discoverabilityStrengths.push('Website is live and accessible'); }
    else { discoverabilityGaps.push('Website not analyzed'); }
    
    if (hasSEOEvidence) { scoreVal += 30; maxScore += 30; discoverabilityStrengths.push('SEO metadata detected'); discoverabilityEvidenceRefs = hasSEOEvidence ? evidenceItems.filter(e => e.evidenceType === EVIDENCE_TYPES.METADATA).slice(0, 2).map(e => e.evidenceId) : []; }
    else { discoverabilityGaps.push('No SEO metadata found'); }
    
    maxScore += 40; // For search visibility, content discoverability
    if (discoverabilityStrengths.length >= 2) scoreVal += 30;
    
    discoverabilityScore = maxScore > 0 ? Math.round((scoreVal / maxScore) * 100) : null;
    discoverabilityConfidence = websiteMeta?.retrievalSuccess ? CONFIDENCE_LEVELS.MEDIUM : CONFIDENCE_LEVELS.LOW;
    discoverabilityReason = discoverabilityGaps.length === 0
      ? 'Business appears discoverable through its website and metadata.'
      : `Discoverability is limited. ${discoverabilityGaps[0]}.`;
  }

  dimensions[PRESENCE_DIMENSIONS.DISCOVERABILITY] = {
    dimension: PRESENCE_DIMENSIONS.DISCOVERABILITY,
    score: discoverabilityScore,
    confidence: discoverabilityConfidence,
    strengths: discoverabilityStrengths,
    gaps: discoverabilityGaps,
    evidence: discoverabilityEvidenceRefs,
    reason: discoverabilityReason,
    provenance: websiteMeta?.retrievalSuccess ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
  };
  if (discoverabilityScore !== null) scores.push(discoverabilityScore);

  // ─────────────────────────────────────────────────────────
  // 9. Overall score
  // ─────────────────────────────────────────────────────────
  const evaluatedCount = scores.length;
  const overallScore = evaluatedCount > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / evaluatedCount)
    : null;

  return {
    evaluation: {
      dimensions,
      overallScore,
      evaluatedDimensions: evaluatedCount,
      totalDimensions: Object.keys(PRESENCE_DIMENSIONS).length
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      evidenceCount: evidenceSummary.totalItems,
      highQualityEvidenceCount: evidenceSummary.highQualityItems,
      source: 'deterministic'
    }
  };
}
