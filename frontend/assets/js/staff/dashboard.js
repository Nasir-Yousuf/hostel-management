/**
 * NIYD Hostel Management System - Staff Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STAFF])) return;

  loadStaffDashboard();
  setupTaskUpdateForm();
});

async function loadStaffDashboard() {
  const tbody = document.querySelector('#staffDashboardTasksTable tbody');

  try {
    const res = await API.get('/staff/me/dashboard');
    const data = res.data || res;
    const { staff, stats, recentTasks } = data;

    // Header info
    const fullName = `${staff.user.firstName} ${staff.user.lastName}`;
    document.getElementById('topStaffName').textContent = fullName;
    document.getElementById('topStaffId').textContent = `Staff ID: ${staff.staffId}`;
    document.getElementById('welcomeStaffName').textContent = `Technician ${fullName}`;
    document.getElementById('staffDesignation').textContent = `${staff.designation} • ${staff.department}`;

    // Stats
    document.getElementById('statStaffActive').textContent = stats.activeTasks || 0;
    document.getElementById('statStaffUrgent').textContent = stats.urgentTasks || 0;
    document.getElementById('statStaffCompleted').textContent = stats.completedToday || 0;

    // Recent Tasks table
    if (!recentTasks || !recentTasks.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No pending tasks assigned to you. All clear!</td></tr>`;
      return;
    }

    tbody.innerHTML = recentTasks.map((t) => {
      const roomNum = t.room ? `Room ${t.room.roomNumber}` : 'N/A';
      const buildingName = t.building?.name || 'Block';
      const priorityClass = t.priority === 'urgent' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-neutral';
      const statusClass = Utils.getStatusBadgeClass(t.status);

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.82rem;">${Utils.escapeHtml(t.requestNumber)}</strong></td>
          <td>
            <strong>${Utils.escapeHtml(roomNum)}</strong>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(buildingName)}</div>
          </td>
          <td style="text-transform: capitalize; font-size: 0.8rem;">${Utils.escapeHtml(t.category)}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.82rem; color: var(--color-navy);">${Utils.escapeHtml(t.title)}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${Utils.escapeHtml(t.description)}
            </div>
          </td>
          <td><span class="badge ${priorityClass}">${t.priority}</span></td>
          <td><span class="badge ${statusClass}">${t.status.replace('_', ' ')}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openUpdateTaskModal('${t._id}', '${t.requestNumber}', '${t.status}')">
              Update Progress
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load staff dashboard:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load staff work orders.</td></tr>`;
  }
}

// Open Update Task Modal
window.openUpdateTaskModal = function(taskId, taskNum, currentStatus) {
  document.getElementById('modalTaskId').value = taskId;
  document.getElementById('modalTaskNum').value = taskNum;
  if (currentStatus === 'in_progress' || currentStatus === 'completed') {
    document.getElementById('modalTaskStatus').value = currentStatus;
  }
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
      loadStaffDashboard();
    } catch (err) {
      UI.showToast(err.message || 'Failed to update work order', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}
