import { BusinessUnderstandingEngine } from './BusinessUnderstandingEngine.js';
import { BusinessVaultService } from './BusinessVaultService.js';

/**
 * Recommendation Engine — Proactive AI Next-Step Growth Recommendations
 * Budget estimates are never hardcoded. Shown as null until admin publishes a quotation.
 *
 * Phase 3 upgrade: prefer backend AI intelligence results when available.
 */
export const RecommendationEngine = {
  /**
   * Generates tailored next-step growth recommendations for a business
   */
  generateRecommendations(userId) {
    const profile = BusinessUnderstandingEngine.getBusinessProfile(userId);
    const vault = BusinessVaultService.getVault(userId);

    // Prefer backend AI recommendations if available
    const backendRecommendations = vault.addiRecommendations?.serviceAssessments;
    if (backendRecommendations && Array.isArray(backendRecommendations) && backendRecommendations.length > 0) {
      return {
        userId,
        generatedAt: vault.addiRecommendations.generatedAt || new Date().toISOString(),
        recommendations: backendRecommendations.map(rec => ({
          id: rec.serviceId || rec.id,
          title: rec.serviceName || rec.title,
          reason: rec.reasoning || rec.reason,
          service: rec.serviceName,
          impact: rec.businessImpact || rec.impact,
          estimatedBudget: null,
          status: rec.status,
          priority: rec.priority,
          evidence: rec.evidence,
          confidence: rec.confidence,
          requiresExpertReview: rec.requiresExpertReview
        }))
      };
    }

    const recommendations = [];

    // Trigger Rule 1: Website exists or completed -> Recommend SEO & Performance Marketing
    if (vault.website.length > 0 || (profile.previousProjects || []).some(p => (p || '').toLowerCase().includes('web'))) {
      recommendations.push({
        id: 'rec_seo',
        title: 'SEO & Organic Growth Campaign',
        reason: 'Your website is live. Driving organic search traffic will lower acquisition costs.',
        service: 'SEO & Content Campaign',
        impact: 'High Impact (2.8x organic lead growth)',
        estimatedBudget: null
      });
    }

    // Trigger Rule 2: Photography completed -> Recommend Video Reel
    if (vault.photography.length > 0) {
      recommendations.push({
        id: 'rec_video',
        title: '4K Commercial Video Reel',
        reason: 'Video content generates significantly higher conversion rates for D2C brands.',
        service: 'Video Advertisement',
        impact: 'High Impact',
        estimatedBudget: null
      });
    }

    // Default Fallback Growth Recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec_default',
        title: 'High-Converting Video Explainer',
        reason: 'Video content generates significantly higher conversion rates for D2C brands.',
        service: 'Video Advertisement',
        impact: 'High Impact',
        estimatedBudget: null
      });
    }

    return {
      userId,
      generatedAt: new Date().toISOString(),
      recommendations
    };
  }
};

export default RecommendationEngine;
