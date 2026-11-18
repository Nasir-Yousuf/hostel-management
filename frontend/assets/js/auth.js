/**
 * NIYD Hostel Management System - Authentication Service
 */

const Auth = {
  // Get Current Cached User
  getUser() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Save User to Storage
  setUser(user) {
    if (user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!API.getToken() && !!this.getUser();
  },

  // Get User Role
  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  // Login Method
  async login(email, password, expectedRole = null) {
    try {
      const result = await API.post('/auth/login', { email, password, role: expectedRole });
      
      if (result.accessToken && result.user) {
        API.setToken(result.accessToken);
        if (result.refreshToken) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
        }
        this.setUser(result.user);
        return result;
      }
      throw new Error('Invalid authentication response from server');
    } catch (err) {
      throw err;
    }
  },

  // Logout Method
  async logout() {
    try {
      if (API.getToken()) {
        await API.post('/auth/logout').catch(() => {});
      }
    } finally {
      API.setToken(null);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      this.setUser(null);
      // Redirect to homepage or login
      window.location.href = '/frontend/login.html';
    }
  },

  // Redirect based on role
  redirectToDashboard(role) {
    const userRole = role || this.getRole();
    if (userRole === CONFIG.ROLES.ADMIN) {
      window.location.href = '/frontend/admin/index.html';
    } else if (userRole === CONFIG.ROLES.STUDENT) {
      window.location.href = '/frontend/student/index.html';
    } else if (userRole === CONFIG.ROLES.STAFF) {
      window.location.href = '/frontend/staff/index.html';
    } else {
      window.location.href = '/frontend/index.html';
    }
  },

  // Client-side Route Guard for Portals
  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/frontend/login.html?returnUrl=${returnUrl}`;
      return false;
    }

    const currentRole = this.getRole();
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
      UI.showToast('You do not have permission to view this page.', 'error');
      setTimeout(() => this.redirectToDashboard(currentRole), 1200);
      return false;
    }

    return true;
  }
};

window.Auth = Auth;
