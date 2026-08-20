# ADDUS Data Integrity Audit Report

**Date:** 2026-08-11  
**Auditor:** Senior Full-Stack Architect & AI Reliability Engineer  
**Scope:** Customer → Backend → Admin + Customer data flow, AI evidence pipeline, recommendation integrity, persistence, and trustworthiness.

---

## A. SINGLE SOURCE OF TRUTH

**Status:** PARTIAL

**Evidence:**
- `backend/routes/aiRoutes.js` line 412: `/recommend` persists to vault via `updateBusinessVault(userId, { addiRecommendations: parsed })`
- `apps/admin/src/tabs/BusinessBrainTab.jsx` lines 106-110: Admin reads `profile.businessBrain.addiRecommendations` (localStorage) — NOT the backend vault
- `src/services/profileService.js` line 88: `businessBrain` stored in `USER_ACCOUNTS_DB` (localStorage)
- `ai/business-brain/vaultService.js` line 5: `const vaultStore = new Map()` — **in-memory only, lost on server restart**

**Risk:** HIGH

**Required fix:**
1. Backend vault must persist to a durable store (file-based JSON or database). Currently `Map()` is ephemeral.
2. Admin must read from the backend vault (`/api/admin/business-vault/:userId`), not localStorage.
3. Customer must sync profile.businessBrain to backend on every update.
4. Backend becomes the canonical source; localStorage becomes a cache.

---

## B. CUSTOMER → BACKEND

**Status:** PARTIAL

**Evidence:**
- `src/services/businessAnalysisService.js` line 170: `apiService.post('/analyze-website', ...)` — website analysis goes to backend ✅
- `src/services/businessAnalysisService.js` line 256: `apiService.post('/analyze-description', ...)` — text analysis goes to backend ✅
- `src/components/chat/ConversationalOnboarding.jsx` line 1053: `apiService.post('/recommend', payload)` — recommendations go to backend ✅
- `src/services/profileService.js` — **all profile data is localStorage-only** ❌
- `src/store/onboardingStore.js` line 104: `storage.set(storeKey, state)` — onboarding state is localStorage-only ❌
- `backend/routes/customerRoutes.js` lines 6-13: `/profile/:userId` and `/projects/:userId` return **empty stubs** ❌

**Risk:** CRITICAL

**Required fix:**
1. Implement real `POST /api/customer/profile` and `GET /api/customer/profile/:userId` endpoints.
2. Customer profile updates must sync to backend.
3. Onboarding state must be persisted to backend, not just localStorage.

---

## C. BACKEND → ADMIN

**Status:** PARTIAL

**Evidence:**
- `backend/routes/adminRoutes.js` line 20: `GET /business-brain/:userId` — exists but uses `BusinessBrainService.understanding.getBusinessProfile()` which reads from **localStorage** (frontend service imported into backend)
- `backend/routes/adminRoutes.js` line 26: `GET /business-vault/:userId` — exists but uses `BusinessBrainService.vault.getVault()` which is the **frontend vault service**, not the backend `ai/business-brain/vaultService.js`
- `apps/admin/src/tabs/BusinessBrainTab.jsx` line 106: Admin reads `profile.businessBrain.addiRecommendations` from localStorage directly

**Risk:** CRITICAL

**Required fix:**
1. Admin routes must read from the backend vault (`ai/business-brain/vaultService.js`), not the frontend service.
2. Admin BusinessBrainTab must fetch from `/api/admin/business-vault/:userId`.
3. Remove the import of `BusinessBrainService` (frontend) from backend routes.

---

## D. BACKEND → CUSTOMER

**Status:** FAIL

**Evidence:**
- `backend/routes/customerRoutes.js` line 6: `GET /profile/:userId` returns `{ success: true, userId }` — **no actual profile data**
- `backend/routes/customerRoutes.js` line 11: `GET /projects/:userId` returns `{ success: true, projects: [] }` — **empty stub**
- `src/services/profileService.js` — customer reads all data from localStorage
- No customer endpoint to fetch recommendations from backend

**Risk:** CRITICAL

**Required fix:**
1. Implement `GET /api/customer/profile/:userId` returning the full profile from backend vault.
2. Implement `GET /api/customer/projects/:userId` returning projects from backend.
3. Customer dashboard must fetch from backend, not just localStorage.

---

## E. SESSION / REFRESH PERSISTENCE

**Status:** PARTIAL

**Evidence:**
- `src/services/sessionManager.js` line 15: `getSession()` reads from `ACTIVE_AUTH_SESSION` (localStorage)
- `src/services/sessionManager.js` line 23: `isAuthenticated()` requires `session.userId && session.token`
- `src/store/onboardingStore.js` line 75: store key derived from session userId
- `src/store/onboardingStore.js` line 87: state loaded from localStorage keyed by userId
- **Refresh:** State persists in localStorage ✅
- **Logout/Login:** State persists in localStorage keyed by userId ✅
- **Cross-device:** State does NOT persist (localStorage is device-local) ❌

**Risk:** MEDIUM

**Required fix:**
1. Session should be validated against backend on app load.
2. Profile and businessBrain should be fetched from backend on login.
3. localStorage remains a cache, not the source of truth.

---

## F. CROSS-CUSTOMER DATA ISOLATION

**Status:** PARTIAL

**Evidence:**
- `src/store/onboardingStore.js` line 6: `getStoreKey(userId)` — state keyed by userId ✅
- `src/store/projectStore.js` line 303: `getProjectsKey(userId)` — projects keyed by userId ✅
- `src/services/profileService.js` line 54: `getProfileById(userId)` — profiles keyed by userId ✅
- `ai/business-brain/vaultService.js` line 71: `getBusinessVault(userId)` — vault keyed by userId ✅
- **Risk:** Backend vault is in-memory Map — if server restarts, all vault data is lost. No authentication on backend endpoints — anyone can call `/api/analyze-website` with any userId.

**Risk:** HIGH

**Required fix:**
1. Add authentication middleware to backend endpoints.
2. Validate that the requesting user's session matches the userId in the request.
3. Persist vault to durable storage.

---

## G. WEBSITE EVIDENCE PIPELINE

**Status:** PASS

**Evidence:**
- `backend/routes/websiteRetrievalService.js` line 356: `retrieveWebsiteEvidence(rawUrl)` — real HTTP fetch with timeout
- Line 27: `validateAndNormalizeUrl()` — URL validation
- Line 53: `fetchWithTimeout()` — 10s timeout, abort controller
- Line 129: `parseHtmlContent()` — extracts title, meta, headings, body text, links, contact info, social links
- Line 254: `buildEvidenceItems()` — builds evidence with `sourceType: 'VERIFIED_WEBSITE'`, `confidence`, `checkedAt`
- Line 428: `insufficientEvidence` check — requires ≥3 meaningful evidence items
- `backend/routes/aiRoutes.js` line 72: `/analyze-website` — passes actual evidence to AI, not just URL
- Line 204: Evidence persisted to vault via `updateBusinessVault(userId, { websiteEvidenceItems })`

**Risk:** LOW

**Required fix:** None — this pipeline is correctly implemented.

---

## H. INSUFFICIENT EVIDENCE HANDLING

**Status:** PASS

**Evidence:**
- `backend/routes/websiteRetrievalService.js` line 387: Returns `insufficientEvidence: true` when website unreachable
- Line 430: Returns `insufficientEvidence: true` when <3 meaningful evidence items
- `backend/routes/aiRoutes.js` line 96: Returns `requiresExpertReview: true` with `addiMessage` explaining insufficient evidence
- `ai/prompts/index.js` line 60: `NEEDS_REVIEW` status for insufficient evidence
- Line 61: "Do NOT guess. Do NOT assume. Do NOT fabricate."

**Risk:** LOW

**Required fix:** None — correctly implemented.

---

## I. AI HALLUCINATION RISK

**Status:** PARTIAL

**Evidence:**
- `ai/prompts/index.js` line 45: "SALES-BIAS PREVENTION" — good
- Line 49: "NEGATIVE RECOMMENDATIONS ARE VALID AND REQUIRED" — good
- Line 60: "NEEDS_REVIEW" escalation — good
- Line 79: "MVP KNOWLEDGE BASE (use ONLY when evidence is absent)" — **this is a risk**: the prompt allows using generic industry statistics when evidence is absent, which could lead to recommendations without specific business evidence
- `backend/routes/aiRoutes.js` line 113: System prompt says "Only use the provided evidence. Do not invent or assume anything not in the evidence." — good

**Risk:** MEDIUM

**Required fix:**
1. The "MVP KNOWLEDGE BASE" section should be removed or heavily restricted. Generic statistics should not be used to justify recommendations without business-specific evidence.
2. When evidence is insufficient, the AI should return `NEEDS_REVIEW` rather than using generic knowledge base.

---

## J. AI CONFIDENCE / CLAIM ACCURACY

**Status:** PARTIAL

**Evidence:**
- `ai/prompts/index.js` line 126: `"confidence": "high|medium|low"` — uses qualitative confidence ✅
- `backend/routes/aiRoutes.js` line 197: `aiConfidenceScore: 20` — fallback profile uses a hardcoded score
- `backend/routes/aiRoutes.js` line 225: `requiresExpertReview: (profile.aiConfidenceScore || 0) < 40` — threshold-based
- `ai/business-brain/vaultService.js` line 41: `calculateConfidenceScore()` — computes score from field completeness, not from AI confidence

**Risk:** MEDIUM

**Required fix:**
1. `aiConfidenceScore` from AI should be preserved, not overwritten by the vault's field-completeness score.
2. When AI doesn't provide a confidence score, use `NOT_AVAILABLE` rather than a fabricated number.
3. Distinguish between `VERIFIED_WEBSITE`, `AI_INFERRED`, `USER_PROVIDED`, `ADMIN_PROVIDED`, `SYSTEM_DERIVED`, `EXPERT_VERIFIED` source types.

---

## K. CONTRADICTORY DATA HANDLING

**Status:** NOT IMPLEMENTED

**Evidence:**
- No code detects conflicts between user-provided data and website evidence
- `backend/routes/aiRoutes.js` line 341: `fullContext` merges vault and context with `||` — silently prefers vault over context
- No `CONFLICT` status exists in the recommendation engine
- No source-priority logic is documented or implemented

**Risk:** HIGH

**Required fix:**
1. Implement conflict detection: if user says "no website" but website evidence exists, flag as `CONFLICT → NEEDS_REVIEW`.
2. Preserve source distinction for every field (user vs website vs admin).
3. Do not silently overwrite one source with another.

---

## L. WEBSITE FAILURE HANDLING

**Status:** PASS

**Evidence:**
- `backend/routes/websiteRetrievalService.js` line 387: Returns `success: false` with `reason` for HTTP errors, timeouts, non-HTML responses
- Line 111: Timeout handling with `AbortError`
- Line 76: HTTP error status captured
- `backend/routes/aiRoutes.js` line 96: Returns `requiresExpertReview: true` with `addiMessage` on failure
- No fabricated profile is returned on website failure ✅

**Risk:** LOW

**Required fix:** None — correctly implemented.

---

## M. RECOMMENDATION PERSISTENCE

**Status:** PARTIAL

**Evidence:**
- `backend/routes/aiRoutes.js` line 412: `updateBusinessVault(userId, { addiRecommendations: parsed })` — persisted to backend vault ✅
- `src/components/chat/ConversationalOnboarding.jsx` line 1071: `updateState({ fullRecommendationData: mergedData })` — stored in onboarding state (localStorage)
- Line 1076: `profileService.updateBusinessBrain(userId, { addiRecommendations: mergedData })` — stored in profile.businessBrain (localStorage)
- **Problem:** Backend vault is in-memory Map — lost on restart. Frontend localStorage persists but is device-local.

**Risk:** HIGH

**Required fix:**
1. Backend vault must persist to durable storage.
2. Customer and Admin must both read from the same backend-persisted recommendation.
3. Frontend should fetch recommendations from backend on load, not just from localStorage.

---

## N. RECOMMENDATION VERSIONING

**Status:** NOT IMPLEMENTED

**Evidence:**
- `backend/routes/aiRoutes.js` line 406: `parsed.generatedAt = new Date().toISOString()` — only timestamp, no version
- No `recommendationId`, `analysisVersion`, `modelVersion`, `evidenceVersion` fields
- No staleness detection when website evidence changes

**Risk:** MEDIUM

**Required fix:**
1. Add `recommendationId`, `analysisVersion`, `modelVersion`, `evidenceVersion` to recommendation metadata.
2. When website evidence changes significantly, mark recommendations as stale or regenerate.
3. Track evidence version to detect when recommendations are based on outdated evidence.

---

## O. ADMIN/CUSTOMER RECOMMENDATION CONSISTENCY

**Status:** PARTIAL

**Evidence:**
- `apps/admin/src/tabs/BusinessBrainTab.jsx` line 106: Admin reads `profile.businessBrain.addiRecommendations` — same localStorage record as customer ✅
- `apps/admin/src/tabs/BusinessBrainTab.jsx` line 104: Comment says "Do NOT call RecommendationEngine.generateRecommendations() here" ✅
- **Problem:** Both read from localStorage, not backend. If customer is on a different device, admin sees stale data.

**Risk:** HIGH

**Required fix:**
1. Admin must fetch recommendations from backend vault.
2. Customer must sync recommendations to backend.
3. Both must read the same canonical backend record.

---

## P. COMPETITOR INTELLIGENCE

**Status:** NOT IMPLEMENTED

**Evidence:**
- `ai/prompts/index.js` line 120: `"sourceType": "VERIFIED_WEBSITE|VAULT_ASSET|CUSTOMER_PROVIDED|INDUSTRY_RESEARCH|INFERENCE"` — source types exist in schema
- `backend/routes/aiRoutes.js` line 120: System prompt says "Do NOT guess competitors. Set competitors to an empty array." — competitors are explicitly excluded
- No competitor discovery, verification, or evidence pipeline exists
- No competitor data structure with `name`, `website`, `source`, `sourceUrl`, `whyIdentified`, `evidence`, `retrievedAt`, `confidence`, `verificationStatus`

**Risk:** MEDIUM

**Required fix:**
1. Design a future-ready competitor intelligence architecture.
2. Competitor discovery → candidate identification → source verification → evidence → analysis.
3. Clearly label competitors as `VERIFIED` vs `AI_INFERRED`.

---

## Q. SOURCE / EVIDENCE PROVENANCE

**Status:** PARTIAL

**Evidence:**
- `backend/routes/websiteRetrievalService.js` line 260: Evidence items have `source`, `sourceType: 'VERIFIED_WEBSITE'`, `confidence`, `checkedAt` ✅
- `ai/prompts/index.js` line 122: `sourceType` field in service assessments ✅
- `backend/routes/aiRoutes.js` line 113: System prompt requires evidence-based extraction ✅
- **Problem:** No `retrievedAt` on recommendation-level evidence. No `modelVersion` or `analysisVersion` on AI output.

**Risk:** MEDIUM

**Required fix:**
1. Add `retrievedAt` to all evidence items.
2. Add `modelVersion` and `analysisVersion` to AI-generated content.
3. Ensure source types are never silently mixed.

---

## R. AUDIT TRAIL

**Status:** PARTIAL

**Evidence:**
- `src/store/projectStore.js` line 419: `activityLog` on projects — tracks status changes ✅
- `src/store/projectStore.js` line 707: `updateProjectInStore()` builds activity entries ✅
- `src/components/operations/ActivityFeed.jsx` — displays activity log ✅
- **Problem:** No audit trail for profile/businessBrain changes. No audit trail for recommendation generation.

**Risk:** MEDIUM

**Required fix:**
1. Add audit logging for profile and businessBrain updates.
2. Log recommendation generation events with userId, timestamp, evidence version.
3. Log admin modifications to business data.

---

## S. ERROR / FALLBACK BEHAVIOUR

**Status:** PARTIAL

**Evidence:**
- `backend/routes/aiRoutes.js` line 80: Website retrieval errors return `requiresExpertReview: true` — no fabricated data ✅
- Line 184: AI analysis failure falls back to basic metadata from HTML — **acceptable** (uses real evidence)
- `src/services/businessAnalysisService.js` line 177: `formatProfileResponse(null, 'website', url)` — **RISK**: falls back to `extractDomainIntel()` which uses **keyword matching on URL** to infer business type
- `src/services/businessAnalysisService.js` line 42: `extractDomainIntel()` — infers industry from URL keywords (e.g., "money" → Fintech). This is **keyword-based inference presented as analysis**.

**Risk:** HIGH

**Required fix:**
1. `extractDomainIntel()` should be removed or clearly labeled as `AI_INFERRED` with low confidence.
2. When backend analysis fails, the frontend should not fabricate a business profile from URL keywords.
3. Return `NEEDS_REVIEW` instead of inferred profile.

---

## T. SECURITY / DATA ISOLATION

**Status:** FAIL

**Evidence:**
- `backend/routes/aiRoutes.js` — no authentication middleware on any endpoint
- `backend/routes/adminRoutes.js` line 6: Admin login is hardcoded credentials (`admin@addus.in` / `addus@admin2025`)
- `backend/routes/customerRoutes.js` — no auth on customer endpoints
- `ai/business-brain/vaultService.js` — vault accessible by any userId without auth
- `src/services/sessionManager.js` — session token is a simple timestamp-based string, no server-side validation

**Risk:** CRITICAL

**Required fix:**
1. Implement authentication middleware for all backend endpoints.
2. Validate session tokens server-side.
3. Replace hardcoded admin credentials with environment-based credentials.
4. Enforce user-scoped data access on all endpoints.

---

## SUMMARY TABLE

| Section | Status | Risk |
|---|---|---|
| A. Single Source of Truth | PARTIAL | HIGH |
| B. Customer → Backend | PARTIAL | CRITICAL |
| C. Backend → Admin | PARTIAL | CRITICAL |
| D. Backend → Customer | FAIL | CRITICAL |
| E. Session/Refresh Persistence | PARTIAL | MEDIUM |
| F. Cross-Customer Isolation | PARTIAL | HIGH |
| G. Website Evidence Pipeline | PASS | LOW |
| H. Insufficient Evidence Handling | PASS | LOW |
| I. AI Hallucination Risk | PARTIAL | MEDIUM |
| J. AI Confidence/Claim Accuracy | PARTIAL | MEDIUM |
| K. Contradictory Data Handling | NOT IMPLEMENTED | HIGH |
| L. Website Failure Handling | PASS | LOW |
| M. Recommendation Persistence | PARTIAL | HIGH |
| N. Recommendation Versioning | NOT IMPLEMENTED | MEDIUM |
| O. Admin/Customer Consistency | PARTIAL | HIGH |
| P. Competitor Intelligence | NOT IMPLEMENTED | MEDIUM |
| Q. Source/Evidence Provenance | PARTIAL | MEDIUM |
| R. Audit Trail | PARTIAL | MEDIUM |
| S. Error/Fallback Behaviour | PARTIAL | HIGH |
| T. Security/Data Isolation | FAIL | CRITICAL |

---

## ALREADY COMPLETED (from previous work)

1. ✅ **Website Evidence Pipeline** — Real HTTP retrieval with evidence items, source types, confidence, checkedAt
2. ✅ **Insufficient Evidence Handling** — `NEEDS_REVIEW` status, `requiresExpertReview: true`, no fabricated data
3. ✅ **AI Recommendation Engine** — Sales-bias prevention, negative recommendations, evidence priority
4. ✅ **Backend Recommendation Persistence** — `/recommend` persists to vault
5. ✅ **Admin/Customer Consistency** — Both read from same `addiRecommendations` record
6. ✅ **Mock Data Removal** — No Aura Skincare, Alex Rivera, ACA000101 in business brain services
7. ✅ **Evidence Provenance** — Evidence items have source, sourceType, confidence, checkedAt
8. ✅ **AI Confidence** — Uses `high|medium|low` qualitative confidence
9. ✅ **Website Failure Handling** — Graceful failure with `addiMessage`, no fabricated recommendations

## PENDING / REQUIRED FIXES (in dependency order)

1. **CRITICAL:** Backend vault persistence (in-memory Map → durable storage)
2. **CRITICAL:** Customer routes implementation (stubs → real endpoints)
3. **CRITICAL:** Admin routes to read from backend vault (not frontend service)
4. **CRITICAL:** Authentication middleware for all backend endpoints
5. **HIGH:** Remove `extractDomainIntel()` keyword-based inference from frontend fallback
6. **HIGH:** Contradictory data handling (user vs website evidence conflicts)
7. **HIGH:** Recommendation versioning (recommendationId, analysisVersion, modelVersion, evidenceVersion)
8. **HIGH:** Remove "MVP KNOWLEDGE BASE" from AI prompt (hallucination risk)
9. **MEDIUM:** Recommendation staleness detection
10. **MEDIUM:** Audit trail for profile/businessBrain changes
11. **MEDIUM:** Competitor intelligence architecture (future-ready design)
12. **MEDIUM:** CreatorIntelligenceService mock data removal (Alex Rivera, ₹35,000)
13. **MEDIUM:** CreatorScoreRepository hardcoded default scores
14. **LOW:** Session token server-side validation