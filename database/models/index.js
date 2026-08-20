/**
 * Centralized Database Schemas & Entity Definitions — ADDUS BPEP Enterprise Model
 * Phases 3A–5: Creator Ecosystem, Planning Brain, Quality Brain, Operations, Finance
 */

// ─── EXISTING CORE MODELS ──────────────────────────────────────────────────

export const UserModel = {
  tableName: 'users',
  fields: ['userId', 'customerId', 'phoneNumber', 'email', 'name', 'authProvider', 'createdAt', 'updatedAt']
};

export const BusinessModel = {
  tableName: 'businesses',
  fields: ['businessId', 'userId', 'businessName', 'industry', 'businessStage', 'businessBrain', 'businessVault', 'updatedAt']
};

export const ProjectModel = {
  tableName: 'projects',
  fields: ['id', 'projectId', 'userId', 'customerId', 'businessId', 'service', 'type', 'status', 'workflowId', 'shootDate', 'estimatedDelivery', 'budget', 'proposal', 'assignedCreator', 'strategyWorkspace', 'creativeBrief', 'approvedCreativeBrief', 'deliverables', 'versionHistory', 'activityLog', 'internalNotes', 'customerNotes', 'planningBrainOutput', 'qualityReviewId', 'operationsStatus', 'financeId', 'createdAt', 'updatedAt']
};

export const WorkflowTemplateModel = {
  tableName: 'workflow_templates',
  fields: ['id', 'name', 'category', 'stages', 'updatedAt']
};

export const QualityReviewModel = {
  tableName: 'quality_reviews',
  fields: ['reviewId', 'projectId', 'creatorId', 'overallScore', 'technicalScore', 'brandScore', 'strategyScore', 'contentScore', 'completenessScore', 'isApproved', 'autoApproved', 'revisionRequired', 'suggestions', 'checks', 'verdict', 'evaluatedAt', 'reviewedBy']
};

export const RecommendationModel = {
  tableName: 'recommendations',
  fields: ['id', 'userId', 'title', 'reason', 'service', 'impact', 'estimatedBudget', 'generatedAt']
};

export const BusinessVaultModel = {
  tableName: 'business_vaults',
  fields: ['vaultId', 'userId', 'logos', 'brandIdentity', 'website', 'photography', 'videos', 'brandGuidelines', 'marketingAssets', 'packaging', 'documents', 'invoices', 'approvals', 'lastUpdated']
};

export const DeliverableModel = {
  tableName: 'deliverables',
  fields: ['id', 'projectId', 'name', 'category', 'status', 'version', 'url', 'updatedAt']
};

export const MilestoneModel = {
  tableName: 'milestones',
  fields: ['id', 'projectId', 'title', 'status', 'daysFromStart', 'completedAt', 'ownerId', 'dependencies']
};

export const TaskModel = {
  tableName: 'tasks',
  fields: ['id', 'taskId', 'projectId', 'parentTaskId', 'title', 'description', 'assigneeId', 'assigneeRole', 'status', 'priority', 'dueDate', 'dependencies', 'progress', 'attachments', 'comments', 'completedAt', 'createdAt']
};

export const SubtaskModel = {
  tableName: 'subtasks',
  fields: ['id', 'taskId', 'projectId', 'title', 'assigneeId', 'status', 'completedAt']
};

export const NotificationModel = {
  tableName: 'notifications',
  fields: ['id', 'userId', 'type', 'message', 'createdAt', 'read']
};

export const AuditLogModel = {
  tableName: 'audit_logs',
  fields: ['logId', 'projectId', 'actor', 'role', 'action', 'previousValue', 'newValue', 'timestamp']
};

// ─── PHASE 3A: CREATOR MODELS ──────────────────────────────────────────────

/**
 * Core Creator Profile
 * ID Format: ACRA000001, ACRA000002, ...
 */
export const CreatorProfileModel = {
  tableName: 'creator_profiles',
  fields: [
    'creatorId',          // ACRA000001
    'name',               // Full name
    'phone',              // Mobile number (unique)
    'email',              // Email (unique)
    'profilePhoto',       // URL/base64
    'verificationStatus', // draft | submitted | under_review | approved | rejected
    'rejectionReason',    // If rejected
    'location',           // { country, state, district, city, pincode, gps }
    'primaryProfession',  // e.g. Videographer
    'categories',         // Array of { categoryId, professionId, status, pricing, portfolio }
    'availabilityStatus', // available | busy | leave | holiday | travelling | unavailable
    'documents',          // Array of uploaded docs
    'scoreCard',          // Creator score object
    'scoreCardVisible',   // Boolean
    'adminNotes',         // Admin internal notes
    'submittedAt',        // ISO timestamp
    'approvedAt',         // ISO timestamp
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Admin-Configurable Professions
 */
export const ProfessionModel = {
  tableName: 'professions',
  fields: [
    'professionId',
    'name',           // e.g. Videographer
    'description',
    'fields',         // Array of dynamic onboarding fields
    'isActive',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Dynamic Fields per Profession (admin-configurable)
 */
export const ProfessionFieldModel = {
  tableName: 'profession_fields',
  fields: [
    'fieldId',
    'professionId',
    'label',          // e.g. Primary Camera
    'type',           // text | select | multiselect | number | boolean | url
    'options',        // For select/multiselect
    'required',
    'placeholder',
    'order'
  ]
};

/**
 * Creator Portfolio Item
 */
export const CreatorPortfolioModel = {
  tableName: 'creator_portfolio',
  fields: [
    'portfolioId',
    'creatorId',
    'categoryId',     // Links to a profession category
    'projectName',
    'clientName',
    'year',
    'description',
    'location',
    'mediaFiles',     // Array of { url, type (image|video|pdf|drive), size, name }
    'isApproved',     // Admin approved portfolio item
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Creator Pricing (per category)
 */
export const CreatorPricingModel = {
  tableName: 'creator_pricing',
  fields: [
    'pricingId',
    'creatorId',
    'categoryId',
    'professionName',
    'packages',       // Array of { name, price, description }
    'basePrice',
    'travelCharge',
    'additionalHourRate',
    'editingRate',
    'urgentDeliveryRate',
    'customNote',
    'currency',       // INR
    'adminApproved',  // Prices don't go live until admin approves
    'approvedAt',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Creator Equipment
 */
export const CreatorEquipmentModel = {
  tableName: 'creator_equipment',
  fields: [
    'equipmentId',
    'creatorId',
    'name',           // e.g. Sony A7IV
    'category',       // Camera | Lens | Drone | Lighting | Audio | Other
    'ownership',      // owned | rent_required
    'condition',      // excellent | good | fair
    'notes',
    'adminVerified',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Equipment Master List (admin-managed)
 */
export const EquipmentMasterModel = {
  tableName: 'equipment_master',
  fields: ['equipmentMasterId', 'name', 'category', 'brand', 'isActive', 'createdAt']
};

/**
 * Creator Availability Calendar
 */
export const CreatorAvailabilityModel = {
  tableName: 'creator_availability',
  fields: [
    'availabilityId',
    'creatorId',
    'date',           // ISO date string YYYY-MM-DD
    'status',         // available | busy | leave | holiday | travelling | unavailable
    'note',
    'projectId',      // If busy due to a project
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Creator Documents (Verification)
 */
export const CreatorDocumentModel = {
  tableName: 'creator_documents',
  fields: [
    'documentId',
    'creatorId',
    'type',           // pan | aadhaar | driving_licence | passport | gst | bank_details | cancelled_cheque
    'fileUrl',        // URL or base64
    'fileName',
    'status',         // pending | verified | rejected
    'adminNotes',
    'uploadedAt',
    'verifiedAt'
  ]
};

/**
 * Creator Equipment Requests
 */
export const CreatorEquipmentRequestModel = {
  tableName: 'creator_equipment_requests',
  fields: [
    'requestId',
    'creatorId',
    'projectId',
    'itemType',       // Drone | Assistant | Studio | Model | Costume | Props | Vehicle | Lighting | Camera | Other
    'description',
    'quantity',
    'requiredDate',
    'estimatedCost',
    'status',         // pending | approved | rejected | arranged
    'adminNotes',
    'createdAt',
    'updatedAt'
  ]
};

// ─── PHASE 3B: CREATOR SCORE ENGINE ────────────────────────────────────────

/**
 * Creator Score (living, never overwritten)
 */
export const CreatorScoreModel = {
  tableName: 'creator_scores',
  fields: [
    'scoreId',
    'creatorId',
    'overallScore',       // 0–100
    'experienceScore',    // 0–100, weight: 15%
    'portfolioScore',     // 0–100, weight: 15%
    'verificationScore',  // 0–100, weight: 10%
    'projectSuccessScore',// 0–100, weight: 20%
    'customerRatingScore',// 0–100, weight: 15%
    'onTimeScore',        // 0–100, weight: 10%
    'responseTimeScore',  // 0–100, weight: 5%
    'acceptanceRateScore',// 0–100, weight: 5%
    'availabilityScore',  // 0–100, weight: 3%
    'qualityBrainScore',  // 0–100, weight: 2%
    'industryExpertise',  // { industry: count } map
    'serviceExpertise',   // { service: count } map
    'scoreHistory',       // Array of past snapshots
    'lastUpdated'
  ]
};

/**
 * Score Weight Configuration (admin-editable)
 */
export const ScoreWeightConfigModel = {
  tableName: 'score_weight_config',
  fields: [
    'configId',
    'experienceWeight',
    'portfolioWeight',
    'verificationWeight',
    'projectSuccessWeight',
    'customerRatingWeight',
    'onTimeWeight',
    'responseTimeWeight',
    'acceptanceRateWeight',
    'availabilityWeight',
    'qualityBrainWeight',
    'updatedBy',
    'updatedAt'
  ]
};

/**
 * Creator Performance Metrics (running totals)
 */
export const CreatorMetricsModel = {
  tableName: 'creator_metrics',
  fields: [
    'metricId',
    'creatorId',
    'totalProjectsReceived',
    'totalProjectsAccepted',
    'totalProjectsCompleted',
    'totalProjectsCancelled',
    'totalProjectsRejected',
    'totalProjectsLate',
    'averageRating',          // Rolling average (recent-weighted)
    'totalRatingsReceived',
    'averageResponseTime',    // Minutes
    'acceptanceRate',         // %
    'onTimeDeliveryRate',     // %
    'totalRevenue',           // Lifetime payout
    'updatedAt'
  ]
};

// ─── PHASE 3C: PLANNING BRAIN ───────────────────────────────────────────────

/**
 * Project Template (admin-configurable)
 */
export const ProjectTemplateModel = {
  tableName: 'project_templates',
  fields: [
    'templateId',
    'name',               // Brand Film, Product Video, etc.
    'category',           // video | photography | design | website | marketing
    'description',
    'defaultTasks',       // Array of task groups with tasks and subtasks
    'defaultMilestones',  // Array of milestone titles
    'defaultDeliverables',// Array of required deliverable names
    'requiredCreatorRoles',// Array of role names
    'requiredEquipment',  // Array of equipment names
    'estimatedDuration',  // Days
    'estimatedComplexity',// low | medium | high
    'budgetRange',        // { min, max, currency }
    'risks',              // Array of risk descriptions
    'isActive',
    'createdBy',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * AI-Generated Project Plan
 */
export const ProjectPlanModel = {
  tableName: 'project_plans',
  fields: [
    'planId',
    'projectId',
    'templateId',         // Base template used
    'version',            // Version number (1, 2, 3…)
    'status',             // draft | submitted | approved | rejected
    'taskGroups',         // Structured task breakdown
    'milestones',
    'timeline',           // { startDate, endDate, totalDays, phases }
    'resourcePlan',       // Required creators + roles
    'equipmentPlan',      // Required equipment
    'costEstimate',       // Budget breakdown
    'risks',
    'buffers',            // Planning/weather/revision buffers
    'dependencies',       // Task dependency map
    'adminNotes',
    'generatedBy',        // 'planning_brain' | 'manual'
    'approvedBy',
    'approvedAt',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Plan Version History
 */
export const PlanVersionModel = {
  tableName: 'plan_versions',
  fields: ['versionId', 'planId', 'projectId', 'version', 'snapshot', 'changedBy', 'createdAt']
};

// ─── PHASE 3D: QUALITY BRAIN ────────────────────────────────────────────────

/**
 * Quality Review (per deliverable submission)
 */
export const QualityReviewDetailModel = {
  tableName: 'quality_reviews_detail',
  fields: [
    'reviewId',
    'projectId',
    'creatorId',
    'deliverableId',
    'overallScore',       // 0–100
    'technicalScore',
    'brandScore',
    'strategyScore',
    'contentScore',
    'completenessScore',
    'executionScore',
    'verdict',            // approved | revision_required | rejected
    'autoApproved',       // Boolean
    'suggestions',        // Array of improvement suggestions
    'missingItems',       // Array of missing deliverables
    'revisionHistory',    // Array of past revisions
    'reviewedBy',         // 'quality_brain' | 'admin' | adminId
    'adminOverride',      // Boolean
    'evaluatedAt',
    'approvedAt'
  ]
};

export const QualityConfigModel = {
  tableName: 'quality_config',
  fields: [
    'configId',
    'autoApproveThreshold',  // Default: 90
    'manualReviewThreshold', // Default: 80
    'revisionThreshold',     // Below this = revision required
    'updatedBy',
    'updatedAt'
  ]
};

// ─── PHASE 4: OPERATIONS ENGINE ─────────────────────────────────────────────

/**
 * Project Status Engine
 */
export const ProjectStatusModel = {
  tableName: 'project_status',
  fields: [
    'statusId',
    'projectId',
    'currentStatus',  // draft | waiting_admin | waiting_creator | planning | equipment_pending | shoot_scheduled | production | editing | quality_review | customer_review | revision | completed | archived | cancelled
    'previousStatus',
    'changedBy',
    'changedAt',
    'reason'
  ]
};

/**
 * SLA Configuration
 */
export const SLAConfigModel = {
  tableName: 'sla_config',
  fields: [
    'slaId',
    'name',
    'stage',
    'targetHours',
    'escalationHours',
    'notifyRoles',
    'isActive',
    'updatedAt'
  ]
};

/**
 * SLA Tracking
 */
export const SLATrackingModel = {
  tableName: 'sla_tracking',
  fields: [
    'trackingId',
    'projectId',
    'slaId',
    'stage',
    'startedAt',
    'targetAt',
    'completedAt',
    'breached',
    'escalated',
    'escalationLevel'
  ]
};

/**
 * Equipment Allocation (operational)
 */
export const EquipmentAllocationModel = {
  tableName: 'equipment_allocations',
  fields: [
    'allocationId',
    'equipmentId',
    'projectId',
    'creatorId',
    'requestId',
    'status',     // reserved | in_use | returned | lost | damaged
    'reservedFrom',
    'reservedTo',
    'returnedAt',
    'notes',
    'createdAt'
  ]
};

/**
 * Project Budget Tracking
 */
export const ProjectBudgetModel = {
  tableName: 'project_budgets',
  fields: [
    'budgetId',
    'projectId',
    'estimatedBudget',
    'approvedBudget',
    'creatorCost',
    'equipmentCost',
    'travelCost',
    'accommodationCost',
    'miscCost',
    'actualCost',
    'variance',
    'profitMargin',
    'updatedAt'
  ]
};

// ─── PHASE 5: FINANCE ENGINE ────────────────────────────────────────────────

/**
 * Quotation (QT000001 format)
 */
export const QuotationModel = {
  tableName: 'quotations',
  fields: [
    'quotationId',      // QT000001
    'projectId',
    'customerId',
    'businessId',
    'lineItems',        // Array of { description, quantity, rate, amount }
    'subtotal',
    'gstRate',
    'gstAmount',
    'discount',
    'totalAmount',
    'currency',         // INR
    'validUntil',
    'paymentSchedule',  // Array of { milestone, percent, amount, dueDate }
    'terms',
    'notes',
    'status',           // draft | sent | approved | rejected | expired
    'sentAt',
    'approvedAt',
    'createdBy',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Invoice (INV000001 format)
 */
export const InvoiceModel = {
  tableName: 'invoices',
  fields: [
    'invoiceId',        // INV000001
    'quotationId',
    'projectId',
    'customerId',
    'businessId',
    'lineItems',
    'subtotal',
    'gstRate',
    'gstAmount',
    'discount',
    'totalAmount',
    'paidAmount',
    'balanceAmount',
    'currency',
    'dueDate',
    'status',           // draft | issued | paid | partially_paid | overdue | cancelled
    'paymentTerms',
    'notes',
    'pdfUrl',
    'issuedAt',
    'paidAt',
    'createdBy',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Payment Record (PAY000001 format)
 */
export const PaymentRecordModel = {
  tableName: 'payment_records',
  fields: [
    'paymentId',        // PAY000001
    'invoiceId',
    'projectId',
    'customerId',
    'amount',
    'currency',
    'method',           // razorpay | stripe | upi | neft | cash | other
    'transactionId',
    'gatewayRef',
    'status',           // pending | completed | failed | refunded
    'type',             // advance | milestone | final | full
    'receiptUrl',
    'recordedAt',
    'recordedBy',
    'createdAt'
  ]
};

/**
 * Creator Payout (POT000001 format)
 */
export const CreatorPayoutModel = {
  tableName: 'creator_payouts',
  fields: [
    'payoutId',         // POT000001
    'creatorId',
    'projectId',
    'invoiceId',
    'grossAmount',
    'platformCommission',
    'tds',
    'equipmentReimbursement',
    'travelReimbursement',
    'bonus',
    'penalty',
    'netAmount',
    'status',           // pending | approved | scheduled | paid | rejected
    'bankAccountRef',
    'paymentDate',
    'approvedBy',
    'approvedAt',
    'paidAt',
    'notes',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Expense Record (EXP000001 format)
 */
export const ExpenseModel = {
  tableName: 'expenses',
  fields: [
    'expenseId',        // EXP000001
    'projectId',
    'category',         // rental | purchase | transport | accommodation | damage | misc
    'description',
    'amount',
    'currency',
    'vendorId',
    'receiptUrl',
    'status',           // pending | approved | paid
    'approvedBy',
    'approvedAt',
    'recordedAt',
    'recordedBy',
    'createdAt'
  ]
};

/**
 * Vendor (VND000001 format)
 */
export const VendorModel = {
  tableName: 'vendors',
  fields: [
    'vendorId',         // VND000001
    'name',
    'category',         // equipment_rental | printing | studio | makeup | transport | hotel | other
    'contactName',
    'phone',
    'email',
    'address',
    'gst',
    'bankDetails',
    'isActive',
    'createdAt',
    'updatedAt'
  ]
};

/**
 * Refund Record
 */
export const RefundModel = {
  tableName: 'refunds',
  fields: [
    'refundId',
    'paymentId',
    'projectId',
    'customerId',
    'amount',
    'reason',
    'type',             // full | partial | cancellation_charge
    'status',           // pending | approved | processed | rejected
    'approvedBy',
    'approvedAt',
    'processedAt',
    'createdAt'
  ]
};

/**
 * Project Profitability
 */
export const ProfitabilityModel = {
  tableName: 'profitability',
  fields: [
    'profitabilityId',
    'projectId',
    'revenue',
    'creatorCost',
    'equipmentCost',
    'travelCost',
    'operationsCost',
    'platformCost',
    'grossProfit',
    'netProfit',
    'marginPercent',
    'calculatedAt'
  ]
};
