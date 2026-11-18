/**
 * NIYD Hostel Management System - Maintenance Management Logic
 */

let allStaffMembers = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadStaffList();
  loadMaintenance();
  setupAssignForm();
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

// Load staff list
async function loadStaffList() {
  try {
    const res = await API.get('/staff');
    allStaffMembers = res.data || res || [];
    const select = document.getElementById('staffSelect');
    if (select) {
      select.innerHTML = `
        <option value="">Select Technician...</option>
        ${allStaffMembers.map(s => `
          <option value="${s._id}">${s.user.firstName} ${s.user.lastName} (${s.designation})</option>
        `).join('')}
      `;
    }
  } catch (err) {
    console.error('Failed to load staff list:', err);
  }
}

// Load maintenance requests
async function loadMaintenance() {
  const tbody = document.querySelector('#maintenanceTable tbody');
  const status = document.getElementById('statusFilter')?.value || 'all';
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const priority = document.getElementById('priorityFilter')?.value || 'all';

  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/maintenance', {
      status,
      category,
      priority
    });

    const requests = res.data?.requests || res.requests || [];

    if (!requests.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No maintenance requests found matching filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map((req) => {
      const studentName = req.student?.user ? `${req.student.user.firstName} ${req.student.user.lastName}` : 'N/A';
      const roomNum = req.room ? `Room ${req.room.roomNumber}` : 'N/A';
      const staffName = req.assignedTo?.user ? `${req.assignedTo.user.firstName} ${req.assignedTo.user.lastName}` : '<span style="color: var(--color-text-muted);">Unassigned</span>';
      const priorityClass = req.priority === 'urgent' ? 'badge-danger' : req.priority === 'high' ? 'badge-warning' : 'badge-neutral';
      const statusClass = Utils.getStatusBadgeClass(req.status);

      return `
        <tr>
          <td><strong style="color: var(--color-navy); font-size: 0.82rem;">${Utils.escapeHtml(req.requestNumber)}</strong></td>
          <td>
            <div style="font-weight: 600;">${Utils.escapeHtml(roomNum)}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(studentName)}</div>
          </td>
          <td style="text-transform: capitalize; font-size: 0.8rem;">${Utils.escapeHtml(req.category)}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.82rem; color: var(--color-navy);">${Utils.escapeHtml(req.title)}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-secondary); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${Utils.escapeHtml(req.description)}
            </div>
          </td>
          <td><span class="badge ${priorityClass}">${req.priority}</span></td>
          <td style="font-size: 0.8rem;">${staffName}</td>
          <td><span class="badge ${statusClass}">${req.status.replace('_', ' ')}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openAssignModal('${req._id}', '${req.requestNumber}', '${req.priority}')">
              ${req.assignedTo ? 'Re-assign' : 'Assign Staff'}
            </button>
            ${req.status !== 'completed' ? `
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-success);" onclick="markComplete('${req._id}')">
                Complete
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load maintenance requests.</td></tr>`;
  }
}

// Open Assign Staff modal
window.openAssignModal = function(reqId, reqNumber, currentPriority) {
  document.getElementById('assignReqId').value = reqId;
  document.getElementById('assignReqNum').value = reqNumber;
  if (currentPriority) document.getElementById('assignPriority').value = currentPriority;
  UI.openModal('assignStaffModal');
};

function setupAssignForm() {
  const form = document.getElementById('assignStaffForm');
  const btn = document.getElementById('saveAssignBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reqId = document.getElementById('assignReqId').value;
    const staffId = document.getElementById('staffSelect').value;
    const priority = document.getElementById('assignPriority').value;
    const adminNote = document.getElementById('assignAdminNote').value.trim();

    if (!staffId) {
      UI.showToast('Please select a technician.', 'warning');
      return;
    }

    UI.setLoading(btn, true, 'Assigning...');

    try {
      await API.put(`/maintenance/${reqId}/assign`, {
        staffId,
        priority,
        adminNote
      });

      UI.showToast('Technician assigned successfully!', 'success');
      UI.closeModal('assignStaffModal');
      form.reset();
      loadMaintenance();
    } catch (err) {
      UI.showToast(err.message || 'Assignment failed', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

window.markComplete = function(reqId) {
  UI.confirm({
    title: 'Mark Maintenance Task Completed',
    message: 'Confirm that this repair or maintenance task has been thoroughly resolved and completed?',
    confirmText: 'Mark Completed',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        await API.put(`/maintenance/${reqId}/status`, { status: 'completed', note: 'Marked completed by warden office' });
        UI.showToast('Task marked as completed', 'success');
        loadMaintenance();
      } catch (err) {
        UI.showToast(err.message || 'Failed to update status', 'error');
      }
    }
  });
};
