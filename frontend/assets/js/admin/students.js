/**
 * NIYD Hostel Management System - Student Directory Logic
 */

let currentPage = 1;
let currentStudentData = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadStudents();
  initProfileTabs();

  // Search input debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      currentPage = 1;
      loadStudents();
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

// Fetch students
async function loadStudents() {
  const tbody = document.querySelector('#studentsTable tbody');
  const dept = document.getElementById('deptFilter')?.value || 'all';
  const status = document.getElementById('statusFilter')?.value || 'all';
  const search = document.getElementById('searchInput')?.value || '';

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;"><span class="spinner"></span></td></tr>`;

  try {
    const res = await API.get('/students', {
      page: currentPage,
      limit: 10,
      department: dept,
      status,
      search
    });

    const data = res.data || res;
    renderStudentsTable(data.students || []);
    renderPagination(data.pagination || {});

  } catch (err) {
    console.error('Failed to load students:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 2rem;">Failed to load student records from database.</td></tr>`;
  }
}

function renderStudentsTable(students = []) {
  const tbody = document.querySelector('#studentsTable tbody');
  if (!tbody) return;

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">No registered students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s) => {
    const fullName = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'N/A';
    const email = s.user ? s.user.email : 'N/A';
    const phone = s.user?.phone || 'N/A';
    const avatarLetter = (s.user?.firstName || 'S')[0].toUpperCase();

    const roomInfo = s.allocation?.room
      ? `<span class="badge badge-gold">Room ${s.allocation.room.roomNumber} (Bed ${s.allocation.bed?.bedNumber || '—'})</span>`
      : `<span style="color: var(--color-text-muted); font-size: 0.75rem;">Unassigned</span>`;

    const statusBadge = Utils.getStatusBadgeClass(s.status);

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div class="stat-icon primary" style="width: 34px; height: 34px; font-size: 0.85rem; border-radius: 50%;">
              ${avatarLetter}
            </div>
            <div>
              <div style="font-weight: 600; color: var(--color-navy);">${Utils.escapeHtml(fullName)}</div>
              <div style="font-size: 0.72rem; color: var(--color-text-secondary);">${s.gender} • Joined ${Utils.formatDate(s.admissionDate)}</div>
            </div>
          </div>
        </td>
        <td><strong style="color: var(--color-primary); font-size: 0.82rem;">${Utils.escapeHtml(s.studentId)}</strong></td>
        <td>
          <div style="font-size: 0.8rem; font-weight: 500;">${Utils.escapeHtml(s.department)}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">${Utils.escapeHtml(s.session)} (Year ${s.year})</div>
        </td>
        <td>${roomInfo}</td>
        <td>
          <div style="font-size: 0.8rem;">${Utils.escapeHtml(email)}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">${Utils.escapeHtml(phone)}</div>
        </td>
        <td><span class="badge ${statusBadge}">${s.status}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-outline-primary btn-sm" onclick="openStudentProfile('${s._id}')">
            View Profile
          </button>
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

  infoEl.textContent = `Showing Page ${current} of ${pages} (${total} total students)`;

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
  loadStudents();
};

// Open Student Profile Modal
window.openStudentProfile = async function(studentId) {
  UI.openModal('studentProfileModal');
  const tabContent = document.getElementById('studentTabContent');
  tabContent.innerHTML = `<span class="spinner"></span>`;

  try {
    const res = await API.get(`/students/${studentId}`);
    currentStudentData = res.data || res;
    const { student } = currentStudentData;

    document.getElementById('modalStudentName').textContent = `${student.user.firstName} ${student.user.lastName}`;
    document.getElementById('modalStudentSub').textContent = `Student ID: ${student.studentId} • Department: ${student.department}`;
    document.getElementById('modalAvatar').textContent = (student.user.firstName[0] || 'S').toUpperCase();

    // Reset tabs to first tab (personal)
    document.querySelectorAll('.profile-tab-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });

    renderTabContent('personal');

  } catch (err) {
    tabContent.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Failed to load student profile.</div>`;
  }
};

function initProfileTabs() {
  document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTabContent(btn.getAttribute('data-tab'));
    });
  });
}

function renderTabContent(tabName) {
  if (!currentStudentData) return;
  const { student, roommates, invoices, payments, attendance, maintenance } = currentStudentData;
  const container = document.getElementById('studentTabContent');

  switch (tabName) {
    case 'personal':
      container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); font-size: var(--font-size-sm);">
          <div>
            <h4 style="color: var(--color-navy); margin-bottom: 8px;">Identity & Demographics</h4>
            <p><strong>National ID / Birth Cert:</strong> ${student.nidNumber || 'N/A'}</p>
            <p><strong>Gender:</strong> ${student.gender}</p>
            <p><strong>Blood Group:</strong> ${student.bloodGroup || 'N/A'}</p>
            <p><strong>Father's Name:</strong> ${student.fatherName || 'N/A'}</p>
            <p><strong>Mother's Name:</strong> ${student.motherName || 'N/A'}</p>
            <p><strong>Emergency Contact:</strong> ${student.emergencyContact?.name || 'N/A'} (${student.emergencyContact?.phone || ''} - ${student.emergencyContact?.relation || ''})</p>
          </div>
          <div>
            <h4 style="color: var(--color-navy); margin-bottom: 8px;">Address Information</h4>
            <p><strong>Permanent Address:</strong> ${student.permanentAddress?.street || 'N/A'}, ${student.permanentAddress?.district || ''}</p>
            <p><strong>Present Address:</strong> ${student.presentAddress?.street || 'N/A'}, ${student.presentAddress?.district || ''}</p>
            <p><strong>Email:</strong> ${student.user.email}</p>
            <p><strong>Mobile:</strong> ${student.user.phone || 'N/A'}</p>
            <p><strong>Account Status:</strong> <span class="badge ${Utils.getStatusBadgeClass(student.status)}">${student.status}</span></p>
          </div>
        </div>
      `;
      break;

    case 'academic':
      container.innerHTML = `
        <div style="font-size: var(--font-size-sm); max-width: 600px;">
          <p><strong>Academic Department:</strong> ${student.department}</p>
          <p><strong>Program Enrolled:</strong> ${student.program || 'Diploma in Youth Development'}</p>
          <p><strong>Academic Session:</strong> ${student.session}</p>
          <p><strong>Academic Year:</strong> Year ${student.year}</p>
          <p><strong>Admission Date:</strong> ${Utils.formatDate(student.admissionDate)}</p>
        </div>
      `;
      break;

    case 'room':
      const alloc = student.allocation;
      if (!alloc || !alloc.room) {
        container.innerHTML = `<div class="empty-state"><p>Student has not been allocated to a room yet.</p></div>`;
        return;
      }

      container.innerHTML = `
        <div style="margin-bottom: var(--space-6); background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-lg);">
          <h4 style="color: var(--color-navy); margin-bottom: 6px;">Current Residential Allocation</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); font-size: var(--font-size-sm);">
            <div><strong>Hostel:</strong> ${alloc.hostel?.name || 'Main Hostel'}</div>
            <div><strong>Building:</strong> ${alloc.building?.name || 'Block A'}</div>
            <div><strong>Room Number:</strong> Room ${alloc.room.roomNumber} (Floor ${alloc.room.floor})</div>
            <div><strong>Assigned Bed:</strong> Bed ${alloc.bed?.bedNumber || 'A'}</div>
          </div>
        </div>

        <h4 style="font-size: var(--font-size-base); color: var(--color-navy); margin-bottom: 8px;">Roommates in Room ${alloc.room.roomNumber}</h4>
        ${roommates.length ? `
          <div class="table-responsive" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Roommate Name</th>
                  <th>Student ID</th>
                  <th>Bed</th>
                  <th>Department</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                ${roommates.map(r => `
                  <tr>
                    <td><strong>${r.student.user.firstName} ${r.student.user.lastName}</strong></td>
                    <td>${r.student.studentId}</td>
                    <td><span class="badge badge-neutral">Bed ${r.bed?.bedNumber}</span></td>
                    <td>${r.student.department}</td>
                    <td>${r.student.user.phone || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">No other roommates currently allocated to this room.</p>`}
      `;
      break;

    case 'fees':
      container.innerHTML = `
        <h4 style="font-size: var(--font-size-base); color: var(--color-navy); margin-bottom: 8px;">Billing & Invoices</h4>
        ${invoices.length ? `
          <div class="table-responsive" style="border: none; margin-bottom: var(--space-6);">
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map(inv => `
                  <tr>
                    <td><strong>${inv.invoiceNumber}</strong></td>
                    <td>${Utils.formatDate(inv.dueDate)}</td>
                    <td>${Utils.formatCurrency(inv.totalAmount)}</td>
                    <td>${Utils.formatCurrency(inv.paidAmount || 0)}</td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(inv.status)}">${inv.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--space-6);">No invoices issued yet.</p>`}

        <h4 style="font-size: var(--font-size-base); color: var(--color-navy); margin-bottom: 8px;">Payment Records</h4>
        ${payments.length ? `
          <div class="table-responsive" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => `
                  <tr>
                    <td><strong style="color: var(--color-primary);">${p.receiptNumber}</strong></td>
                    <td>${Utils.formatDate(p.paymentDate)}</td>
                    <td style="text-transform: uppercase;">${p.method}</td>
                    <td>${Utils.formatCurrency(p.amount)}</td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(p.status)}">${p.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">No payments recorded yet.</p>`}
      `;
      break;

    case 'attendance':
      container.innerHTML = `
        <h4 style="font-size: var(--font-size-base); color: var(--color-navy); margin-bottom: 8px;">Recent Attendance Records</h4>
        ${attendance.length ? `
          <div class="table-responsive" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${attendance.map(a => `
                  <tr>
                    <td>${Utils.formatDate(a.date)}</td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(a.status)}">${a.status}</span></td>
                    <td>${a.checkIn ? Utils.formatDateTime(a.checkIn) : '—'}</td>
                    <td>${a.checkOut ? Utils.formatDateTime(a.checkOut) : '—'}</td>
                    <td style="color: var(--color-text-muted); font-size: 0.75rem;">${a.notes || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">No attendance recorded yet for this student.</p>`}
      `;
      break;

    case 'maintenance':
      container.innerHTML = `
        <h4 style="font-size: var(--font-size-base); color: var(--color-navy); margin-bottom: 8px;">Submitted Complaints & Repairs</h4>
        ${maintenance.length ? `
          <div class="table-responsive" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Req No.</th>
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                ${maintenance.map(m => `
                  <tr>
                    <td><strong>${m.requestNumber}</strong></td>
                    <td>${Utils.escapeHtml(m.title)}</td>
                    <td style="text-transform: capitalize;">${m.category}</td>
                    <td><span class="badge ${m.priority === 'urgent' ? 'badge-danger' : 'badge-neutral'}">${m.priority}</span></td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(m.status)}">${m.status}</span></td>
                    <td>${Utils.formatDate(m.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">No maintenance complaints submitted.</p>`}
      `;
      break;
  }
}
