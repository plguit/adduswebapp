# ADDUS Platform Architecture Specification

## Overview
ADDUS is an enterprise-grade multi-application platform built around a single backend, database, and AI layer.

### Applications Breakdown
1. **Customer Web App (`apps/customer`)**: Business intake, ADDI AI chat, Business Brain, proposals, visual calendars, dashboard workspace.
2. **Admin Web App (`apps/admin`)**: Operations, user management, business brain management, expert review queue, project oversight, notification engine, analytics.
3. **Creator Web App (`apps/creator`)**: Photographers, videographers, editors, and designers portal for assigned shoots, portfolio, availability, and payouts.

### System Layers
- `shared/`: Reusable UI components, widgets, validators, constants, hooks, services.
- `ai/`: Groq LLM integration, prompt templates, Business Brain vault, conversation memory, continuous profile extraction.
- `backend/`: Node.js Express controllers and routes (`/api/customer`, `/api/admin`, `/api/creator`, `/api/chat`).
- `database/`: Centralized repositories and models.
- `storage/`: Structured media and document asset directories.
