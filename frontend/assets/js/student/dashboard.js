/**
 * NIYD Hostel Management System - Student Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STUDENT])) return;

  loadStudentDashboard();
});

async function loadStudentDashboard() {
  try {
    const res = await API.get('/students/me/dashboard');
    const data = res.data || res;
    const { student, allocation, financialSummary, recentMaintenance, announcements, attendanceStats } = data;

    // Header info
    const fullName = `${student.user.firstName} ${student.user.lastName}`;
    document.getElementById('topStudentName').textContent = fullName;
    document.getElementById('topStudentId').textContent = `ID: ${student.studentId}`;
    document.getElementById('welcomeStudentName').textContent = `Welcome back, ${student.user.firstName}!`;
    document.getElementById('studentMetaInfo').textContent = `Department: ${student.department} • Session: ${student.session}`;

    // Room info
    if (allocation && allocation.room) {
      document.getElementById('bannerRoomNumber').textContent = `Room ${allocation.room.roomNumber}`;
      document.getElementById('bannerBedInfo').textContent = `Bed: ${allocation.bed?.bedNumber || 'A'} • ${allocation.building?.name || 'Block A'}`;

      document.getElementById('roomSummaryBody').innerHTML = `
        <div style="font-size: var(--font-size-sm);">
          <div style="margin-bottom: 6px;"><strong>Building:</strong> ${allocation.building?.name || 'Block A'}</div>
          <div style="margin-bottom: 6px;"><strong>Floor Level:</strong> Floor ${allocation.room.floor}</div>
          <div style="margin-bottom: 6px;"><strong>Room Type:</strong> <span style="text-transform: capitalize;">${allocation.room.type}</span></div>
          <div><strong>Status:</strong> <span class="badge badge-success">Active Resident</span></div>
        </div>
      `;
    } else {
      document.getElementById('bannerRoomNumber').textContent = 'Pending';
      document.getElementById('bannerBedInfo').textContent = 'No room allocated yet';
      document.getElementById('roomSummaryBody').innerHTML = `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">You have not been assigned to a hostel room yet. Please check your application status or contact the Warden Office.</p>`;
    }

    // Financial summary
    const due = financialSummary.totalDue || 0;
    document.getElementById('feeSummaryBody').innerHTML = `
      <div style="font-size: var(--font-size-sm);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Total Outstanding Balance</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: ${due > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; margin: 4px 0 8px;">
          ${Utils.formatCurrency(due)}
        </div>
        ${financialSummary.upcomingInvoice ? `
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">
            Next Due Date: <strong>${Utils.formatDate(financialSummary.upcomingInvoice.dueDate)}</strong>
          </div>
        ` : `
          <div style="font-size: 0.75rem; color: var(--color-success);">✓ All hostel fees are fully settled!</div>
        `}
      </div>
    `;

    // Attendance summary
    document.getElementById('attendanceSummaryBody').innerHTML = `
      <div style="font-size: var(--font-size-sm);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Last 30 Days Compliance</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--color-primary); margin: 4px 0 8px;">
          ${attendanceStats.percentage}%
        </div>
        <div style="font-size: 0.72rem; color: var(--color-text-muted);">
          Present: ${attendanceStats.presentCount} of ${attendanceStats.totalMarked} recorded days
        </div>
      </div>
    `;

    // Maintenance complaints table
    const maintTbody = document.querySelector('#studentRecentMaintenanceTable tbody');
    if (!recentMaintenance || !recentMaintenance.length) {
      maintTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--color-text-secondary); padding: 1.5rem;">No active maintenance requests.</td></tr>`;
    } else {
      maintTbody.innerHTML = recentMaintenance.map((m) => {
        const badgeClass = Utils.getStatusBadgeClass(m.status);
        return `
          <tr>
            <td><strong>${m.requestNumber}</strong></td>
            <td style="text-transform: capitalize;">${m.category}</td>
            <td><span class="badge ${m.priority === 'urgent' ? 'badge-danger' : 'badge-neutral'}">${m.priority}</span></td>
            <td><span class="badge ${badgeClass}">${m.status.replace('_', ' ')}</span></td>
          </tr>
        `;
      }).join('');
    }

    // Announcements
    const noticesContainer = document.getElementById('studentNoticesBody');
    if (!announcements || !announcements.length) {
      noticesContainer.innerHTML = `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">No new notices published.</p>`;
    } else {
      noticesContainer.innerHTML = announcements.map((ann) => `
        <div style="border-bottom: 1px solid var(--color-border-light); padding-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <strong style="color: var(--color-navy); font-size: 0.85rem;">${Utils.escapeHtml(ann.title)}</strong>
            <span style="font-size: 0.7rem; color: var(--color-text-muted);">${Utils.formatDate(ann.publishedAt)}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--color-text-secondary); margin: 0;">${Utils.escapeHtml(ann.content)}</p>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('Failed to load student dashboard:', err);
    UI.showToast('Could not load your residential dashboard.', 'error');
  }
}
