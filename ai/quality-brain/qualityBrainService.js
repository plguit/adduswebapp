/**
 * Quality Brain Service — ADDUS Phase 3D
 * Reviews deliverables against brief, brand, strategy, and quality standards.
 * Auto-approves or flags for revision based on configurable thresholds.
 */

const QUALITY_REVIEWS_KEY = 'addus_quality_reviews';
const QUALITY_CONFIG_KEY = 'addus_quality_config';

// ── Config ────────────────────────────────────────────────────────────────

export const qualityConfig = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(QUALITY_CONFIG_KEY) || JSON.stringify({
        autoApproveThreshold: 90,
        manualReviewThreshold: 80,
        revisionThreshold: 79,
        updatedAt: null
      }));
    } catch {
      return { autoApproveThreshold: 90, manualReviewThreshold: 80, revisionThreshold: 79 };
    }
  },
  set(config) {
    localStorage.setItem(QUALITY_CONFIG_KEY, JSON.stringify({ ...config, updatedAt: new Date().toISOString() }));
  }
};

// ── Review Store ──────────────────────────────────────────────────────────

function getReviews() {
  try { return JSON.parse(localStorage.getItem(QUALITY_REVIEWS_KEY) || '[]'); }
  catch { return []; }
}

function saveReviews(reviews) {
  localStorage.setItem(QUALITY_REVIEWS_KEY, JSON.stringify(reviews));
}

// ── Scoring Heuristics ────────────────────────────────────────────────────

/**
 * Simulates AI technical review based on deliverable metadata.
 * In production, replace with Vision AI / video analysis APIs.
 */
function scoreTechnical(deliverable, template) {
  let score = 70; // baseline
  if (!deliverable) return score;

  // Completeness check
  const required = template?.defaultDeliverables || [];
  if (required.length > 0) {
    // If we have deliverable info, boost score
    score += 10;
  }

  // File type check (simulated)
  if (deliverable.url || deliverable.fileUrl) score += 10;
  if (deliverable.name) score += 5;
  if (deliverable.status === 'uploaded') score += 5;

  return Math.min(score, 100);
}

function scoreBrand(project, creator) {
  let score = 75; // baseline
  // Check if creator is approved (brand-verified workflow followed)
  if (creator?.verificationStatus === 'approved') score += 10;
  // Check if brief was approved before shoot
  if (project?.approvedCreativeBrief) score += 15;
  return Math.min(score, 100);
}

function scoreStrategy(project) {
  let score = 70; // baseline
  if (project?.strategyWorkspace) score += 10;
  if (project?.creativeBrief?.objective) score += 10;
  if (project?.businessBrainSummary) score += 10;
  return Math.min(score, 100);
}

function scoreContent(project, deliverable) {
  let score = 72; // baseline
  if (deliverable?.name) score += 5;
  if (project?.approvedCreativeBrief?.objective) score += 10;
  if (deliverable?.url) score += 8;
  if (project?.service?.toLowerCase().includes('reel') || project?.service?.toLowerCase().includes('video')) {
    score += 5; // Video-specific content score boost
  }
  return Math.min(score, 100);
}

function scoreCompleteness(project, template) {
  const required = template?.defaultDeliverables || [];
  const projectDeliverables = project?.deliverables || [];
  if (required.length === 0) return 80;
  const uploaded = projectDeliverables.filter(d => d.status === 'uploaded' || d.url).length;
  return Math.round((Math.min(uploaded, required.length) / required.length) * 100);
}

function scoreExecution(project) {
  let score = 75;
  if (project?.shootDate) {
    const shoot = new Date(project.shootDate);
    const now = new Date();
    if (shoot <= now) score += 15; // Shoot completed
  }
  if (project?.completedMilestones?.length > 2) score += 10;
  return Math.min(score, 100);
}

// ── Suggestion Engine ─────────────────────────────────────────────────────

function generateSuggestions(scores, project) {
  const suggestions = [];
  if (scores.technical < 80) suggestions.push('Review technical export settings — ensure resolution and file format match the delivery spec.');
  if (scores.brand < 80) suggestions.push('Cross-check brand colours, logo visibility, and typography against the Brand Guidelines.');
  if (scores.strategy < 80) suggestions.push('Review if the deliverable addresses the customer\'s stated objective and target audience.');
  if (scores.content < 80) suggestions.push('Ensure the opening hook, key message, and call-to-action are clearly communicated.');
  if (scores.completeness < 90) suggestions.push('Upload all required deliverable formats before submitting for final review.');
  if (scores.execution < 80) suggestions.push('Ensure all milestones are marked complete and shoot notes are documented.');
  if (!project?.approvedCreativeBrief) suggestions.push('Confirm the approved creative brief is attached to the project.');
  return suggestions;
}

// ── Main Quality Brain ────────────────────────────────────────────────────

export const qualityBrainService = {
  /**
   * Run quality review on a project's deliverables
   */
  reviewProject(project, template = null, creator = null) {
    const config = qualityConfig.get();
    const scores = {
      technical: scoreTechnical(project?.deliverables?.[0], template),
      brand: scoreBrand(project, creator),
      strategy: scoreStrategy(project),
      content: scoreContent(project, project?.deliverables?.[0]),
      completeness: scoreCompleteness(project, template),
      execution: scoreExecution(project)
    };

    const overallScore = Math.round(
      scores.technical * 0.20 +
      scores.brand * 0.20 +
      scores.strategy * 0.20 +
      scores.content * 0.18 +
      scores.completeness * 0.12 +
      scores.execution * 0.10
    );

    const suggestions = generateSuggestions(scores, project);

    let verdict;
    let autoApproved = false;

    if (overallScore >= config.autoApproveThreshold) {
      verdict = 'approved';
      autoApproved = true;
    } else if (overallScore >= config.manualReviewThreshold) {
      verdict = 'pending_manual_review';
    } else {
      verdict = 'revision_required';
    }

    const reviewId = `qr_${Date.now()}`;
    const review = {
      reviewId,
      projectId: project.id,
      creatorId: project.assignedCreator?.creatorId,
      overallScore,
      scores,
      verdict,
      autoApproved,
      revisionRequired: verdict === 'revision_required',
      suggestions,
      missingItems: (template?.defaultDeliverables || []).filter(d => {
        const projectDeliverables = project?.deliverables || [];
        return !projectDeliverables.some(pd => pd.name?.toLowerCase().includes(d.toLowerCase()) && pd.status === 'uploaded');
      }),
      revisionHistory: [],
      reviewedBy: 'quality_brain',
      adminOverride: false,
      evaluatedAt: new Date().toISOString(),
      approvedAt: autoApproved ? new Date().toISOString() : null
    };

    const reviews = getReviews();
    reviews.push(review);
    saveReviews(reviews);

    return review;
  },

  /**
   * Admin manual override
   */
  adminOverride(reviewId, decision, adminId = 'admin') {
    const reviews = getReviews();
    const idx = reviews.findIndex(r => r.reviewId === reviewId);
    if (idx === -1) return null;

    reviews[idx] = {
      ...reviews[idx],
      verdict: decision, // approved | rejected | revision_required
      adminOverride: true,
      reviewedBy: adminId,
      approvedAt: decision === 'approved' ? new Date().toISOString() : null
    };
    saveReviews(reviews);
    return reviews[idx];
  },

  /**
   * Get review for a project
   */
  getReviewForProject(projectId) {
    return getReviews()
      .filter(r => r.projectId === projectId)
      .sort((a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt))[0] || null;
  },

  /**
   * Get all reviews (admin dashboard)
   */
  getAllReviews() {
    return getReviews().sort((a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt));
  },

  /**
   * Get pending reviews
   */
  getPendingReviews() {
    return getReviews().filter(r => r.verdict === 'pending_manual_review');
  },

  /**
   * Get score verdict label
   */
  getVerdictLabel(overallScore) {
    const config = qualityConfig.get();
    if (overallScore >= config.autoApproveThreshold) return { label: 'Auto Approved', color: '#34D399', icon: '✓' };
    if (overallScore >= config.manualReviewThreshold) return { label: 'Manual Review', color: '#FBBF24', icon: '⚠' };
    return { label: 'Revision Required', color: '#F87171', icon: '✗' };
  },

  /**
   * Get quality dashboard stats
   */
  getDashboardStats() {
    const reviews = getReviews();
    return {
      total: reviews.length,
      approved: reviews.filter(r => r.verdict === 'approved').length,
      pending: reviews.filter(r => r.verdict === 'pending_manual_review').length,
      revision: reviews.filter(r => r.verdict === 'revision_required').length,
      avgScore: reviews.length > 0 ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length) : 0,
      autoApproveRate: reviews.length > 0
        ? Math.round(reviews.filter(r => r.autoApproved).length / reviews.length * 100)
        : 0
    };
  }
};

export default qualityBrainService;
