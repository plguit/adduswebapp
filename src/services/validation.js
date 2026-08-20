/**
 * Input Validation Utility Service — Business Module Data Integrity Edition
 * Provides strict validation rules for forms, business names, customer names, URLs, and emails.
 */

export const ALLOWED_STAGES = ['Idea', 'Startup', 'Launching', 'Growing', 'Scaling', 'Established'];

export const ALLOWED_INDUSTRIES = [
  'Hospitality', 'Healthcare', 'Retail', 'Education', 'FinTech',
  'Financial Technology', 'Manufacturing', 'Real Estate', 'Technology',
  'Food & Beverage', 'Professional Services'
];

export const validation = {
  /**
   * Business Name Validation Rules:
   * - 2 to 120 characters
   * - Letters, numbers, and spaces only
   * - Rejects special characters and emojis
   * - Trims & collapses spaces
   */
  validateBusinessName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Business name is required.', sanitized: '' };
    }

    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Business name must be at least 2 characters.', sanitized: trimmed };
    }
    if (trimmed.length > 120) {
      return { isValid: false, error: 'Business name cannot exceed 120 characters.', sanitized: trimmed };
    }

    // Letters, numbers, spaces only
    const validPattern = /^[a-zA-Z0-9\s]+$/;
    if (!validPattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Business name cannot contain special characters or emojis. Please enter letters, numbers, and spaces only.',
        sanitized: trimmed.replace(/[^a-zA-Z0-9\s]/g, '')
      };
    }

    return { isValid: true, error: '', sanitized: trimmed };
  },

  /**
   * Customer Name Validation Rules:
   * - 2 to 80 characters
   * - Letters, spaces, single apostrophe, single hyphen only
   * - Rejects numbers, emojis, special symbols
   */
  validateCustomerName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Customer name is required.', sanitized: '' };
    }

    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Customer name must be at least 2 characters.', sanitized: trimmed };
    }
    if (trimmed.length > 80) {
      return { isValid: false, error: 'Customer name cannot exceed 80 characters.', sanitized: trimmed };
    }

    const validPattern = /^[a-zA-Z\s'-]+$/;
    if (!validPattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Customer name can only contain letters, spaces, hyphens, and apostrophes.',
        sanitized: trimmed.replace(/[^a-zA-Z\s'-]/g, '')
      };
    }

    return { isValid: true, error: '', sanitized: trimmed };
  },

  /**
   * Validates Indian mobile numbers:
   * - Exactly 10 digits starting with 6, 7, 8, 9
   */
  validateIndianPhone(phone) {
    if (!phone) {
      return { isValid: false, error: 'Mobile number is required.', cleanPhone: '' };
    }
    const cleanPhone = String(phone).replace(/\D/g, '');
    
    if (cleanPhone.length === 0) {
      return { isValid: false, error: 'Mobile number is required.', cleanPhone: '' };
    }
    if (!['6', '7', '8', '9'].includes(cleanPhone.charAt(0))) {
      return { isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9.', cleanPhone };
    }
    if (cleanPhone.length !== 10) {
      return { isValid: false, error: 'Mobile number must be exactly 10 digits.', cleanPhone };
    }
    
    return { isValid: true, error: '', cleanPhone };
  },

  /**
   * Validates RFC compliant email address and returns lowercase.
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email address is required.', cleanEmail: '' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailPattern.test(cleanEmail)) {
      return { isValid: false, error: 'Please enter a valid RFC-compliant email address.', cleanEmail };
    }
    return { isValid: true, error: '', cleanEmail };
  },

  /**
   * Validates website URL format and auto-prepends https:// if omitted.
   */
  validateUrl(url) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return { isValid: false, error: 'Website URL is required.', formattedUrl: '' };
    }
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const parsed = new URL(formattedUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { isValid: false, error: 'Please enter a valid website domain.', formattedUrl };
      }
      return { isValid: true, error: '', formattedUrl };
    } catch {
      return { isValid: false, error: 'Please enter a valid website URL.', formattedUrl };
    }
  },

  /**
   * Validates Business Stage enum.
   */
  validateStage(stage) {
    if (ALLOWED_STAGES.includes(stage)) {
      return { isValid: true, stage };
    }
    return { isValid: false, error: `Stage must be one of: ${ALLOWED_STAGES.join(', ')}`, stage: 'Growing' };
  }
};
