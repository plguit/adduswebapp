import { storage } from '../../utils/storage.js';
import { profileService } from '../profileService.js';

const TIMELINE_KEY_PREFIX = 'ADDUS_BUSINESS_TIMELINE_DB_';

/**
 * Module 5: Business Timeline Engine
 */
export const BusinessTimelineEngine = {
  getTimeline(userId) {
    return storage.get(`${TIMELINE_KEY_PREFIX}${userId}`, []);
  },

  appendEvent(userId, { type, title, description, metadata = {} }) {
    const timeline = this.getTimeline(userId);

    const event = {
      id: `TL_${Date.now()}`,
      userId,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      metadata
    };

    const updated = [event, ...timeline];
    storage.set(`${TIMELINE_KEY_PREFIX}${userId}`, updated);
    return event;
  },

  searchTimeline(userId, query = '') {
    const timeline = this.getTimeline(userId);
    if (!query.trim()) return timeline;
    const q = query.toLowerCase();
    return timeline.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.type || '').toLowerCase().includes(q)
    );
  }
};

export default BusinessTimelineEngine;
