/**
 * NIYD Hostel Management System - Admission Management Logic
 */

let currentPage = 1;
let currentRoomsList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadApplications();
  setupAllocateForm();

  // Search input debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      currentPage = 1;
      loadApplications();
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

// Fetch applications from backend
async function loadApplications() {
  const tbody = document.querySelector('#applicationsTable tbody');
  const status = document.getElementById('statusFilter')?.value || 'all';
  const dept = document.getElementById('deptFilter')?.value || 'all';
  const search = document.getElementById('searchInput')?.value || '';

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/admissions', {
      page: currentPage,
      limit: 10,
      status,
      department: dept,
      search
    });

    const data = res.data || res;
    renderApplicationsTable(data.applications || []);
    renderPagination(data.pagination || {});

  } catch (err) {
    console.error('Failed to load applications:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load applications from database.</td></tr>`;
  }
}

function renderApplicationsTable(items = []) {
  const tbody = document.querySelector('#applicationsTable tbody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No admission applications found matching your criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((app) => {
    const badgeClass = Utils.getStatusBadgeClass(app.status);
    const applicantName = `${app.applicant.firstName} ${app.applicant.lastName}`;
    const allocInfo = app.allocatedRoom
      ? `<span class="badge badge-gold" style="font-size: 0.72rem;">Room ${app.allocatedRoom.roomNumber} (Bed ${app.allocatedBed?.bedNumber || '—'})</span>`
      : `<span style="color: var(--color-text-muted); font-size: 0.75rem;">Not Allocated</span>`;

    const canAllocate = ['pending', 'under_review', 'approved', 'waitlisted'].includes(app.status);
    const canConfirm = app.allocatedRoom && app.status !== 'confirmed';

    return `
      <tr>
        <td><strong style="color: var(--color-navy); font-size: 0.8rem;">${Utils.escapeHtml(app.applicationNumber)}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--color-text);">${Utils.escapeHtml(applicantName)}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${app.applicant.gender} • NID: ${Utils.escapeHtml(app.applicant.nidNumber)}</div>
        </td>
        <td>
          <div style="font-size: 0.8rem;">${Utils.escapeHtml(app.applicant.email)}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">${Utils.escapeHtml(app.applicant.phone)}</div>
        </td>
        <td>
          <div style="font-weight: 500; font-size: 0.8rem;">${Utils.escapeHtml(app.academic.department)}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${Utils.escapeHtml(app.academic.session)}</div>
        </td>
        <td>${allocInfo}</td>
        <td><span class="badge ${badgeClass}">${app.status.replace('_', ' ')}</span></td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="viewApplicationDetails('${app._id}')" title="View Application Details">
            View
          </button>
          ${canAllocate ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="openAllocateModal('${app._id}', '${Utils.escapeHtml(applicantName)}')">
              ${app.allocatedRoom ? 'Re-allocate' : 'Allocate Bed'}
            </button>
          ` : ''}
          ${canConfirm ? `
            <button type="button" class="btn btn-gold btn-sm" onclick="confirmAdmission('${app._id}', '${Utils.escapeHtml(applicantName)}')" title="Create Student Account and Confirm">
              Confirm & Admit
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination(meta = {}) {
  const infoEl = document.getElementById('paginationInfo');
  const btnContainer = document.getElementById('paginationButtons');
  if (!infoEl || !btnContainer) return;

  const total = meta.totalItems || 0;
  const current = meta.currentPage || 1;
  const pages = meta.totalPages || 1;

  infoEl.textContent = `Showing Page ${current} of ${pages} (${total} total records)`;

  btnContainer.innerHTML = `
    <button type="button" class="btn btn-outline btn-sm" ${!meta.hasPrevPage ? 'disabled' : ''} onclick="changePage(${current - 1})">
      &larr; Prev
    </button>
    <button type="button" class="btn btn-outline btn-sm" ${!meta.hasNextPage ? 'disabled' : ''} onclick="changePage(${current + 1})">
      Next &rarr;
    </button>
  `;
}

window.changePage = function(page) {
  if (page < 1) return;
  currentPage = page;
  loadApplications();
};

// View full application details modal
window.viewApplicationDetails = async function(appId) {
  UI.openModal('appDetailsModal');
  const body = document.getElementById('modalAppBody');
  const footer = document.getElementById('modalAppFooter');
  body.innerHTML = `<span class="spinner"></span>`;

  try {
    const res = await API.get(`/admissions/${appId}`);
    const app = res.data || res;
    const { applicant, academic, preferences } = app;

    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); font-size: var(--font-size-sm);">
        <div>
          <h4 style="color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 4px; margin-bottom: 8px;">Personal Information</h4>
          <p><strong>Full Name:</strong> ${applicant.firstName} ${applicant.lastName}</p>
          <p><strong>Email:</strong> ${applicant.email}</p>
          <p><strong>Phone:</strong> ${applicant.phone}</p>
          <p><strong>Gender:</strong> ${applicant.gender}</p>
          <p><strong>Blood Group:</strong> ${applicant.bloodGroup || 'N/A'}</p>
          <p><strong>NID / Birth Cert:</strong> ${applicant.nidNumber}</p>
          <p><strong>Father:</strong> ${applicant.fatherName || 'N/A'}</p>
        </div>

        <div>
          <h4 style="color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 4px; margin-bottom: 8px;">Academic & Preferences</h4>
          <p><strong>Department:</strong> ${academic.department}</p>
          <p><strong>Session:</strong> ${academic.session}</p>
          <p><strong>Program:</strong> ${academic.program}</p>
          <p><strong>Preferred Room Type:</strong> ${preferences?.roomType || 'Double'}</p>
          <p><strong>Current Status:</strong> <span class="badge ${Utils.getStatusBadgeClass(app.status)}">${app.status}</span></p>
          <p><strong>Permanent Address:</strong> ${applicant.permanentAddress?.street || 'N/A'}, ${applicant.permanentAddress?.district || ''}</p>
          <p><strong>Emergency Contact:</strong> ${applicant.emergencyContact?.name || 'N/A'} (${applicant.emergencyContact?.phone || ''})</p>
        </div>
      </div>

      ${app.statusHistory?.length ? `
        <div style="margin-top: var(--space-5);">
          <h4 style="font-size: 0.85rem; color: var(--color-navy); margin-bottom: 6px;">Status History</h4>
          <div style="background: var(--color-bg); padding: 10px; border-radius: 6px; font-size: 0.75rem;">
            ${app.statusHistory.map(h => `<div>• <strong>${h.status}</strong> (${Utils.formatDateTime(h.changedAt)}): ${h.notes || ''}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    `;

    footer.innerHTML = `
      <button type="button" class="btn btn-outline" data-dismiss="modal">Close</button>
      <button type="button" class="btn btn-danger btn-sm" onclick="updateAppStatus('${app._id}', 'rejected')">Reject</button>
      <button type="button" class="btn btn-outline-primary btn-sm" onclick="updateAppStatus('${app._id}', 'under_review')">Mark Under Review</button>
      <button type="button" class="btn btn-primary btn-sm" onclick="UI.closeModal('appDetailsModal'); openAllocateModal('${app._id}', '${applicant.firstName} ${applicant.lastName}')">Allocate Bed</button>
    `;

  } catch (err) {
    body.innerHTML = `<div style="color: var(--color-danger);">Failed to load application details.</div>`;
  }
};

window.updateAppStatus = async function(appId, newStatus) {
  try {
    await API.put(`/admissions/${appId}/status`, { status: newStatus });
    UI.showToast(`Application marked as ${newStatus}`, 'success');
    UI.closeModal('appDetailsModal');
    loadApplications();
  } catch (err) {
    UI.showToast(err.message || 'Failed to update status', 'error');
  }
};

// Open allocate modal and load available rooms
window.openAllocateModal = async function(appId, applicantName) {
  document.getElementById('allocAppId').value = appId;
  document.getElementById('allocApplicantName').value = applicantName;
  UI.openModal('allocateModal');

  const roomSelect = document.getElementById('allocRoomSelect');
  const bedSelect = document.getElementById('allocBedSelect');
  roomSelect.innerHTML = `<option value="">Loading available rooms...</option>`;
  bedSelect.innerHTML = `<option value="">First select a room</option>`;

  try {
    const res = await API.get('/rooms', { status: 'available' });
    currentRoomsList = res.data || res || [];

    // Filter rooms with vacancy
    const vacantRooms = currentRoomsList.filter(r => r.currentOccupancy < r.capacity);

    if (!vacantRooms.length) {
      roomSelect.innerHTML = `<option value="">No rooms currently have available beds!</option>`;
      return;
    }

    roomSelect.innerHTML = `
      <option value="">Choose an available room...</option>
      ${vacantRooms.map(r => `
        <option value="${r._id}">
          Room ${r.roomNumber} (Floor ${r.floor}, ${r.type.toUpperCase()}) — ${r.capacity - r.currentOccupancy} beds free
        </option>
      `).join('')}
    `;

  } catch (err) {
    roomSelect.innerHTML = `<option value="">Error loading rooms</option>`;
  }
};

window.onRoomSelected = function(roomId) {
  const bedSelect = document.getElementById('allocBedSelect');
  if (!roomId) {
    bedSelect.innerHTML = `<option value="">First select a room</option>`;
    return;
  }

  const room = currentRoomsList.find(r => r._id === roomId);
  if (!room || !room.beds) {
    bedSelect.innerHTML = `<option value="">No beds data</option>`;
    return;
  }

  const availableBeds = room.beds.filter(b => b.status === 'available');
  if (!availableBeds.length) {
    bedSelect.innerHTML = `<option value="">All beds in this room are currently occupied</option>`;
    return;
  }

  bedSelect.innerHTML = `
    <option value="">Select a bed...</option>
    ${availableBeds.map(b => `<option value="${b._id}">Bed ${b.bedNumber} (Vacant)</option>`).join('')}
  `;
};

function setupAllocateForm() {
  const form = document.getElementById('allocateForm');
  const btn = document.getElementById('saveAllocBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const appId = document.getElementById('allocAppId').value;
    const roomId = document.getElementById('allocRoomSelect').value;
    const bedId = document.getElementById('allocBedSelect').value;
    const notes = document.getElementById('allocNotes').value;

    if (!roomId || !bedId) {
      UI.showToast('Please select both a room and a specific bed.', 'warning');
      return;
    }

    UI.setLoading(btn, true, 'Allocating...');

    try {
      await API.put(`/admissions/${appId}/allocate`, { roomId, bedId, notes });
      UI.showToast('Room and bed allocated successfully! Ready to confirm admission.', 'success');
      UI.closeModal('allocateModal');
      loadApplications();
    } catch (err) {
      UI.showToast(err.message || 'Allocation failed', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

// Confirm admission & create live student account
window.confirmAdmission = function(appId, applicantName) {
  UI.confirm({
    title: 'Confirm & Admit Student',
    message: `Are you sure you want to officially admit ${applicantName}? This will create a verified Student account in MongoDB, mark the allocated bed as occupied, and issue the initial admission fee invoice.`,
    confirmText: 'Confirm Admission',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const res = await API.put(`/admissions/${appId}/confirm`);
        const data = res.data || res;
        UI.confirm({
          title: 'Student Admitted Successfully!',
          message: `Student ID: ${data.studentId}\nAllocated: Room ${data.roomNumber}, Bed ${data.bedNumber}\nInvoice: ${data.invoiceNumber}\n\nThe student can now sign in using their registered email and default password.`,
          confirmText: 'Done',
          cancelText: 'Close',
          onConfirm: () => loadApplications()
        });
        loadApplications();
      } catch (err) {
        UI.showToast(err.message || 'Failed to confirm admission', 'error');
      }
    }
  });
};
