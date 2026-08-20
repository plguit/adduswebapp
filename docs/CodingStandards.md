# ADDUS Engineering Standards & Governance Rules

## Permanent Platform Governance Rules

### 1. Customer Application Feature-Frozen
- The **Customer application** is strictly **feature-frozen**.
- Do NOT redesign the Customer UI.
- Do NOT modify the Customer onboarding.
- Do NOT change ADDI's behavior.
- Do NOT change any Customer routes, components, prompts, AI flow, or UX unless explicitly requested.

### 2. Mandatory Pre-Change Clarification Rule
Before making ANY code changes, ALWAYS ask the user for clarification:

> **Which application should this change affect?**
> 1. Customer
> 2. Admin
> 3. Creator
> 4. Shared

*Never assume. Never modify the Customer application while working on Admin, Creator, architecture, or shared modules.*

### 3. Application Isolation
- Customer (`apps/customer`), Admin (`apps/admin`), and Creator (`apps/creator`) UI logic must remain completely isolated.
- Customer code must never load admin UI, and admin code must never load creator components.

### 4. Shared Code Placement
- Truly reusable UI components belong in `shared/components/ui/`.
- Reusable domain widgets belong in `shared/components/widgets/`.
- Validation functions belong in `shared/validators/`.
- Platform constants belong in `shared/constants/`.
- No inline validation rules or magic strings inside page components.
