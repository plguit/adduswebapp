import { apiService } from './apiService.js';
import { sessionManager } from './sessionManager.js';

export const aiService = {
  async sendMessage(message, userId, currentStep, brainContext = null) {
    try {
      const response = await apiService.post('/chat', {
        message,
        userId,
        currentStep,
        brainContext,
        stream: false
      });
      return response.content || response.text || '';
    } catch {
      return "I'm currently processing your request. How else can I assist you with your business goals?";
    }
  },

  async chatStream({ message, userId, onChunk, onDone, onError }) {
    try {
      const session = sessionManager.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
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

  async fetchVault(userId) {
    return apiService.get(`/vault/${userId}`);
  }
};
