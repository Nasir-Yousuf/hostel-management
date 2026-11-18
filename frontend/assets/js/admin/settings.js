/**
 * NIYD Hostel Management System - Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadSettings();
  setupForms();
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

async function loadSettings() {
  try {
    const res = await API.get('/settings');
    const settings = res.data || res || {};

    if (settings.gate_timings) {
      document.getElementById('gateOpenTime').value = settings.gate_timings.openTime || '06:00';
      document.getElementById('gateCloseTime').value = settings.gate_timings.closeTime || '21:30';
      document.getElementById('lateEntryFee').value = settings.gate_timings.lateEntryFee || 200;
    }

    if (settings.visitor_policy) {
      document.getElementById('visitorFrom').value = settings.visitor_policy.visitingHoursFrom || '16:00';
      document.getElementById('visitorTo').value = settings.visitor_policy.visitingHoursTo || '19:00';
      document.getElementById('visitorLocations').value = (settings.visitor_policy.allowedLocations || []).join(', ');
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

function setupForms() {
  // Gate Timings
  const timingsForm = document.getElementById('gateTimingsForm');
  if (timingsForm) {
    timingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const openTime = document.getElementById('gateOpenTime').value;
      const closeTime = document.getElementById('gateCloseTime').value;
      const lateEntryFee = document.getElementById('lateEntryFee').value;

      try {
        await API.put('/settings/gate_timings', {
          value: { openTime, closeTime, lateEntryFee: Number(lateEntryFee), curfewEnforced: true },
          category: 'timing',
          description: 'Hostel gate operating and curfew hours'
        });
        UI.showToast('Gate curfew schedule saved!', 'success');
      } catch (err) {
        UI.showToast(err.message || 'Failed to save timings', 'error');
      }
    });
  }

  // Visitor Policy
  const visitorForm = document.getElementById('visitorPolicyForm');
  if (visitorForm) {
    visitorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const visitingHoursFrom = document.getElementById('visitorFrom').value;
      const visitingHoursTo = document.getElementById('visitorTo').value;
      const locations = document.getElementById('visitorLocations').value.split(',').map(s => s.trim());

      try {
        await API.put('/settings/visitor_policy', {
          value: { visitingHoursFrom, visitingHoursTo, allowedLocations: locations },
          category: 'rules',
          description: 'Visitor entry hours and permitted lounges'
        });
        UI.showToast('Visitor policy saved!', 'success');
      } catch (err) {
        UI.showToast(err.message || 'Failed to save policy', 'error');
      }
    });
  }
}
