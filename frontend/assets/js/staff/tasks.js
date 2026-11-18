/**
 * NIYD Hostel Management System - Staff Work Orders List Logic
 */

let currentTasksPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STAFF])) return;

  loadStaffHeader();
  loadStaffTasks(1);
  setupTaskUpdateForm();

  // Search input enter key
  document.getElementById('filterSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadStaffTasks(1);
    }
  });

  // Filter dropdown auto-reload
  document.getElementById('filterStatus').addEventListener('change', () => loadStaffTasks(1));
  document.getElementById('filterPriority').addEventListener('change', () => loadStaffTasks(1));
  document.getElementById('filterCategory').addEventListener('change', () => loadStaffTasks(1));
});

async function loadStaffHeader() {
  try {
    const res = await API.get('/staff/me/dashboard');
    const data = res.data || res;
    const { staff } = data;
    if (staff) {
      const fullName = `${staff.user.firstName} ${staff.user.lastName}`;
      document.getElementById('topStaffName').textContent = fullName;
      document.getElementById('topStaffId').textContent = `Staff ID: ${staff.staffId}`;
    }
  } catch (err) {
    console.error('Failed to load staff header:', err);
  }
}

async function loadStaffTasks(page = 1) {
  currentTasksPage = page;
  const tbody = document.querySelector('#staffTasksTable tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem;"><span class="spinner"></span></td></tr>`;

  const status = document.getElementById('filterStatus').value;
  const priority = document.getElementById('filterPriority').value;
  const category = document.getElementById('filterCategory').value;
  const search = document.getElementById('filterSearch').value.trim();

  const params = new URLSearchParams({
    page: currentTasksPage,
    limit: 10
  });

  if (status && status !== 'all') params.append('status', status);
  if (priority && priority !== 'all') params.append('priority', priority);
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  try {
    const res = await API.get(`/maintenance?${params.toString()}`);
    const data = res.data || res;
    const requests = Array.isArray(data) ? data : (data.requests || []);
    const meta = res.meta || {};

    if (!requests.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No work orders found matching criteria.</td></tr>`;
      document.getElementById('tasksPaginationInfo').textContent = 'Showing 0 work orders';
      document.getElementById('tasksPaginationButtons').innerHTML = '';
      return;
    }

    tbody.innerHTML = requests.map((t) => {
      const roomNum = t.room ? `Room ${t.room.roomNumber}` : 'General';
      const buildingName = t.building?.name || 'Block';
      const priorityClass = t.priority === 'urgent' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-neutral';
      const statusClass = Utils.getStatusBadgeClass(t.status);

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.85rem;">${Utils.escapeHtml(t.requestNumber)}</strong></td>
          <td>
            <strong>${Utils.escapeHtml(roomNum)}</strong>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(buildingName)}</div>
          </td>
          <td style="text-transform: capitalize; font-size: 0.8rem;">${Utils.escapeHtml(t.category)}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.84rem; color: var(--color-navy);">${Utils.escapeHtml(t.title)}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary); max-width: 320px; white-space: normal;">
              ${Utils.escapeHtml(t.description)}
            </div>
            ${t.resolutionNotes ? `<div style="margin-top: 4px; font-size: 0.72rem; background: var(--color-surface-hover); padding: 4px 6px; border-radius: var(--radius-sm); border-left: 2px solid var(--color-primary);"><strong>Note:</strong> ${Utils.escapeHtml(t.resolutionNotes)}</div>` : ''}
          </td>
          <td><span class="badge ${priorityClass}">${t.priority}</span></td>
          <td><span class="badge ${statusClass}">${t.status.replace('_', ' ')}</span></td>
          <td style="font-size: 0.75rem; color: var(--color-text-secondary); white-space: nowrap;">
            ${Utils.formatDate(t.createdAt)}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openUpdateTaskModal('${t._id}', '${t.requestNumber}', '${t.status}', '${Utils.escapeHtml(t.resolutionNotes || '')}')">
              Update Progress
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Pagination info & buttons
    const total = meta.total || requests.length;
    const pageNum = meta.page || 1;
    const totalPages = meta.totalPages || 1;

    document.getElementById('tasksPaginationInfo').textContent = `Showing page ${pageNum} of ${totalPages} (${total} total work orders)`;

    let btnHtml = '';
    if (pageNum > 1) {
      btnHtml += `<button type="button" class="btn btn-outline btn-sm" onclick="loadStaffTasks(${pageNum - 1})">&larr; Prev</button>`;
    }
    if (pageNum < totalPages) {
      btnHtml += `<button type="button" class="btn btn-outline btn-sm" onclick="loadStaffTasks(${pageNum + 1})">Next &rarr;</button>`;
    }
    document.getElementById('tasksPaginationButtons').innerHTML = btnHtml;

  } catch (err) {
    console.error('Failed to load staff tasks:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-danger); padding: 2.5rem;">Failed to load work orders.</td></tr>`;
  }
}

// Open Update Task Modal
window.openUpdateTaskModal = function(taskId, taskNum, currentStatus, existingNotes = '') {
  document.getElementById('modalTaskId').value = taskId;
  document.getElementById('modalTaskNum').value = taskNum;
  if (currentStatus === 'in_progress' || currentStatus === 'completed') {
    document.getElementById('modalTaskStatus').value = currentStatus;
  }
  document.getElementById('modalTaskNote').value = existingNotes || '';
  UI.openModal('updateTaskModal');
};

function setupTaskUpdateForm() {
  const form = document.getElementById('updateTaskForm');
  const btn = document.getElementById('saveTaskBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('modalTaskId').value;
    const status = document.getElementById('modalTaskStatus').value;
    const note = document.getElementById('modalTaskNote').value.trim();

    UI.setLoading(btn, true, 'Saving...');

    try {
      await API.put(`/maintenance/${taskId}/status`, {
        status,
        note
      });

      UI.showToast(`Work order status updated to ${status.replace('_', ' ')}!`, 'success');
      UI.closeModal('updateTaskModal');
      form.reset();
      loadStaffTasks(currentTasksPage);
    } catch (err) {
      UI.showToast(err.message || 'Failed to update work order', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}
