/**
 * NIYD Hostel Management System - API Client
 * Enterprise-grade REST client with token injection and automatic error handling
 */

const API = {
  // Get Access Token
  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Set Access Token
  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    }
  },

  // Generic Request Handler
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = { ...options.headers };

    // Inject Bearer token if available
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON content-type if not sending FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      // Handle Unauthorized (401)
      if (response.status === 401) {
        // Attempt refresh or logout
        if (!options._retry && localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN)) {
          options._retry = true;
          const refreshed = await this.refreshToken();
          if (refreshed) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
            return this.request(endpoint, options);
          }
        }

        // Only redirect if inside an authenticated dashboard
        const path = window.location.pathname;
        if (path.includes('/admin/') || path.includes('/student/') || path.includes('/staff/')) {
          Auth.logout();
        }
      }

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data.errors || [];
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
      throw err;
    }
  },

  // HTTP Helper Methods
  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post(endpoint, data = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    });
  },

  put(endpoint, data = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data)
    });
  },

  patch(endpoint, data = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Refresh Token Flow
  async refreshToken() {
    const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await response.json();
      if (response.ok && data.accessToken) {
        this.setToken(data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};

window.API = API;
