import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, LogOut, RefreshCw, Mail, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../../../src/store/onboardingStore.js';
import { sessionManager } from '../../../../src/services/sessionManager.js';
import { profileService } from '../../../../src/services/profileService.js';
import { authService } from '../../../../shared/services/authService.js';
import { syncService } from '../../../../src/services/syncService.js';
import { getAuthoritativeState, resolveFlow } from '../../../../src/services/flowController.js';
import { SplashScreen } from '../../../../src/components/onboarding/SplashScreen.jsx';
import { AuthScreen } from '../../../../src/components/onboarding/AuthScreen.jsx';
import { ConversationalOnboarding } from '../../../../src/components/chat/ConversationalOnboarding.jsx';
import { DashboardPage } from './DashboardPage.jsx';
import { ToastNotification } from '../../../../src/components/dashboard/ToastNotification.jsx';

function AccountRestrictedScreen({ profile, onReapply, onLogout }) {
  const reason = profile?.expertNotes || 'Your business profile submission did not meet our verification guidelines or onboarding requirements.';
  
  return (
    <div className="dashboard-viewport flex-center" style={{ minHeight: '100vh', padding: '24px', background: '#0D0D12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ambient-glow glow-top-left" style={{ opacity: 0.15, background: '#EF4444' }} />
      
      <div style={{ maxWidth: '480px', width: '100%', background: '#16161F', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '32px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#EF4444' }}>
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#FFF', marginBottom: '8px' }}>
          Onboarding Not Approved
        </h2>
        
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px', lineHeight: 1.5 }}>
          Your business profile was reviewed by our administrative team and has been restricted at this time.
        </p>

        <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '14px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} /> Admin Review Feedback
          </div>
          <div style={{ fontSize: '13px', color: '#F3F4F6', lineHeight: 1.5 }}>
            "{reason}"
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            type="button" 
            className="duolingo-primary-btn" 
            style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, #7C5CFF, #4F46E5)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={onReapply}
          >
            <RefreshCw size={16} /> Update Info &amp; Request Re-Review
          </button>
          
          <button 
            type="button" 
            className="duolingo-secondary-btn" 
            style={{ width: '100%', height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={onLogout}
          >
            <LogOut size={16} /> Sign Out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}

export function Onboarding() {
  const { state, updateState, bindToUser, resetState } = useOnboardingStore();
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const hasSeenSplash = sessionStorage.getItem('HAS_SEEN_SPLASH');
      return !hasSeenSplash;
    } catch {
      return true;
    }
  });
  const [hasCompletedAuth, setHasCompletedAuth] = useState(() => sessionManager.isAuthenticated());
  const [toastMessage, setToastMessage] = useState('');
  const [forceDashboard, setForceDashboard] = useState(false);

  const session = sessionManager.getSession();
  const userId = session?.userId || state.userId;
  const currentProfile = userId ? profileService.getProfileById(userId) : null;
  const isRejected = currentProfile?.expertReviewStatus === 'rejected' || currentProfile?.approvalStatus === 'rejected' || currentProfile?.onboardingStatus === 'rejected' || state.expertReviewStatus === 'rejected';

  useEffect(() => {
    if (sessionManager.isAuthenticated()) {
      const activeUser = sessionManager.getCurrentUser();
      if (activeUser) {
        bindToUser(activeUser.userId, {
          ...activeUser,
          verified: true,
          expertReviewStatus: activeUser.expertReviewStatus || null,
          expertReviewSubmittedAt: activeUser.expertReviewSubmittedAt || null,
          chatHistory: activeUser.chatHistory || [],
        });
      }
    }
  }, []);

  // Centralized flow resolution
  const authoritativeState = getAuthoritativeState();
  const flowResolution = resolveFlow({
    currentStep: state.currentStep,
    verified: state.verified || authoritativeState.profile?.verified,
    isAuthenticated: authoritativeState.isAuthenticated,
    businessProfile: state.businessProfile || authoritativeState.businessProfile,
    project: authoritativeState.profile?.projects?.[0] || null,
    lastVisitedScreen: authoritativeState.lastVisitedScreen,
    onboardingStatus: authoritativeState.profile?.onboardingStatus || state.onboardingStatus
  });

  const isExplicitlyCompleted = Boolean(
    sessionManager.isAuthenticated() && (
      (state.onboardingStatus === 'completed' && state.currentStep === 'dashboard') ||
      (currentProfile?.onboardingStatus === 'completed' && currentProfile?.lastVisitedScreen === 'dashboard') ||
      (flowResolution.appState === 'dashboard' && authoritativeState.onboardingStatus === 'completed')
    )
  );

  const isDashboardStep = forceDashboard || isExplicitlyCompleted;

  const handleProjectCreated = async (project) => {
    const targetUserId = state.userId || session?.userId || `user_${Date.now()}`;
    const existingSession = sessionManager.getSession();
    if (existingSession?.token) {
      sessionManager.setSession(targetUserId, 'dashboard', existingSession.token);
    } else {
      sessionManager.createSession({
        userId: targetUserId,
        phone: state.phone || state.phoneNumber || null,
        email: state.email || null,
        verified: true,
        lastVisitedScreen: 'dashboard'
      });
    }

    if (targetUserId) {
      const profile = profileService.getProfileById(targetUserId) || {};
      const existingProjects = profile.projects || [];
      const updatedProf = profileService.saveProfile({
        ...profile,
        userId: targetUserId,
        currentStep: 'dashboard',
        lastVisitedScreen: 'dashboard',
        onboardingStatus: 'completed',
        phoneVerified: true,
        verified: true,
        projects: [project, ...existingProjects]
      });
      syncService.syncProfile(targetUserId, updatedProf);
      syncService.syncProjects(targetUserId, updatedProf.projects || []);
      sessionManager.updateLastVisitedScreen('dashboard');
    }
    updateState({ currentStep: 'dashboard', verified: true, onboardingStatus: 'completed', lastCreatedProject: project });
    setForceDashboard(true);
    setToastMessage('Project Created Successfully 🎉');
  };

  const handleReapply = () => {
    if (userId) {
      const updated = profileService.saveProfile({
        ...(currentProfile || {}),
        expertReviewStatus: 'pending',
        approvalStatus: 'pending',
        onboardingStatus: 'in_progress',
        expertReviewSubmittedAt: new Date().toISOString()
      });
      syncService.syncProfile(userId, updated);
      updateState({ expertReviewStatus: 'pending', onboardingStatus: 'in_progress', currentStep: 'business' });
      window.location.reload();
    }
  };

  const handleLogout = () => {
    authService.logout();
    resetState();
    window.location.reload();
  };

  // 1. Splash screen (always first)
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 2. Account Rejected / Restricted
  if (isRejected) {
    return <AccountRestrictedScreen profile={currentProfile} onReapply={handleReapply} onLogout={handleLogout} />;
  }

  // 3. Unauthenticated users -> Render CURRENT existing AuthScreen (Login/Sign-up)
  // Guard uses ONLY hasCompletedAuth so that state.verified flipping inside AuthScreen's
  // 1600ms setTimeout does NOT prematurely unmount the mascot celebration popup.
  if (!hasCompletedAuth) {
    return (
      <AuthScreen 
        onAuthSuccess={() => {
          // Extra 500ms buffer (on top of AuthScreen's own 1600ms) so the
          // mascot celebration popup completes its animation before unmount.
          setTimeout(() => setHasCompletedAuth(true), 500);
        }} 
      />
    );
  }

  // 4. Dashboard (for returning users who completed onboarding)
  if (isDashboardStep) {
    return (
      <>
        <DashboardPage showToast={toastMessage} onToastDismiss={() => setToastMessage('')} />
        <ToastNotification message={toastMessage} onDismiss={() => setToastMessage('')} />
      </>
    );
  }

  // 5. Onboarding flow for authenticated users
  return (
    <>
      <ConversationalOnboarding onProjectCreated={handleProjectCreated} />
      <ToastNotification message={toastMessage} onDismiss={() => setToastMessage('')} />
    </>
  );
}

export { Onboarding as OnboardingPage };
export default Onboarding;
