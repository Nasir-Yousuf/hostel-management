/**
 * NIYD Hostel Management System - Room Inventory Logic
 */

let allBuildings = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadBuildings();
  loadRooms();
  setupAddRoomForm();
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

// Load buildings list into dropdowns
async function loadBuildings() {
  try {
    const res = await API.get('/rooms/buildings');
    allBuildings = res.data || res || [];

    const filterSelect = document.getElementById('buildingFilter');
    const modalSelect = document.getElementById('addBuildingId');

    if (filterSelect) {
      allBuildings.forEach(b => {
        filterSelect.innerHTML += `<option value="${b._id}">${b.name}</option>`;
      });
    }

    if (modalSelect) {
      modalSelect.innerHTML = allBuildings.map(b => `<option value="${b._id}">${b.name}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load buildings:', err);
  }
}

// Load and render room cards
async function loadRooms() {
  const container = document.getElementById('roomsContainer');
  const countBadge = document.getElementById('roomCountBadge');
  const buildingId = document.getElementById('buildingFilter')?.value || '';
  const floor = document.getElementById('floorFilter')?.value || '';
  const status = document.getElementById('statusFilter')?.value || 'all';

  container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;"><span class="spinner"></span></div>`;

  try {
    const res = await API.get('/rooms', {
      buildingId,
      floor,
      status
    });

    const rooms = res.data || res || [];
    if (countBadge) countBadge.textContent = `Showing ${rooms.length} rooms`;
    renderRoomsGrid(rooms);

  } catch (err) {
    console.error('Failed to load rooms:', err);
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 3rem;">Failed to load room inventory.</div>`;
  }
}

function renderRoomsGrid(rooms = []) {
  const container = document.getElementById('roomsContainer');
  if (!container) return;

  if (!rooms.length) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 3rem;">No rooms found matching filters.</div>`;
    return;
  }

  container.innerHTML = rooms.map((room) => {
    const occupancyPercent = room.capacity > 0 ? Math.round((room.currentOccupancy / room.capacity) * 100) : 0;
    const isFull = room.currentOccupancy >= room.capacity;
    const statusBadge = Utils.getStatusBadgeClass(room.status);

    const beds = room.beds || [];
    const amenities = room.amenities || [];

    return `
      <div class="room-card">
        <div class="room-card-header">
          <div>
            <span class="room-number">${Utils.escapeHtml(room.roomNumber)}</span>
            <div class="room-type-tag">${room.building?.name || 'Block'} • Floor ${room.floor} • ${room.type}</div>
          </div>
          <span class="badge ${statusBadge}">${room.status}</span>
        </div>

        <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); display: flex; justify-content: space-between; align-items: center;">
          <span>Occupancy: <strong>${room.currentOccupancy} / ${room.capacity}</strong> beds</span>
          <span>Rent: <strong>${Utils.formatCurrency(room.monthlyRent)}</strong>/mo</span>
        </div>

        <div class="occupancy-bar-wrapper">
          <div class="occupancy-bar ${isFull ? 'full' : ''}" style="width: ${occupancyPercent}%;"></div>
        </div>

        <!-- Bed Chips -->
        <div class="bed-chips-grid">
          ${beds.map(bed => {
            const isOccupied = bed.status === 'occupied';
            const occupantName = bed.currentOccupant?.user?.firstName || 'Vacant';
            return `
              <div class="bed-chip ${isOccupied ? 'occupied' : 'available'}" title="${isOccupied ? `Occupant: ${bed.currentOccupant?.studentId || ''}` : 'Vacant Bed'}">
                Bed ${bed.bedNumber}: ${isOccupied ? `👤 ${occupantName}` : 'Available'}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Amenities Tags -->
        <div style="display: flex; gap: 4px; margin-top: var(--space-3); flex-wrap: wrap;">
          ${amenities.slice(0, 4).map(a => `<span style="font-size: 0.68rem; background: var(--color-bg); padding: 1px 6px; border-radius: 4px; color: var(--color-text-secondary);">${a.replace('_', ' ')}</span>`).join('')}
        </div>

        <!-- Action footer -->
        <div style="margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: var(--space-2); border-top: 1px solid var(--color-border-light); padding-top: var(--space-3);">
          <button type="button" class="btn btn-outline btn-sm" onclick="editRoomStatus('${room._id}', '${room.status}')">
            Set Status
          </button>
          ${room.currentOccupancy === 0 ? `
            <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-danger);" onclick="deleteEmptyRoom('${room._id}', '${room.roomNumber}')">
              Delete
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.openAddRoomModal = function() {
  UI.openModal('addRoomModal');
};

function setupAddRoomForm() {
  const form = document.getElementById('addRoomForm');
  const btn = document.getElementById('saveRoomBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const buildingId = document.getElementById('addBuildingId').value;
    const roomNumber = document.getElementById('addRoomNumber').value.trim();
    const floor = document.getElementById('addFloor').value;
    const type = document.getElementById('addType').value;
    const capacity = document.getElementById('addCapacity').value;
    const monthlyRent = document.getElementById('addRent').value;

    const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenity"]:checked')).map(el => el.value);

    UI.setLoading(btn, true, 'Creating Room...');

    try {
      await API.post('/rooms', {
        buildingId,
        roomNumber,
        floor,
        type,
        capacity,
        monthlyRent,
        amenities: checkedAmenities
      });

      UI.showToast(`Room ${roomNumber} created with ${capacity} beds!`, 'success');
      UI.closeModal('addRoomModal');
      form.reset();
      loadRooms();
    } catch (err) {
      UI.showToast(err.message || 'Failed to create room', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

window.editRoomStatus = function(roomId, currentStatus) {
  UI.confirm({
    title: 'Update Room Status',
    message: 'Set room to Maintenance or Available mode:',
    confirmText: currentStatus === 'maintenance' ? 'Set Available' : 'Set Under Maintenance',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const nextStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        await API.put(`/rooms/${roomId}`, { status: nextStatus });
        UI.showToast(`Room status updated to ${nextStatus}`, 'success');
        loadRooms();
      } catch (err) {
        UI.showToast(err.message || 'Failed to update room', 'error');
      }
    }
  });
};

window.deleteEmptyRoom = function(roomId, roomNumber) {
  UI.confirm({
    title: `Delete Room ${roomNumber}?`,
    message: `Are you sure you want to permanently delete room ${roomNumber}? All unoccupied bed slots will also be removed.`,
    confirmText: 'Delete Room',
    cancelText: 'Cancel',
    isDanger: true,
    onConfirm: async () => {
      try {
        await API.delete(`/rooms/${roomId}`);
        UI.showToast(`Room ${roomNumber} deleted`, 'success');
        loadRooms();
      } catch (err) {
        UI.showToast(err.message || 'Failed to delete room', 'error');
      }
    }
  });
};
