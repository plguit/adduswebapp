/**
 * ADDUS Platform — Workflow Orchestration Engine
 *
 * Phase 12 implementation:
 *  - Coordinates brief → specialist → work → review → approval → delivery → outcome
 *  - Maintains shared business context throughout
 *  - Uses Business Vault as persistent context layer
 */

import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';

export const WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  BRIEF_CREATED: 'BRIEF_CREATED',
  SPECIALIST_ASSIGNED: 'SPECIALIST_ASSIGNED',
  WORK_IN_PROGRESS: 'WORK_IN_PROGRESS',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const WORKFLOW_STAGE = {
  BRIEF: 'BRIEF',
  SPECIALIST_MATCHING: 'SPECIALIST_MATCHING',
  EXECUTION: 'EXECUTION',
  REVIEW: 'REVIEW',
  APPROVAL: 'APPROVAL',
  DELIVERY: 'DELIVERY',
  OUTCOME: 'OUTCOME'
};

export function createWorkflow(userId, businessId, brief) {
  const workflow = {
    workflowId: `WORKFLOW_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    businessId,
    status: WORKFLOW_STATUS.DRAFT,
    currentStage: WORKFLOW_STAGE.BRIEF,
    brief: {
      objective: brief.objective || '',
      deliverables: brief.deliverables || [],
      constraints: brief.constraints || {},
      timeline: brief.timeline || null,
      budget: brief.budget || null,
      context: brief.context || {}
    },
    specialistAssignment: null,
    execution: {
      startDate: null,
      milestones: [],
      revisions: 0
    },
    review: {
      submittedAt: null,
      reviewedBy: null,
      feedback: null,
      approvedAt: null
    },
    delivery: {
      deliveredAt: null,
      deliverables: [],
      acceptanceNotes: null
    },
    outcome: {
      evaluated: false,
      beforeState: null,
      afterState: null,
      customerFeedback: null,
      performanceIndicators: {},
      lessonsLearned: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return workflow;
}

export function transitionWorkflow(workflow, newStatus, metadata = {}) {
  const validTransitions = {
    [WORKFLOW_STATUS.DRAFT]: [WORKFLOW_STATUS.BRIEF_CREATED, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.BRIEF_CREATED]: [WORKFLOW_STATUS.SPECIALIST_ASSIGNED, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.SPECIALIST_ASSIGNED]: [WORKFLOW_STATUS.WORK_IN_PROGRESS, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.WORK_IN_PROGRESS]: [WORKFLOW_STATUS.UNDER_REVIEW, WORKFLOW_STATUS.REVISION_REQUESTED, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.REVISION_REQUESTED]: [WORKFLOW_STATUS.WORK_IN_PROGRESS, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.UNDER_REVIEW]: [WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REVISION_REQUESTED, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.APPROVED]: [WORKFLOW_STATUS.DELIVERED, WORKFLOW_STATUS.CANCELLED],
    [WORKFLOW_STATUS.DELIVERED]: [WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.CANCELLED]
  };

  const allowed = validTransitions[workflow.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid workflow transition: ${workflow.status} → ${newStatus}`);
  }

  const updated = {
    ...workflow,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  switch (newStatus) {
    case WORKFLOW_STATUS.BRIEF_CREATED:
      updated.currentStage = WORKFLOW_STAGE.SPECIALIST_MATCHING;
      break;
    case WORKFLOW_STATUS.SPECIALIST_ASSIGNED:
      updated.currentStage = WORKFLOW_STAGE.EXECUTION;
      break;
    case WORKFLOW_STATUS.WORK_IN_PROGRESS:
      updated.currentStage = WORKFLOW_STAGE.EXECUTION;
      updated.execution = {
        ...updated.execution,
        startDate: updated.execution.startDate || new Date().toISOString()
      };
      break;
    case WORKFLOW_STATUS.UNDER_REVIEW:
      updated.currentStage = WORKFLOW_STAGE.REVIEW;
      updated.review = {
        ...updated.review,
        submittedAt: new Date().toISOString(),
        reviewedBy: metadata.reviewedBy || null,
        feedback: metadata.feedback || null
      };
      break;
    case WORKFLOW_STATUS.APPROVED:
      updated.currentStage = WORKFLOW_STAGE.APPROVAL;
      updated.review = {
        ...updated.review,
        approvedAt: new Date().toISOString()
      };
      break;
    case WORKFLOW_STATUS.DELIVERED:
      updated.currentStage = WORKFLOW_STAGE.DELIVERY;
      updated.delivery = {
        ...updated.delivery,
        deliveredAt: new Date().toISOString(),
        deliverables: metadata.deliverables || updated.delivery.deliverables,
        acceptanceNotes: metadata.acceptanceNotes || null
      };
      break;
    case WORKFLOW_STATUS.COMPLETED:
      updated.currentStage = WORKFLOW_STAGE.OUTCOME;
      updated.outcome = {
        ...updated.outcome,
        evaluated: true,
        afterState: metadata.afterState || null,
        customerFeedback: metadata.customerFeedback || null,
        performanceIndicators: metadata.performanceIndicators || {},
        lessonsLearned: metadata.lessonsLearned || []
      };
      break;
    case WORKFLOW_STATUS.REVISION_REQUESTED:
      updated.execution = {
        ...updated.execution,
        revisions: updated.execution.revisions + 1
      };
      break;
    default:
      break;
  }

  return updated;
}

export function getWorkflowProgress(workflow) {
  const stages = [
    { key: WORKFLOW_STAGE.BRIEF, label: 'Brief', completed: workflow.status !== WORKFLOW_STATUS.DRAFT },
    { key: WORKFLOW_STAGE.SPECIALIST_MATCHING, label: 'Specialist', completed: [WORKFLOW_STATUS.SPECIALIST_ASSIGNED, WORKFLOW_STATUS.WORK_IN_PROGRESS, WORKFLOW_STATUS.UNDER_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.DELIVERED, WORKFLOW_STATUS.COMPLETED].includes(workflow.status) },
    { key: WORKFLOW_STAGE.EXECUTION, label: 'Execution', completed: [WORKFLOW_STATUS.UNDER_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.DELIVERED, WORKFLOW_STATUS.COMPLETED].includes(workflow.status) },
    { key: WORKFLOW_STAGE.REVIEW, label: 'Review', completed: [WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.DELIVERED, WORKFLOW_STATUS.COMPLETED].includes(workflow.status) },
    { key: WORKFLOW_STAGE.APPROVAL, label: 'Approval', completed: [WORKFLOW_STATUS.DELIVERED, WORKFLOW_STATUS.COMPLETED].includes(workflow.status) },
    { key: WORKFLOW_STAGE.DELIVERY, label: 'Delivery', completed: workflow.status === WORKFLOW_STATUS.COMPLETED },
    { key: WORKFLOW_STAGE.OUTCOME, label: 'Outcome', completed: workflow.status === WORKFLOW_STATUS.COMPLETED && workflow.outcome?.evaluated }
  ];

  const completedCount = stages.filter(s => s.completed).length;
  const progress = Math.round((completedCount / stages.length) * 100);

  return {
    stages,
    progress,
    currentStage: workflow.currentStage,
    status: workflow.status
  };
}
