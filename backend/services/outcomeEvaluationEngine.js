/**
 * ADDUS Platform — Outcome Evaluation Engine
 *
 * Phase 13 implementation:
 *  - Compares before/after business state
 *  - Evaluates against original objectives
 *  - Captures lessons learned
 *  - Does not claim success merely because a project was delivered
 */

import { getBusinessVault } from '../../ai/business-brain/vaultService.js';

export const OUTCOME_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PARTIALLY_SUCCESSFUL: 'PARTIALLY_SUCCESSFUL',
  SUCCESSFUL: 'SUCCESSFUL',
  UNSUCCESSFUL: 'UNSUCCESSFUL'
};

export function createOutcomeEvaluation(workflow, vaultBefore) {
  return {
    evaluationId: `OUTCOME_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    workflowId: workflow.workflowId,
    userId: workflow.userId,
    businessId: workflow.businessId,
    status: OUTCOME_STATUS.PENDING,
    objective: workflow.brief.objective,
    deliverables: workflow.delivery.deliverables || [],
    
    beforeState: {
      businessName: vaultBefore?.businessName || null,
      industry: vaultBefore?.industry || null,
      confidenceScore: vaultBefore?.aiConfidenceScore || null,
      assets: vaultBefore?.brandAssets || {},
      gaps: vaultBefore?.diagnosis?.gaps || [],
      timestamp: workflow.createdAt
    },
    
    afterState: null,
    
    evaluation: {
      objectiveMet: false,
      deliverablesCompleted: 0,
      totalDeliverables: workflow.brief.deliverables?.length || 0,
      customerSatisfaction: null,
      performanceIndicators: {},
      gapsAddressed: [],
      gapsRemaining: [],
      unexpectedOutcomes: []
    },
    
    customerFeedback: {
      rating: null,
      comments: null,
      wouldRecommend: null,
      submittedAt: null
    },
    
    lessonsLearned: [],
    improvements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function evaluateOutcome(evaluation, vaultAfter, customerFeedback = {}) {
  const updatedEvaluation = { ...evaluation, updatedAt: new Date().toISOString() };
  
  updatedEvaluation.afterState = {
    businessName: vaultAfter?.businessName || null,
    industry: vaultAfter?.industry || null,
    confidenceScore: vaultAfter?.aiConfidenceScore || null,
    assets: vaultAfter?.brandAssets || {},
    gaps: vaultAfter?.diagnosis?.gaps || [],
    timestamp: new Date().toISOString()
  };

  const beforeGaps = evaluation.beforeState?.gaps || [];
  const afterGaps = updatedEvaluation.afterState.gaps || [];
  const deliverables = evaluation.deliverables || [];

  const gapsAddressed = beforeGaps.filter(beforeGap => {
    return !afterGaps.some(afterGap => 
      afterGap.dimension === beforeGap.dimension && 
      afterGap.observation === beforeGap.observation
    );
  });

  const gapsRemaining = afterGaps.filter(afterGap => {
    return beforeGaps.some(beforeGap => 
      beforeGap.dimension === afterGap.dimension && 
      beforeGap.observation === afterGap.observation
    );
  });

  const objectiveMet = evaluateObjectiveMet(evaluation.objective, updatedEvaluation.afterState, gapsAddressed);
  const successScore = calculateSuccessScore(evaluation, updatedEvaluation.afterState, gapsAddressed, customerFeedback);

  if (successScore >= 80) {
    updatedEvaluation.status = OUTCOME_STATUS.SUCCESSFUL;
  } else if (successScore >= 50) {
    updatedEvaluation.status = OUTCOME_STATUS.PARTIALLY_SUCCESSFUL;
  } else if (successScore > 0) {
    updatedEvaluation.status = OUTCOME_STATUS.PARTIALLY_SUCCESSFUL;
  } else {
    updatedEvaluation.status = OUTCOME_STATUS.UNSUCCESSFUL;
  }

  updatedEvaluation.evaluation = {
    objectiveMet,
    deliverablesCompleted: deliverables.filter(d => d.status === 'completed').length,
    totalDeliverables: evaluation.evaluation.totalDeliverables,
    customerSatisfaction: customerFeedback.rating || null,
    performanceIndicators: {
      gapsAddressedCount: gapsAddressed.length,
      gapsRemainingCount: gapsRemaining.length,
      deliverableCompletionRate: deliverables.length > 0 
        ? Math.round((deliverables.filter(d => d.status === 'completed').length / deliverables.length) * 100)
        : 0,
      confidenceImprovement: (updatedEvaluation.afterState.confidenceScore || 0) - (evaluation.beforeState?.confidenceScore || 0),
      assetGrowth: Object.keys(updatedEvaluation.afterState.assets || {}).filter(key => {
        const before = evaluation.beforeState?.assets?.[key];
        const after = updatedEvaluation.afterState.assets[key];
        return !!after && (!before || before.status === 'MISSING');
      }).length
    },
    gapsAddressed: gapsAddressed.map(g => ({ dimension: g.dimension, observation: g.observation })),
    gapsRemaining: gapsRemaining.map(g => ({ dimension: g.dimension, observation: g.observation })),
    unexpectedOutcomes: []
  };

  updatedEvaluation.customerFeedback = {
    rating: customerFeedback.rating || null,
    comments: customerFeedback.comments || null,
    wouldRecommend: customerFeedback.wouldRecommend || null,
    submittedAt: customerFeedback.submittedAt || null
  };

  updatedEvaluation.lessonsLearned = generateLessonsLearned(updatedEvaluation);

  return updatedEvaluation;
}

function evaluateObjectiveMet(objective, afterState, gapsAddressed) {
  if (!objective) return false;
  
  const objectiveLower = objective.toLowerCase();
  const afterStateStr = JSON.stringify(afterState).toLowerCase();
  
  const keywords = objectiveLower.split(' ').filter(word => word.length > 4);
  const matchedKeywords = keywords.filter(keyword => afterStateStr.includes(keyword));
  
  const keywordMatchRatio = matchedKeywords.length / Math.max(1, keywords.length);
  
  return gapsAddressed.length > 0 && keywordMatchRatio >= 0.3;
}

function calculateSuccessScore(evaluation, afterState, gapsAddressed, customerFeedback) {
  let score = 0;
  const maxScore = 100;

  const deliverableWeight = 30;
  const deliverableCompletion = evaluation.evaluation.totalDeliverables > 0
    ? (evaluation.deliverables?.filter(d => d.status === 'completed').length / evaluation.evaluation.totalDeliverables) * deliverableWeight
    : deliverableWeight;

  score += deliverableCompletion;

  const gapWeight = 30;
  const totalGaps = (evaluation.beforeState?.gaps?.length || 0) + (afterState.gaps?.length || 0);
  if (totalGaps > 0) {
    const gapResolutionRatio = gapsAddressed.length / totalGaps;
    score += gapResolutionRatio * gapWeight;
  } else {
    score += gapWeight;
  }

  const confidenceWeight = 20;
  const confidenceImprovement = (afterState.confidenceScore || 0) - (evaluation.beforeState?.confidenceScore || 0);
  if (confidenceImprovement > 0) {
    score += Math.min(confidenceImprovement, confidenceWeight);
  }

  const feedbackWeight = 20;
  if (customerFeedback.rating) {
    score += (customerFeedback.rating / 5) * feedbackWeight;
  }

  return Math.min(maxScore, Math.round(score));
}

function generateLessonsLearned(evaluation) {
  const lessons = [];
  
  const performance = evaluation.evaluation.performanceIndicators;
  
  if (performance.gapsAddressedCount > performance.gapsRemainingCount) {
    lessons.push({
      type: 'SUCCESS',
      lesson: `Successfully addressed ${performance.gapsAddressedCount} gaps out of ${performance.gapsAddressedCount + performance.gapsRemainingCount}.`,
      actionable: true
    });
  }

  if (performance.gapsRemainingCount > 0) {
    lessons.push({
      type: 'IMPROVEMENT',
      lesson: `${performance.gapsRemainingCount} gaps remain unaddressed. Consider follow-up work.`,
      actionable: true
    });
  }

  if (performance.confidenceImprovement > 0) {
    lessons.push({
      type: 'SUCCESS',
      lesson: `Business confidence improved by ${performance.confidenceImprovement} points.`,
      actionable: false
    });
  }

  if (evaluation.evaluation.objectiveMet) {
    lessons.push({
      type: 'SUCCESS',
      lesson: 'Project objectives were met.',
      actionable: false
    });
  } else {
    lessons.push({
      type: 'IMPROVEMENT',
      lesson: 'Project objectives were not fully met. Review scope and deliverables.',
      actionable: true
    });
  }

  if (evaluation.customerFeedback?.wouldRecommend === false) {
    lessons.push({
      type: 'CRITICAL',
      lesson: 'Customer would not recommend. Immediate attention required.',
      actionable: true
    });
  }

  return lessons;
}

export function persistOutcomeToVault(userId, evaluation) {
  const vault = getBusinessVault(userId);
  if (!vault) return null;

  const existingOutcomes = vault.outcomes || [];
  const updatedOutcomes = existingOutcomes.filter(o => o.evaluationId !== evaluation.evaluationId);
  updatedOutcomes.push(evaluation);

  updateBusinessVault(userId, {
    outcomes: updatedOutcomes,
    lastOutcomeEvaluationAt: new Date().toISOString()
  });

  return evaluation;
}
