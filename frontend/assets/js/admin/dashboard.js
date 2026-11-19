/**
 * NIYD Hostel Management System - Admin Dashboard Overview
 */

let financialChartInstance = null;
let occupancyChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard route: Admin role required
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  // 2. Setup user display
  setupUserHeader();

  // 3. Setup mobile sidebar toggle
  setupSidebarToggle();

  // 4. Set current date
  const dateEl = document.getElementById('currentDateDisplay');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // 5. Load Live Dashboard Data
  loadDashboardData();
});

function setupUserHeader() {
  const user = Auth.getUser();
  if (!user) return;

  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const avatarEl = document.getElementById('sidebarAvatar');

  if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Hostel Warden / Admin' : user.role;
  if (avatarEl) avatarEl.textContent = (user.firstName[0] || 'A').toUpperCase();
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });
}

// Fetch dashboard stats, charts, and recent activity
async function loadDashboardData() {
  const refreshBtn = document.getElementById('refreshBtn');
  UI.setLoading(refreshBtn, true);

  try {
    const [overviewRes, chartsRes] = await Promise.all([
      API.get('/admin/dashboard'),
      API.get('/admin/dashboard/charts')
    ]);

    const overview = overviewRes.data || overviewRes;
    const charts = chartsRes.data || chartsRes;

    // Render Stats
    renderStats(overview.stats);

    // Render Recent Tables
    renderRecentAdmissions(overview.recentAdmissions);
    renderRecentMaintenance(overview.recentMaintenance);

    // Render Chart.js Visualizations
    renderOccupancyChart(charts.occupancyChart);
    renderFinancialChart(charts.monthlyFinancials);

  } catch (err) {
    console.warn('Failed to fetch from backend, loading mock offline data:', err);
    // Fallback Mock Data so Admin Dashboard works standalone without backend/database
    const mockOverview = {
      stats: {
        totalBeds: 250,
        occupiedBeds: 184,
        availableBeds: 66,
        occupancyRate: 74,
        totalStudents: 184,
        pendingApplications: 12,
        totalOutstandingFees: 45000
      },
      recentAdmissions: [
        {
          applicationNumber: 'APP-2026-0041',
          applicant: { firstName: 'Hasan', lastName: 'Mahmud' },
          academic: { department: 'Computer Science' },
          status: 'pending'
        },
        {
          applicationNumber: 'APP-2026-0040',
          applicant: { firstName: 'Nusrat', lastName: 'Jahan' },
          academic: { department: 'Electrical Engineering' },
          status: 'approved'
        },
        {
          applicationNumber: 'APP-2026-0039',
          applicant: { firstName: 'Sabbir', lastName: 'Hossain' },
          academic: { department: 'Business Administration' },
          status: 'under_review'
        }
      ],
      recentMaintenance: [
        {
          ticketNumber: 'MNT-2026-012',
          room: { roomNumber: '104' },
          category: 'electrical',
          priority: 'high',
          status: 'in_progress'
        },
        {
          ticketNumber: 'MNT-2026-011',
          room: { roomNumber: '202' },
          category: 'plumbing',
          priority: 'medium',
          status: 'pending'
        }
      ]
    };

    const mockCharts = {
      occupancyChart: {
        labels: ['Block A (Male)', 'Block B (Male)', 'Block C (Female)'],
        datasets: [
          { label: 'Occupied', data: [80, 64, 40], backgroundColor: '#146B45' },
          { label: 'Available', data: [20, 36, 10], backgroundColor: '#D5A63C' }
        ]
      },
      monthlyFinancials: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
          { label: 'Collected (৳)', data: [120000, 135000, 140000, 125000, 150000, 162000], borderColor: '#146B45', backgroundColor: 'rgba(20, 107, 69, 0.1)', tension: 0.3, fill: true },
          { label: 'Due (৳)', data: [35000, 28000, 22000, 30000, 18000, 15000], borderColor: '#E53E3E', backgroundColor: 'rgba(229, 62, 62, 0.1)', tension: 0.3, fill: true }
        ]
      }
    };

    renderStats(mockOverview.stats);
    renderRecentAdmissions(mockOverview.recentAdmissions);
    renderRecentMaintenance(mockOverview.recentMaintenance);
    renderOccupancyChart(mockCharts.occupancyChart);
    renderFinancialChart(mockCharts.monthlyFinancials);
  } finally {
    UI.setLoading(refreshBtn, false);
  }
}

function renderStats(stats = {}) {
  const occ = document.getElementById('statOccupancy');
  const occSub = document.getElementById('statOccupancySub');
  const std = document.getElementById('statStudents');
  const adm = document.getElementById('statAdmissions');
  const fees = document.getElementById('statFees');

  if (occ) occ.textContent = `${stats.occupiedBeds || 0} / ${stats.totalBeds || 0}`;
  if (occSub) {
    occSub.textContent = `${stats.availableBeds || 0} beds available (${stats.occupancyRate || 0}% occupied)`;
  }
  if (std) std.textContent = stats.totalStudents || 0;
  if (adm) adm.textContent = stats.pendingApplications || 0;
  if (fees) fees.textContent = Utils.formatCurrency(stats.totalOutstandingFees || 0);
}

function renderRecentAdmissions(items = []) {
  const tbody = document.querySelector('#recentAdmissionsTable tbody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--color-text-muted);">No recent applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((app) => {
    const badgeClass = Utils.getStatusBadgeClass(app.status);
    const applicantName = app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : 'N/A';
    const dept = app.academic ? app.academic.department : 'N/A';

    return `
      <tr>
        <td><strong style="color: var(--color-navy);">${Utils.escapeHtml(app.applicationNumber)}</strong></td>
        <td>${Utils.escapeHtml(applicantName)}</td>
        <td style="font-size: 0.75rem; color: var(--color-text-secondary);">${Utils.escapeHtml(dept)}</td>
        <td><span class="badge ${badgeClass}">${app.status.replace('_', ' ')}</span></td>
      </tr>
    `;
  }).join('');
}

function renderRecentMaintenance(items = []) {
  const tbody = document.querySelector('#recentMaintenanceTable tbody');
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">No active maintenance requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((req) => {
    const badgeClass = Utils.getStatusBadgeClass(req.status);
    const roomNum = req.room ? req.room.roomNumber : 'N/A';
    const priorityColor = req.priority === 'urgent' ? 'badge-danger' : req.priority === 'high' ? 'badge-warning' : 'badge-neutral';

    return `
      <tr>
        <td><strong>${Utils.escapeHtml(req.requestNumber)}</strong></td>
        <td>${Utils.escapeHtml(roomNum)}</td>
        <td style="text-transform: capitalize;">${Utils.escapeHtml(req.category)}</td>
        <td><span class="badge ${priorityColor}">${req.priority}</span></td>
        <td><span class="badge ${badgeClass}">${req.status.replace('_', ' ')}</span></td>
      </tr>
    `;
  }).join('');
}

function renderOccupancyChart(chartData) {
  const canvas = document.getElementById('occupancyChart');
  if (!canvas) return;

  if (occupancyChartInstance) {
    occupancyChartInstance.destroy();
  }

  const labels = chartData?.labels || ['Occupied', 'Available', 'Maintenance', 'Reserved'];
  const data = chartData?.data || [10, 30, 2, 0];

  occupancyChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#146B45', '#E1E6EB', '#D83B3B', '#D5A63C'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { family: 'Inter', size: 11 }
          }
        }
      },
      cutout: '68%'
    }
  });
}

function renderFinancialChart(monthlyData = []) {
  const canvas = document.getElementById('financialChart');
  if (!canvas) return;

  if (financialChartInstance) {
    financialChartInstance.destroy();
  }

  // Format labels from aggregation _id { year, month }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let labels = [];
  let billed = [];
  let collected = [];

  if (monthlyData.length > 0) {
    monthlyData.forEach((item) => {
      labels.push(`${monthNames[(item._id.month || 1) - 1]} ${item._id.year}`);
      billed.push(item.totalBilled || 0);
      collected.push(item.totalCollected || 0);
    });
  } else {
    // Default fallback months
    labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    billed = [25000, 25000, 25000, 25000, 35000, 25000];
    collected = [25000, 25000, 24000, 23000, 30000, 15000];
  }

  financialChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Invoiced (৳)',
          data: billed,
          backgroundColor: '#17324D',
          borderRadius: 4
        },
        {
          label: 'Fees Collected (৳)',
          data: collected,
          backgroundColor: '#146B45',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: 'Inter', size: 12 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => `৳${val.toLocaleString()}`
          }
        }
      }
    }
  });
}
