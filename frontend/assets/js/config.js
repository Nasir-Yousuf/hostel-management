/**
 * NIYD Hostel Management System - Configuration
 */

const CONFIG = {
  // Configurable Backend API Base URL
  // In development: http://localhost:5000/api
  // In production: window.APP_API_URL or relative /api
  API_BASE_URL: window.API_BASE_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api'
  ),

  // Storage Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'niyd_access_token',
    REFRESH_TOKEN: 'niyd_refresh_token',
    USER: 'niyd_user_profile',
    LANGUAGE: 'niyd_language_pref'
  },

  // Role Types
  ROLES: {
    ADMIN: 'admin',
    STUDENT: 'student',
    STAFF: 'staff'
  },

  // Default Language
  DEFAULT_LANGUAGE: 'en',

  // Currency
  CURRENCY_SYMBOL: '৳',
  CURRENCY_CODE: 'BDT',

  // Institution Info
  ORGANIZATION: {
    NAME_EN: 'National Institute of Youth Development (NIYD)',
    NAME_BN: 'জাতীয় যুব উন্নয়ন ইনস্টিটিউট',
    MINISTRY_EN: 'Ministry of Youth and Sports, Government of the People\'s Republic of Bangladesh',
    MINISTRY_BN: 'যুব ও ক্রীড়া মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
    LOCATION_EN: 'Savar, Dhaka, Bangladesh',
    LOCATION_BN: 'সাভার, ঢাকা, বাংলাদেশ',
    CONTACT_PHONE: '+880-2-7744001',
    CONTACT_EMAIL: 'hostel@niyd.gov.bd'
  }
};

// Freeze configuration in runtime
Object.freeze(CONFIG);
window.CONFIG = CONFIG;
