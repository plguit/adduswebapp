/**
 * ADDUS Platform — Creator Notification Service
 *
 * Manages creator-specific notifications and delivery.
 */

import { getCreatorVault, updateCreatorVault } from './creatorVaultService.js';
import { addNotificationToCreator } from './creatorService.js';

export function createCreatorNotification({ creatorId, type, title, message, deepLink, priority = 'normal' }) {
  return addNotificationToCreator(creatorId, {
    type,
    title,
    message,
    deepLink: deepLink || null,
    priority,
    read: false,
    dismissed: false
  });
}

export function getCreatorNotifications(creatorId) {
  const vault = getCreatorVault(creatorId);
  return vault.notifications || [];
}

export function markCreatorNotificationRead(creatorId, notificationId) {
  const vault = getCreatorVault(creatorId);
  const notifications = (vault.notifications || []).map(n =>
    n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
  );
  return updateCreatorVault(creatorId, { notifications });
}

export function dismissCreatorNotification(creatorId, notificationId) {
  const vault = getCreatorVault(creatorId);
  const notifications = (vault.notifications || []).map(n =>
    n.id === notificationId ? { ...n, dismissed: true, dismissedAt: new Date().toISOString() } : n
  );
  return updateCreatorVault(creatorId, { notifications });
}

export function getUnreadCreatorNotificationsCount(creatorId) {
  const notifications = getCreatorNotifications(creatorId);
  return notifications.filter(n => !n.read && !n.dismissed).length;
}

export function pushToAllCreators(notification) {
  const { getAllCreatorVaults } = require('./creatorVaultService.js');
  const vaults = getAllCreatorVaults();
  const results = [];
  for (const { creatorId } of vaults) {
    const updated = createCreatorNotification({ creatorId, ...notification });
    results.push({ creatorId, status: 'sent' });
  }
  return results;
}

export function pushToCreators(creatorIds, notification) {
  const results = [];
  for (const creatorId of creatorIds) {
    const updated = createCreatorNotification({ creatorId, ...notification });
    results.push({ creatorId, status: 'sent', notification: updated.notifications?.[updated.notifications.length - 1] });
  }
  return results;
}
