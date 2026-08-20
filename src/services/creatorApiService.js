/**
 * ADDUS Platform — Creator API Service (Frontend)
 *
 * Centralized API client for creator-specific endpoints.
 */

import { getCreatorToken } from './creatorTokenService.js';

const API_BASE = '/api';

function getAuthHeaders() {
  const token = getCreatorToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const creatorApiService = {
  async register({ phone, email, authType }) {
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

  async login({ phone, email }) {
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

  async getProfile(creatorId) {
    const res = await fetch(`${API_BASE}/creator/profile/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile || null;
  },

  async updateProfile(creatorId, updates) {
    const res = await fetch(`${API_BASE}/creator/profile/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Update failed');
    }
    return res.json();
  },

  async submitForReview() {
    const res = await fetch(`${API_BASE}/creator/submit-for-review`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Submission failed');
    }
    return res.json();
  },

  async getProjects(creatorId) {
    const res = await fetch(`${API_BASE}/creator/projects/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects || [];
  },

  async getEquipment(creatorId) {
    const res = await fetch(`${API_BASE}/creator/equipment/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.equipment || [];
  },

  async updateEquipment(creatorId, equipment) {
    const res = await fetch(`${API_BASE}/creator/equipment/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ equipment })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Update failed');
    }
    return res.json();
  },

  async getEarnings(creatorId) {
    const res = await fetch(`${API_BASE}/creator/earnings/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return { earnings: [], totalEarnings: 0 };
    return res.json();
  },

  async getNotifications(creatorId) {
    const res = await fetch(`${API_BASE}/creator/notifications/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.notifications || [];
  },

  async uploadDocument({ type, file, fileName }) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    formData.append('fileName', fileName);

    const token = getCreatorToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

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

  async getDocuments(creatorId) {
    const res = await fetch(`${API_BASE}/creator/documents/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  },

  async updateAvailability(creatorId, status, note, date, projectId) {
    const res = await fetch(`${API_BASE}/creator/availability/${encodeURIComponent(creatorId)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, note, date, projectId })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Update failed');
    }
    return res.json();
  },

  async getScore(creatorId) {
    const res = await fetch(`${API_BASE}/creator/score/${encodeURIComponent(creatorId)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.score || null;
  }
};
