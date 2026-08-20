import { profileService } from '../profileService.js';

export const UniversalNotificationEngine = {
  dispatchNotification({ userId = 'global', role = 'Customer', type, title, message, priority = 'medium', deepLink = '/#' }) {
    if (!userId || !title || !message) return null;

    // 1. Storage - Store in existing profile/storage
    const newNotif = {
      id: `notif_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      userId,
      role,
      type: type || 'project_update',
      title,
      message,
      unread: true,
      priority,
      createdAt: new Date().toISOString(),
      deepLink
    };

    profileService.addNotification(userId, newNotif);
    
    // In-App Notification Event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addus_notification_dispatched', { detail: newNotif }));
    }
    
    // Browser Notification Support
    this.triggerBrowserNotification(title, message);
    
    return newNotif;
  },

  /**
   * Alias required by Notification Engine Phase 1 specifications
   */
  notify(options) {
    return this.dispatchNotification(options);
  },

  triggerBrowserNotification(title, message) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    }
  },

  markAsRead(userId, notifId) {
    profileService.markNotificationRead(userId, notifId);
  }
};export const NotificationEngine = UniversalNotificationEngine;
export default UniversalNotificationEngine;
