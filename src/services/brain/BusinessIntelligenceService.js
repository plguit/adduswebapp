import { BusinessUnderstandingEngine } from './BusinessUnderstandingEngine.js';
import { BusinessVaultService } from './BusinessVaultService.js';
import { RecommendationEngine } from './RecommendationEngine.js';

export const BusinessIntelligenceService = {
  /**
   * Generates a complete structured business intelligence roadmap and strategy
   * @param {string} userId
   * @returns {object} Structured Business Intelligence Roadmap
   */
  generateBusinessRoadmap(userId) {
    const profile = BusinessUnderstandingEngine.getBusinessProfile(userId);
    const vault = BusinessVaultService.getVault(userId);

    // 1. Industry Detection
    const industry = profile.industry || '';

    // 2. Business Stage Detection
    const businessStage = profile.businessStage || 'Growth Stage';

    // 3. Business Type Detection (D2C, B2B, Service, E-commerce, Retail)
    let businessType = 'D2C Brand';
    if (profile.businessGoals?.toLowerCase().includes('b2b') || profile.targetAudience?.toLowerCase().includes('business')) {
      businessType = 'B2B Enterprise';
    } else if (profile.services && profile.services.length > 0 && (!profile.products || profile.products.length === 0)) {
      businessType = 'Service Business';
    } else if (profile.businessGoals?.toLowerCase().includes('retail') || profile.businessTimeline?.some(t => t.milestone?.toLowerCase().includes('retail') || t.milestone?.toLowerCase().includes('store'))) {
      businessType = 'Retail Business';
    }

    // 4. Target Audience
    const targetAudience = profile.targetAudience || 'Target Market Segment';

    // 5. Business Presence & Asset Assessment
    const currentAssets = [];
    const missingAssets = [];

    // Logo & Guidelines Assessment
    if (vault.logos && vault.logos.length > 0) {
      currentAssets.push('Brand Logo');
    } else {
      missingAssets.push('Brand Logo');
    }

    if (vault.brandGuidelines && vault.brandGuidelines.length > 0) {
      currentAssets.push('Brand Guidelines');
    } else {
      missingAssets.push('Brand Guidelines');
    }

    // Digital Presence Assessment
    if (vault.website && vault.website.length > 0) {
      currentAssets.push('Website');
    } else {
      missingAssets.push('Website');
    }

    // Marketing/Content Assets Assessment
    if (vault.photography && vault.photography.length > 0) {
      currentAssets.push('Product Photography');
    } else {
      missingAssets.push('Product Photography');
    }

    if (vault.videos && vault.videos.length > 0) {
      currentAssets.push('Brand Video/Reels');
    } else {
      missingAssets.push('Brand Video/Reels');
    }

    if (vault.packaging && vault.packaging.length > 0) {
      currentAssets.push('Product Packaging');
    } else {
      missingAssets.push('Product Packaging');
    }

    if (vault.socialMediaAssets && vault.socialMediaAssets.length > 0) {
      currentAssets.push('Social Media Assets');
    } else {
      missingAssets.push('Social Media Assets');
    }

    // 6. Generate Growth Recommendations using RecommendationEngine
    const growthRecs = RecommendationEngine.generateRecommendations(userId);
    const recommendations = growthRecs.recommendations || [];

    // 7. Roadmap Priority Definition
    // Priority 1: Brand Identity (Logo, Brand Guidelines)
    const priority1 = {
      title: 'Priority 1: Brand Identity & Foundation',
      services: [],
      status: 'Incomplete'
    };
    if (missingAssets.includes('Brand Logo') || missingAssets.includes('Brand Guidelines')) {
      priority1.services.push({
        service: 'Brand Identity',
        deliverables: ['Logo Creation', 'Brand Guidelines Design', 'Typography Guide', 'Color Palette Setup'],
        status: 'Recommended'
      });
    } else {
      priority1.status = 'Complete';
      priority1.services.push({
        service: 'Brand Identity',
        deliverables: ['Logo & Guidelines active in Vault'],
        status: 'Active'
      });
    }

    // Priority 2: Packaging, Photography, Website
    const priority2 = {
      title: 'Priority 2: Channel Setup & Asset Readiness',
      services: [],
      status: 'Incomplete'
    };
    if (missingAssets.includes('Product Packaging') && businessType !== 'Service Business') {
      priority2.services.push({
        service: 'Packaging',
        deliverables: ['Custom Dielines', '3D Packaging Mockups', 'Print-ready Assets'],
        status: 'Recommended'
      });
    }
    if (missingAssets.includes('Product Photography')) {
      priority2.services.push({
        service: 'Photography',
        deliverables: ['Studio Product Shoots', 'Lifestyle Model Shoots', 'Commercial Grade Stills'],
        status: 'Recommended'
      });
    }
    if (missingAssets.includes('Website')) {
      priority2.services.push({
        service: 'Website',
        deliverables: ['UI/UX Wireframes', 'Responsive Web Design', 'E-commerce Dev'],
        status: 'Recommended'
      });
    }
    if (priority2.services.length === 0) {
      priority2.status = 'Complete';
      priority2.services.push({
        service: 'Operational Assets',
        deliverables: ['Packaging, Photography, and Website are fully operational'],
        status: 'Active'
      });
    }

    // Priority 3: Social Media, Brand Film, SEO, Google Business
    const priority3 = {
      title: 'Priority 3: Market Expansion & Conversion Engine',
      services: [],
      status: 'Incomplete'
    };
    if (missingAssets.includes('Social Media Assets')) {
      priority3.services.push({
        service: 'Social Media',
        deliverables: ['Content Strategy Grid', 'Custom Social Graphic Templates'],
        status: 'Recommended'
      });
    }
    if (missingAssets.includes('Brand Video/Reels')) {
      priority3.services.push({
        service: 'Brand Film',
        deliverables: ['High-Converting Explainer Video', 'Social Ad Reels (9:16)'],
        status: 'Recommended'
      });
    }
    priority3.services.push({
      service: 'SEO',
      deliverables: ['On-page optimization', 'Organic Growth content campaign'],
      status: 'Recommended'
    });
    priority3.services.push({
      service: 'Google Business',
      deliverables: ['GMB Optimization', 'Local Search setup'],
      status: 'Recommended'
    });

    const roadmap = {
      priority1,
      priority2,
      priority3
    };

    // 8. Creator Requirements Calculation (Roles only)
    const requiredRoles = new Set();
    if (priority1.status !== 'Complete') {
      requiredRoles.add('Graphic Designer');
      requiredRoles.add('Brand Strategist');
    }
    if (missingAssets.includes('Product Packaging')) {
      requiredRoles.add('Graphic Designer');
    }
    if (missingAssets.includes('Product Photography')) {
      requiredRoles.add('Photographer');
    }
    if (missingAssets.includes('Website')) {
      requiredRoles.add('Website Developer');
      requiredRoles.add('Graphic Designer');
    }
    if (missingAssets.includes('Social Media Assets') || missingAssets.includes('Brand Video/Reels')) {
      requiredRoles.add('Content Writer');
      requiredRoles.add('Graphic Designer');
    }
    if (missingAssets.includes('Brand Video/Reels')) {
      requiredRoles.add('Videographer');
    }
    if (requiredRoles.size === 0) {
      // Fallback defaults
      requiredRoles.add('Brand Strategist');
      requiredRoles.add('Content Writer');
    }
    const creatorRequirements = Array.from(requiredRoles);

    // 9. Cost and Budget Tier Estimates
    // Let's dynamically calculate pricing based on missing assets to fit the requirements
    const standardPricing = {
      'Brand Identity': { min: 15000, rec: 25000, prem: 40000 },
      'Website': { min: 30000, rec: 50000, prem: 95000 },
      'Photography': { min: 15000, rec: 25000, prem: 45000 },
      'Packaging': { min: 12000, rec: 20000, prem: 35000 },
      'Social Media': { min: 10000, rec: 18000, prem: 30000 },
      'Brand Film': { min: 35000, rec: 60000, prem: 120000 },
      'SEO': { min: 8000, rec: 15000, prem: 25000 },
      'Google Business': { min: 3000, rec: 5000, prem: 10000 }
    };

    let minBudget = 0;
    let recBudget = 0;
    let premBudget = 0;

    // Check what is recommended in priority1, 2, and 3
    const allRoadmapServices = [
      ...priority1.services.filter(s => s.status === 'Recommended'),
      ...priority2.services.filter(s => s.status === 'Recommended'),
      ...priority3.services.filter(s => s.status === 'Recommended')
    ];

    allRoadmapServices.forEach(s => {
      const price = standardPricing[s.service] || { min: 10000, rec: 20000, prem: 35000 };
      minBudget += price.min;
      recBudget += price.rec;
      premBudget += price.prem;
    });

    if (minBudget === 0) {
      minBudget = 25000;
      recBudget = 45000;
      premBudget = 85000;
    }

    const estimatedBudget = {
      minimum: `₹${minBudget.toLocaleString()}`,
      recommended: `₹${recBudget.toLocaleString()}`,
      premium: `₹${premBudget.toLocaleString()}`
    };

    // 10. Estimated Timeline Phases
    // Phase 1 (Brand/Foundation), Phase 2 (Assets/Launch), Phase 3 (Growth)
    let phase1Weeks = priority1.status !== 'Complete' ? '1-2 weeks' : 'Completed';
    let phase2Weeks = priority2.services.filter(s => s.status === 'Recommended').length > 0 ? '2-4 weeks' : '1-2 weeks';
    let phase3Weeks = '4-6 weeks';

    const estimatedTimeline = {
      Phase1: `Foundation Setup: ${phase1Weeks}`,
      Phase2: `Asset Readiness & Channel Launch: ${phase2Weeks}`,
      Phase3: `Organic Growth & Conversion Campaigns: ${phase3Weeks}`
    };

    // 11. Confidence score computation based on profile completeness
    let filledFields = 0;
    const fieldsToTrack = ['businessName', 'industry', 'businessStage', 'targetAudience', 'vision', 'mission', 'usp'];
    fieldsToTrack.forEach(f => {
      if (profile[f] && profile[f] !== 'Enterprise Client' && profile[f] !== 'Commercial Business') {
        filledFields += 1;
      }
    });
    const confidence = Math.min(60 + (filledFields * 5) + (vault.logos?.length > 0 ? 10 : 0), 98);

    return {
      industry,
      businessStage,
      businessType,
      targetAudience,
      currentAssets,
      missingAssets,
      recommendations,
      roadmap,
      estimatedTimeline,
      estimatedBudget,
      creatorRequirements,
      confidence
    };
  }
};

export default BusinessIntelligenceService;
