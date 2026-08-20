# ADDUS Customer Onboarding Content Audit

## 1. Current Flow Map

**Current Page Order & Routing:**

Page 1 (OTP / Login) →
Page 1.5 (Language Selection) [Conditional - if no saved language] →
Page 2 (Name Input) →
Page 3 (Business Info / Upload) →
Page 4 (Business Profile Confirmation) →
Page 5 (Branching Choice) →

**[Conditional: Journey B "Help me figure out what I need"]**
Page 6_B1 (Primary Goal) →
Page 6_B2 (Business Category) →
Page 6_B3 (Target Audience) →
Page 7 (ADDI Recommendations & Video Gallery) →

**[Conditional: Journey A "I already know what I need"]**
Page 6_A1 (Deliverable Selection - Video Focused) →
Page 6_A2+ (Context Questions: Goal, Platform, Audience, Timeline - varies by selection) →

**[Shared - Post Journey Selection]**
Page 8 (Shoot Booking - Date & Time) →
Page 9 (Final Project Summary)

**Legend:**
- **Shared Pages:** 1, 1.5, 2, 3, 4, 5, 8, 9
- **Journey A Pages:** 6_A1, 6_A2+
- **Journey B Pages:** 6_B1, 6_B2, 6_B3, 7

---

## 2. Current Content Inventory

### Page 1 — OTP / Registration
- **Current purpose:** Authenticate user via Phone or Email.
- **Current copy:** "Welcome to ADDUS! Let's get started. Enter your mobile number or email to receive a quick verification code."
- **Current options:** Mobile Number tab, Email Address tab.
- **Current CTA:** Continue -> Verify & Start.
- **Current validation:** 10-digit phone number starting with 6,7,8,9. Standard email validation. 4-digit OTP.
- **Current state/data:** `authMethod`, `phoneInput`, `emailInput`, `otpInput`, `otpSent`, `loginError`.
- **Current branching:** Goes to Language (1.5) or Name (2).

### Page 1.5 — Language Selection
- **Current purpose:** Set app language.
- **Current copy:** "Select Your Language. Choose a language to continue"
- **Current options:** English, Malayalam.
- **Current CTA:** Option buttons act as CTA.
- **Current state/data:** Saves to `localStorage('APP_LANGUAGE')`.

### Page 2 — Name Input
- **Current purpose:** Collect user name.
- **Current copy:** "What is your name? Let ADDI personalize your creative workspace."
- **Current options:** Text input.
- **Current CTA:** Continue.
- **Current validation:** Minimum 1 character.
- **Current state/data:** `state.name`.

### Page 3 — Business Upload
- **Current purpose:** Collect business context via URL, text, or file.
- **Current copy:** "Tell ADDI about your business. Provide your website URL or paste your business summary."
- **Current options:** Uses `BusinessUploadWidget` (URL, File, Text).
- **Current CTA:** Extract/Analyze (within widget).
- **Current state/data:** `state.businessProfile`.

### Page 4 — Business Profile Confirmation
- **Current purpose:** Review AI-extracted business info.
- **Current copy:** "Here's what I understood about your business."
- **Current options:** Edit (goes back), Looks Good (Continue).
- **Current data shown:** Business Name, Industry, Stage, Services.

### Page 5 — Branching Choice
- **Current purpose:** Determine User Intent (Journey A vs B).
- **Current copy:** "How would you like ADDI to assist you today?"
- **Current options:** "Help me figure out what I need", "I already know what I need".
- **Current CTA:** Option cards.
- **Current state/data:** `branchChoice`.
- **Current branching:** Routes to Step 6_A or 6_B.

### Page 6_B — Journey B Discovery (Goal, Category, Audience)
- **Current purpose:** Learn about the user's needs.
- **Current copy:** 
  1. "What is your primary business goal right now?"
  2. "What category does your business fall into?"
  3. "Who is your primary target audience?"
- **Current options:** Hardcoded lists (e.g., Launch business, Grow, Rebrand / Physical product, Digital product, Service / Young Adults, Professionals, Families).
- **Current CTA:** Option buttons.
- **Current validation:** Single selection.
- **Current state/data:** `guidedAnswers`, `state.strategicAnswers`.

### Page 7 — ADDI Recommendation (Journey B)
- **Current purpose:** Suggest services. Heavy video focus.
- **Current copy:** "Based on your goals, here is what ADDI recommends. Select a deliverable to begin creative strategy."
- **Current options:** `VideoShowcaseSection` + AI recommendation list (e.g., Product Explainer Video).
- **Current CTA:** Option cards.
- **Current state/data:** `state.aiRecommendations`, `selectedDeliverable`.

### Page 6_A — Journey A Selection & Context
- **Current purpose:** User selects what they want.
- **Current copy:** "What deliverable do you need? Choose from our core production categories below." followed by context questions based on selection.
- **Current options:** `VideoShowcaseSection`, then dynamic questions (e.g., "What is your primary goal for this video?", "Where will this video be displayed?").
- **Current CTA:** Option cards.
- **Current state/data:** `selectedType`, `guidedAnswers`.

### Page 8 — Shoot Booking
- **Current purpose:** Schedule the project.
- **Current copy:** "Choose your shoot date & time. Select a preferred schedule for production."
- **Current options:** Calendar for date, preset time slots (9 AM - 11 AM, etc).
- **Current CTA:** Preview Production Schedule.
- **Current state/data:** `shootDate`, `timeSlot`.

### Page 9 — Final Project Summary
- **Current purpose:** Review and finalize.
- **Current copy:** "Final Project Summary. Review your project plan before confirming."
- **Current data shown:** Project name, Budget (hardcoded 35k), Timeline (hardcoded 7 Days), Shoot Date, Time.
- **Current CTA:** Swipe to Confirm Project.
- **Current state/data:** Uses all collected state to create draft project.

---

## 3. Requested Changes Mapping

| Page | Current | Requested Change | Type |
|---|---|---|---|
| OTP | Basic login prompt | Add conversational intro explaining ADDUS value. Options at bottom. | Content / UI |
| Language | Step 1.5 | Remove entirely. Default to English. | Flow |
| Business Info | Steps 2 & 3 | Merge Name and Manual Entry pages. Add proper validation. Keep Upload/Website paths separate. | Flow / UI / Validation |
| Discovery Qs | Steps 6_B | Add 'Other' text input option to discovery questions. | UI / Content |
| Target Audience | Step 6_B (Audience) | Remove manual audience collection. ADDI should infer it. | Flow |
| Recommendations | Step 7 (Video Heavy) | Broaden to Opportunity Plan (budget, scope, why it matters). Remove video exclusivity. | Content / Flow / UI |
| Expert Review | None | Add banner/text at bottom of Recommendation page. | UI / Content |
| Reference Gallery | `VideoShowcaseSection` | Add category-specific galleries (branding, web, etc.) linked to recommendations. | UI |
| Journey A | Step 6_A | Remove Main Goal, Target Audience, Priority Timeline. Change to Multi-select services. | Flow / Content / UI |
| Scheduling | Step 8 (Shoot only) | Implement Service-Aware logic (Shoot Date vs Delivery Date). Remove exact time slots. | Flow / UI |
| Final Summary | Step 9 (Basic) | Expand to include full business context, budget details, expert review status. | Content / UI |
| Global Chat Bar | Persistent bottom bar | Remove from onboarding. Allow clicking previous steps to edit. | Flow / UI |

---

## 4. Content Improvements

### Page: OTP / Registration
**CURRENT:**
"Welcome to ADDUS! Let's get started. Enter your mobile number or email to receive a quick verification code."

**PROPOSED:**
"Hi, I'm ADDI, your creative business partner. ADDUS helps you build your brand, identity, and visual assets effortlessly. To get started and save your progress, how would you like to sign in?"

**WHY:**
Provides context on who ADDI is and what ADDUS does before asking for contact information, making the experience warmer and more professional.

### Page: ADDI Recommendation / Opportunity Page
**CURRENT:**
"Based on your goals, here is what ADDI recommends. Select a deliverable to begin creative strategy."

**PROPOSED:**
"Here is your customized business opportunity plan. Based on what we've discussed, these are the services that will drive the most impact for your brand right now."

**WHY:**
Shifts the tone from selling an isolated "deliverable" (like a single video) to presenting a strategic, holistic business recommendation.

### Page: Expert Review Notification (Appended to Recommendations)
**CURRENT:**
*(Does not exist)*

**PROPOSED:**
"Your business details and ADDI's recommendations have also been shared with relevant experts for review. We'll bring you additional suggestions within approximately 3 hours."

**WHY:**
Sets realistic expectations and highlights the human-expert value add behind the AI.

---

## 5. Journey A Flow

**Current Flow:**
1. Deliverable Selection (Heavily relies on `VideoShowcaseSection`).
2. Specific Context Questions (Main Goal, Target Audience, Priority Timeline, Platform).
3. Shoot Booking.

**Proposed Flow:**
1. **Multi-Service Selection:** User can select multiple categories (Branding, Web, Video, Photography, etc.).
2. *REMOVED:* Main Goal page.
3. *REMOVED:* Manual Target Audience page.
4. *REMOVED:* Priority selection / generic timeline.
5. **Service-Aware Scheduling:** User provides preferred shoot dates (if physical) and/or delivery dates (if digital).

---

## 6. Journey B Flow

**Current Flow:**
1. Primary Goal (Single choice).
2. Business Category (Single choice).
3. Target Audience (Single choice).
4. Recommendation (Video-centric).

**Proposed Flow:**
1. Primary Goal (Single choice + **Other text input**).
2. Business Category (Single choice + **Other text input**).
3. *REMOVED:* Target Audience (ADDI infers this).
4. **Opportunity / Recommendation Page:** Broad service recommendations, budget estimates, scope customization, reference galleries, and Expert Review notification.

---

## 7. Scheduling Logic

**Current Implementation:**
- Single calendar component (`ShootCalendar`).
- Forces the user to pick a `shootDate`.
- Forces the user to pick a 2-hour `timeSlot` (e.g., "11 AM – 1 PM").
- Assumes every project is a physical shoot.

**Proposed Service-Aware Model:**
- **Physical Production (Video, Photography):** Ask for "PREFERRED SHOOT DATE". Remove exact time slots (handled by admin later).
- **Creative/Digital Work (Branding, Web, UI/UX):** Ask for "PREFERRED DELIVERY DATE".
- **Mixed Projects:** Ask for both "PREFERRED SHOOT DATE" and "PREFERRED DELIVERY DATE".
- Requires associating metadata with each service option to determine its type.

---

## 8. Final Summary

**Current Fields:**
- Project Title
- Budget (Static string)
- Timeline (Static string)
- Shoot Date & Time

**Proposed Fields:**
- **BUSINESS:** Name, Segment, Type, Description.
- **ADDI UNDERSTANDING:** Business stage, Identified Target Audience, Opportunity, Observations.
- **RECOMMENDED WORK:** Selected services, Recommended services, Purpose/Reason.
- **SCOPE:** Additions, Removals, Custom requests.
- **BUDGET:** Service-level estimates, Total estimated budget.
- **SCHEDULING:** Preferred shoot date, Preferred delivery date.
- **EXPERT REVIEW:** Review status / timeline expectation.
- **ADDITIONAL NOTES:** Customer clarifications.

---

## 9. Existing Components We Should Reuse

- `MascotLottiePlayer`: For consistent character animations.
- `DuolingoSpeechBubble`: For conversational text framing.
- `BusinessUploadWidget`: For the URL/File upload paths.
- `SwipeToConfirmButton`: For the final step confirmation.
- `VideoShowcaseSection`: Can be generalized/refactored into a `MediaGallerySection` to support images (branding/web) alongside video.

---

## 10. Risk / Dependencies

1. **Navigation Paradigm Shift:** Moving away from the persistent Chat bar to a "click previous question to edit" model requires a significant rewrite of how `stepIndex` and historical message state (`history` array) are managed. Currently, past steps are rendered as static bubbles; they will need to become interactive buttons that rewind the state.
2. **State Management for Multi-Select:** Journey A currently assumes a single `selectedType` and `selectedDeliverable` string. The store will need to support an array of selected services.
3. **Data Inference:** Removing the explicit "Target Audience" question requires ensuring `businessAnalysisService` reliably infers and populates this data so it can be presented later in the Final Summary.

---

## 11. Recommended Implementation Order

1. **Routing & UI Foundation:** Remove Language step, remove bottom Chat bar, and implement the "click to edit previous step" navigation mechanism.
2. **Onboarding Entry:** Update OTP copy and merge Name + Manual Business Entry pages (with new validation).
3. **Journey A Refactor:** Implement multi-selection for services and remove the deprecated context questions (Goal, Audience, Timeline).
4. **Journey B Refactor:** Add the 'Other' input to discovery questions and remove the manual Audience question.
5. **Recommendation Engine:** Build the new Opportunity Page (incorporating budget, scope, non-video services, reference galleries, and the expert review notification).
6. **Scheduling Engine:** Implement the Service-Aware Scheduling logic (Shoot vs Delivery date).
7. **Final Summary:** Expand the summary page to display all newly collected and inferred data.
