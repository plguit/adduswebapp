import { useState, useCallback, useEffect } from 'react';
import { profileService } from '../services/profileService.js';
import { storage } from '../utils/storage.js';
import { BusinessBrainService } from '../../src/services/brain/BusinessBrainService.js';

export function useBusinessBrain(userId = null) {
  const getActiveUserId = useCallback(() => {
    if (userId) return userId;
    const session = storage.get('ACTIVE_AUTH_SESSION', null);
    return session?.userId || null;
  }, [userId]);

  const uid = getActiveUserId();

  const [brain, setBrain] = useState(() => BusinessBrainService.understanding.getBusinessProfile(uid));
  const [vault, setVault] = useState(() => BusinessBrainService.vault.getVault(uid));
  const [recommendations, setRecommendations] = useState(() => BusinessBrainService.recommendations.generateRecommendations(uid).recommendations);
  const [roadmap, setRoadmap] = useState(() => BusinessBrainService.generateRoadmap(uid));

  const refreshBrain = useCallback(() => {
    const activeUid = getActiveUserId();
    if (activeUid) {
      setBrain(BusinessBrainService.understanding.getBusinessProfile(activeUid));
      setVault(BusinessBrainService.vault.getVault(activeUid));
      setRecommendations(BusinessBrainService.recommendations.generateRecommendations(activeUid).recommendations);
      setRoadmap(BusinessBrainService.generateRoadmap(activeUid));
    }
  }, [getActiveUserId]);

  useEffect(() => {
    refreshBrain();
  }, [refreshBrain, userId]);

  const updateBrain = useCallback((patch) => {
    const activeUid = getActiveUserId();
    if (!activeUid) return;
    BusinessBrainService.understanding.enrichBusinessProfile(activeUid, patch);
    refreshBrain();
  }, [getActiveUserId, refreshBrain]);

  const generateProjectPlan = useCallback((projectData) => {
    const activeUid = getActiveUserId();
    return BusinessBrainService.planner.generateProjectPlan(activeUid, projectData);
  }, [getActiveUserId]);

  const runQualityReview = useCallback((project) => {
    const activeUid = getActiveUserId();
    return BusinessBrainService.quality.evaluateProjectQuality(activeUid, project);
  }, [getActiveUserId]);

  return {
    brain,
    vault,
    recommendations,
    roadmap,
    updateBrain,
    refreshBrain,
    generateProjectPlan,
    runQualityReview
  };
}

export default useBusinessBrain;
