/**
 * NIYD Hostel Management System - General Utilities
 */

const Utils = {
  // DOM Selection helpers
  $: (selector, parent = document) => parent.querySelector(selector),
  $$: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),

  // Format Currency in Bangladeshi Taka (৳)
  formatCurrency: (amount) => {
    const num = Number(amount) || 0;
    return `৳ ${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  },

  // Format Date (EN / BN friendly)
  formatDate: (dateString, lang = 'en') => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    if (lang === 'bn') {
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  // Format Date and Time
  formatDateTime: (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Safe HTML Escaping (prevents XSS)
  escapeHtml: (unsafe) => {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Debounce for search inputs
  debounce: (fn, delay = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Status Badge Class Mapper
  getStatusBadgeClass: (status) => {
    const map = {
      approved: 'badge-success',
      active: 'badge-success',
      completed: 'badge-success',
      paid: 'badge-success',
      present: 'badge-success',
      available: 'badge-success',
      verified: 'badge-success',

      pending: 'badge-warning',
      under_review: 'badge-warning',
      in_progress: 'badge-warning',
      partially_paid: 'badge-warning',
      late_return: 'badge-warning',

      rejected: 'badge-danger',
      suspended: 'badge-danger',
      cancelled: 'badge-danger',
      overdue: 'badge-danger',
      absent: 'badge-danger',
      unavailable: 'badge-danger',
      full: 'badge-danger',

      waitlisted: 'badge-info',
      assigned: 'badge-info',
      submitted: 'badge-info',
      draft: 'badge-neutral',
      checked_out: 'badge-neutral'
    };
    return map[status] || 'badge-neutral';
  },

  // Convert English digits to Bengali digits
  toBengaliDigits: (num) => {
    if (num == null) return '';
    const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (digit) => bnDigits[enDigits.indexOf(digit)]);
  }
};

window.Utils = Utils;
