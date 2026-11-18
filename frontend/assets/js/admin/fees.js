/**
 * NIYD Hostel Management System - Fee & Billing Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadFeeStructures();
  loadInvoices();
  setupPaymentForm();
  setupFeeStructureForm();
});

function setupUserHeader() {
  const user = Auth.getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebarUserName');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
  if (avatarEl) avatarEl.textContent = (user.firstName[0] || 'A').toUpperCase();
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  }
}

// Load approved fee structures
async function loadFeeStructures() {
  const container = document.getElementById('feeStructuresContainer');
  if (!container) return;

  try {
    const res = await API.get('/fees/structures');
    const items = res.data || res || [];

    if (!items.length) {
      container.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-text-secondary);">No custom fee structures registered.</div>`;
      return;
    }

    container.innerHTML = items.map((f) => `
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
        <div style="font-weight: 700; color: var(--color-navy); margin-bottom: 2px;">${Utils.escapeHtml(f.name)}</div>
        <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">
          ${Utils.formatCurrency(f.amount)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted);">/ ${f.frequency}</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(f.description || '')}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger);">Failed to load fee structures.</div>`;
  }
}

// Load invoices list
async function loadInvoices() {
  const tbody = document.querySelector('#invoicesTable tbody');
  const status = document.getElementById('invoiceStatusFilter')?.value || 'all';
  const search = document.getElementById('invoiceSearch')?.value || '';

  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/fees/invoices', { status, search });
    const invoices = res.data?.invoices || res.invoices || [];

    if (!invoices.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No billing invoices found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map((inv) => {
      const studentName = inv.student?.user ? `${inv.student.user.firstName} ${inv.student.user.lastName}` : 'N/A';
      const studentId = inv.student?.studentId || 'N/A';
      const due = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
      const badgeClass = Utils.getStatusBadgeClass(inv.status);

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.82rem;">${Utils.escapeHtml(inv.invoiceNumber)}</strong></td>
          <td>
            <div style="font-weight: 600;">${Utils.escapeHtml(studentName)}</div>
            <div style="font-size: 0.72rem; color: var(--color-primary);">${Utils.escapeHtml(studentId)}</div>
          </td>
          <td style="font-size: 0.8rem;">${Utils.formatDate(inv.dueDate)}</td>
          <td><strong>${Utils.formatCurrency(inv.totalAmount)}</strong></td>
          <td style="color: var(--color-success);">${Utils.formatCurrency(inv.paidAmount || 0)}</td>
          <td style="color: ${due > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'}; font-weight: 600;">
            ${Utils.formatCurrency(due)}
          </td>
          <td><span class="badge ${badgeClass}">${inv.status.replace('_', ' ')}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            ${due > 0 ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="openRecordPaymentModal('${inv._id}', '${inv.invoiceNumber}', ${due})">
                Record Payment
              </button>
            ` : `
              <span style="font-size: 0.75rem; color: var(--color-success); font-weight: 600;">✓ Settled</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load invoices.</td></tr>`;
  }
}

// Generate Monthly Billing batch prompt
window.generateMonthlyInvoicesPrompt = function() {
  const nextMonth = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  UI.confirm({
    title: 'Generate Monthly Hostel Invoices',
    message: `Generate recurring monthly hostel fee invoices for all currently active residential students? Invoices already issued for this cycle will be skipped automatically.`,
    confirmText: 'Generate Invoices',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const res = await API.post('/fees/invoices/generate-monthly', { month: nextMonth, year });
        UI.showToast(res.message || 'Monthly invoices generated!', 'success');
        loadInvoices();
      } catch (err) {
        UI.showToast(err.message || 'Generation failed', 'error');
      }
    }
  });
};

// Open Record Offline Payment modal
window.openRecordPaymentModal = function(invoiceId, invoiceNumber, dueAmount) {
  document.getElementById('payInvoiceId').value = invoiceId;
  document.getElementById('payInvoiceNum').value = invoiceNumber;
  document.getElementById('payAmount').value = dueAmount;
  document.getElementById('payAmount').max = dueAmount;
  document.getElementById('payMaxHint').textContent = `Maximum balance due: ${Utils.formatCurrency(dueAmount)}`;

  UI.openModal('recordPaymentModal');
};

function setupPaymentForm() {
  const form = document.getElementById('recordPaymentForm');
  const btn = document.getElementById('savePayBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invoiceId = document.getElementById('payInvoiceId').value;
    const amount = document.getElementById('payAmount').value;
    const method = document.getElementById('payMethod').value;
    const transactionId = document.getElementById('payTxnId').value.trim();
    const notes = document.getElementById('payNotes').value.trim();

    UI.setLoading(btn, true, 'Verifying...');

    try {
      const res = await API.post('/fees/payments/record', {
        invoiceId,
        amount,
        method,
        transactionId,
        notes
      });

      const receipt = res.data?.payment?.receiptNumber || 'REC';
      UI.showToast(`Payment of ${Utils.formatCurrency(amount)} recorded! Receipt: ${receipt}`, 'success');
      UI.closeModal('recordPaymentModal');
      form.reset();
      loadInvoices();
    } catch (err) {
      UI.showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

function setupFeeStructureForm() {
  const form = document.getElementById('addFeeStructureForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fsName').value.trim();
    const type = document.getElementById('fsType').value;
    const amount = document.getElementById('fsAmount').value;
    const description = document.getElementById('fsDesc').value.trim();

    try {
      await API.post('/fees/structures', { name, type, amount, description });
      UI.showToast('Fee structure created', 'success');
      UI.closeModal('addFeeStructureModal');
      form.reset();
      loadFeeStructures();
    } catch (err) {
      UI.showToast(err.message || 'Failed to create structure', 'error');
    }
  });
}
