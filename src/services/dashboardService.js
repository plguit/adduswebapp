import { sessionManager } from './sessionManager.js';
import { profileService } from './profileService.js';
import { businessProfileService } from './businessProfileService.js';
import { projectService } from './projectService.js';

/**
 * Centralized Dashboard Service
 * 
 * Single source of truth for dashboard data.
 * All dashboard data is loaded through this service.
 * 
 * Responsibilities:
 * - Load user profile
 * - Load business profile
 * - Load projects
 * - Load notifications
 * - Load expert review status
 * - Provide unified dashboard data object
 */

export const dashboardService = {
  /**
   * Get complete dashboard data for current user.
   * @returns {Object|null} Dashboard data object
   */
  getDashboardData() {
    const session = sessionManager.getSession();
    if (!session?.userId) {
      return null;
    }

    const userId = session.userId;
    const profile = profileService.getProfileById(userId) || {};
    const businessProfile = businessProfileService.getBusinessProfile() || {};
    const projects = projectService.getProjects();
    const notifications = profile.notifications || [];
    const expertReviewStatus = profile.expertReviewStatus || null;
    const expertNotes = profile.expertNotes || '';
    const chatHistory = profile.chatHistory || [];

    return {
      userId,
      profile: {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phoneNumber || '',
        customerId: profile.customerId || '',
        businessId: profile.businessId || '',
        onboardingStatus: profile.onboardingStatus || 'in_progress',
        currentStep: profile.currentStep || 'welcome',
        lastVisitedScreen: profile.lastVisitedScreen || 'welcome',
        createdAt: profile.createdAt || null,
        updatedAt: profile.updatedAt || null,
        lastLoginAt: profile.lastLoginAt || null
      },
      businessProfile: {
        businessName: businessProfile.businessName || '',
        industry: businessProfile.industry || '',
        businessStage: businessProfile.businessStage || '',
        businessDescription: businessProfile.businessDescription || '',
        services: Array.isArray(businessProfile.services) ? businessProfile.services : [],
        products: Array.isArray(businessProfile.products) ? businessProfile.products : [],
        targetAudience: businessProfile.targetAudience || '',
        location: businessProfile.location || '',
        website: businessProfile.website || '',
        isConfirmed: businessProfile.isConfirmed || false,
        confirmedAt: businessProfile.confirmedAt || null,
        aiConfidenceScore: businessProfile.aiConfidenceScore || null,
        sourceStatus: businessProfile.sourceStatus || null
      },
      projects: projects.map(p => ({
        projectId: p.projectId || p.draftId,
        service: p.service || '',
        status: p.status || 'DRAFT',
        createdAt: p.createdAt || p.submittedAt || null,
        submittedAt: p.submittedAt || null,
        budget: p.budget || '',
        timeline: p.timeline || '',
        deliverables: p.deliverables || []
      })),
      notifications: notifications.map(n => ({
        id: n.id || `notif_${Date.now()}`,
        message: n.message || n.text || '',
        read: n.read || false,
        createdAt: n.createdAt || null
      })),
      expertReview: {
        status: expertReviewStatus,
        notes: expertNotes,
        submittedAt: profile.expertReviewSubmittedAt || null,
        completedAt: profile.expertReviewCompletedAt || null
      },
      chatHistory: chatHistory.slice(-20),
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE' || p.status === 'EXPERT_REVIEW').length,
        completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
        unreadNotifications: notifications.filter(n => !n.read).length
      }
    };
  },

  /**
   * Refresh dashboard data (reload from storage).
   */
  refreshDashboard() {
    return this.getDashboardData();
  },

  /**
   * Check if user can access dashboard.
   */
  canAccessDashboard() {
    const session = sessionManager.getSession();
    if (!session?.userId) return false;

    const profile = profileService.getProfileById(session.userId);
    if (!profile) return false;

    const hasCompletedOnboarding = profile.onboardingStatus === 'completed' ||
      profile.lastVisitedScreen === 'dashboard' ||
      profile.currentStep === 'dashboard';

    return hasCompletedOnboarding;
  },

  /**
   * Get onboarding completion status.
   */
  getOnboardingStatus() {
    const session = sessionManager.getSession();
    if (!session?.userId) {
      return { status: 'NOT_STARTED', progress: 0 };
    }

    const profile = profileService.getProfileById(session.userId);
    if (!profile) {
      return { status: 'NOT_STARTED', progress: 0 };
    }

    const status = profile.onboardingStatus || 'in_progress';
    const currentStep = profile.currentStep || profile.lastVisitedScreen || 'welcome';

    const stepProgress = {
      'splash': 5,
      'welcome': 10,
      'phone': 15,
      'otp': 20,
      'name': 30,
      'business_input': 40,
      'business_analysis': 50,
      'business_summary': 60,
      'project_shortcut': 70,
      'inspiration_gallery': 80,
      'booking': 90,
      'project_details': 95,
      'final_review': 100,
      'dashboard': 100
    };

    return {
      status,
      currentStep,
      progress: stepProgress[currentStep] || 0
    };
  }
};
