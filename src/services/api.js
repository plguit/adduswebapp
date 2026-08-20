/**
 * Centralized Backend API Client Service
 * Encapsulates all network communication with Express server.
 * Never communicates directly with Groq or third-party AI APIs from the browser.
 */

import { sessionManager } from './sessionManager.js';

const API_BASE = '/api';

function getAuthHeaders() {
  const session = sessionManager.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

export const apiService = {
  /**
   * Sends a message to the backend AI chat endpoint.
   * Supports streaming SSE callbacks or standard JSON response.
   * 
   * @param {Object} params - { message, userId, stream, onChunk, onDone, onError }
   */
  async sendMessage({ message, stream = true, onChunk, onDone, onError }) {
    if (!message || message.trim() === '') return;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, stream })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.content || 'Unable to connect to AI backend service.';
        if (typeof onError === 'function') onError(msg);
        return;
      }

      if (stream) {
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
              console.error('[API SSE Parse Error]', e);
            }
          }
        }
      } else {
        const data = await response.json();
        if (typeof onDone === 'function') onDone(data);
      }

    } catch (err) {
      console.error('[API Service Exception]', err);
      if (typeof onError === 'function') {
        onError('Network error: Unable to reach backend server. Please check your connection.');
      }
    }
  },

  /**
   * Retrieves stored Business Vault profile for authenticated user.
   */
  async fetchBusinessVault() {
    const session = sessionManager.getSession();
    if (!session?.userId) return null;
    try {
      const res = await fetch(`${API_BASE}/vault/${encodeURIComponent(session.userId)}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.vault;
    } catch (err) {
      console.error('[API Service Exception] Fetch Vault:', err);
      return null;
    }
  },

  async fetchAdminUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Users:', err);
      return [];
    }
  },

  async fetchAdminNotifications() {
    try {
      const res = await fetch(`${API_BASE}/admin/notifications`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications || [];
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Notifications:', err);
      return [];
    }
  },

  async fetchAdminExpertReviews() {
    try {
      const res = await fetch(`${API_BASE}/admin/expert-reviews`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.reviews || [];
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Expert Reviews:', err);
      return [];
    }
  },

  async fetchAdminProjects() {
    try {
      const res = await fetch(`${API_BASE}/admin/projects`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.projects || [];
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Projects:', err);
      return [];
    }
  },

  async fetchAdminAnalytics() {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      return data.analytics || null;
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Analytics:', err);
      return null;
    }
  },

  async fetchAdminVaults() {
    try {
      const res = await fetch(`${API_BASE}/admin/vaults`, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.vaults || [];
    } catch (err) {
      console.error('[API Service Exception] Fetch Admin Vaults:', err);
      return [];
    }
  },

  async blockUser(userId) {
    return this.request(`${API_BASE}/admin/user/${encodeURIComponent(userId)}/block`, { method: 'POST' });
  },

  async unblockUser(userId) {
    return this.request(`${API_BASE}/admin/user/${encodeURIComponent(userId)}/unblock`, { method: 'POST' });
  },

  async deleteUser(userId) {
    return this.request(`${API_BASE}/admin/user/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  },

  async approveOnboarding(userId) {
    return this.request(`${API_BASE}/admin/onboarding/${encodeURIComponent(userId)}/approve`, { method: 'POST' });
  },

  async rejectOnboarding(userId, reason = '') {
    return this.request(`${API_BASE}/admin/onboarding/${encodeURIComponent(userId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async fetchChatMessages(filters = {}) {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.conversationId) params.append('conversationId', filters.conversationId);
    const res = await fetch(`${API_BASE}/admin/chat/messages?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  },

  async sendChatMessage({ recipientId, content, conversationId }) {
    return this.request(`${API_BASE}/admin/chat/send`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, conversationId })
    });
  },

  async deleteChatMessage(messageId) {
    return this.request(`${API_BASE}/admin/chat/message/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
  },

  async restrictUserChat(userId, restricted = true) {
    return this.request(`${API_BASE}/admin/chat/restrict/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ restricted })
    });
  },

  async downloadOnboardingTemplate() {
    const res = await fetch(`${API_BASE}/admin/onboarding/template`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'addus_onboarding_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  async bulkOnboard(users) {
    return this.request(`${API_BASE}/admin/onboarding/bulk`, {
      method: 'POST',
      body: JSON.stringify({ users })
    });
  },

  async sendPushNotification({ userIds, title, message, deepLink }) {
    return this.request(`${API_BASE}/admin/push/send`, {
      method: 'POST',
      body: JSON.stringify({ userIds, title, message, deepLink })
    });
  },

  // ── Creator API Methods ──────────────────────────────────────────

  async creatorLogin({ phone, email }) {
    const res = await fetch(`${API_BASE}/creator/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Login failed');
    }
    return res.json();
  },

  async creatorRegister({ phone, email, authType }) {
    const res = await fetch(`${API_BASE}/creator/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email, authType })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Registration failed');
    }
    return res.json();
  },

  async fetchCreatorProfile(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/profile/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  },

  async updateCreatorProfile(creatorId, updates) {
    return this.request(`${API_BASE}/creator/profile/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async submitCreatorForReview() {
    return this.request(`${API_BASE}/creator/submit-for-review`, { method: 'POST' });
  },

  async fetchCreatorProjects(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/projects/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects || [];
  },

  async fetchCreatorEquipment(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/equipment/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.equipment || [];
  },

  async updateCreatorEquipment(creatorId, equipment) {
    return this.request(`${API_BASE}/creator/equipment/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      body: JSON.stringify({ equipment })
    });
  },

  async fetchCreatorEarnings(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/earnings/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return { earnings: [], totalEarnings: 0 };
    const data = await res.json();
    return data;
  },

  async fetchCreatorNotifications(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/notifications/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.notifications || [];
  },

  async uploadCreatorDocument(formData) {
    const session = sessionManager.getSession();
    const headers = {};
    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }
    const res = await fetch(`${API_BASE}/creator/documents`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Upload failed');
    }
    return res.json();
  },

  async fetchCreatorDocuments(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/documents/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  },

  async updateCreatorAvailability(creatorId, status, note, date, projectId) {
    return this.request(`${API_BASE}/creator/availability/${encodeURIComponent(creatorId)}`, {
      method: 'POST',
      body: JSON.stringify({ status, note, date, projectId })
    });
  },

  async fetchCreatorScore(creatorId) {
    const headers = this.getAuthHeaders();
    const res = await fetch(`${API_BASE}/creator/score/${encodeURIComponent(creatorId)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.score || null;
  },

  // ── Admin Creator API Methods ───────────────────────────────────

  async fetchAdminCreators(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.profession) params.append('profession', filters.profession);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    const res = await fetch(`${API_BASE}/admin/creators?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return { creators: [], total: 0 };
    const data = await res.json();
    return data;
  },

  async fetchAdminCreatorDetail(creatorId) {
    const res = await fetch(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  },

  async approveCreator(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/approve`, { method: 'POST' });
  },

  async rejectCreator(creatorId, reason) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async approveCreatorKyc(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/kyc-approve`, { method: 'POST' });
  },

  async rejectCreatorKyc(creatorId, reason) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/kyc-reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async approveCreatorFinancial(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/financial-approve`, { method: 'POST' });
  },

  async blockCreator(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/block`, { method: 'POST' });
  },

  async unblockCreator(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}/unblock`, { method: 'POST' });
  },

  async deleteCreator(creatorId) {
    return this.request(`${API_BASE}/admin/creators/${encodeURIComponent(creatorId)}`, { method: 'DELETE' });
  },

  async downloadCreatorsTemplate() {
    const res = await fetch(`${API_BASE}/admin/creators/template`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'addus_creators_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  async bulkUploadCreators(creators) {
    return this.request(`${API_BASE}/admin/creators/bulk`, {
      method: 'POST',
      body: JSON.stringify({ creators })
    });
  },

  async fetchCreatorsReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`${API_BASE}/admin/creators/reports?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report || null;
  },

  async request(url, options = {}) {
    const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || `Request failed: ${res.status}`);
    }
    return res.json();
  }
};
