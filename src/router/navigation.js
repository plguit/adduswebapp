/**
 * Onboarding Navigation Flow & Guard Rules
 * 
 * Flow Sequence:
 * Splash -> Welcome -> Phone Verification -> Name -> Business Input ->
 * Business Analysis -> Expectation -> Business Summary -> Project Shortcut ->
 * Inspiration Gallery -> Booking -> Project Details -> Final Review -> Dashboard
 */

export const ONBOARDING_ROUTES = [
  { id: 'splash', label: 'Splash Screen', progress: 0 },
  { id: 'welcome', label: 'Welcome', progress: 8 },
  { id: 'phone', label: 'Phone Verification', progress: 16 },
  { id: 'otp', label: 'OTP Verification', progress: 20 },
  { id: 'name', label: 'Client Identity', progress: 28 },
  { id: 'business_input', label: 'Business Profile', progress: 36 },
  { id: 'business_analysis', label: 'AI Strategy Audit', progress: 44 },
  { id: 'expectation', label: 'Expectations & Goals', progress: 52 },
  { id: 'business_summary', label: 'Business Snapshot', progress: 60 },
  { id: 'project_shortcut', label: 'Deliverables', progress: 68 },
  { id: 'inspiration_gallery', label: 'Inspiration Gallery', progress: 76 },
  { id: 'booking', label: 'Execution Calendar', progress: 84 },
  { id: 'project_details', label: 'Project Logistics', progress: 92 },
  { id: 'final_review', label: 'Final Submission', progress: 98 },
  { id: 'dashboard', label: 'Dashboard', progress: 100 }
];

/**
 * Checks if a route can be accessed based on global onboarding state guards.
 * @param {string} routeId - Target route
 * @param {Object} state - Current global onboarding state
 * @returns {{ allowed: boolean, redirectRoute?: string }}
 */
export function checkNavigationGuard(routeId, state) {
  if (!state) return { allowed: true };

  // Always allow unauthenticated entry steps
  if (['splash', 'welcome', 'phone', 'otp'].includes(routeId)) {
    return { allowed: true };
  }

  // Require phone verification for post-auth steps
  if (!state.verified) {
    return { allowed: false, redirectRoute: 'phone' };
  }

  return { allowed: true };
}

/**
 * Calculates current progress percentage.
 * @param {string} currentRouteId 
 * @returns {number} progress percentage (0 - 100)
 */
export function getRouteProgress(currentRouteId) {
  const route = ONBOARDING_ROUTES.find(r => r.id === currentRouteId);
  return route ? route.progress : 0;
}
