/**
 * NIYD Hostel Management System - UI Utilities (Toasts, Modals, Spinners)
 */

const UI = {
  // Ensure Toast Container exists
  getToastContainer() {
    let container = document.getElementById('niyd-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'niyd-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  },

  // Display Toast Notification
  showToast(message, type = 'info', title = '', duration = 4000) {
    const container = this.getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const defaultTitles = {
      success: 'Success',
      error: 'Error',
      warning: 'Attention',
      info: 'Information'
    };

    const displayTitle = title || defaultTitles[type] || 'Notice';

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${Utils.escapeHtml(displayTitle)}</div>
        <div class="toast-message">${Utils.escapeHtml(message)}</div>
      </div>
      <button type="button" class="modal-close" style="font-size: 1rem; line-height: 1;" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeBtn = toast.querySelector('.modal-close');
    const closeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }
  },

  // Open Modal by ID
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-focus first input
    const firstInput = modal.querySelector('input:not([disabled]), textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  // Close Modal by ID
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  // Setup generic modal dismiss listeners
  initModals() {
    document.addEventListener('click', (e) => {
      // Click on backdrop to close
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
      }
      // Click on data-dismiss="modal" or .modal-close
      const dismissBtn = e.target.closest('[data-dismiss="modal"], .modal-close');
      if (dismissBtn) {
        const modal = dismissBtn.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop.active');
        if (openModal) {
          openModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
  },

  // Reusable Confirmation Dialog
  confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) {
    let confirmModal = document.getElementById('niyd-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'niyd-confirm-modal';
      confirmModal.className = 'modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-dialog" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title"></h3>
            <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" style="color: var(--color-text-secondary);"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" data-dismiss="modal" id="confirm-modal-cancel"></button>
            <button type="button" class="btn" id="confirm-modal-submit"></button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    document.getElementById('confirm-modal-cancel').textContent = cancelText;

    const submitBtn = document.getElementById('confirm-modal-submit');
    submitBtn.textContent = confirmText;
    submitBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    // Clone button to drop previous event listeners cleanly
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

    newSubmitBtn.addEventListener('click', async () => {
      this.closeModal('niyd-confirm-modal');
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    });

    this.openModal('niyd-confirm-modal');
  },

  // Button Loading State
  setLoading(btn, isLoading, loadingText = '') {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.classList.add('disabled');
      const text = loadingText ? `<span>${loadingText}</span>` : '';
      btn.innerHTML = `<span class="spinner spinner-sm spinner-white"></span> ${text}`;
    } else {
      btn.disabled = false;
      btn.classList.remove('disabled');
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
        delete btn.dataset.originalHtml;
      }
    }
  }
};

window.UI = UI;
document.addEventListener('DOMContentLoaded', () => UI.initModals());
