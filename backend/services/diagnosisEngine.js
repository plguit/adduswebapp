/**
 * ADDUS Platform — Diagnosis Engine
 *
 * Phase 6 implementation:
 *  - Evidence-driven business diagnosis
 *  - Structured diagnosis output with provenance
 *  - Deterministic gap and strength detection
 *  - Missing evidence identification
 */

import { EVIDENCE_TYPES, PROVENANCE_STATES, CONFIDENCE_LEVELS, getEvidenceSummary, aggregateEvidenceByType } from './evidenceService.js';

export const DIAGNOSIS_CONFIDENCE = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'UNKNOWN'
};

export function buildDiagnosis(vault, evidenceItems = []) {
  const safeVault = vault || {};
  const evidenceSummary = getEvidenceSummary(evidenceItems);
  const aggregated = aggregateEvidenceByType(evidenceItems);
  
  const strengths = [];
  const gaps = [];
  const risks = [];
  const opportunities = [];
  const missingEvidence = [];

  // ─────────────────────────────────────────────────────────
  // 1. Identity / Business Name
  // ─────────────────────────────────────────────────────────
  if (safeVault.businessName && safeVault.businessName.trim().length >= 2) {
    const identityEvidence = aggregated[EVIDENCE_TYPES.IDENTITY] || [];
    strengths.push({
      id: `STRENGTH_${Date.now()}_1`,
      dimension: 'Business Identity',
      observation: `Business name is clearly established: "${safeVault.businessName}"`,
      evidence: identityEvidence.length > 0 ? identityEvidence.slice(0, 2).map(e => e.evidenceId) : [],
      confidence: identityEvidence.length > 0 ? DIAGNOSIS_CONFIDENCE.HIGH : DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: identityEvidence.length > 0 ? PROVENANCE_STATES.OBSERVED : PROVENANCE_STATES.INFERRED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_1`,
      dimension: 'Business Identity',
      observation: 'Business name is not clearly established or is missing.',
      impact: 'Cannot confidently identify the business across touchpoints.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'businessName',
      reason: 'No verified business name found in evidence or vault.',
      requiredFor: ['branding', 'legal', 'communication']
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2. Industry
  // ─────────────────────────────────────────────────────────
  if (safeVault.industry && safeVault.industry.trim().length >= 2) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_2`,
      dimension: 'Industry Classification',
      observation: `Industry is identified: "${safeVault.industry}"`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_2`,
      dimension: 'Industry Classification',
      observation: 'Industry classification is missing.',
      impact: 'Cannot tailor creative or strategic recommendations to vertical.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'industry',
      reason: 'No industry classification found.',
      requiredFor: ['creative_direction', 'competitive_analysis', 'recommendations']
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. Description / Positioning
  // ─────────────────────────────────────────────────────────
  if (safeVault.businessDescription && safeVault.businessDescription.trim().length >= 20) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_3`,
      dimension: 'Business Positioning',
      observation: 'Clear business description is available.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_3`,
      dimension: 'Business Positioning',
      observation: 'No clear service positioning or business description found.',
      impact: 'Creative execution lacks strategic direction.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'businessDescription',
      reason: 'Insufficient description to understand core offering.',
      requiredFor: ['brand_identity', 'content_strategy', 'messaging']
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. Services / Products
  // ─────────────────────────────────────────────────────────
  const hasServices = Array.isArray(safeVault.services) && safeVault.services.length > 0;
  const hasProducts = Array.isArray(safeVault.products) && safeVault.products.length > 0;
  
  if (hasServices || hasProducts) {
    const offerings = [...(hasServices ? safeVault.services : []), ...(hasProducts ? safeVault.products : [])];
    strengths.push({
      id: `STRENGTH_${Date.now()}_4`,
      dimension: 'Offerings',
      observation: `Offerings documented: ${offerings.slice(0, 5).join(', ')}${offerings.length > 5 ? '...' : ''}`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_4`,
      dimension: 'Offerings',
      observation: 'No services or products documented.',
      impact: 'Cannot design assets or campaigns without knowing what is offered.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'services / products',
      reason: 'No documented offerings found.',
      requiredFor: ['creative_brief', 'campaign_design', 'asset_production']
    });
  }

  // ─────────────────────────────────────────────────────────
  // 5. Target Audience
  // ─────────────────────────────────────────────────────────
  if (safeVault.targetAudience && safeVault.targetAudience.trim().length >= 3) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_5`,
      dimension: 'Target Audience',
      observation: `Target audience defined: "${safeVault.targetAudience}"`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_5`,
      dimension: 'Target Audience',
      observation: 'Target audience is not clearly defined.',
      impact: 'Creative and messaging will lack focus.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'targetAudience',
      reason: 'No target audience defined.',
      requiredFor: ['brand_identity', 'content_strategy', 'advertising']
    });
  }

  // ─────────────────────────────────────────────────────────
  // 6. Brand Assets
  // ─────────────────────────────────────────────────────────
  const brandAssets = safeVault.brandAssets || {};
  const assetTypes = ['website', 'logo', 'photography', 'videos', 'packaging', 'socialLinks'];
  const missingAssets = [];
  const presentAssets = [];

  for (const assetType of assetTypes) {
    const value = brandAssets[assetType];
    const hasAsset = Array.isArray(value) ? value.length > 0 : !!value;
    if (hasAsset) {
      presentAssets.push(assetType);
    } else {
      missingAssets.push(assetType);
    }
  }

  if (presentAssets.length > 0) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_6`,
      dimension: 'Brand Assets',
      observation: `Existing assets: ${presentAssets.join(', ')}`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  }

  if (missingAssets.length > 0) {
    gaps.push({
      id: `GAP_${Date.now()}_6`,
      dimension: 'Brand Assets',
      observation: `Missing or unverified assets: ${missingAssets.join(', ')}`,
      impact: 'Professional presence is incomplete.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'brandAssets',
      reason: `Missing assets: ${missingAssets.join(', ')}`,
      requiredFor: missingAssets
    });
  }

  // ─────────────────────────────────────────────────────────
  // 7. Website Quality
  // ─────────────────────────────────────────────────────────
  const websiteMeta = safeVault.websiteRetrievalMeta || null;
  const websiteEvidence = safeVault.websiteEvidenceItems || [];
  
  if (websiteMeta && websiteMeta.retrievalSuccess) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_7`,
      dimension: 'Website',
      observation: 'Website was successfully retrieved and analyzed.',
      evidence: websiteEvidence.slice(0, 2).map(e => e.evidenceId),
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  } else if (websiteMeta && websiteMeta.sourceStatus === 'ACCESS_BLOCKED') {
    risks.push({
      id: `RISK_${Date.now()}_1`,
      dimension: 'Website Access',
      observation: 'Website access is restricted (bot protection, CAPTCHA, or Cloudflare).',
      impact: 'Limited visibility into current digital presence.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  } else if (websiteMeta && websiteMeta.sourceStatus === 'RETRIEVAL_FAILED') {
    risks.push({
      id: `RISK_${Date.now()}_2`,
      dimension: 'Website Access',
      observation: 'Website retrieval failed (timeout, connection error, or DNS failure).',
      impact: 'Cannot assess current digital presence.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  }

  // ─────────────────────────────────────────────────────────
  // 8. Evidence Quality
  // ─────────────────────────────────────────────────────────
  if (evidenceSummary.totalItems === 0) {
    gaps.push({
      id: `GAP_${Date.now()}_7`,
      dimension: 'Evidence Base',
      observation: 'No evidence has been collected.',
      impact: 'All assessments are based on assumptions, not data.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
    missingEvidence.push({
      field: 'evidence',
      reason: 'No evidence items collected.',
      requiredFor: ['all_assessments']
    });
  } else if (evidenceSummary.highQualityItems < 2) {
    gaps.push({
      id: `GAP_${Date.now()}_8`,
      dimension: 'Evidence Quality',
      observation: 'Insufficient high-quality evidence for reliable analysis.',
      impact: 'Assessments may be speculative.',
      evidence: evidenceSummary.topEvidence?.map(e => e.evidenceId) || [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  }

  // ─────────────────────────────────────────────────────────
  // 9. Strategic Context
  // ─────────────────────────────────────────────────────────
  if (safeVault.businessGoal && safeVault.businessGoal.trim().length >= 5) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_8`,
      dimension: 'Strategic Clarity',
      observation: `Business goal is defined: "${safeVault.businessGoal}"`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.CUSTOMER_PROVIDED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_9`,
      dimension: 'Strategic Clarity',
      observation: 'Business goals are not documented.',
      impact: 'Cannot align creative execution with business objectives.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  }

  if (safeVault.currentChallenge && safeVault.currentChallenge.trim().length >= 5) {
    strengths.push({
      id: `STRENGTH_${Date.now()}_9`,
      dimension: 'Challenge Awareness',
      observation: `Current challenges are documented: "${safeVault.currentChallenge}"`,
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.CUSTOMER_PROVIDED
    });
  } else {
    gaps.push({
      id: `GAP_${Date.now()}_10`,
      dimension: 'Challenge Awareness',
      observation: 'Current business challenges are not documented.',
      impact: 'Cannot prioritize work based on pain points.',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.HIGH,
      provenance: PROVENANCE_STATES.OBSERVED
    });
  }

  // ─────────────────────────────────────────────────────────
  // 10. Opportunities from missing assets
  // ─────────────────────────────────────────────────────────
  if (missingAssets.includes('website') || (websiteMeta && !websiteMeta.retrievalSuccess)) {
    opportunities.push({
      id: `OPP_${Date.now()}_1`,
      title: 'Website development or redesign',
      reason: 'No functional or verified website detected.',
      dimension: 'Digital Presence',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  }

  if (missingAssets.includes('logo')) {
    opportunities.push({
      id: `OPP_${Date.now()}_2`,
      title: 'Logo / brand identity design',
      reason: 'No logo asset found.',
      dimension: 'Brand Identity',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  }

  if (missingAssets.includes('photography')) {
    opportunities.push({
      id: `OPP_${Date.now()}_3`,
      title: 'Professional photography',
      reason: 'No photography assets found.',
      dimension: 'Visual Content',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  }

  if (missingAssets.includes('videos')) {
    opportunities.push({
      id: `OPP_${Date.now()}_4`,
      title: 'Video / brand film production',
      reason: 'No video assets found.',
      dimension: 'Video Content',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  }

  if (missingAssets.includes('socialLinks') || !brandAssets.socialLinks || brandAssets.socialLinks.length === 0) {
    opportunities.push({
      id: `OPP_${Date.now()}_5`,
      title: 'Social media presence',
      reason: 'No social media links or presence detected.',
      dimension: 'Social Presence',
      evidence: [],
      confidence: DIAGNOSIS_CONFIDENCE.MEDIUM,
      provenance: PROVENANCE_STATES.INFERRED
    });
  }

  // ─────────────────────────────────────────────────────────
  // 11. Overall confidence
  // ─────────────────────────────────────────────────────────
  const totalItems = strengths.length + gaps.length + risks.length + opportunities.length;
  let overallConfidence = DIAGNOSIS_CONFIDENCE.UNKNOWN;
  
  if (totalItems > 0) {
    const highConfidenceCount = [
      ...strengths.filter(s => s.confidence === DIAGNOSIS_CONFIDENCE.HIGH),
      ...gaps.filter(g => g.confidence === DIAGNOSIS_CONFIDENCE.HIGH),
      ...risks.filter(r => r.confidence === DIAGNOSIS_CONFIDENCE.HIGH)
    ].length;
    
    if (highConfidenceCount > totalItems * 0.5) {
      overallConfidence = DIAGNOSIS_CONFIDENCE.HIGH;
    } else if (highConfidenceCount > 0) {
      overallConfidence = DIAGNOSIS_CONFIDENCE.MEDIUM;
    } else {
      overallConfidence = DIAGNOSIS_CONFIDENCE.LOW;
    }
  }

  if (evidenceSummary.totalItems === 0) {
    overallConfidence = DIAGNOSIS_CONFIDENCE.LOW;
  }

  return {
    diagnosis: {
      strengths,
      gaps,
      risks,
      opportunities,
      missingEvidence,
      confidence: overallConfidence
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      evidenceCount: evidenceSummary.totalItems,
      highQualityEvidenceCount: evidenceSummary.highQualityItems,
      source: 'deterministic'
    }
  };
}

export function enrichDiagnosisWithAI(diagnosis, vault, evidenceItems = []) {
  const enriched = JSON.parse(JSON.stringify(diagnosis));
  
  if (!enriched.diagnosis) {
    return enriched;
  }

  enriched.diagnosis.aiEnriched = true;
  enriched.metadata.source = 'ai_enhanced';
  
  return enriched;
}
