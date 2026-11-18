/**
 * NIYD Hostel Management System - Student Maintenance Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STUDENT])) return;

  loadMyMaintenance();
  setupMaintenanceForm();
});

// Load student maintenance history
async function loadMyMaintenance() {
  const tbody = document.querySelector('#myMaintenanceTable tbody');

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/maintenance/my-requests');
    const requests = res.data || res || [];

    if (!requests.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">You have not submitted any maintenance complaints.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map((req) => {
      const priorityClass = req.priority === 'urgent' ? 'badge-danger' : req.priority === 'high' ? 'badge-warning' : 'badge-neutral';
      const statusClass = Utils.getStatusBadgeClass(req.status);
      const staffName = req.assignedTo?.user ? `${req.assignedTo.user.firstName} ${req.assignedTo.user.lastName} (${req.assignedTo.designation})` : 'Awaiting Assignment';

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.85rem;">${Utils.escapeHtml(req.requestNumber)}</strong></td>
          <td style="text-transform: capitalize; font-size: 0.8rem;">${Utils.escapeHtml(req.category)}</td>
          <td>
            <div style="font-weight: 600; color: var(--color-navy); font-size: 0.85rem;">${Utils.escapeHtml(req.title)}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(req.description)}</div>
          </td>
          <td><span class="badge ${priorityClass}">${req.priority}</span></td>
          <td style="font-size: 0.8rem; color: var(--color-text);">${staffName}</td>
          <td><span class="badge ${statusClass}">${req.status.replace('_', ' ')}</span></td>
          <td style="font-size: 0.75rem; color: var(--color-text-muted);">${Utils.formatDate(req.createdAt)}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load complaints.</td></tr>`;
  }
}

function setupMaintenanceForm() {
  const form = document.getElementById('studentMaintenanceForm');
  const btn = document.getElementById('submitMaintBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = document.getElementById('maintCategory').value;
    const priority = document.getElementById('maintPriority').value;
    const title = document.getElementById('maintTitle').value.trim();
    const description = document.getElementById('maintDescription').value.trim();

    UI.setLoading(btn, true, 'Submitting Request...');

    try {
      const res = await API.post('/maintenance', {
        category,
        priority,
        title,
        description
      });

      const reqNum = res.data?.requestNumber || 'MNT';
      UI.showToast(`Complaint #${reqNum} submitted! Staff will inspect shortly.`, 'success');
      form.reset();
      loadMyMaintenance();
    } catch (err) {
      UI.showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}
