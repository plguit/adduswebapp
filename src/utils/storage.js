/**
 * Persistent Storage Utility
 * Safe wrapper around browser localStorage for global state persistence.
 */

const STORAGE_PREFIX = 'ADDUS_MVP_';
const memoryStore = new Map();

export const storage = {
  get(key, defaultValue = null) {
    try {
      if (typeof localStorage === 'undefined') {
        return memoryStore.has(STORAGE_PREFIX + key) ? memoryStore.get(STORAGE_PREFIX + key) : defaultValue;
      }
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`[Storage Utility] Error reading key "${key}":`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      if (typeof localStorage === 'undefined') {
        memoryStore.set(STORAGE_PREFIX + key, value);
        return;
      }
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        try {
          const fallbackKey = STORAGE_PREFIX + key;
          const oldestKey = Object.keys(localStorage)
            .filter(k => k.startsWith(STORAGE_PREFIX) && k !== fallbackKey)
            .sort((a, b) => (localStorage.getItem(a) || '').length - (localStorage.getItem(b) || '').length)[0];
          if (oldestKey) {
            localStorage.removeItem(oldestKey);
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            return;
          }
        } catch (cleanupError) {
          console.warn('[Storage Utility] Quota cleanup failed, using memory fallback for key:', key);
          memoryStore.set(STORAGE_PREFIX + key, value);
        }
      } else {
        console.warn(`[Storage Utility] Error writing key "${key}":`, error);
      }
    }
  },

  remove(key) {
    try {
      if (typeof localStorage === 'undefined') {
        memoryStore.delete(STORAGE_PREFIX + key);
        return;
      }
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`[Storage Utility] Error removing key "${key}":`, error);
    }
  },

  clear() {
    try {
      if (typeof localStorage === 'undefined') {
        memoryStore.clear();
        return;
      }
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn('[Storage Utility] Error clearing storage:', error);
    }
  }
};
