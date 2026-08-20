# AI Layer Architecture & Orchestration

## Overview
All LLM operations are isolated inside the `ai/` folder and wrapped by backend services. The browser never makes direct API calls to Groq.

### Key AI Components
- `PRIMARY_MODEL`: `llama-3.3-70b-versatile`
- `FALLBACK_MODEL`: `llama-3.1-8b-instant`
- `ai/business-brain/vaultService.js`: Tracks 20+ business attributes and calculates live confidence scores.
- `ai/business-brain/businessBrainService.js`: Handles model execution with automatic primary → fallback retry strategy.
- `ai/conversation-engine/conversationManager.js`: Assembles dynamic system prompts incorporating Business Brain state.
- `ai/summary-engine/profileExtractor.js`: Extracts structured JSON profile attributes from conversation stream.
