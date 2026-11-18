/**
 * NIYD Hostel Management System - Student Profile Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STUDENT])) return;

  loadProfile();
  setupPasswordForm();
});

async function loadProfile() {
  const container = document.getElementById('studentProfileDetails');

  try {
    const res = await API.get('/auth/me');
    const user = res.data?.user || res.user;
    const student = user.profile;

    if (!student) {
      container.innerHTML = `<div style="color: var(--color-danger);">Student profile record not found.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); font-size: var(--font-size-sm);">
        <div>
          <h4 style="color: var(--color-navy); margin-bottom: 8px;">Personal & Identification</h4>
          <p><strong>Full Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Student ID:</strong> <span style="color: var(--color-primary); font-weight: 700;">${student.studentId}</span></p>
          <p><strong>Email Address:</strong> ${user.email}</p>
          <p><strong>Phone Number:</strong> ${user.phone || 'N/A'}</p>
          <p><strong>Gender:</strong> <span style="text-transform: capitalize;">${student.gender}</span></p>
          <p><strong>Blood Group:</strong> ${student.bloodGroup || 'N/A'}</p>
          <p><strong>National ID No:</strong> ${student.nidNumber || 'N/A'}</p>
        </div>
        <div>
          <h4 style="color: var(--color-navy); margin-bottom: 8px;">Academic & Residence</h4>
          <p><strong>Department:</strong> ${student.department}</p>
          <p><strong>Program:</strong> ${student.program || 'Diploma in Youth Development'}</p>
          <p><strong>Academic Session:</strong> ${student.session}</p>
          <p><strong>Current Year:</strong> Year ${student.year}</p>
          <p><strong>Permanent Address:</strong> ${student.permanentAddress?.street || 'N/A'}, ${student.permanentAddress?.district || ''}</p>
          <p><strong>Emergency Contact:</strong> ${student.emergencyContact?.name || 'N/A'} (${student.emergencyContact?.phone || ''})</p>
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger);">Failed to load profile.</div>`;
  }
}

function setupPasswordForm() {
  const form = document.getElementById('changePasswordForm');
  const btn = document.getElementById('savePassBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPass').value;
    const newPassword = document.getElementById('newPass').value;
    const confirmPassword = document.getElementById('confirmPass').value;

    if (newPassword !== confirmPassword) {
      UI.showToast('New passwords do not match.', 'warning');
      return;
    }

    UI.setLoading(btn, true, 'Updating...');

    try {
      await API.put('/auth/change-password', { currentPassword, newPassword });
      UI.showToast('Password changed successfully!', 'success');
      form.reset();
    } catch (err) {
      UI.showToast(err.message || 'Failed to change password', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}
