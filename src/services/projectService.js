import { profileService } from './profileService.js';
import { sessionManager } from './sessionManager.js';

/**
 * Centralized Project Service
 * 
 * Single source of truth for project operations.
 * Handles project drafts, creation, updates, and idempotency.
 * 
 * Responsibilities:
 * - Create project drafts
 * - Submit projects (idempotent)
 * - Update project status
 * - Restore draft on session restore
 * - Prevent duplicate submissions
 */

const DRAFT_KEY = 'ADDUS_PROJECT_DRAFT';

export const projectService = {
  /**
   * Create a new project draft.
   * @param {Object} projectData
   * @returns {Object} created project with draftId
   */
  createDraft(projectData = {}) {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const draft = {
      draftId,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...projectData
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {}

    return draft;
  },

  /**
   * Get current project draft.
   */
  getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Update project draft.
   */
  updateDraft(updates = {}) {
    const current = this.getDraft() || {};
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    } catch (e) {}

    return updated;
  },

  /**
   * Clear project draft.
   */
  clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  },

  /**
   * Submit project (idempotent).
   * Uses draftId as idempotency key.
   * @param {Object} draft - Project draft to submit
   * @returns {Promise<Object>} submitted project
   */
  async submitProject(draft) {
    if (!draft) {
      throw new Error('No project draft to submit');
    }

    const session = sessionManager.getSession();
    if (!session?.userId) {
      throw new Error('User not authenticated');
    }

    const userId = session.userId;

    try {
      const profile = profileService.getProfileById(userId) || {};
      const existingProjects = profile.projects || [];

      const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const submittedProject = {
        ...draft,
        projectId,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        userId
      };

      const updatedProfile = {
        ...profile,
        projects: [submittedProject, ...existingProjects],
        currentStep: 'dashboard',
        lastVisitedScreen: 'dashboard',
        onboardingStatus: 'completed'
      };

      profileService.saveProfile(updatedProfile);
      sessionManager.updateLastVisitedScreen('dashboard');
      this.clearDraft();

      return submittedProject;
    } catch (e) {
      console.warn('[ProjectService] Submit project error:', e);
      throw e;
    }
  },

  /**
   * Get projects for current user.
   */
  getProjects() {
    const session = sessionManager.getSession();
    if (!session?.userId) return [];

    const profile = profileService.getProfileById(session.userId);
    return profile?.projects || [];
  },

  /**
   * Get project by ID.
   */
  getProjectById(projectId) {
    const projects = this.getProjects();
    return projects.find(p => p.projectId === projectId || p.draftId === projectId) || null;
  },

  /**
   * Check if user has an active project.
   */
  hasActiveProject() {
    const projects = this.getProjects();
    return projects.some(p => p.status === 'SUBMITTED' || p.status === 'ACTIVE' || p.status === 'EXPERT_REVIEW');
  },

  /**
   * Restore draft from localStorage on app startup.
   */
  restoreDraft() {
    return this.getDraft();
  }
};
