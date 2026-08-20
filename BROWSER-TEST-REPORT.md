# ADDUS Website Analysis — 10-Brand Test Report

**Date:** 2026-08-15  
**Backend:** Port 3000  
**Test Method:** Direct `/api/analyze-website` endpoint calls

## Summary

| # | URL | Result | Profile Returned | Time |
|---|-----|--------|-----------------|------|
| 1 | https://www.36palms.com/ | ✅ LIKELY_BUSINESS_WEBSITE | businessName, industry, services, location | 3.4s |
| 2 | https://sealagoonhealthresort.com/ | ✅ LIKELY_BUSINESS_WEBSITE | businessName, industry, services | 1.1s |
| 3 | https://amazon.in/ | ❌ ACCESS_BLOCKED | No profile (bot protection) | 2.0s |
| 4 | https://www.olx.com/ | ❌ RETRIEVAL_FAILED | No profile (timeout) | 24.2s |
| 5 | https://example.com/ | ❌ INSUFFICIENT_EVIDENCE | No profile (placeholder site) | 1.0s |
| 6 | https://manoramaonline.com/ | ✅ LIKELY_BUSINESS_WEBSITE | businessName, industry, services, location | 5.5s |
| 7 | https://www.flipkart.com/ | ✅ LIKELY_BUSINESS_WEBSITE | businessName, industry, services | 5.0s |
| 8 | https://www.zomato.com/ | ❌ TIMEOUT | No profile | 30.0s |
| 9 | https://www.swiggy.com/ | ❌ RATE_LIMITED | No profile | 1.5s |
| 10 | https://www.airbnb.com/ | ✅ LIKELY_BUSINESS_WEBSITE | businessName, industry, services | 3.9s |

**Success Rate:** 4/10 (40%) return full business profiles  
**Expected Failures:** 5/10 are protected/timeout sites (amazon, olx, zomato, swiggy, example)  
**Previously Broken, Now Fixed:** manoramaonline.com, flipkart.com, airbnb.com

## Root Cause of manoramaonline.com Failure

**File:** `backend/routes/websiteRetrievalService.js:1208-1212`

The `evaluateEvidenceSufficiency` function required ALL THREE evidence types:
- `identity`
- `business_description`  
- `contact`

Manoramaonline.com had identity and business_description evidence (8 items total) but NO contact info on the homepage. This caused the sufficiency check to fail, returning `INSUFFICIENT_EVIDENCE` and preventing the AI from analyzing the website.

## Fix Applied

Changed required evidence types from:
```javascript
['identity', 'business_description', 'contact']
```
to:
```javascript
['identity', 'business_description']
```

Contact info is now optional, which reflects real-world website behavior where contact details are often on separate pages.

## Files Modified

| File | Change |
|------|--------|
| `backend/routes/websiteRetrievalService.js:1208-1212` | Removed `contact` from required evidence types |
| `backend/routes/websiteRetrievalService.js:1358-1362` | Same fix in main retrieval flow |

## Verification

- **333 tests pass, 0 fail**
- Manoramaonline.com now returns full profile with business name, industry, and services
- 36palms.com, sealagoonhealthresort.com, flipkart.com, airbnb.com all return complete profiles

## Remaining Limitations

| Limitation | Detail |
|------------|--------|
| **Bot-protected sites** | amazon.in, swiggy.com, zomato.com block automated requests. This is expected behavior. |
| **Timeout sites** | olx.com, zomato.com exceed the 10-second fetch deadline. Retry logic exists but final attempt still times out. |
| **Industry classification** | manoramaonline.com classified as "Hospitality" instead of "News/Media". The industry classifier in `aiRoutes.js` uses keyword matching and needs improvement for media/news sites. |
| **Placeholder sites** | example.com correctly returns INSUFFICIENT_EVIDENCE as it has no real business content. |
