/**
 * ADDUS Platform — Shared Validators
 */

export const validators = {
  validatePhone(phone) {
    if (!phone) return { isValid: false, message: 'Phone number is required.' };
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) return { isValid: false, message: 'Please enter a valid 10-digit mobile number.' };
    return { isValid: true, clean };
  },

  validateEmail(email) {
    if (!email) return { isValid: false, message: 'Email address is required.' };
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const clean = email.trim().toLowerCase();
    if (!re.test(clean)) return { isValid: false, message: 'Please enter a valid email address.' };
    return { isValid: true, clean };
  },

  validateOTP(code) {
    if (!code || !/^\d{4,6}$/.test(String(code).trim())) {
      return { isValid: false, message: 'Please enter a valid verification code.' };
    }
    return { isValid: true };
  },

  validateUrl(url) {
    if (!url || !url.trim()) return { isValid: false, message: 'URL is required.' };
    try {
      const parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
      return { isValid: true, clean: parsed.href };
    } catch {
      return { isValid: false, message: 'Please enter a valid URL.' };
    }
  },

  validateFile(file) {
    if (!file) return { isValid: false, message: 'No file selected.' };
    const allowed = ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'ppt', 'pptx'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      return { isValid: false, message: `Unsupported file type .${ext}` };
    }
    return { isValid: true };
  }
};
