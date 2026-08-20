const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ADMIN_AUTH_TOKEN');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.content || `API Error: ${res.statusText}`);
  }
  return res.json();
}

export const adminApiService = {
  async ensureAuthenticated() {
    const existing = localStorage.getItem('ADMIN_AUTH_TOKEN');
    if (existing) return true;
    return this.login();
  },

  async login() {
    const email = process.env.ADMIN_EMAIL || localStorage.getItem('ADMIN_EMAIL') || '';
    const password = process.env.ADMIN_PASSWORD || localStorage.getItem('ADMIN_PASSWORD') || '';
    if (!email || !password) {
      console.warn('[AdminApi] Missing ADMIN_EMAIL / ADMIN_PASSWORD');
      return false;
    }
    const res = await request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success && res.token) {
      localStorage.setItem('ADMIN_AUTH_TOKEN', res.token);
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem('ADMIN_AUTH_TOKEN');
  },

  isAuthenticated() {
    return !!localStorage.getItem('ADMIN_AUTH_TOKEN');
  },

  async getUsers() {
    await this.ensureAuthenticated();
    return request('/admin/users');
  },

  async getProjects() {
    await this.ensureAuthenticated();
    return request('/admin/projects');
  },

  async getVaults() {
    await this.ensureAuthenticated();
    return request('/admin/vaults');
  },

  async getNotifications() {
    await this.ensureAuthenticated();
    return request('/admin/notifications');
  },

  async getExpertReviews() {
    await this.ensureAuthenticated();
    return request('/admin/expert-reviews');
  },

  async updateUser(userId, patch) {
    await this.ensureAuthenticated();
    return request(`/admin/user/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(patch)
    });
  },

  async getAnalytics() {
    await this.ensureAuthenticated();
    return request('/admin/analytics');
  },

  async getAuditLogs(filters = {}) {
    await this.ensureAuthenticated();
    const params = new URLSearchParams();
    if (filters.user) params.append('user', filters.user);
    if (filters.component) params.append('component', filters.component);
    if (filters.action) params.append('action', filters.action);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.limit) params.append('limit', filters.limit);
    const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('ADMIN_AUTH_TOKEN')}` } });
    if (!res.ok) return { logs: [], count: 0 };
    return res.json();
  },

  async getAuditStats() {
    await this.ensureAuthenticated();
    const res = await fetch(`${API_BASE}/admin/audit-logs/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('ADMIN_AUTH_TOKEN')}` } });
    if (!res.ok) return { stats: {} };
    return res.json();
  },

  async getUrlAnalysisLogs(filters = {}) {
    await this.ensureAuthenticated();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    const res = await fetch(`${API_BASE}/admin/url-analysis?${params.toString()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('ADMIN_AUTH_TOKEN')}` } });
    if (!res.ok) return { logs: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    return res.json();
  },

  async getUrlAnalysisStats() {
    await this.ensureAuthenticated();
    const res = await fetch(`${API_BASE}/admin/url-analysis/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem('ADMIN_AUTH_TOKEN')}` } });
    if (!res.ok) return { stats: {} };
    return res.json();
  },

  async getUrlAnalysisEntry(id) {
    await this.ensureAuthenticated();
    const res = await fetch(`${API_BASE}/admin/url-analysis/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('ADMIN_AUTH_TOKEN')}` } });
    if (!res.ok) return null;
    return res.json();
  }
};
