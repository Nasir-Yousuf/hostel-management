/**
 * NIYD Hostel Management System - Student My Room Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.STUDENT])) return;

  loadMyRoomData();
  setupRoomChangeForm();
});

async function loadMyRoomData() {
  const roomBody = document.getElementById('myRoomDetailsBody');
  const roommatesTbody = document.querySelector('#roommatesTable tbody');

  try {
    const res = await API.get('/students/me/room');
    const data = res.data || res;

    if (!data.hasAllocation) {
      roomBody.innerHTML = `<div class="empty-state"><p>You do not have an active room allocation yet.</p></div>`;
      roommatesTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No roommates.</td></tr>`;
      return;
    }

    const { room, bed, building, hostel, roommates, pendingChangeRequest } = data;

    // Room info
    roomBody.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-6); font-size: var(--font-size-sm);">
        <div>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase;">Hostel & Block</span>
          <div style="font-weight: 700; color: var(--color-navy); font-size: 1.05rem;">${building?.name || 'Block A'}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${hostel?.name || 'Main Residential'}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase;">Room & Floor</span>
          <div style="font-weight: 700; color: var(--color-primary); font-size: 1.05rem;">Room ${room.roomNumber}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">Floor Level ${room.floor}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase;">My Assigned Bed</span>
          <div style="font-weight: 700; color: var(--color-gold-dark); font-size: 1.05rem;">Bed Slot ${bed?.bedNumber || 'A'}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: capitalize;">${room.type} Room</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase;">Monthly Accommodation Fee</span>
          <div style="font-weight: 700; color: var(--color-navy); font-size: 1.05rem;">${Utils.formatCurrency(room.monthlyRent || 2500)}</div>
          <div style="font-size: 0.75rem; color: var(--color-success);">Inclusive of Utilities</div>
        </div>
      </div>

      <div style="margin-top: var(--space-5); border-top: 1px solid var(--color-border-light); padding-top: var(--space-4);">
        <strong style="font-size: 0.8rem; color: var(--color-navy);">Room Amenities:</strong>
        <div style="display: flex; gap: var(--space-2); margin-top: 6px; flex-wrap: wrap;">
          ${(room.amenities || []).map(a => `<span class="badge badge-neutral">${a.replace('_', ' ')}</span>`).join('')}
        </div>
      </div>
    `;

    // Roommates list
    if (!roommates || !roommates.length) {
      roommatesTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No other roommates currently assigned to this room.</td></tr>`;
    } else {
      roommatesTbody.innerHTML = roommates.map((r) => `
        <tr>
          <td><strong style="color: var(--color-navy);">${r.student.user.firstName} ${r.student.user.lastName}</strong></td>
          <td>${r.student.studentId}</td>
          <td><span class="badge badge-gold">Bed ${r.bed?.bedNumber || '—'}</span></td>
          <td>${r.student.department}</td>
          <td>${r.student.user.phone || 'N/A'}</td>
        </tr>
      `).join('');
    }

    // Pending change request check
    if (pendingChangeRequest) {
      const alertBox = document.getElementById('existingRequestAlert');
      const submitBtn = document.getElementById('submitChangeBtn');
      const reasonBox = document.getElementById('changeReason');

      if (alertBox) alertBox.style.display = 'block';
      if (submitBtn) submitBtn.disabled = true;
      if (reasonBox) {
        reasonBox.value = pendingChangeRequest.reason;
        reasonBox.disabled = true;
      }
    }

  } catch (err) {
    roomBody.innerHTML = `<div style="color: var(--color-danger);">Failed to load room details.</div>`;
  }
}

function setupRoomChangeForm() {
  const form = document.getElementById('roomChangeForm');
  const btn = document.getElementById('submitChangeBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = document.getElementById('changeReason').value.trim();

    UI.setLoading(btn, true, 'Submitting...');

    try {
      await API.post('/students/me/room-change', { reason });
      UI.showToast('Room change request submitted for Warden review!', 'success');
      loadMyRoomData();
    } catch (err) {
      UI.showToast(err.message || 'Submission failed', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}
