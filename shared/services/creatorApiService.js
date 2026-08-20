const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const session = localStorage.getItem('addus_creator_session');
  const headers = {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${JSON.parse(session).token || '' }` } : {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API Error: ${res.statusText}`);
  }
  return res.json();
}

export const creatorApiService = {
  async register(data) {
    return request('/creator/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(identifier, method = 'phone') {
    return request('/creator/login', {
      method: 'POST',
      body: JSON.stringify({ [method]: identifier })
    });
  },

  async refresh() {
    return request('/creator/refresh', { method: 'POST' });
  },

  async getProfile(creatorId) {
    return request(`/creator/profile/${encodeURIComponent(creatorId)}`);
  },

  async updateProfile(creatorId, data) {
    return request(`/creator/profile/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async submitForReview(creatorId) {
    return request(`/creator/submit-for-review/${encodeURIComponent(creatorId)}`, { method: 'POST' });
  },

  async getProjects(creatorId) {
    return request(`/creator/projects/${encodeURIComponent(creatorId)}`);
  },

  async getEarnings(creatorId) {
    return request(`/creator/earnings/${encodeURIComponent(creatorId)}`);
  },

  async getNotifications(creatorId) {
    return request(`/creator/notifications/${encodeURIComponent(creatorId)}`);
  },

  async uploadDocument(creatorId, formData) {
    const session = localStorage.getItem('addus_creator_session');
    const headers = {};
    if (session) {
      headers.Authorization = `Bearer ${JSON.parse(session).token || ''}`;
    }
    const res = await fetch(`${API_BASE}/creator/documents`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `Upload failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getDocuments(creatorId) {
    return request(`/creator/documents/${encodeURIComponent(creatorId)}`);
  },

  async updateEquipment(creatorId, data) {
    return request(`/creator/equipment/${encodeURIComponent(creatorId)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateAvailability(creatorId, data) {
    return request(`/creator/availability/${encodeURIComponent(creatorId)}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getScore(creatorId) {
    return request(`/creator/score/${encodeURIComponent(creatorId)}`);
  }
};
