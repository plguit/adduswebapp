/**
 * Deterministic Duplicate Business Detector & Similarity Calculator for ADDUS MVP
 * Rule-based, credit-saver (0 AI calls), fast domain & name matching.
 */

// Helper 1: Extract normalized domain from URL or Email
export function extractDomain(inputStr) {
  if (!inputStr) return '';
  let str = inputStr.trim().toLowerCase();
  
  // Handle email addresses
  if (str.includes('@')) {
    str = str.split('@').pop();
  }

  // Handle URLs
  str = str.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  str = str.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  return str;
}

// Helper 2: Normalize business name for strict comparison
export function normalizeBusinessName(name) {
  if (!name) return '';
  let clean = name.trim().toLowerCase();
  // Remove common corporate suffixes
  clean = clean.replace(/\b(pvt|private|ltd|limited|inc|incorporated|llc|corp|corporation|co|company|group|solutions|services|tech|technologies)\b/g, '');
  // Remove punctuation and extra whitespace
  clean = clean.replace(/[^a-z0-9]/g, '');
  return clean;
}

// Helper 3: Dice's Coefficient Bigram Similarity (0.0 to 1.0)
export function calculateSimilarity(str1, str2) {
  const s1 = normalizeBusinessName(str1);
  const s2 = normalizeBusinessName(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2 || s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);
  let intersection = 0;

  bg1.forEach((gram) => {
    if (bg2.has(gram)) intersection++;
  });

  return (2.0 * intersection) / (bg1.size + bg2.size);
}

// Default pre-loaded or stored businesses in system for comparison
const STORED_BUSINESSES = [
  { id: 'biz_ace', businessName: 'Ace Money', domain: 'acemoney.in', emailDomain: 'acemoney.in' },
  { id: 'biz_addus', businessName: 'Addus Media', domain: 'addus.in', emailDomain: 'addus.in' },
  { id: 'biz_nike', businessName: 'Nike Retail', domain: 'nike.com', emailDomain: 'nike.com' }
];

/**
 * Checks new onboarding business profile against existing businesses.
 * Returns match status object or null.
 */
export function checkDuplicateBusiness(newProfile, existingVaults = []) {
  if (!newProfile) return null;

  // 1. Normalization
  const cleanNewPhone = (newProfile.phoneNumber || newProfile.phone || '').replace(/\D/g, '');
  const cleanNewEmail = (newProfile.email || '').trim().toLowerCase();
  const newUrlDomain = extractDomain(newProfile.website || newProfile.url || '');
  const newEmailDomain = extractDomain(newProfile.email || '');
  const newName = newProfile.businessName || '';
  const normNewName = normalizeBusinessName(newName);

  const allBusinesses = [...STORED_BUSINESSES, ...existingVaults];

  for (const biz of allBusinesses) {
    const cleanBizPhone = (biz.phoneNumber || biz.phone || '').replace(/\D/g, '');
    const cleanBizEmail = (biz.email || '').trim().toLowerCase();
    const bizDomain = extractDomain(biz.domain || biz.website || '');
    const bizEmailDomain = extractDomain(biz.emailDomain || biz.email || '');
    const bizName = biz.businessName || biz.name || '';
    const normBizName = normalizeBusinessName(bizName);

    // Skip self-comparison if they share the exact user identifier
    if (newProfile.userId && biz.userId && newProfile.userId === biz.userId) {
      continue;
    }

    // 2. High Confidence Matches
    // Exact Mobile Match
    if (cleanNewPhone && cleanBizPhone && cleanNewPhone === cleanBizPhone) {
      return {
        confidence: 'HIGH',
        matchType: 'EXACT_PHONE',
        message: 'This mobile number is already linked to an existing business account.',
        existingBusiness: biz
      };
    }

    // Exact Email Match
    if (cleanNewEmail && cleanBizEmail && cleanNewEmail === cleanBizEmail) {
      return {
        confidence: 'HIGH',
        matchType: 'EXACT_EMAIL',
        message: 'This email address is already linked to an existing business account.',
        existingBusiness: biz
      };
    }

    // Exact website domain match
    if (newUrlDomain && bizDomain && newUrlDomain === bizDomain) {
      return {
        confidence: 'HIGH',
        matchType: 'EXACT_URL',
        message: `An account already exists with website domain "${newUrlDomain}".`,
        existingBusiness: biz
      };
    }

    // 3. Medium/High Confidence Matches
    // Only perform name-based matching when the new business name is meaningful
    if (normNewName && normNewName.length >= 2) {
      const isStrictNameMatch = normNewName === normBizName;
      const similarity = calculateSimilarity(newName, bizName);
      const isStrongNameMatch = similarity >= 0.88;

      // Matching Name + Website/Email Domain
      if ((isStrictNameMatch || isStrongNameMatch) && 
          ((newUrlDomain && bizDomain && newUrlDomain === bizDomain) || 
           (newEmailDomain && bizEmailDomain && bizEmailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(newEmailDomain)))) {
        return {
          confidence: 'MEDIUM_HIGH',
          matchType: 'NAME_AND_DOMAIN',
          message: `We found an existing account named "${bizName}" sharing domain details.`,
          existingBusiness: biz
        };
      }

      // 4. Soft matches (approx. 90%+ similarity on name only)
      if (isStrongNameMatch) {
        return {
          confidence: 'SOFT',
          matchType: 'FUZZY_SIMILARITY',
          message: `We found a business with a very similar name ("${bizName}"). Is this your company?`,
          existingBusiness: biz,
          similarityScore: Math.round(similarity * 100)
        };
      }
    }
  }

  return null;
}
