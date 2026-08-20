import { useState, useCallback } from 'react';
import { profileService } from '../services/profileService.js';
import { storage } from '../utils/storage.js';

/**
 * Business Brain Store — Phase 3
 * Thin reactive hook wrapping profileService.businessBrain persistence.
 * Every update saves immediately to USER_ACCOUNTS_DB.
 */
export function useBusinessBrain(userId) {
  const [brain, setBrain] = useState(() => {
    if (!userId) {
      const session = storage.get('ACTIVE_AUTH_SESSION', null);
      const uid = session?.userId;
      return uid ? profileService.getBusinessBrain(uid) : {};
    }
    return profileService.getBusinessBrain(userId);
  });

  const getActiveUserId = () => {
    if (userId) return userId;
    const session = storage.get('ACTIVE_AUTH_SESSION', null);
    return session?.userId || null;
  };

  const updateBrain = useCallback((patch) => {
    const uid = getActiveUserId();
    if (!uid) return;
    const updated = profileService.updateBusinessBrain(uid, patch);
    if (updated?.businessBrain) {
      setBrain(updated.businessBrain);
    }
  }, [userId]);

  const resetBrain = useCallback(() => {
    const uid = getActiveUserId();
    if (!uid) return;
    profileService.saveProfile({
      ...profileService.getProfileById(uid),
      businessBrain: {}
    });
    setBrain({});
  }, [userId]);

  const refreshBrain = useCallback(() => {
    const uid = getActiveUserId();
    if (uid) setBrain(profileService.getBusinessBrain(uid));
  }, [userId]);

  return { brain, updateBrain, resetBrain, refreshBrain };
}
