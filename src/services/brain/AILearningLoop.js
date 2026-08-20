import { BusinessVaultService } from './BusinessVaultService.js';
import { BusinessUnderstandingEngine } from './BusinessUnderstandingEngine.js';
import { BusinessTimelineEngine } from './BusinessTimelineEngine.js';

/**
 * Module 8: Silent AI Learning Loop
 * Continuously learns from completed projects and enriches future recommendations
 */
export const AILearningLoop = {
  /**
   * Triggered after a project is delivered or approved
   */
  processCompletedProject(userId, project = {}) {
    if (!userId || !project.id) return null;

    // 1. Archive deliverable metadata to Business Vault
    const deliverableCategory = this.mapServiceToVaultCategory(project.service);
    if (deliverableCategory) {
      BusinessVaultService.storeAsset(userId, deliverableCategory, project.title || project.service);
    }

    // 2. Update Business Understanding Engine with new project context
    BusinessUnderstandingEngine.enrichBusinessProfile(userId, {
      newProject: project.service,
      lastCompletedProject: project.service,
      lastCompletedAt: new Date().toISOString()
    });

    // 3. Record learning event in Business Timeline
    BusinessTimelineEngine.appendEvent(userId, {
      type: 'project_completed',
      title: `${project.service} Delivered`,
      description: `AI Learning Loop enriched Business Vault and improved future recommendations from "${project.service}" project data.`,
      metadata: {
        projectId: project.id,
        service: project.service,
        creatorUsed: project.assignedCreator?.name || 'Creator',
        successSignal: 'customer_approved'
      }
    });

    return {
      userId,
      processedAt: new Date().toISOString(),
      learned: `Vault enriched with ${project.service} data. Future recommendations updated.`
    };
  },

  mapServiceToVaultCategory(service = '') {
    const s = service.toLowerCase();
    if (s.includes('video') || s.includes('film') || s.includes('reel')) return 'videos';
    if (s.includes('photo') || s.includes('shoot')) return 'photography';
    if (s.includes('brand') || s.includes('logo') || s.includes('identity')) return 'brandIdentity';
    if (s.includes('website') || s.includes('web')) return 'website';
    if (s.includes('packaging')) return 'packaging';
    if (s.includes('guideline') || s.includes('brand guide')) return 'brandGuidelines';
    return 'marketingAssets';
  }
};

export default AILearningLoop;
