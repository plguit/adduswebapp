# Backend Architecture & API Specification

## Server Overview
Node.js + Express backend serving API routes and static frontend bundles.

### API Endpoints
- `POST /api/chat` — SSE streaming chat endpoint with AI Business Profile extraction.
- `GET /api/vault/:userId` — Retrieves live Business Brain state.
- `POST /api/analyze-website` — Web page analysis.
- `POST /api/analyze-document` — Document text parsing.
- `POST /api/admin/login` — Admin authentication.
- `GET /api/customer/*` — Customer domain endpoints.
- `GET /api/admin/*` — Admin domain endpoints.
- `GET /api/creator/*` — Creator domain endpoints.
