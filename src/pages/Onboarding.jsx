import React, { useState, useEffect } from 'react';
import { useOnboardingStore } from '../store/onboardingStore.js';
import { sessionManager } from '../services/sessionManager.js';
import { profileService } from '../services/profileService.js';
import { SplashScreen } from '../components/onboarding/SplashScreen.jsx';
import { AuthScreen } from '../components/onboarding/AuthScreen.jsx';
import { ConversationalOnboarding } from '../components/chat/ConversationalOnboarding.jsx';
import { DashboardPage } from './dashboard/DashboardPage.jsx';
import { ToastNotification } from '../components/dashboard/ToastNotification.jsx';

export function Onboarding() {
  const { state, updateState, bindToUser } = useOnboardingStore();
  const [showSplash, setShowSplash] = useState(() => {
    if (sessionManager.isAuthenticated()) return false;
    try {
      const hasSeenSplash = sessionStorage.getItem('HAS_SEEN_SPLASH');
      return !hasSeenSplash;
    } catch {
      return true;
    }
  });
  const [hasCompletedAuth, setHasCompletedAuth] = useState(() => sessionManager.isAuthenticated());
  const [toastMessage, setToastMessage] = useState('');

  // Auto-Login & Session Restore on Startup
  useEffect(() => {
    if (sessionManager.isAuthenticated()) {
      const activeUser = sessionManager.getCurrentUser();
      if (activeUser) {
        bindToUser(activeUser.userId, {
          ...activeUser,
          verified: true,
          currentStep: 'dashboard',
          onboardingStatus: 'completed',
          expertReviewStatus: activeUser.expertReviewStatus || null,
          expertReviewSubmittedAt: activeUser.expertReviewSubmittedAt || null,
          chatHistory: activeUser.chatHistory || [],
        });
      }
    }
  }, []);

  const activeSession = sessionManager.getSession();
  const activeUser = sessionManager.getCurrentUser();
  const isAuthenticated = sessionManager.isAuthenticated();
  const isCompleted = state.onboardingStatus === 'completed' ||
                      state.currentStep === 'dashboard' ||
                      activeSession?.lastVisitedScreen === 'dashboard' ||
                      activeUser?.lastVisitedScreen === 'dashboard' ||
                      activeUser?.currentStep === 'dashboard' ||
                      activeUser?.onboardingStatus === 'completed';
  const isDashboardStep = isAuthenticated && isCompleted;

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Unauthenticated users -> Render CURRENT existing AuthScreen (Login/Sign-up)
  if (!hasCompletedAuth && !state.verified) {
    return (
      <AuthScreen 
        onAuthSuccess={() => {
          setHasCompletedAuth(true);
        }} 
      />
    );
  }

  // Auto-redirect to dashboard for returning authenticated users who completed onboarding
  if (isDashboardStep) {
    return (
      <>
        <DashboardPage showToast={toastMessage} onToastDismiss={() => setToastMessage('')} />
        <ToastNotification message={toastMessage} onDismiss={() => setToastMessage('')} />
      </>
    );
  }

  const handleProjectCreated = (project) => {
    const session = sessionManager.getSession();
    if (session?.userId) {
      const profile = profileService.getProfileById(session.userId);
      if (profile) {
        const existingProjects = profile.projects || [];
        profileService.saveProfile({ ...profile, projects: [project, ...existingProjects] });
      }
    }
    updateState({ currentStep: 'dashboard', lastCreatedProject: project });
    setToastMessage('Project Created Successfully 🎉');
  };

  return (
    <>
      <ConversationalOnboarding onProjectCreated={handleProjectCreated} />
      <ToastNotification message={toastMessage} onDismiss={() => setToastMessage('')} />
    </>
  );
}

export default Onboarding;
