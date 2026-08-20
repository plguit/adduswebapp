import { apiService } from './apiService.js';
import { sessionManager } from './sessionManager.js';

/**
 * AI Assistant Service (ADDI Orchestrator)
 * Interfaces with Express backend Groq AI service.
 */

function getAuthHeaders() {
  const session = sessionManager.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

export const aiService = {
  async chatStream({ message, userId, onChunk, onDone, onError }) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, userId, stream: true })
      });

      if (!response.ok) {
        if (typeof onError === 'function') onError('Backend AI Service unavailable');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              if (typeof onDone === 'function') onDone(data);
              break;
            }
            if (data.token && typeof onChunk === 'function') {
              onChunk(data.token);
            }
          } catch (e) {
            console.error('[AI Service SSE Parse Error]', e);
          }
        }
      }

    } catch (err) {
      if (typeof onError === 'function') onError(err.message);
    }
  },

  /**
   * Non-streaming wrapper for simple request/response AI calls.
   * Accumulates the SSE stream into a single resolved string.
   * Used by DashboardPage ADDI strip and other non-streaming consumers.
   */
  async sendMessage(prompt, userId, _step = '') {
    const session = sessionManager.getSession();
    const safeUserId = userId || session?.userId || null;
    if (!safeUserId) return null;
    return new Promise((resolve) => {
      let accumulated = '';
      this.chatStream({
        message: prompt,
        userId: safeUserId,
        onChunk: (token) => { accumulated += token; },
        onDone: () => { resolve(accumulated || null); },
        onError: () => { resolve(null); }
      });
    });
  },

  async fetchVault(userId) {
    return apiService.get(`/vault/${userId}`);
  }
};

