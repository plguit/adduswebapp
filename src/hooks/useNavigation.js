import { useCallback, useMemo } from 'react';
import { useOnboardingStore } from '../store/onboardingStore.js';
import { ONBOARDING_ROUTES, checkNavigationGuard, getRouteProgress } from '../router/navigation.js';

/**
 * Custom Hook for Navigation, Routing Guards, and Progress Tracking
 */
export function useNavigation() {
  const { state, updateState } = useOnboardingStore();

  const currentRoute = state.currentStep || 'splash';

  // Compute progress percentage
  const progressPct = useMemo(() => {
    return getRouteProgress(currentRoute);
  }, [currentRoute]);

  // Check guard for a specific target route against current state
  const canAccessRoute = useCallback((targetRouteId) => {
    return checkNavigationGuard(targetRouteId, state);
  }, [state]);

  // Navigate to target route using atomic state updater to avoid stale closure state
  const navigateTo = useCallback((targetRouteId) => {
    updateState((prev) => {
      const guard = checkNavigationGuard(targetRouteId, prev);
      if (guard.allowed) {
        return { ...prev, currentStep: targetRouteId };
      } else {
        console.warn(`[Navigation Guard Block] Access to "${targetRouteId}" denied. Redirecting to "${guard.redirectRoute}".`);
        return { ...prev, currentStep: guard.redirectRoute };
      }
    });
  }, [updateState]);

  // Advance to next route in flow sequence
  const next = useCallback(() => {
    const currentIndex = ONBOARDING_ROUTES.findIndex(r => r.id === currentRoute);
    if (currentIndex >= 0 && currentIndex < ONBOARDING_ROUTES.length - 1) {
      const nextRouteId = ONBOARDING_ROUTES[currentIndex + 1].id;
      navigateTo(nextRouteId);
    }
  }, [currentRoute, navigateTo]);

  // Go back to previous route in sequence
  const back = useCallback(() => {
    const currentIndex = ONBOARDING_ROUTES.findIndex(r => r.id === currentRoute);
    if (currentIndex > 0) {
      const prevRouteId = ONBOARDING_ROUTES[currentIndex - 1].id;
      navigateTo(prevRouteId);
    }
  }, [currentRoute, navigateTo]);

  return {
    currentRoute,
    progressPct,
    routes: ONBOARDING_ROUTES,
    navigateTo,
    next,
    back,
    canAccessRoute
  };
}
