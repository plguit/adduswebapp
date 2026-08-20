# Database Architecture

## Persistence Strategy
- Browser client persists user accounts, business brain, chat history, projects, and notifications in `localStorage` under isolated `userId` keys (`ONBOARDING_STATE_<userId>`, `PROJECTS_STORE_<userId>`).
- Node server maintains in-memory maps for active session vaults.
- Database access is abstracted via `database/repositories/` to allow swapping to PostgreSQL / Supabase with zero changes to UI components.

### Core Schemas
- `User`: userId, phoneNumber, email, name, authProvider, timestamps
- `Business`: businessId, userId, businessBrain, aiConfidenceScore
- `Project`: id, userId, service, type, status, currentStage, shootDate, proposal
- `Creator`: creatorId, name, skill, portfolio, assignedProjects
- `Notification`: id, userId, type, message, read, createdAt
