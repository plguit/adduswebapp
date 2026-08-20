/**
 * ADDUS Platform — Creator Validation Schemas
 *
 * Strict validation for all creator fields.
 * Both frontend and backend validation use these rules.
 */

const NAME_REGEX = /^[a-zA-Z\s]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_REGEX = /^\d{6}$/;
const PINCODE_US_REGEX = /^\d{5}(-\d{4})?$/;
const CREATOR_ID_REGEX = /^ACRA\d{6}$/;

export const EXPERIENCE_RANGES = [
  { value: 'LESS_THAN_1', label: 'Less than 1 year' },
  { value: 'ONE_TO_TWO', label: '1-2 years' },
  { value: 'THREE_TO_EIGHT', label: '3-8 years' },
  { value: 'NINE_TO_FIFTEEN', label: '9-15 years' },
  { value: 'SIXTEEN_PLUS', label: '16+ years' }
];

export const EQUIPMENT_CATEGORIES = [
  { value: 'camera', label: 'Camera' },
  { value: 'lens', label: 'Lens' },
  { value: 'drone', label: 'Drone' },
  { value: 'gimbal', label: 'Gimbal / Stabiliser' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'audio', label: 'Audio' },
  { value: 'other', label: 'Other' }
];

export const AVAILABILITY_STATUSES = [
  'available', 'busy', 'leave', 'holiday', 'travelling', 'unavailable'
];

export const VERIFICATION_STATUSES = [
  'draft', 'submitted', 'under_review', 'approved', 'rejected'
];

export const DOCUMENT_TYPES = [
  { value: 'pan', label: 'PAN Card' },
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'passport', label: 'Passport' },
  { value: 'gst', label: 'GST Certificate' },
  { value: 'bank_details', label: 'Bank Details' },
  { value: 'cancelled_cheque', label: 'Cancelled Cheque' }
];

export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'Name must be 80 characters or less' };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Name must contain only alphabets and spaces' };
  }
  const normalized = trimmed.replace(/\s+/g, ' ').trim();
  return { valid: true, value: normalized };
}

export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length !== 10) {
    return { valid: false, error: 'Phone number must be exactly 10 digits' };
  }
  if (!PHONE_REGEX.test(digits)) {
    return { valid: false, error: 'Please enter a valid Indian mobile number' };
  }
  return { valid: true, value: digits };
}

export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true, value: trimmed };
}

export function validatePincode(pincode, country = 'India') {
  if (!pincode) {
    return { valid: false, error: 'Pincode is required' };
  }

  const digits = String(pincode).trim();

  if (country === 'India' || country === 'IN') {
    if (!PINCODE_REGEX.test(digits)) {
      return { valid: false, error: 'Indian pincode must be exactly 6 digits' };
    }
  } else if (country === 'United States' || country === 'US' || country === 'USA') {
    if (!PINCODE_US_REGEX.test(digits)) {
      return { valid: false, error: 'US zipcode must be 5 digits or 5+4 format' };
    }
  } else {
    if (!/^\d{4,10}$/.test(digits)) {
      return { valid: false, error: 'Pincode must be 4-10 digits for the selected country' };
    }
  }

  return { valid: true, value: digits };
}

export function validateLocation(country, state, district, city, pincode) {
  const errors = [];
  const result = {};

  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    errors.push('Country is required');
  } else {
    result.country = country.trim();
  }

  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    errors.push('State is required');
  } else {
    result.state = state.trim();
  }

  if (!district || typeof district !== 'string' || district.trim().length === 0) {
    errors.push('District is required');
  } else {
    result.district = district.trim();
  }

  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    errors.push('City is required');
  } else {
    result.city = city.trim();
  }

  const pinResult = validatePincode(pincode, country);
  if (!pinResult.valid) {
    errors.push(pinResult.error);
  } else {
    result.pincode = pinResult.value;
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, value: result };
}

export function validateCreatorId(creatorId) {
  if (!creatorId) {
    return { valid: false, error: 'Creator ID is required' };
  }
  const trimmed = String(creatorId).trim().toUpperCase();
  if (!CREATOR_ID_REGEX.test(trimmed)) {
    return { valid: false, error: 'Creator ID must be in format ACRA followed by 6 digits (e.g. ACRA000001)' };
  }
  return { valid: true, value: trimmed };
}

export function validateFullName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Full name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Full name is required' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'Full name must be 80 characters or less' };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Full name must contain only alphabets and spaces' };
  }
  const normalized = trimmed.replace(/\s+/g, ' ').trim();
  return { valid: true, value: normalized };
}

export function validateEquipmentItem(item) {
  if (!item || typeof item !== 'object') {
    return { valid: false, error: 'Equipment item is required' };
  }

  const errors = [];
  const result = {};

  if (!item.category || typeof item.category !== 'string') {
    errors.push('Category is required');
  } else {
    const catValid = EQUIPMENT_CATEGORIES.find(c => c.value === item.category);
    if (!catValid) {
      errors.push('Invalid equipment category');
    } else {
      result.category = item.category;
    }
  }

  if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
    errors.push('Equipment name is required');
  } else {
    result.name = item.name.trim();
  }

  if (item.brand && typeof item.brand === 'string') {
    result.brand = item.brand.trim();
  }

  if (item.model && typeof item.model === 'string') {
    result.model = item.model.trim();
  }

  if (item.type && typeof item.type === 'string') {
    result.type = item.type.trim();
  }

  if (item.category === 'other') {
    if (!item.otherDescription || typeof item.otherDescription !== 'string' || item.otherDescription.trim().length === 0) {
      errors.push('Description is required for "Other" equipment category');
    } else {
      result.otherDescription = item.otherDescription.trim();
    }
  }

  if (item.ownership) {
    if (!['owned', 'rent_required', 'shared'].includes(item.ownership)) {
      errors.push('Ownership must be owned, rent_required, or shared');
    } else {
      result.ownership = item.ownership;
    }
  }

  if (item.condition) {
    if (!['excellent', 'good', 'fair', 'needs_repair'].includes(item.condition)) {
      errors.push('Condition must be excellent, good, fair, or needs_repair');
    } else {
      result.condition = item.condition;
    }
  }

  if (item.notes && typeof item.notes === 'string') {
    result.notes = item.notes.trim();
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, value: result };
}

export function validateDocument(file) {
  if (!file || typeof file !== 'object') {
    return { valid: false, error: 'Document file is required' };
  }

  const errors = [];
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

  if (file.size && file.size > MAX_SIZE_BYTES) {
    errors.push(`File size must be under ${MAX_SIZE_MB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  if (file.name) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push(`File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push(`File MIME type not allowed: ${file.type}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true };
}

export function validateExperienceRange(range) {
  if (!range) {
    return { valid: false, error: 'Experience range is required' };
  }
  const valid = EXPERIENCE_RANGES.find(r => r.value === range);
  if (!valid) {
    return { valid: false, error: 'Invalid experience range selected' };
  }
  return { valid: true, value: range };
}

export function validateEquipmentItems(items) {
  if (!Array.isArray(items)) {
    return { valid: true, value: [] };
  }

  const validated = [];
  for (const item of items) {
    if (!item.category) {
      continue;
    }
    const catValid = EQUIPMENT_CATEGORIES.find(c => c.value === item.category);
    if (!catValid) {
      continue;
    }

    const equipmentItem = {
      category: item.category,
      name: (item.name || '').trim(),
      brand: (item.brand || '').trim(),
      model: (item.model || '').trim(),
      ownership: item.ownership || 'owned',
      condition: item.condition || 'good',
      notes: (item.notes || '').trim()
    };

    if (item.category === 'other' && !item.otherDescription) {
      continue;
    }
    if (item.category === 'other') {
      equipmentItem.otherDescription = item.otherDescription.trim();
    }

    if (equipmentItem.name || equipmentItem.brand) {
      validated.push(equipmentItem);
    }
  }

  return { valid: true, value: validated };
}

export function validateSoftwareSelections(selections) {
  if (!Array.isArray(selections)) {
    return { valid: true, value: [] };
  }

  const validated = [];
  for (const sel of selections) {
    if (typeof sel === 'string' && sel.trim()) {
      validated.push(sel.trim());
    } else if (typeof sel === 'object' && sel.name) {
      validated.push(sel.name.trim());
    }
  }

  return { valid: true, value: [...new Set(validated)] };
}

export function validateSpecializationSelections(selections) {
  return validateSoftwareSelections(selections);
}

export function validateDocumentType(docType) {
  if (!docType) {
    return { valid: false, error: 'Document type is required' };
  }
  const valid = DOCUMENT_TYPES.find(d => d.value === docType);
  if (!valid) {
    return { valid: false, error: 'Invalid document type' };
  }
  return { valid: true, value: docType };
}

export function validateFileUpload(file, allowedTypes, maxSizeMB = 10) {
  const errors = [];

  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size must be under ${maxSizeMB}MB`);
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type || '';
    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = allowedTypes.map(t => t.replace('image/', '').replace('application/', ''));

    const typeMatch = allowedTypes.some(t => fileType.startsWith(t));
    const extMatch = allowedExtensions.includes(extension);

    if (!typeMatch && !extMatch) {
      errors.push(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }
  return { valid: true };
}

export function validateCreatorRegistration(data) {
  const errors = {};

  const nameResult = validateName(data.name);
  if (!nameResult.valid) errors.name = nameResult.error;

  if (data.phone) {
    const phoneResult = validatePhone(data.phone);
    if (!phoneResult.valid) errors.phone = phoneResult.error;
  }

  if (data.email) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) errors.email = emailResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

export function validateCreatorProfileUpdate(data) {
  const errors = {};

  if (data.name !== undefined) {
    const nameResult = validateName(data.name);
    if (!nameResult.valid) errors.name = nameResult.error;
  }

  if (data.phone !== undefined && data.phone !== null) {
    const phoneResult = validatePhone(data.phone);
    if (!phoneResult.valid) errors.phone = phoneResult.error;
  }

  if (data.email !== undefined && data.email !== null) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) errors.email = emailResult.error;
  }

  if (data.location) {
    const locResult = validateLocation(data.location);
    if (!locResult.valid) errors.location = locResult.error;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
