import { profileService } from '../profileService.js';

/**
 * Module 6: Customer Health Score Engine
 */
export const CustomerHealthScoreEngine = {
  /**
   * Score tiers: Excellent (85-100), Healthy (65-84), Needs Attention (40-64), At Risk (0-39)
   */
  calculateHealthScore(userId, projectList = []) {
    const profile = profileService.getProfileById(userId) || {};

    const totalProjects = projectList.length;
    const completedProjects = projectList.filter(p =>
      ['Delivered', 'Archived', 'Approved by Customer'].includes(p.status)
    ).length;

    // 1. Project Completion Rate (25%)
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) : 0.9;
    const completionScore = Math.round(completionRate * 100);

    // 2. Payment Behaviour (25%)
    const paymentScore = profile.paymentBehaviour === 'overdue' ? 30 : 90;

    // 3. Activity Score (15%) — based on login / project submission recency
    const activityScore = profile.lastActiveAt
      ? (Date.now() - new Date(profile.lastActiveAt).getTime() < 7 * 86400000 ? 95 : 60)
      : 75;

    // 4. Communication Score (15%) — response time proxy
    const communicationScore = profile.avgResponseHours <= 24 ? 95 : 70;

    // 5. Recommendation Acceptance (10%)
    const recommendationScore = profile.acceptedRecommendations > 0 ? 90 : 70;

    // 6. Project Success Rate (10%)
    const successRate = completedProjects > 0 ? 95 : 75;

    const weightedScore = Math.round(
      (completionScore * 0.25) +
      (paymentScore * 0.25) +
      (activityScore * 0.15) +
      (communicationScore * 0.15) +
      (recommendationScore * 0.10) +
      (successRate * 0.10)
    );

    const finalScore = Math.min(Math.max(weightedScore, 0), 100);

    let tier, color;
    if (finalScore >= 85) { tier = 'Excellent'; color = '#10B981'; }
    else if (finalScore >= 65) { tier = 'Healthy'; color = '#6EE7B7'; }
    else if (finalScore >= 40) { tier = 'Needs Attention'; color = '#F59E0B'; }
    else { tier = 'At Risk'; color = '#EF4444'; }

    return {
      userId,
      score: finalScore,
      tier,
      color,
      breakdown: {
        completionRate: completionScore,
        paymentBehaviour: paymentScore,
        activity: activityScore,
        communication: communicationScore,
        recommendationAcceptance: recommendationScore,
        projectSuccess: successRate
      },
      calculatedAt: new Date().toISOString()
    };
  }
};

export default CustomerHealthScoreEngine;
