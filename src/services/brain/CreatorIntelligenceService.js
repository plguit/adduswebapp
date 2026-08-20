import { storage } from '../../utils/storage.js';

export const SAMPLE_CREATOR_INTELLIGENCE_DB = [
  {
    creatorId: 'ACRA000201',
    name: 'Alex Rivera',
    role: 'Videographer',
    skills: ['4K Cinema', 'Drone', 'Color Grading', 'Lighting'],
    location: 'Studio Hangar A, Mumbai',
    availability: 'Available',
    completedProjects: 18,
    pastRating: 4.9,
    // CIS (Creator Index Score)
    cis: { capability: 95, portfolioQuality: 96, yearsExperience: 7, certs: 'RED Certified Camera Operator', equipment: 'Sony FX6, RED Komodo, DJI Mavic 3 Pro', software: 'DaVinci Resolve, Premiere Pro', CIS_Score: 94 },
    // CPS (Creator Performance Score)
    cps: { creativeQuality: 96, clientSatisfaction: 98, onTimeDelivery: 95, acceptanceRate: 98, revisionRate: 4, repeatCustomerRate: 88, internalQualityScore: 96, CPS_Score: 96 },
    // CCS (Creator Cost Score)
    ccs: { budgetCompatibility: 90, priceCompetitiveness: 88, valueForMoney: 92, avgProjectCost: '₹47,500', discountHistory: '5% recurring discount', CCS_Score: 90 }
  },
  {
    creatorId: 'ACRA000202',
    name: 'Sophia Chen',
    role: 'Photographer',
    skills: ['Studio Product', 'Commercial Lighting', 'Post-processing'],
    location: 'Studio B, Bengaluru',
    availability: 'Available',
    completedProjects: 14,
    pastRating: 4.8,
    cis: { capability: 92, portfolioQuality: 94, yearsExperience: 5, certs: 'Hasselblad Studio Master', equipment: 'Canon R5 C, Broncolor Lighting', software: 'Capture One, Photoshop', CIS_Score: 92 },
    cps: { creativeQuality: 94, clientSatisfaction: 96, onTimeDelivery: 98, acceptanceRate: 96, revisionRate: 2, repeatCustomerRate: 85, internalQualityScore: 94, CPS_Score: 95 },
    ccs: { budgetCompatibility: 94, priceCompetitiveness: 92, valueForMoney: 94, avgProjectCost: '₹35,000', discountHistory: 'None', CCS_Score: 93 }
  },
  {
    creatorId: 'ACRA000203',
    name: 'Marcus Vance',
    role: 'Designer',
    skills: ['Motion Graphics', 'UI/UX', '3D Assets', 'Blender'],
    location: 'Remote / Delhi',
    availability: 'Assigned',
    completedProjects: 22,
    pastRating: 5.0,
    cis: { capability: 98, portfolioQuality: 98, yearsExperience: 8, certs: 'Adobe Certified Expert', equipment: 'Mac Studio M2 Ultra', software: 'After Effects, Blender, Figma', CIS_Score: 98 },
    cps: { creativeQuality: 99, clientSatisfaction: 100, onTimeDelivery: 96, acceptanceRate: 99, revisionRate: 1, repeatCustomerRate: 92, internalQualityScore: 98, CPS_Score: 98 },
    ccs: { budgetCompatibility: 88, priceCompetitiveness: 85, valueForMoney: 95, avgProjectCost: '₹55,000', discountHistory: 'Enterprise volume tier', CCS_Score: 89 }
  }
];

export const CreatorIntelligenceService = {
  /**
   * Calculate CIS, CPS, CCS and Overall Creator Match Score for a project
   */
  calculateCreatorScores(creator, project = {}) {
    const cisScore = creator.cis?.CIS_Score || 90;
    const cpsScore = creator.cps?.CPS_Score || 90;
    const ccsScore = creator.ccs?.CCS_Score || 90;

    // Weighted Overall Match Calculation
    // CIS: 35%, CPS: 40%, CCS: 25%
    const baseMatchScore = (cisScore * 0.35) + (cpsScore * 0.40) + (ccsScore * 0.25);

    // Contextual Boosts
    let boost = 0;
    if (creator.availability === 'Available') boost += 3;
    if (creator.pastRating >= 4.8) boost += 2;
    if (project.service && (creator.role || '').toLowerCase().includes((project.service || '').toLowerCase())) boost += 4;

    const finalMatchScore = Math.min(Math.round(baseMatchScore + boost), 99);

    return {
      cisScore,
      cpsScore,
      ccsScore,
      overallMatchScore: finalMatchScore,
      recommendationReason: `Ranked #${finalMatchScore}% match based on ${creator.completedProjects} completed projects, ★ ${creator.pastRating} rating, and high CIS/CPS scores.`
    };
  },

  /**
   * Rank all creators for a given project
   */
  rankCreatorsForProject(project = {}) {
    return SAMPLE_CREATOR_INTELLIGENCE_DB.map(creator => {
      const scores = this.calculateCreatorScores(creator, project);
      return {
        ...creator,
        ...scores
      };
    }).sort((a, b) => b.overallMatchScore - a.overallMatchScore);
  }
};

export default CreatorIntelligenceService;
