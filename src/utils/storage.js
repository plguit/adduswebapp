/**
 * Persistent Storage Utility
 * Safe wrapper around browser localStorage for global state persistence.
 */

const STORAGE_PREFIX = 'ADDUS_MVP_';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`[Storage Utility] Error reading key "${key}":`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage Utility] Error writing key "${key}":`, error);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn(`[Storage Utility] Error removing key "${key}":`, error);
    }
  },

  clear() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn('[Storage Utility] Error clearing storage:', error);
    }
  }
};
