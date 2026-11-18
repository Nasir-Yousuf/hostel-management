/**
 * NIYD Hostel Management System - Student Fee & Invoicing Logic
 */

let currentInvoices = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STUDENT])) return;

  loadStudentFees();
  setupSimForm();
});

// Load student fee records
async function loadStudentFees() {
  const tbody = document.querySelector('#studentInvoicesTable tbody');
  const dueDisplay = document.getElementById('studentTotalDue');
  const dueSubtext = document.getElementById('dueSubtext');

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/fees/invoices');
    currentInvoices = res.data?.invoices || res.invoices || [];

    // Calculate total due
    const totalDue = currentInvoices.reduce((acc, inv) => {
      return acc + Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    }, 0);

    dueDisplay.textContent = Utils.formatCurrency(totalDue);
    if (totalDue > 0) {
      dueDisplay.style.color = 'var(--color-danger)';
      dueSubtext.textContent = 'Please clear pending fees before the due date.';
    } else {
      dueDisplay.style.color = 'var(--color-success)';
      dueSubtext.textContent = 'All fees are up to date. No pending balance.';
    }

    if (!currentInvoices.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No billing records issued for your profile.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentInvoices.map((inv) => {
      const due = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
      const statusBadge = Utils.getStatusBadgeClass(inv.status);

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.85rem;">${Utils.escapeHtml(inv.invoiceNumber)}</strong></td>
          <td style="font-size: 0.8rem;">${Utils.formatDate(inv.dueDate)}</td>
          <td>${Utils.formatCurrency(inv.totalAmount)}</td>
          <td style="color: var(--color-success); font-weight: 500;">${Utils.formatCurrency(inv.paidAmount || 0)}</td>
          <td style="color: ${due > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'}; font-weight: 600;">
            ${Utils.formatCurrency(due)}
          </td>
          <td><span class="badge ${statusBadge}">${inv.status.replace('_', ' ')}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            ${due > 0 ? `
              <button type="button" class="btn btn-gold btn-sm" onclick="openPaymentSimModal('${inv._id}', '${inv.invoiceNumber}', ${due})">
                Pay Now
              </button>
            ` : `
              <button type="button" class="btn btn-outline btn-sm" onclick="viewReceipt('${inv._id}')">
                View Receipt
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load billing history.</td></tr>`;
  }
}

// Payment simulation modal
let activePayableAmount = 0;
window.openPaymentSimModal = function(invoiceId, invoiceNumber, dueAmount) {
  activePayableAmount = dueAmount;
  document.getElementById('simInvoiceId').value = invoiceId;
  document.getElementById('simInvoiceNum').textContent = invoiceNumber;
  document.getElementById('simPayableAmount').textContent = Utils.formatCurrency(dueAmount);

  UI.openModal('paymentSimModal');
};

window.selectGateway = function(gw) {
  document.querySelectorAll('.gateway-option').forEach(el => {
    el.classList.toggle('selected', el.getAttribute('data-gateway') === gw);
  });
  document.getElementById('selectedGateway').value = gw;
};

function setupSimForm() {
  const form = document.getElementById('paymentSimForm');
  const btn = document.getElementById('simSubmitBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invoiceId = document.getElementById('simInvoiceId').value;
    const method = document.getElementById('selectedGateway').value;
    const phone = document.getElementById('simPhone').value;

    UI.setLoading(btn, true, 'Processing Payment...');

    try {
      const res = await API.post('/fees/payments/simulate', {
        invoiceId,
        method,
        amount: activePayableAmount
      });

      const receiptNum = res.data?.receiptNumber || 'REC';
      UI.closeModal('paymentSimModal');

      UI.confirm({
        title: 'Payment Completed Successfully!',
        message: `Your payment of ${Utils.formatCurrency(activePayableAmount)} via ${method.toUpperCase()} has been processed and verified.\nReceipt Number: ${receiptNum}`,
        confirmText: 'View Receipt',
        cancelText: 'Close',
        onConfirm: () => viewReceipt(invoiceId)
      });

      loadStudentFees();
    } catch (err) {
      UI.showToast(err.message || 'Payment simulation failed', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

// View Receipt Modal
window.viewReceipt = async function(invoiceId) {
  UI.openModal('receiptModal');
  const content = document.getElementById('receiptContent');
  content.innerHTML = `<div style="text-align: center; padding: 2rem;"><span class="spinner"></span></div>`;

  try {
    const res = await API.get(`/fees/invoices/${invoiceId}`);
    const { invoice, payments } = res.data || res;
    const student = invoice.student;
    const latestPayment = payments && payments.length ? payments[0] : null;

    content.innerHTML = `
      <div style="border: 2px solid var(--color-primary); padding: var(--space-8); border-radius: var(--radius-lg); background: #FFFFFF;">
        <!-- Receipt Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--color-primary); padding-bottom: var(--space-4); margin-bottom: var(--space-6);">
          <div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--color-navy);">National Institute of Youth Development (NIYD)</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">Ministry of Youth and Sports, Govt. of Bangladesh</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Savar, Dhaka-1340 • Official Hostel Accommodation Receipt</div>
          </div>
          <div style="text-align: right;">
            <div class="badge badge-success" style="font-size: 0.9rem; padding: 4px 12px; margin-bottom: 4px;">PAID & VERIFIED</div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Receipt No: <strong>${latestPayment?.receiptNumber || 'REC-VERIFIED'}</strong></div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Date: ${Utils.formatDate(latestPayment?.paymentDate || invoice.updatedAt)}</div>
          </div>
        </div>

        <!-- Student & Allocation Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6); font-size: var(--font-size-sm); background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
          <div>
            <div><strong>Student Name:</strong> ${student.user.firstName} ${student.user.lastName}</div>
            <div><strong>Student ID:</strong> ${student.studentId}</div>
            <div><strong>Department:</strong> ${student.department}</div>
          </div>
          <div>
            <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Payment Channel:</strong> ${latestPayment ? latestPayment.method.toUpperCase() : 'CASH'}</div>
            <div><strong>Transaction Reference:</strong> ${latestPayment?.transactionId || 'OFFLINE-COUNTER'}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="table" style="margin-bottom: var(--space-6);">
          <thead>
            <tr>
              <th>Description of Hostel Fee</th>
              <th style="text-align: right;">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map(item => `
              <tr>
                <td>${Utils.escapeHtml(item.description)}</td>
                <td style="text-align: right; font-weight: 600;">${Utils.formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid var(--color-navy);">
              <td style="font-weight: 800; font-size: 1rem;">Total Amount Paid:</td>
              <td style="text-align: right; font-weight: 800; font-size: 1.1rem; color: var(--color-primary);">
                ${Utils.formatCurrency(invoice.paidAmount)}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Receipt Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: var(--space-10); font-size: var(--font-size-xs); color: var(--color-text-secondary);">
          <div>
            <div>Computer generated electronic money receipt.</div>
            <div>Valid without physical seal when verified in system database.</div>
          </div>
          <div style="text-align: center; border-top: 1px solid #777; width: 180px; padding-top: 4px;">
            Authorized Accounts Officer<br>
            NIYD Hostel Administration
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-danger); padding: 2rem;">Failed to load receipt details.</div>`;
  }
};
