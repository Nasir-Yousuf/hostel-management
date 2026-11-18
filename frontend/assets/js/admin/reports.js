/**
 * NIYD Hostel Management System - Reports & Analytics Logic
 */

let methodChartInstance = null;
let currentOccupancyReport = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadOccupancyReport();
  loadFinancialReport();
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

// Load Occupancy Report
async function loadOccupancyReport() {
  const summaryEl = document.getElementById('occupancyReportSummary');
  const tbody = document.querySelector('#floorBreakdownTable tbody');

  try {
    const res = await API.get('/reports/occupancy');
    currentOccupancyReport = res.data || res;
    const { summary, floorBreakdown } = currentOccupancyReport;

    summaryEl.innerHTML = `
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Total Rooms</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-navy);">${summary.totalRooms}</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Total Bed Capacity</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary);">${summary.totalCapacity} Beds</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Occupied Beds</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-navy);">${summary.totalOccupied} Beds</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Occupancy Rate</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-gold-dark);">${summary.occupancyPercentage}%</div>
      </div>
    `;

    const floors = Object.keys(floorBreakdown || {});
    tbody.innerHTML = floors.map((fKey) => {
      const f = floorBreakdown[fKey];
      const rate = f.capacity > 0 ? Math.round((f.occupied / f.capacity) * 100) : 0;
      return `
        <tr>
          <td><strong>${fKey}</strong></td>
          <td>${f.rooms} Rooms</td>
          <td>${f.capacity} Beds</td>
          <td>${f.occupied}</td>
          <td>${f.available}</td>
          <td><span class="badge ${rate >= 90 ? 'badge-danger' : 'badge-success'}">${rate}%</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    summaryEl.innerHTML = `<div style="color: var(--color-danger);">Failed to load occupancy report.</div>`;
  }
}

// Load Financial Report
async function loadFinancialReport() {
  const summaryEl = document.getElementById('financialReportSummary');
  const methodListEl = document.getElementById('methodBreakdownList');

  try {
    const res = await API.get('/reports/financial');
    const data = res.data || res;

    summaryEl.innerHTML = `
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Total Invoiced</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-navy);">${Utils.formatCurrency(data.totalBilled)}</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Total Collected</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-success);">${Utils.formatCurrency(data.totalCollected)}</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Outstanding Due</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-danger);">${Utils.formatCurrency(data.totalOutstanding)}</div>
      </div>
      <div style="background: var(--color-bg); padding: var(--space-4); border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase;">Collection Rate</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-gold-dark);">${data.collectionRate}%</div>
      </div>
    `;

    const methods = Object.keys(data.methodBreakdown || {});
    methodListEl.innerHTML = methods.map((m) => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--color-border-light);">
        <span style="text-transform: capitalize;">${m.replace('_', ' ')}:</span>
        <strong>${Utils.formatCurrency(data.methodBreakdown[m])}</strong>
      </div>
    `).join('');

    renderPaymentMethodChart(data.methodBreakdown);

  } catch (err) {
    summaryEl.innerHTML = `<div style="color: var(--color-danger);">Failed to load financial report.</div>`;
  }
}

function renderPaymentMethodChart(breakdown = {}) {
  const canvas = document.getElementById('paymentMethodChart');
  if (!canvas) return;

  if (methodChartInstance) methodChartInstance.destroy();

  const labels = Object.keys(breakdown).map(k => k.replace('_', ' ').toUpperCase());
  const values = Object.values(breakdown);

  methodChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['bKash', 'Bank Transfer', 'Cash'],
      datasets: [
        {
          data: values.length ? values : [50000, 30000, 15000],
          backgroundColor: ['#D12053', '#17324D', '#146B45', '#D5A63C']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

// Client-side CSV export
window.exportDataCSV = function() {
  if (!currentOccupancyReport || !currentOccupancyReport.rooms) {
    UI.showToast('Please wait for reports to finish loading.', 'warning');
    return;
  }

  const rooms = currentOccupancyReport.rooms;
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Room Number,Floor,Type,Capacity,Current Occupancy,Available Beds,Monthly Rent (BDT),Status\n';

  rooms.forEach((r) => {
    const free = Math.max(0, r.capacity - r.currentOccupancy);
    csvContent += `"${r.roomNumber}",${r.floor},"${r.type}",${r.capacity},${r.currentOccupancy},${free},${r.monthlyRent},"${r.status}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `NIYD_Hostel_Occupancy_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  UI.showToast('CSV export downloaded successfully', 'success');
};
