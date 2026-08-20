// Helper: Gibberish and Low-Information Text Detector
export function isGibberishText(str) {
  if (!str) return true;
  const trimmed = str.trim();
  
  // 1. Repeated character patterns e.g. aaaaaaaaaaaa, eeeeeeeeeeee, 11111111111
  if (/(.)\1{4,}/i.test(trimmed)) return true;

  // 2. Pure digits or digit-dominated strings for names/descriptions
  const cleanDigits = trimmed.replace(/\D/g, '');
  if (cleanDigits.length >= 5 && cleanDigits.length / trimmed.length > 0.4) return true;

  // 3. Consonant-heavy / zero-vowel gibberish (e.g., jddbccdcshjg, g23545ythsbgfdd4365)
  const lettersOnly = trimmed.toLowerCase().replace(/[^a-z]/g, '');
  if (lettersOnly.length >= 6) {
    const vowels = (lettersOnly.match(/[aeiouy]/g) || []).length;
    if (vowels / lettersOnly.length < 0.12) return true;
  }

  return false;
}

// 1. Phone Validation
export function validatePhone(phone) {
  if (!phone) return { isValid: false, message: 'Mobile number is required.' };
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 10) {
    return { isValid: false, message: 'Please enter a valid 10-digit mobile number.' };
  }
  if (!['6', '7', '8', '9'].includes(clean.charAt(0))) {
    return { isValid: false, message: 'Mobile number must start with 6, 7, 8, or 9.' };
  }
  // Reject repeated single digits e.g. 9999999999, 0000000000
  if (/^(.)\1{9}$/.test(clean)) {
    return { isValid: false, message: 'Please enter a valid mobile number, not repeated digits.' };
  }
  return { isValid: true, clean };
}

// 2. Email Validation
export function validateEmail(email) {
  if (!email || !email.trim()) return { isValid: false, message: 'Email address is required.' };
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true, email: trimmed };
}

// 3. OTP Verification
const ALLOWED_TEST_OTPS = ['1234', '5678'];

export function validateOTP(otp, attempts = 0) {
  if (!otp || !otp.trim()) {
    return { isValid: false, message: 'Please enter the 4-digit verification code.' };
  }
  const cleanOtp = otp.trim();
  if (!/^\d{4}$/.test(cleanOtp)) {
    return { isValid: false, message: 'Verification code must be exactly 4 digits.' };
  }
  if (attempts >= 3) {
    return { isValid: false, message: 'Maximum verification attempts exceeded. Please request a new code.', blocked: true };
  }
  if (!ALLOWED_TEST_OTPS.includes(cleanOtp)) {
    return { isValid: false, message: `Invalid verification code. (Attempt ${attempts + 1}/3). Use test code 1234.` };
  }
  return { isValid: true };
}

// 4. Name Validation
export function validateName(name) {
  if (!name || !name.trim()) return { isValid: false, message: 'Your name is required.' };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { isValid: false, message: 'Name must be at least 2 characters.' };
  if (trimmed.length > 50) return { isValid: false, message: 'Name must not exceed 50 characters.' };

  if (isGibberishText(trimmed)) {
    return { isValid: false, message: 'Please enter a valid name, not repeated or keyboard characters.' };
  }

  // Must contain alphabetic characters
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < 2) {
    return { isValid: false, message: 'Name must contain valid letters.' };
  }
  // Valid pattern: letters, spaces, hyphens, apostrophes, periods
  if (!/^[a-zA-Z\s'\-.]+$/.test(trimmed)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods.' };
  }
  return { isValid: true, name: trimmed };
}

// 5. Business Name Validation
export function validateBusinessName(name) {
  if (!name || !name.trim()) return { isValid: false, message: 'Business name is required.' };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { isValid: false, message: 'Business name must be at least 2 characters.' };
  if (trimmed.length > 80) return { isValid: false, message: 'Business name must not exceed 80 characters.' };

  if (isGibberishText(trimmed)) {
    return { isValid: false, message: 'Please enter a meaningful business name.' };
  }

  // Must contain at least 2 alphabetic characters
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < 2) {
    return { isValid: false, message: 'Business name must contain alphabetic characters.' };
  }
  // Allow letters, numbers, spaces, &, ., -, ', @, +, /
  if (!/^[a-zA-Z0-9\s&.\-'@+/]+$/.test(trimmed)) {
    return { isValid: false, message: 'Business name contains invalid special characters.' };
  }
  return { isValid: true, name: trimmed };
}

// 6. Industry & Segment Validation
export function validateIndustryOrSegment(value, fieldLabel = 'Field') {
  if (!value || !value.trim()) return { isValid: false, message: `${fieldLabel} is required.` };
  const trimmed = value.trim();
  if (trimmed.length < 2) return { isValid: false, message: `${fieldLabel} must be at least 2 characters.` };
  if (isGibberishText(trimmed)) return { isValid: false, message: `Please enter a valid ${fieldLabel.toLowerCase()}.` };
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < 2) return { isValid: false, message: `${fieldLabel} must contain alphabetic text.` };
  return { isValid: true, value: trimmed };
}

// 7. Business Description Validation
export function validateBusinessDescription(description) {
  if (!description || !description.trim()) {
    return { isValid: false, message: 'Business description is required.' };
  }
  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { isValid: false, message: 'Business description must be at least 10 characters long.' };
  }
  if (trimmed.length > 1500) {
    return { isValid: false, message: 'Business description must not exceed 1500 characters.' };
  }

  if (isGibberishText(trimmed)) {
    return { isValid: false, message: 'Description contains invalid or repeated character patterns. Please describe your business.' };
  }

  // Alphabetic character ratio check
  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letters / trimmed.length < 0.35) {
    return { isValid: false, message: 'Description must contain meaningful text.' };
  }

  // Word count check (at least 2 words or 10 meaningful chars)
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2 && trimmed.length < 15) {
    return { isValid: false, message: 'Please provide a more detailed business summary (at least 2 words).' };
  }

  return { isValid: true, description: trimmed };
}

// 8. URL Validation
export function validateURL(urlStr) {
  if (!urlStr || !urlStr.trim()) return { isValid: false, message: 'URL is required.' };
  let trimmed = urlStr.trim();

  // Reject basic nonsense strings like "aaaaaaaa", "abc", "hello world", "123456"
  if (trimmed.includes(' ') || isGibberishText(trimmed)) {
    return { isValid: false, message: 'Please enter a valid website URL (e.g. https://company.com or example.com).' };
  }

  let testUrl = trimmed;
  if (!/^https?:\/\//i.test(testUrl)) {
    testUrl = 'https://' + testUrl;
  }

  try {
    const parsed = new URL(testUrl);
    const host = parsed.hostname;
    // Host must have at least one dot (e.g., example.com)
    if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) {
      return { isValid: false, message: 'Please enter a valid website domain (e.g. example.com or https://company.com).' };
    }
    const tld = host.split('.').pop();
    if (!tld || tld.length < 2 || /\d/.test(tld)) {
      return { isValid: false, message: 'URL domain TLD is invalid.' };
    }
    return { isValid: true, normalizedUrl: testUrl };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL (e.g. https://yourwebsite.com).' };
  }
}

// 9. Custom Input / Other Validation
export function validateCustomInput(text, label = 'Custom input') {
  if (!text || !text.trim()) return { isValid: false, message: `${label} cannot be empty.` };
  const trimmed = text.trim();
  if (trimmed.length < 2) return { isValid: false, message: `${label} must be at least 2 characters.` };
  if (isGibberishText(trimmed)) return { isValid: false, message: `Please enter valid ${label.toLowerCase()} text.` };
  const alphaCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphaCount < 2) return { isValid: false, message: `${label} contains invalid characters.` };
  return { isValid: true, value: trimmed };
}
