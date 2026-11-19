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

  // Demo Users Database for Client-Side / Offline Mode
  DEMO_USERS: [
    {
      id: 'demo-admin-1',
      firstName: 'Hostel',
      lastName: 'Administrator',
      email: 'admin@niyd.gov.bd',
      password: 'Admin@NIYD2026',
      role: 'admin',
      department: 'Hostel Administration'
    },
    {
      id: 'demo-warden-1',
      firstName: 'Chief',
      lastName: 'Warden',
      email: 'warden@niyd.gov.bd',
      password: 'Warden@NIYD2026',
      role: 'admin',
      department: 'Residential Hall Inspection'
    },
    {
      id: 'demo-student-1',
      firstName: 'Tanvir',
      lastName: 'Ahmed',
      email: 'student1@niyd.gov.bd',
      password: 'Student@123',
      role: 'student',
      studentId: 'NIYD-2026-001',
      room: '101'
    },
    {
      id: 'demo-staff-1',
      firstName: 'Mohammad',
      lastName: 'Rafiq',
      email: 'staff1@niyd.gov.bd',
      password: 'Staff@123',
      role: 'staff',
      trade: 'Electrical & Facility Maintenance'
    }
  ],

  // Login Method
  async login(email, password, expectedRole = null) {
    // 1. Check local frontend demo credentials first
    const cleanEmail = (email || '').trim().toLowerCase();
    const localUser = this.DEMO_USERS.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (localUser) {
      if (expectedRole && localUser.role !== expectedRole) {
        throw new Error(`This account has role "${localUser.role}", but you selected "${expectedRole}".`);
      }
      const fakeToken = 'mock_jwt_token_' + btoa(JSON.stringify(localUser));
      API.setToken(fakeToken);
      this.setUser(localUser);
      return {
        success: true,
        accessToken: fakeToken,
        user: localUser
      };
    }

    // 2. Fall back to backend API if not matched locally
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

  // Helper to resolve paths whether hosted via http:// (server) or direct file://
  resolveAppPath(targetPath) {
    // If targetPath is like '/frontend/admin/index.html'
    if (window.location.protocol === 'file:') {
      // Find where 'frontend/' appears in current pathname
      const currentPath = window.location.pathname.replace(/\\/g, '/');
      const frontendIdx = currentPath.toLowerCase().indexOf('/frontend/');
      if (frontendIdx !== -1) {
        const rootPath = currentPath.substring(0, frontendIdx);
        return rootPath + targetPath;
      }
    }
    return targetPath;
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
      window.location.href = this.resolveAppPath('/frontend/login.html');
    }
  },

  // Redirect based on role
  redirectToDashboard(role) {
    const userRole = role || this.getRole();
    if (userRole === CONFIG.ROLES.ADMIN) {
      window.location.href = this.resolveAppPath('/frontend/admin/index.html');
    } else if (userRole === CONFIG.ROLES.STUDENT) {
      window.location.href = this.resolveAppPath('/frontend/student/index.html');
    } else if (userRole === CONFIG.ROLES.STAFF) {
      window.location.href = this.resolveAppPath('/frontend/staff/index.html');
    } else {
      window.location.href = this.resolveAppPath('/frontend/index.html');
    }
  },

  // Client-side Route Guard for Portals
  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = this.resolveAppPath(`/frontend/login.html?returnUrl=${returnUrl}`);
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
