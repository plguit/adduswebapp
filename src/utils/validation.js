/**
 * Input Validation Utilities
 * Pure functions for validating user inputs across the application.
 */

export const validation = {
  validateIndianPhone(phone) {
    if (!phone) return { isValid: false, error: 'Mobile number is required.' };
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) return { isValid: false, error: 'Mobile number must be 10 digits.' };
    if (!['6', '7', '8', '9'].includes(clean.charAt(0))) {
      return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
    }
    return { isValid: true, error: '' };
  },

  validateName(name) {
    if (!name || !name.trim()) return { isValid: false, error: 'Name is required.' };
    if (name.trim().length < 2) return { isValid: false, error: 'Name must be at least 2 characters.' };
    return { isValid: true, error: '' };
  },

  validateUrl(url) {
    if (!url || !url.trim()) return { isValid: false, error: 'URL is required.' };
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return { isValid: true, error: '' };
    } catch {
      return { isValid: false, error: 'Invalid URL format.' };
    }
  }
};
