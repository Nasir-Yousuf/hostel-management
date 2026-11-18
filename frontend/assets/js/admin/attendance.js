/**
 * NIYD Hostel Management System - Attendance Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();

  // Set default date picker to today YYYY-MM-DD
  const datePicker = document.getElementById('attendanceDatePicker');
  if (datePicker) {
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
  }

  loadDailyAttendance();

  // Search input debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      loadDailyAttendance();
    }, 400));
  }
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

// Fetch daily attendance sheet from backend
async function loadDailyAttendance() {
  const tbody = document.querySelector('#attendanceTable tbody');
  const date = document.getElementById('attendanceDatePicker')?.value;
  const status = document.getElementById('statusFilter')?.value;
  const search = document.getElementById('searchInput')?.value;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/attendance', {
      date,
      status: status !== 'all' ? status : undefined,
      search: search || undefined
    });

    const data = res.data || res;
    renderAttendanceStats(data.stats || {});
    renderAttendanceTable(data.students || []);

  } catch (err) {
    console.error('Failed to load attendance:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load attendance sheet.</td></tr>`;
  }
}

function renderAttendanceStats(stats = {}) {
  document.getElementById('statAttTotal').textContent = stats.total || 0;
  document.getElementById('statAttPresent').textContent = stats.present || 0;
  document.getElementById('statAttAbsent').textContent = stats.absent || 0;
  document.getElementById('statAttCheckedOut').textContent = stats.checkedOut || 0;
  document.getElementById('statAttLate').textContent = stats.late || 0;
}

function renderAttendanceTable(students = []) {
  const tbody = document.querySelector('#attendanceTable tbody');
  if (!tbody) return;

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No student records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s) => {
    const statusBadge = Utils.getStatusBadgeClass(s.status);
    const checkInTime = s.checkIn ? Utils.formatDateTime(s.checkIn).split(',')[1] : '—';

    return `
      <tr>
        <td><strong style="color: var(--color-primary);">${Utils.escapeHtml(s.studentCode)}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--color-navy);">${Utils.escapeHtml(s.studentName)}</div>
        </td>
        <td>
          <span class="badge badge-gold">Room ${s.roomNumber} (Bed ${s.bedNumber})</span>
        </td>
        <td><span style="font-size: 0.8rem;">${Utils.escapeHtml(s.department)}</span></td>
        <td style="font-size: 0.8rem; color: var(--color-text-secondary);">${checkInTime}</td>
        <td>
          <span class="badge ${statusBadge}">${s.status.replace('_', ' ')}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-outline-primary btn-sm" onclick="markStudent('${s.studentId}', 'present')" title="Mark Present">
            ✓ Present
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-danger); border-color: var(--color-danger-border);" onclick="markStudent('${s.studentId}', 'absent')" title="Mark Absent">
            ✕ Absent
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-warning);" onclick="markStudent('${s.studentId}', 'late_return')" title="Mark Late Return">
            ⏱ Late
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Mark individual student
window.markStudent = async function(studentId, status) {
  const date = document.getElementById('attendanceDatePicker')?.value;
  try {
    await API.post('/attendance/mark', {
      studentId,
      date,
      status
    });
    UI.showToast(`Marked ${status}`, 'success');
    loadDailyAttendance();
  } catch (err) {
    UI.showToast(err.message || 'Failed to update attendance', 'error');
  }
};

// Bulk mark all present
window.bulkMarkAllPresent = function() {
  const date = document.getElementById('attendanceDatePicker')?.value;
  UI.confirm({
    title: 'Bulk Attendance',
    message: `Mark all active hostel students as PRESENT for ${date}?`,
    confirmText: 'Mark All Present',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const res = await API.post('/attendance/bulk-mark', { date, status: 'present' });
        UI.showToast(`Marked ${res.data?.updatedCount || 0} students present!`, 'success');
        loadDailyAttendance();
      } catch (err) {
        UI.showToast(err.message || 'Bulk mark failed', 'error');
      }
    }
  });
};
