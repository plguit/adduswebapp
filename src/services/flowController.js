import { sessionManager } from './sessionManager.js';
import { profileService } from './profileService.js';
import { businessProfileService } from './businessProfileService.js';
import { projectService } from './projectService.js';

/**
 * Centralized Flow Controller
 * 
 * Determines the authoritative next screen based on session, auth, onboarding,
 * business profile, and project state. All major navigation decisions flow
 * through this controller to prevent scattered conditional navigation logic.
 * 
 * Flow Resolution Order:
 * 1. Splash (always first, then auto-advance)
 * 2. Auth (if not authenticated)
 * 3. Onboarding (if authenticated but incomplete)
 * 4. Dashboard (if authenticated and onboarding complete)
 */

export const APP_STATES = {
  INITIALIZING: 'initializing',
  AUTH: 'auth',
  ONBOARDING: 'onboarding',
  DASHBOARD: 'dashboard',
  ERROR: 'error'
};

export const AUTH_STATES = {
  UNAUTHENTICATED: 'unauthenticated',
  OTP_REQUESTING: 'otp_requesting',
  OTP_SENT: 'otp_sent',
  OTP_VERIFYING: 'otp_verifying',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error'
};

export const BUSINESS_STATES = {
  NOT_STARTED: 'not_started',
  ANALYZING: 'analyzing',
  READY: 'ready',
  PARTIAL: 'partial',
  NEEDS_INPUT: 'needs_input',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

export const PROJECT_STATES = {
  NOT_STARTED: 'not_started',
  DRAFT: 'draft',
  SUBMITTING: 'submitting',
  SUBMITTED: 'submitted',
  EXPERT_REVIEW: 'expert_review',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export function resolveUserDestination(options = {}) {
  const authoritativeState = getAuthoritativeState();
  const session = options.session || authoritativeState.session;
  const isAuthenticated = sessionManager.isAuthenticated();
  const profile = options.profile || authoritativeState.profile;
  const state = options.state || {};

  if (!isAuthenticated || !session?.userId) {
    return {
      destination: 'AUTH',
      step: 'welcome',
      reason: 'User is not authenticated'
    };
  }

  const isCompleted = 
    profile?.onboardingStatus === 'completed' ||
    state.onboardingStatus === 'completed' ||
    session.lastVisitedScreen === 'dashboard' ||
    profile?.lastVisitedScreen === 'dashboard' ||
    state.currentStep === 'dashboard';

  if (isCompleted) {
    return {
      destination: 'DASHBOARD',
      step: 'dashboard',
      reason: 'User has completed onboarding'
    };
  }

  return {
    destination: 'ONBOARDING',
    step: state.currentStep || profile?.currentStep || 'business_input',
    reason: 'Onboarding in progress'
  };
}

/**
 * Resolves the current application state and recommended next step.
 * @param {Object} options
 * @param {string} options.currentStep - Current onboarding step
 * @param {boolean} options.verified - Whether user is verified
 * @param {boolean} options.isAuthenticated - Whether user has active session
 * @param {Object} options.businessProfile - Current business profile
 * @param {Object} options.project - Current project draft/status
 * @param {string} options.lastVisitedScreen - Last screen user visited
 * @returns {Object} { appState, nextStep, reason }
 */
export function resolveFlow(options = {}) {
  const {
    currentStep = 'splash',
    verified = false,
    isAuthenticated = false,
    businessProfile = null,
    project = null,
    lastVisitedScreen = null,
    onboardingStatus = null
  } = options;

  // Always start with splash if explicitly set
  if (currentStep === 'splash') {
    return {
      appState: APP_STATES.AUTH,
      nextStep: 'welcome',
      reason: 'Splash complete, advancing to welcome'
    };
  }

  // Not authenticated → auth flow
  if (!isAuthenticated) {
    return {
      appState: APP_STATES.AUTH,
      nextStep: currentStep === 'splash' ? 'welcome' : (currentStep || 'welcome'),
      reason: 'User not authenticated'
    };
  }

  // Authenticated but not verified → OTP/auth completion
  if (!verified) {
    return {
      appState: APP_STATES.AUTH,
      nextStep: currentStep || 'otp',
      reason: 'Authenticated but OTP not verified'
    };
  }

  // Explicit onboarding completion
  const isOnboardingComplete = onboardingStatus === 'completed' ||
    lastVisitedScreen === 'dashboard' ||
    currentStep === 'dashboard';

  if (isOnboardingComplete) {
    return {
      appState: APP_STATES.DASHBOARD,
      nextStep: 'dashboard',
      reason: 'Onboarding complete, showing dashboard'
    };
  }

  // Authenticated and verified, onboarding in progress
  return {
    appState: APP_STATES.ONBOARDING,
    nextStep: resolveOnboardingStep(currentStep, businessProfile, project),
    reason: 'Onboarding in progress'
  };
}

/**
 * Resolves the next onboarding step based on current progress and collected data.
 */
function resolveOnboardingStep(currentStep, businessProfile, project) {
  // If user explicitly has an already completed project, go to dashboard
  if (project && (project.status === 'completed' || project.status === 'active')) {
    return 'dashboard';
  }

  // Default: continue from current step
  return currentStep || 'business_input';
}

/**
 * Determines business analysis state from profile data.
 */
export function getBusinessState(businessProfile = {}) {
  if (!businessProfile || Object.keys(businessProfile).length === 0) {
    return BUSINESS_STATES.NOT_STARTED;
  }

  if (businessProfile.isConfirmed) {
    return BUSINESS_STATES.CONFIRMED;
  }

  if (businessProfile.analysisStatus === 'failed' || businessProfile.sourceStatus === 'RETRIEVAL_FAILED') {
    return BUSINESS_STATES.FAILED;
  }

  if (businessProfile.analysisStatus === 'analyzing') {
    return BUSINESS_STATES.ANALYZING;
  }

  const hasAnyData = businessProfile.businessName ||
    businessProfile.industry ||
    (Array.isArray(businessProfile.services) && businessProfile.services.length > 0) ||
    businessProfile.businessDescription;

  if (!hasAnyData) {
    return BUSINESS_STATES.NOT_STARTED;
  }

  const hasEnough = businessProfile.businessName &&
    businessProfile.industry &&
    (Array.isArray(businessProfile.services) && businessProfile.services.length > 0 || businessProfile.businessDescription);

  if (hasEnough) {
    return BUSINESS_STATES.READY;
  }

  return BUSINESS_STATES.PARTIAL;
}

/**
 * Determines project state from project data.
 */
export function getProjectState(project = null) {
  if (!project) {
    return PROJECT_STATES.NOT_STARTED;
  }

  if (project.status === 'submitting') {
    return PROJECT_STATES.SUBMITTING;
  }

  if (project.status === 'submitted' || project.status === 'pending_review') {
    return PROJECT_STATES.SUBMITTED;
  }

  if (project.status === 'expert_review') {
    return PROJECT_STATES.EXPERT_REVIEW;
  }

  if (project.status === 'active') {
    return PROJECT_STATES.ACTIVE;
  }

  if (project.status === 'completed') {
    return PROJECT_STATES.COMPLETED;
  }

  if (project.status === 'failed') {
    return PROJECT_STATES.FAILED;
  }

  // Has draft data but not submitted
  if (project.draft || project.service || project.goal) {
    return PROJECT_STATES.DRAFT;
  }

  return PROJECT_STATES.NOT_STARTED;
}

/**
 * Gets the authoritative user state from all sources.
 * This is the single source of truth for the application.
 */
export function getAuthoritativeState() {
  const session = sessionManager.getSession();
  const isAuthenticated = sessionManager.isAuthenticated();
  const currentUser = sessionManager.getCurrentUser();

  let profile = null;
  let businessProfile = null;
  let project = null;
  let onboardingStatus = null;
  let currentStep = 'splash';
  let verified = false;

  if (currentUser) {
    profile = currentUser;
    businessProfile = currentUser.businessBrain || currentUser.businessProfile || null;
    project = currentUser.projects?.[0] || null;
    onboardingStatus = currentUser.onboardingStatus || null;
    currentStep = currentUser.currentStep || currentUser.lastVisitedScreen || 'welcome';
    verified = currentUser.verified || currentUser.phoneVerified || false;
  }

  return {
    session,
    isAuthenticated,
    profile,
    businessProfile,
    project,
    onboardingStatus,
    currentStep,
    verified,
    lastVisitedScreen: session?.lastVisitedScreen || profile?.lastVisitedScreen || null
  };
}
