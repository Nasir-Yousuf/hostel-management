/**
 * NIYD Hostel Management System - Announcement Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth([CONFIG.ROLES.ADMIN])) return;

  setupUserHeader();
  setupSidebarToggle();
  loadAnnouncements();
  setupAnnouncementForm();
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

// Load announcements
async function loadAnnouncements() {
  const container = document.getElementById('adminAnnouncementsContainer');
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 3rem;"><span class="spinner"></span></div>`;

  try {
    const res = await API.get('/announcements');
    const items = res.data || res || [];

    if (!items.length) {
      container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--color-text-secondary);">No announcements currently published.</div>`;
      return;
    }

    container.innerHTML = items.map((ann) => {
      const priorityClass = ann.priority === 'urgent' ? 'badge-danger' : ann.priority === 'important' ? 'badge-warning' : 'badge-neutral';
      const isPinned = ann.isPinned ? `<span class="badge badge-gold">📌 Pinned</span>` : '';

      return `
        <div class="card" style="padding: var(--space-5);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-2);">
            <div>
              <div style="display: flex; gap: var(--space-2); margin-bottom: 4px; align-items: center;">
                <span class="badge ${priorityClass}">${ann.priority}</span>
                <span class="badge badge-neutral" style="text-transform: capitalize;">${ann.category}</span>
                ${isPinned}
                <span style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-left: var(--space-2);">
                  Published: ${Utils.formatDate(ann.publishedAt)}
                </span>
              </div>
              <h3 style="color: var(--color-navy); font-size: 1.15rem; margin-bottom: 4px;">
                ${Utils.escapeHtml(ann.title)}
              </h3>
              ${ann.titleBn ? `<div style="font-size: 0.9rem; color: var(--color-primary-dark); margin-bottom: 6px;">${Utils.escapeHtml(ann.titleBn)}</div>` : ''}
            </div>

            <button type="button" class="btn btn-outline btn-sm" style="color: var(--color-danger);" onclick="deleteAnnouncement('${ann._id}')">
              Delete
            </button>
          </div>

          <p style="color: var(--color-text); font-size: var(--font-size-sm); margin-bottom: 4px;">
            ${Utils.escapeHtml(ann.content)}
          </p>

          ${ann.contentBn ? `
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); border-top: 1px dashed var(--color-border-light); padding-top: 4px;">
              ${Utils.escapeHtml(ann.contentBn)}
            </p>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 2rem;">Failed to load announcements.</div>`;
  }
}

window.openCreateAnnouncementModal = function() {
  UI.openModal('announcementModal');
};

function setupAnnouncementForm() {
  const form = document.getElementById('announcementForm');
  const btn = document.getElementById('saveAnnBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('annTitle').value.trim();
    const titleBn = document.getElementById('annTitleBn').value.trim();
    const category = document.getElementById('annCategory').value;
    const priority = document.getElementById('annPriority').value;
    const content = document.getElementById('annContent').value.trim();
    const contentBn = document.getElementById('annContentBn').value.trim();
    const isPinned = document.getElementById('annIsPinned').checked;
    const isPublished = document.getElementById('annIsPublished').checked;

    UI.setLoading(btn, true, 'Publishing...');

    try {
      await API.post('/announcements', {
        title,
        titleBn,
        category,
        priority,
        content,
        contentBn,
        isPinned,
        isPublished
      });

      UI.showToast('Announcement published successfully!', 'success');
      UI.closeModal('announcementModal');
      form.reset();
      loadAnnouncements();
    } catch (err) {
      UI.showToast(err.message || 'Failed to publish announcement', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  });
}

window.deleteAnnouncement = function(annId) {
  UI.confirm({
    title: 'Delete Announcement?',
    message: 'Are you sure you want to delete this notice? Students will no longer see it on their portal or homepage.',
    confirmText: 'Delete Notice',
    cancelText: 'Cancel',
    isDanger: true,
    onConfirm: async () => {
      try {
        await API.delete(`/announcements/${annId}`);
        UI.showToast('Announcement removed', 'success');
        loadAnnouncements();
      } catch (err) {
        UI.showToast(err.message || 'Delete failed', 'error');
      }
    }
  });
};
