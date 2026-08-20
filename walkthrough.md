# ADDUS Data Integrity Walkthrough & Verification

**Date:** 2026-08-11  
**Status:** VERIFICATION AUDIT — Phase 1-12

---

## PHASE 1 — CUSTOMER / ADMIN DATA PERSISTENCE TABLE

| DATA OBJECT | CUSTOMER WRITE | BACKEND PERSISTENCE | LOCAL CACHE | CUSTOMER READ | ADMIN READ | SURVIVES REFRESH | SURVIVES LOGIN | SOURCE OF TRUTH | STATUS |
|---|---|---|---|---|---|---|---|---|---|
| Business Profile | `profileService.saveProfile()` → localStorage `USER_ACCOUNTS_DB` | ❌ No backend endpoint | ✅ localStorage | ✅ `getProfileById()` | ✅ `getAllProfiles()` (localStorage) | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Business Understanding | `updateState()` → onboardingStore → localStorage | ❌ No backend endpoint | ✅ localStorage `ONBOARDING_STATE_*` | ✅ from store | ❌ Not visible | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Business Vault | `updateBusinessVault()` → backend in-memory Map | ⚠️ Backend `Map()` — lost on restart | ✅ localStorage via profile | ✅ from profile | ⚠️ From frontend service (wrong source) | ✅ | ✅ (same device) | **DUAL — DIVERGENT** | **PARTIAL** |
| Website URL | `updateState({ businessProfile })` → localStorage | ⚠️ `/analyze-website` stores in vault Map | ✅ localStorage | ✅ | ⚠️ From frontend service | ✅ | ✅ (same device) | **LOCAL + EPHEMERAL** | **PARTIAL** |
| Website Evidence | Backend `/analyze-website` → vault Map | ⚠️ In-memory Map only | ✅ localStorage via profile | ✅ | ⚠️ From frontend service | ✅ | ✅ (same device) | **LOCAL + EPHEMERAL** | **PARTIAL** |
| AI Recommendations | `profileService.updateBusinessBrain()` → localStorage | ⚠️ `/recommend` → vault Map | ✅ localStorage | ✅ | ✅ Same localStorage record | ✅ | ✅ (same device) | **LOCAL + EPHEMERAL** | **PARTIAL** |
| Service Assessments | Part of recommendations | ⚠️ Same as above | ✅ | ✅ | ✅ | ✅ | ✅ | **LOCAL + EPHEMERAL** | **PARTIAL** |
| Projects | `createDraftProject()` → localStorage `PROJECTS_STORE_*` | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ `getAllProjectsAcrossUsers()` | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Quotations | `updateProjectInStore()` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Payments | `paymentService` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Assets | `profileService.saveProfile()` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Schedules | `updateState({ scheduleRequests })` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Conversations | `profileService.saveProfile()` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |
| Notifications | `UniversalNotificationEngine` → localStorage | ❌ No backend endpoint | ✅ localStorage | ✅ | ✅ | ✅ | ✅ (same device) | **LOCAL ONLY** | **FAIL** |

**KEY FINDING:** All business-critical data is **LOCAL ONLY** (localStorage). Backend vault is in-memory `Map()` that is lost on server restart. No customer data survives to a different device/browser.

---

## PHASE 2 — RECOMMENDATION PERSISTENCE TRACE

**Flow:**
1. `/recommend` called → `backend/routes/aiRoutes.js` line 327
2. AI generates result → line 386-403
3. `updateBusinessVault(userId, { addiRecommendations: parsed })` → line 412 → **in-memory Map**
4. Response returned to frontend → line 417
5. `ConversationalOnboarding.jsx` line 1071: `updateState({ fullRecommendationData: mergedData })` → localStorage
6. Line 1076: `profileService.updateBusinessBrain(userId, { addiRecommendations: mergedData })` → localStorage `USER_ACCOUNTS_DB`
7. Admin `BusinessBrainTab.jsx` line 106: reads `profile.businessBrain.addiRecommendations` → **same localStorage record** ✅
8. Customer `ExpertSuggestionsSection` reads `brain.addiRecommendations` → **same localStorage record** ✅

**VERDICT:** Customer and Admin see the same recommendation **on the same device**. But:
- Backend vault is ephemeral (in-memory Map)
- No cross-device persistence
- No server-side canonical record survives restart

**REQUIRED FIX:** Persist vault to a JSON file on disk (no new DB dependency needed).

---

## PHASE 3 — INSUFFICIENT EVIDENCE → EXPERT

**Status:** ✅ IMPLEMENTED

**Evidence:**
- `ai/prompts/index.js` line 60: `NEEDS_REVIEW` status defined
- Line 61: "Do NOT guess. Do NOT assume. Do NOT fabricate."
- `backend/routes/aiRoutes.js` line 96: `requiresExpertReview: true` when website insufficient
- `backend/routes/aiRoutes.js` line 104: `addiMessage` explains insufficient evidence
- `apps/admin/src/tabs/BusinessBrainTab.jsx` line 21: `NEEDS_REVIEW` status config with `AlertTriangle` icon
- `shared/components/widgets/ExpertSuggestionsSection.jsx`: Displays `NEEDS_REVIEW` with "Expert Review Required" label

**VERDICT:** PASS — NEEDS_REVIEW is properly implemented and displayed.

---

## PHASE 4 — REAL COMPETITOR INTELLIGENCE

**Status:** NOT IMPLEMENTED

**Evidence:**
- `backend/routes/aiRoutes.js` line 120: System prompt says "Do NOT guess competitors. Set competitors to an empty array."
- No competitor discovery, verification, or evidence pipeline exists
- No competitor data structure with `name`, `website`, `source`, `sourceUrl`, `whyIdentified`, `evidence`, `retrievedAt`, `confidence`, `verificationStatus`

**VERDICT:** FAIL — Real competitor intelligence is not implemented. The system correctly avoids fabricating competitors, but no competitor research capability exists.

**REQUIRED FIX:** Design future-ready architecture with `VERIFIED` vs `AI_INFERRED` labeling.

---

## PHASE 5 — NO FABRICATED CONFIDENCE

**Status:** PARTIAL

**Evidence:**
- `ai/prompts/index.js` line 126: Uses `"confidence": "high|medium|low"` — qualitative ✅
- `backend/routes/aiRoutes.js` line 197: `aiConfidenceScore: 20` — hardcoded fallback ⚠️
- `ai/business-brain/vaultService.js` line 41: `calculateConfidenceScore()` — computes from field completeness, not AI confidence ⚠️
- `src/services/brain/CreatorIntelligenceService.js`: Hardcoded scores like `CPS_Score: 95` ⚠️
- `database/repositories/index.js` line 72: `cisScore: 94, cpsScore: 96` — hardcoded defaults ⚠️

**VERDICT:** PARTIAL — Qualitative confidence is used correctly in AI prompts, but hardcoded numerical scores exist in creator intelligence and fallback paths.

**REQUIRED FIX:**
1. Replace hardcoded creator scores with `NOT_AVAILABLE` or evidence-based scores
2. Remove hardcoded `aiConfidenceScore: 20` fallback
3. Use `HIGH EVIDENCE` / `MEDIUM EVIDENCE` / `LOW EVIDENCE` / `INSUFFICIENT EVIDENCE` instead of fabricated numbers

---

## PHASE 6 — WEBSITE INTELLIGENCE ADVERSARIAL TESTING

**Status:** ✅ IMPLEMENTED (backend)

**Evidence from `backend/routes/websiteRetrievalService.js`:**
- Line 27: URL validation — invalid URLs rejected ✅
- Line 53: `fetchWithTimeout()` — 10s timeout with AbortController ✅
- Line 76: HTTP error status captured (404, 500, etc.) ✅
- Line 88: Non-HTML response detection ✅
- Line 111: Timeout handling with `AbortError` ✅
- Line 387: Returns `success: false` with `reason` on failure ✅
- Line 428: `insufficientEvidence` check — requires ≥3 meaningful evidence items ✅
- Line 430: Returns `insufficientEvidence: true` when insufficient ✅

**Test Matrix Results (from code analysis):**

| Test | Expected | Actual Behavior | Status |
|---|---|---|---|
| A. Valid business website | Evidence extracted | ✅ Real HTTP fetch + parse + evidence | PASS |
| B. Invalid URL | Retrieval failure | ✅ `validateAndNormalizeUrl()` rejects | PASS |
| C. Website timeout | Graceful failure | ✅ `AbortError` → `success: false` | PASS |
| D. Website returns 404 | Graceful failure | ✅ `httpStatus: 404` → `success: false` | PASS |
| E. Website blocks request | Graceful failure | ✅ Non-HTML or error → `success: false` | PASS |
| F. Empty HTML | Insufficient evidence | ✅ `<3 evidence items` → `insufficientEvidence: true` | PASS |
| G. Almost no business info | Insufficient evidence | ✅ Same as above | PASS |
| H. Only contact info | Insufficient evidence | ✅ Contact info alone < 3 evidence items | PASS |
| I. Services ADDUS provides | Evidence-based recs | ✅ Evidence passed to AI recommendation engine | PASS |
| J. Already has professional website | ALREADY_SUFFICIENT | ✅ Prompt supports negative recommendations | PASS |
| K. Contradictory info | NEEDS_REVIEW | ⚠️ No explicit conflict detection | PARTIAL |

**VERDICT:** PASS for most cases. Contradictory data handling needs improvement.

---

## PHASE 7 — SMART NEGATIVE RECOMMENDATIONS

**Status:** ✅ IMPLEMENTED

**Evidence from `ai/prompts/index.js`:**
- Line 49: "NEGATIVE RECOMMENDATIONS ARE VALID AND REQUIRED"
- Line 50: "If evidence shows a website is already functional → status: NOT_CURRENTLY_SUGGESTED"
- Line 51: "If photography assets exist and are recent → status: ALREADY_SUFFICIENT"
- Line 52: "If branding is consistent → status: NOT_CURRENTLY_SUGGESTED"
- Line 53: "You MUST produce these negative assessments. Omitting them is an error."

**VERDICT:** PASS — The prompt explicitly requires negative recommendations based on evidence.

---

## PHASE 8 — CROSS-CUSTOMER DATA ISOLATION

**Status:** PARTIAL

**Evidence:**
- `src/store/onboardingStore.js` line 6: `getStoreKey(userId)` — state keyed by userId ✅
- `src/store/projectStore.js` line 303: `getProjectsKey(userId)` — projects keyed by userId ✅
- `src/services/profileService.js` line 54: `getProfileById(userId)` — profiles keyed by userId ✅
- `ai/business-brain/vaultService.js` line 71: `getBusinessVault(userId)` — vault keyed by userId ✅
- **RISK:** No authentication on backend endpoints — anyone can call `/api/analyze-website` with any userId
- **RISK:** Backend vault is in-memory Map — no isolation enforcement

**VERDICT:** PARTIAL — Frontend isolation is correct (keyed by userId). Backend has no auth enforcement.

---

## PHASE 9 — ADMIN DATA ACCURACY

**Status:** PARTIAL

**Evidence:**
- `apps/admin/src/tabs/BusinessBrainTab.jsx` line 106: Reads `profile.businessBrain.addiRecommendations` — real customer data ✅
- `src/services/brain/CreatorIntelligenceService.js`: Contains hardcoded creator data (Alex Rivera, ₹35,000) ⚠️
- `database/repositories/index.js` line 72: Hardcoded creator scores ⚠️
- `backend/routes/adminRoutes.js` line 6: Hardcoded admin credentials ⚠️

**VERDICT:** PARTIAL — Customer data in BusinessBrainTab is real. Creator intelligence contains mock/seed data.

---

## PHASE 10 — AUDIT TRAIL

**Status:** PARTIAL

**Evidence:**
- `src/store/projectStore.js` line 419: `activityLog` on projects ✅
- `src/store/projectStore.js` line 707: `updateProjectInStore()` builds activity entries ✅
- **MISSING:** No audit trail for profile/businessBrain changes
- **MISSING:** No audit trail for recommendation generation
- **MISSING:** No audit trail for admin modifications

**VERDICT:** PARTIAL — Project audit trail exists. Profile/recommendation audit trail missing.

---

## PHASE 11 — FAILURE SAFETY

**Status:** ✅ IMPLEMENTED

**Evidence:**
- `backend/routes/aiRoutes.js` line 80: Website retrieval errors → `requiresExpertReview: true` — no fabricated data ✅
- Line 96: Insufficient evidence → `requiresExpertReview: true` with `addiMessage` ✅
- Line 184: AI analysis failure → falls back to basic HTML metadata (real evidence) ✅
- `src/services/businessAnalysisService.js` line 177: **RISK** — falls back to `extractDomainIntel()` which uses URL keyword matching ⚠️

**VERDICT:** PARTIAL — Backend failure safety is excellent. Frontend `extractDomainIntel()` keyword-based inference is a risk.

---

## PHASE 12 — FINAL VERIFICATION SUMMARY

### Executive Report

**A. Customer Data Accuracy:** PARTIAL — Data is accurate within a single device but not backend-persisted.

**B. Admin Data Accuracy:** PARTIAL — BusinessBrainTab reads real customer data. Creator intelligence has mock data.

**C. Persistence:** FAIL — All business-critical data is localStorage-only. Backend vault is in-memory Map.

**D. Cross-Customer Isolation:** PARTIAL — Frontend keyed by userId. Backend has no auth.

**E. Website Intelligence:** PASS — Real HTTP retrieval with evidence items, insufficient evidence detection, graceful failure.

**F. Recommendation Intelligence:** PASS — Evidence-driven, sales-bias prevention, negative recommendations supported.

**G. Competitor Intelligence:** NOT IMPLEMENTED — System correctly avoids fabricating competitors but has no research capability.

**H. Evidence Quality:** PASS — Evidence items have source, sourceType, confidence, checkedAt.

**I. AI Confidence/Claim Safety:** PARTIAL — Qualitative confidence used correctly. Hardcoded scores in creator intelligence.

**J. Expert Escalation:** PASS — NEEDS_REVIEW status properly implemented and displayed.

**K. Remaining Risks:**
1. Backend vault is in-memory (lost on restart)
2. No authentication on backend endpoints
3. Customer routes are empty stubs
4. `extractDomainIntel()` keyword-based inference
5. Hardcoded creator scores
6. No cross-device persistence

**L. Exact Next Steps:**
1. Persist backend vault to JSON file
2. Implement real customer profile/projects endpoints
3. Add authentication middleware
4. Remove `extractDomainIntel()` keyword inference
5. Remove hardcoded creator scores
6. Add recommendation versioning
7. Add audit trail for profile changes