# Directory Mapping & Folder Structure

```
/apps
  /customer         # Business Owner Portal
  /admin            # Internal Operations Portal
  /creator          # Creative Partner Portal

/shared
  /components/ui    # Base UI elements (Button, Toast, Loading)
  /components/widgets # Domain widgets (ShootCalendar, UploadWidget, StylePreview)
  /services         # Shared client services (authService, profileService, apiService)
  /hooks            # State stores (useOnboardingStore, useProjectStore, useBusinessBrain)
  /validators       # System validation rules
  /constants        # Roles, statuses, industries, deliverables
  /config           # Environment settings
  /permissions      # Role access rules

/ai
  /prompts          # System prompts & LLM instructions
  /business-brain   # Business Vault memory & Groq LLM orchestration
  /conversation-engine # History & SSE stream context builder
  /summary-engine   # Auto profile extraction & roadmap generation

/database
  /models           # User, Business, Project, Creator, Vault schemas
  /repositories     # Data access abstraction layer

/backend
  /api              # Controllers
  /routes           # API routes (/api/customer, /api/admin, /api/creator, /api/chat)
  /middleware       # Rate limiters & authentication

/storage            # Business files, documents, uploads
/docs               # Developer documentation
```
