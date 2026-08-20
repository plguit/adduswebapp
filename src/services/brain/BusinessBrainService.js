import { BusinessUnderstandingEngine } from './BusinessUnderstandingEngine.js';
import { BusinessVaultService } from './BusinessVaultService.js';
import { PlanningBrainService } from './PlanningBrainService.js';
import { WorkflowEngine } from './WorkflowEngine.js';
import { CreatorIntelligenceService } from './CreatorIntelligenceService.js';
import { QualityBrainService } from './QualityBrainService.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { CollaborationWorkspaceService } from './CollaborationWorkspaceService.js';
import { AnalyticsEngine } from './AnalyticsEngine.js';
// Phase 3 Automation Modules
import { UniversalNotificationEngine } from './UniversalNotificationEngine.js';
import { AutomatedTaskEngine } from './AutomatedTaskEngine.js';
import { MeetingSchedulerService } from './MeetingSchedulerService.js';
import { FileApprovalEngine } from './FileApprovalEngine.js';
import { BusinessTimelineEngine } from './BusinessTimelineEngine.js';
import { CustomerHealthScoreEngine } from './CustomerHealthScoreEngine.js';
import { InternalCRMService } from './InternalCRMService.js';
import { AILearningLoop } from './AILearningLoop.js';
import { KnowledgeBaseService } from './KnowledgeBaseService.js';
import { UniversalSearchEngine } from './UniversalSearchEngine.js';
import { BusinessIntelligenceService } from './BusinessIntelligenceService.js';

/**
 * Multi-Model AI Provider Routing Architecture (Phase-Agnostic, Provider-Independent)
 * - Qwen: Business Understanding & Planning Brain
 * - GPT-5.5: Strategy & Creative Direction
 * - Claude: Quality Review & Brand Compliance
 * - Gemini: Vision & Brand Asset Extraction
 * - DeepSeek: Analytics & Data Intelligence
 * - Document AI: OCR Document Ingestion
 * - Whisper: Audio & Speech Transcription
 * - PostgreSQL + pgvector: Memory Knowledge Retrieval Layer
 */
export const AIRouter = {
  routeRequest(taskType, payload) {
    switch (taskType) {
      case 'business_understanding':
      case 'project_planning':
        return { provider: 'Qwen', model: 'Qwen-2.5-72B-Instruct', taskType, payload };
      case 'strategy_formulation':
        return { provider: 'OpenAI', model: 'GPT-5.5-Turbo', taskType, payload };
      case 'quality_review':
        return { provider: 'Anthropic', model: 'Claude-3.5-Sonnet', taskType, payload };
      case 'vision_asset_analysis':
        return { provider: 'Google', model: 'Gemini-1.5-Pro', taskType, payload };
      case 'analytics_intelligence':
        return { provider: 'DeepSeek', model: 'DeepSeek-V3', taskType, payload };
      case 'ocr_document_analysis':
        return { provider: 'Google Cloud', model: 'Document-AI-v2', taskType, payload };
      case 'audio_transcription':
        return { provider: 'OpenAI', model: 'Whisper-v3-Large', taskType, payload };
      default:
        return { provider: 'Qwen', model: 'Qwen-2.5-72B-Instruct', taskType, payload };
    }
  }
};

/**
 * Business Brain Service Bus — Central BPEP Orchestration Router (Phase 1-3)
 * Nothing bypasses the Business Brain. All modules communicate through here.
 */
export const BusinessBrainService = {
  // Core Phase 1-2 Modules
  understanding: BusinessUnderstandingEngine,
  vault: BusinessVaultService,
  planner: PlanningBrainService,
  workflows: WorkflowEngine,
  creatorIntelligence: CreatorIntelligenceService,
  quality: QualityBrainService,
  recommendations: RecommendationEngine,
  workspace: CollaborationWorkspaceService,
  analytics: AnalyticsEngine,
  aiRouter: AIRouter,
  intel: BusinessIntelligenceService,

  // Phase 3 Automation Modules
  notifications: UniversalNotificationEngine,
  taskEngine: AutomatedTaskEngine,
  meetings: MeetingSchedulerService,
  fileApproval: FileApprovalEngine,
  timeline: BusinessTimelineEngine,
  healthScore: CustomerHealthScoreEngine,
  crm: InternalCRMService,
  learning: AILearningLoop,
  knowledgeBase: KnowledgeBaseService,
  search: UniversalSearchEngine,

  /**
   * Phase 1-2 Primary Orchestration: Process project submission through Business Brain
   */
  processProjectSubmission(userId, projectData = {}) {
    const understandingRoute = AIRouter.routeRequest('business_understanding', { userId });
    const planningRoute = AIRouter.routeRequest('project_planning', { projectData });

    const businessProfile = BusinessUnderstandingEngine.getBusinessProfile(userId);
    const vaultAssets = BusinessVaultService.getVault(userId);
    const aiPlan = PlanningBrainService.generateProjectPlan(userId, projectData);
    const workflowTemplate = WorkflowEngine.getWorkflowForCategory(projectData.service);
    const rankedCreators = CreatorIntelligenceService.rankCreatorsForProject(projectData);
    const topRecommendedCreator = rankedCreators.length > 0 ? rankedCreators[0] : null;
    const growthRecs = RecommendationEngine.generateRecommendations(userId);

    // Phase 3: Auto-generate tasks on project creation
    const autoTasks = AutomatedTaskEngine.generateTasksForProject(projectData);
    AutomatedTaskEngine.saveTasksForProject(projectData.id, autoTasks);

    // Phase 3: Append to Business Timeline
    BusinessTimelineEngine.appendEvent(userId, {
      type: 'project_submitted',
      title: `${projectData.service || 'Project'} Submitted`,
      description: `Project ${projectData.id} submitted via ADDI. AI Planning Brain generated ${autoTasks.length} automated tasks.`,
      metadata: { projectId: projectData.id, service: projectData.service }
    });

    // Phase 3: Dispatch customer notification
    UniversalNotificationEngine.dispatchNotification({
      userId,
      role: 'Customer',
      type: 'project_created',
      title: '📋 Project Created Successfully',
      message: `Your ${projectData.service || 'project'} request is now under AI review. ${autoTasks.length} tasks auto-generated.`,
      priority: 'medium',
      deepLink: '/#dashboard'
    });

    return {
      userId,
      processedAt: new Date().toISOString(),
      aiRouting: {
        understandingModel: understandingRoute.model,
        planningModel: planningRoute.model,
        strategyModel: AIRouter.routeRequest('strategy_formulation').model,
        qualityModel: AIRouter.routeRequest('quality_review').model
      },
      businessProfile,
      vaultSummary: {
        totalLogos: vaultAssets.logos.length,
        totalGuidelines: vaultAssets.brandGuidelines.length,
        hasVaultData: true
      },
      aiPlan,
      workflowTemplate,
      autoTasks,
      creatorMatching: { topCreator: topRecommendedCreator, rankedCreators },
      recommendations: growthRecs.recommendations
    };
  },

  /**
   * Phase 3: Full project lifecycle event dispatcher — syncs all modules simultaneously
   */
  dispatchProjectEvent(userId, project = {}, eventType = 'project_updated') {
    const STATUS_NOTIFICATIONS = {
      'Under Review': { title: '🔍 Project Under Review', message: 'Your project is being reviewed by the ADDUS Ops Team.', priority: 'medium' },
      'Strategy Preparation': { title: '📊 Strategy Being Prepared', message: 'Your Creative Strategist has started working on your project brief.', priority: 'medium' },
      'Creator Assignment': { title: '🎬 Creator Assigned', message: 'A creator has been matched and assigned to your project.', priority: 'high' },
      'In Production': { title: '🎥 Production Started', message: 'Your project is now in active production.', priority: 'high' },
      'Internal Quality Review': { title: '✅ Quality Check In Progress', message: 'Your deliverables are being quality-checked before review.', priority: 'medium' },
      'Customer Review': { title: '📂 Ready for Your Review', message: 'Your project deliverables are ready. Please review and provide feedback.', priority: 'high' },
      'Delivered': { title: '🎉 Project Delivered!', message: 'Your project has been successfully completed and delivered.', priority: 'high' },
      'Archived': { title: '📁 Archived to Business Vault', message: 'Your completed project has been archived to your Business Vault.', priority: 'low' }
    };

    const notifData = STATUS_NOTIFICATIONS[project.status];
    if (notifData && userId) {
      UniversalNotificationEngine.dispatchNotification({
        userId,
        role: 'Customer',
        type: eventType,
        ...notifData,
        deepLink: `/#projects/${project.id}`
      });
    }

    // Timeline update
    if (userId && project.status) {
      BusinessTimelineEngine.appendEvent(userId, {
        type: eventType,
        title: `Project ${project.status}`,
        description: `${project.service || 'Project'} status changed to "${project.status}".`,
        metadata: { projectId: project.id, status: project.status }
      });
    }

    // AI Learning Loop on completion
    if (['Delivered', 'Archived', 'Approved by Customer'].includes(project.status)) {
      AILearningLoop.processCompletedProject(userId, project);
    }
  },

  /**
   * Generates a complete business intelligence roadmap
   */
  generateRoadmap(userId) {
    return BusinessIntelligenceService.generateBusinessRoadmap(userId);
  },

  /**
   * Process Quality Check through Quality Brain (routed via Claude)
   */
  processQualityReview(userId, project = {}) {
    const qualityRoute = AIRouter.routeRequest('quality_review', { projectId: project.id });
    const evaluation = QualityBrainService.evaluateProjectQuality(userId, project);
    return { ...evaluation, modelUsed: qualityRoute.model, provider: qualityRoute.provider };
  }
};

export default BusinessBrainService;
