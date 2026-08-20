/**
 * ADDUS Platform — Recommendation Engine
 *
 * Evidence-based recommendation generation.
 * Supports negative recommendations (ALREADY_SUFFICIENT, NOT_CURRENTLY_SUGGESTED).
 * Industry-aware asset ontology for relevant recommendations.
 */

import { CONFIDENCE_LEVELS } from './evidenceService.js';
import { GAP_SEVERITY, OPPORTUNITY_PRIORITY } from './opportunityEngine.js';

export const RECOMMENDATION_STATUS = {
  ALREADY_SUFFICIENT: 'ALREADY_SUFFICIENT',
  NOT_CURRENTLY_SUGGESTED: 'NOT_CURRENTLY_SUGGESTED',
  RECOMMENDED: 'RECOMMENDED',
  REQUIRES_MORE_INFORMATION: 'REQUIRES_MORE_INFORMATION'
};

const INDUSTRY_ASSET_ONTOLOGY = {
  'News & Media': {
    relevantAssets: ['logo', 'website', 'editorial_identity', 'social_media_templates', 'video_news_presentation', 'content_presentation'],
    irrelevantAssets: ['product_photography', 'product_videos', 'packaging'],
    assetNames: {
      logo: 'Logo / Editorial Identity',
      website: 'Website Experience',
      editorial_identity: 'Editorial Visual Identity',
      social_media_templates: 'Social Media Templates',
      video_news_presentation: 'Video / News Presentation',
      content_presentation: 'Content Presentation System'
    }
  },
  'Hospitality': {
    relevantAssets: ['logo', 'website', 'property_photography', 'room_photography', 'food_photography', 'video', 'booking_system'],
    irrelevantAssets: ['product_catalogue', 'product_photography', 'technical_documentation'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Booking Website',
      property_photography: 'Property Photography',
      room_photography: 'Room & Suite Photography',
      food_photography: 'Food & Dining Photography',
      video: 'Brand / Experience Video',
      booking_system: 'Booking Engine Integration'
    }
  },
  'E-commerce': {
    relevantAssets: ['logo', 'website', 'product_photography', 'product_videos', 'packaging', 'product_catalogue', 'shopping_experience'],
    irrelevantAssets: ['editorial_identity', 'news_graphics'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'E-commerce Website',
      product_photography: 'Product Photography',
      product_videos: 'Product Videos',
      packaging: 'Packaging Design',
      product_catalogue: 'Product Catalogue',
      shopping_experience: 'Shopping Experience Optimization'
    }
  },
  'SaaS': {
    relevantAssets: ['logo', 'website', 'brand_identity', 'product_screenshots', 'demo_video', 'documentation', 'saas_ui_design'],
    irrelevantAssets: ['product_photography', 'packaging', 'food_photography'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Product Website / Landing Pages',
      brand_identity: 'Brand Identity System',
      product_screenshots: 'Product UI Screenshots',
      demo_video: 'Product Demo Video',
      documentation: 'Technical Documentation',
      saas_ui_design: 'UI/UX Design System'
    }
  },
  'Healthcare': {
    relevantAssets: ['logo', 'website', 'facility_photography', 'team_profiles', 'educational_content', 'patient_communication'],
    irrelevantAssets: ['product_photography', 'packaging', 'food_photography'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Patient Portal / Website',
      facility_photography: 'Facility Photography',
      team_profiles: 'Doctor / Team Profiles',
      educational_content: 'Patient Education Content',
      patient_communication: 'Patient Communication Materials'
    }
  },
  'Real Estate': {
    relevantAssets: ['logo', 'website', 'property_photography', 'virtual_tour', 'listing_presentation', 'neighborhood_content'],
    irrelevantAssets: ['product_photography', 'food_photography', 'packaging'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Property Listing Website',
      property_photography: 'Property Photography',
      virtual_tour: 'Virtual Tours / 3D Walkthroughs',
      listing_presentation: 'Listing Presentation Design',
      neighborhood_content: 'Neighborhood / Area Content'
    }
  },
  'Food & Beverage': {
    relevantAssets: ['logo', 'brand_identity', 'food_photography', 'menu_design', 'interior_photography', 'social_content', 'packaging'],
    irrelevantAssets: ['product_catalogue', 'technical_documentation', 'news_graphics'],
    assetNames: {
      logo: 'Brand Identity',
      brand_identity: 'Brand Identity System',
      food_photography: 'Food Photography',
      menu_design: 'Menu Design',
      interior_photography: 'Interior / Ambiance Photography',
      social_content: 'Social Media Content System',
      packaging: 'Packaging Design'
    }
  },
  'Finance': {
    relevantAssets: ['logo', 'website', 'brand_identity', 'financial_presentation', 'security_trust_signals', 'documentation'],
    irrelevantAssets: ['product_photography', 'food_photography', 'packaging'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Financial Services Website',
      brand_identity: 'Brand Identity System',
      financial_presentation: 'Financial Presentation / Reports',
      security_trust_signals: 'Trust & Security Signals',
      documentation: 'Client Documentation'
    }
  },
  'Education': {
    relevantAssets: ['logo', 'website', 'course_materials', 'institutional_branding', 'virtual_classroom', 'educational_content'],
    irrelevantAssets: ['product_photography', 'packaging', 'food_photography'],
    assetNames: {
      logo: 'Institutional Brand Identity',
      website: 'Learning Platform / Website',
      course_materials: 'Course Materials Design',
      institutional_branding: 'Institutional Branding',
      virtual_classroom: 'Virtual Classroom Experience',
      educational_content: 'Educational Content System'
    }
  },
  'Entertainment': {
    relevantAssets: ['logo', 'brand_identity', 'video_content', 'streaming_experience', 'social_media_templates', 'promotional_materials'],
    irrelevantAssets: ['product_photography', 'packaging', 'technical_documentation'],
    assetNames: {
      logo: 'Brand Identity',
      brand_identity: 'Brand Identity System',
      video_content: 'Video Content Production',
      streaming_experience: 'Streaming Experience Design',
      social_media_templates: 'Social Media Templates',
      promotional_materials: 'Promotional Materials'
    }
  },
  'Technology': {
    relevantAssets: ['logo', 'website', 'product_screenshots', 'demo_video', 'technical_documentation', 'brand_identity'],
    irrelevantAssets: ['product_photography', 'food_photography', 'packaging'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Product Website',
      product_screenshots: 'Product UI Screenshots',
      demo_video: 'Product Demo Video',
      technical_documentation: 'Technical Documentation',
      brand_identity: 'Brand Identity System'
    }
  },
  'Agency': {
    relevantAssets: ['logo', 'website', 'case_studies', 'portfolio_design', 'proposal_templates', 'client_presentation'],
    irrelevantAssets: ['product_photography', 'packaging', 'food_photography'],
    assetNames: {
      logo: 'Agency Brand Identity',
      website: 'Agency Website / Portfolio',
      case_studies: 'Case Study Design',
      portfolio_design: 'Portfolio Presentation',
      proposal_templates: 'Proposal Templates',
      client_presentation: 'Client Presentation System'
    }
  },
  'Manufacturing': {
    relevantAssets: ['logo', 'website', 'product_photography', 'industrial_branding', 'catalogue_design', 'technical_specifications'],
    irrelevantAssets: ['food_photography', 'news_graphics', 'editorial_identity'],
    assetNames: {
      logo: 'Corporate Brand Identity',
      website: 'Corporate Website',
      product_photography: 'Product / Machinery Photography',
      industrial_branding: 'Industrial Branding',
      catalogue_design: 'Product Catalogue Design',
      technical_specifications: 'Technical Specifications'
    }
  },
  'Consulting': {
    relevantAssets: ['logo', 'website', 'presentation_deck', 'brand_identity', 'thought_leadership_content', 'proposal_templates'],
    irrelevantAssets: ['product_photography', 'packaging', 'food_photography'],
    assetNames: {
      logo: 'Brand Identity',
      website: 'Professional Website',
      presentation_deck: 'Presentation / Pitch Deck',
      brand_identity: 'Brand Identity System',
      thought_leadership_content: 'Thought Leadership Content',
      proposal_templates: 'Proposal Templates'
    }
  }
};

export function generateRecommendations(gaps, opportunities, evidenceSummary, existingAssets = [], industry = null) {
  const recommendations = [];
  const assetMap = new Map(existingAssets.map(a => [a.assetType, a]));
  const ontology = industry ? (INDUSTRY_ASSET_ONTOLOGY[industry] || null) : null;

  for (const opportunity of opportunities.slice(0, 8)) {
    const relatedGap = gaps.find(g => g.gapId === opportunity.relatedGap);

    if (!relatedGap) continue;

    const assetType = inferAssetTypeFromCriterion(relatedGap.criterion);
    const existingAsset = assetMap.get(assetType);

    // Industry-aware filtering
    if (ontology) {
      const isIrrelevant = ontology.irrelevantAssets?.includes(assetType);
      const isRelevant = ontology.relevantAssets?.includes(assetType);
      
      if (isIrrelevant) {
        recommendations.push({
          recommendationId: `REC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: `${ontology.assetNames[assetType] || relatedGap.criterion} — Not Recommended`,
          why: `For ${industry} businesses, ${ontology.assetNames[assetType] || relatedGap.criterion} is not a priority.`,
          evidenceRefs: opportunity.evidenceRefs,
          gap: relatedGap.gapId,
          opportunity: opportunity.opportunityId,
          businessImpact: 'Not applicable for this industry',
          priority: 'LOW',
          confidence: CONFIDENCE_LEVELS.HIGH,
          existingAssetStatus: 'NOT_APPLICABLE',
          status: RECOMMENDATION_STATUS.NOT_CURRENTLY_SUGGESTED,
          suggestedAction: 'Focus on industry-specific assets instead',
          suggestedActionDetails: {
            requiresCustomerInput: false,
            requiresAssetUpload: false,
            requiresExternalResearch: false,
            industryContext: industry
          }
        });
        continue;
      }
      
      if (isRelevant && ontology.assetNames[assetType]) {
        const title = `${ontology.assetNames[assetType]}`;
        const why = industry === 'News & Media' 
          ? `News organizations need strong ${ontology.assetNames[assetType].toLowerCase()} to effectively present news content and maintain audience engagement.`
          : `${industry} businesses benefit from ${ontology.assetNames[assetType].toLowerCase()} to establish credibility and attract customers.`;
        
        recommendations.push({
          recommendationId: `REC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: `${title} — ${relatedGap.explanation}`,
          why: why,
          evidenceRefs: opportunity.evidenceRefs,
          gap: relatedGap.gapId,
          opportunity: opportunity.opportunityId,
          businessImpact: opportunity.expectedImpact,
          priority: opportunity.priority,
          confidence: opportunity.confidence,
          existingAssetStatus: existingAsset ? 'SUFFICIENT' : 'MISSING',
          status: existingAsset ? RECOMMENDATION_STATUS.ALREADY_SUFFICIENT : RECOMMENDATION_STATUS.RECOMMENDED,
          suggestedAction: existingAsset ? 'Asset already exists and is sufficient' : `Develop ${ontology.assetNames[assetType].toLowerCase()}`,
          suggestedActionDetails: {
            requiresCustomerInput: false,
            requiresAssetUpload: !existingAsset,
            requiresExternalResearch: false,
            industryContext: industry
          }
        });
        continue;
      }
    }

    let status = RECOMMENDATION_STATUS.RECOMMENDED;
    let existingAssetStatus = 'MISSING';

    if (existingAsset) {
      if (existingAsset.confidence === 'HIGH' || existingAsset.confidence === 'MEDIUM') {
        status = RECOMMENDATION_STATUS.ALREADY_SUFFICIENT;
        existingAssetStatus = 'SUFFICIENT';
      } else {
        existingAssetStatus = 'LOW_QUALITY';
      }
    }

    recommendations.push({
      recommendationId: `REC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: opportunity.description,
      why: relatedGap.explanation,
      evidenceRefs: opportunity.evidenceRefs,
      gap: relatedGap.gapId,
      opportunity: opportunity.opportunityId,
      businessImpact: opportunity.expectedImpact,
      priority: opportunity.priority,
      confidence: opportunity.confidence,
      existingAssetStatus,
      status,
      suggestedAction: status === RECOMMENDATION_STATUS.RECOMMENDED
        ? `Improve ${relatedGap.criterion}`
        : status === RECOMMENDATION_STATUS.ALREADY_SUFFICIENT
          ? 'Asset already exists and is sufficient'
          : 'Gather more information before recommending',
      suggestedActionDetails: {
        requiresCustomerInput: status === RECOMMENDATION_STATUS.REQUIRES_MORE_INFORMATION,
        requiresAssetUpload: status === RECOMMENDATION_STATUS.RECOMMENDED && !existingAsset,
        requiresExternalResearch: false
      }
    });
  }

  return recommendations;
}

function inferAssetTypeFromCriterion(criterion) {
  const mapping = {
    brand_clarity: 'logo',
    visual_identity: 'logo',
    website_clarity: 'website',
    service_presentation: 'service_document',
    product_presentation: 'product_image',
    content_quality: 'content',
    trust_signals: 'testimonial',
    social_presence: 'social_link'
  };
  return mapping[criterion] || 'unknown';
}

export function buildRecommendationSummary(recommendations) {
  const summary = {
    total: recommendations.length,
    recommended: recommendations.filter(r => r.status === RECOMMENDATION_STATUS.RECOMMENDED).length,
    alreadySufficient: recommendations.filter(r => r.status === RECOMMENDATION_STATUS.ALREADY_SUFFICIENT).length,
    notSuggested: recommendations.filter(r => r.status === RECOMMENDATION_STATUS.NOT_CURRENTLY_SUGGESTED).length,
    needsMoreInfo: recommendations.filter(r => r.status === RECOMMENDATION_STATUS.REQUIRES_MORE_INFORMATION).length,
    highPriority: recommendations.filter(r => r.priority === 'HIGH').length
  };

  return summary;
}