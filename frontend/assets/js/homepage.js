/**
 * NIYD Hostel Management System - Homepage Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  loadAnnouncements();
  initQuickStats();
  checkAuthBadge();
});

// Header scroll elevation
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

// Mobile navigation toggle
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close when clicking nav links
  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// If user is already logged in, update header CTA button to say "Go to Dashboard"
function checkAuthBadge() {
  if (Auth.isAuthenticated()) {
    const user = Auth.getUser();
    const actionArea = document.querySelector('.header-actions');
    const heroBtn = document.querySelector('#hero-login-btn');

    if (heroBtn && user) {
      heroBtn.textContent = I18N.currentLang === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Dashboard';
      heroBtn.href = user.role === 'admin' 
        ? '/frontend/admin/index.html' 
        : user.role === 'staff' 
          ? '/frontend/staff/index.html' 
          : '/frontend/student/index.html';
    }
  }
}

// Quick stats counter animation
function initQuickStats() {
  const statNumbers = document.querySelectorAll('.stat-num');
  // Simple intersection observer to animate when in view
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  statNumbers.forEach((el) => {
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });
}

// Fetch live published announcements from backend or show informative institutional notices
async function loadAnnouncements() {
  const container = document.getElementById('announcements-container');
  if (!container) return;

  try {
    const res = await API.get('/announcements', { limit: 3, isPublished: true });
    const items = res.announcements || res.data || [];
    if (items.length > 0) {
      renderAnnouncements(items, container);
      return;
    }
  } catch (err) {
    console.log('[Notice] Backend not yet connected for announcements, showing fallback.');
  }

  // Institutional default announcements
  const fallbackAnnouncements = [
    {
      title: 'Hostel Seat Allocation for Autumn 2026 Announced',
      titleBn: 'অটাম ২০২৬ সেশনের হোস্টেল সিট বরাদ্দ তালিকা প্রকাশ',
      category: 'academic',
      priority: 'important',
      publishedAt: '2026-11-10T09:00:00Z',
      content: 'Selected residential students are requested to complete the fee payment and bed registration before November 30.',
      contentBn: 'নির্বাচিত শিক্ষার্থীদের আগামী ৩০ নভেম্বরের মধ্যে প্রয়োজনীয় ফি পরিশোধ করে সিট কনফার্ম করার অনুরোধ করা হলো।'
    },
    {
      title: 'Annual Wi-Fi Network & Electrical Maintenance Notice',
      titleBn: 'বার্ষিক ওয়াই-ফাই নেটওয়ার্ক ও বিদ্যুৎ ব্যবস্থাপনা নোটিশ',
      category: 'maintenance',
      priority: 'normal',
      publishedAt: '2026-11-14T14:30:00Z',
      content: 'Scheduled fiber optic upgrade work will be conducted across Block A and Block B on Friday from 10:00 AM to 1:00 PM.',
      contentBn: 'শুক্রবার সকাল ১০টা থেকে দুপুর ১টা পর্যন্ত ব্লক-এ এবং ব্লক-বি-তে ফাইবার অপটিক নেটওয়ার্ক আপগ্রেড চলবে।'
    },
    {
      title: 'Revised Hostel Gate Timings for Winter Term',
      titleBn: 'শীতকালীন মেয়াদের জন্য হোস্টেল গেট সময়সূচি পরিবর্তন',
      category: 'general',
      priority: 'normal',
      publishedAt: '2026-11-16T11:00:00Z',
      content: 'All residents must check in before 9:30 PM. Late entries require prior permission from the Assistant Warden.',
      contentBn: 'সকল আবাসিক শিক্ষার্থীকে রাত ৯:৩০ এর মধ্যে হোস্টেলে প্রবেশ করতে হবে। জরুরি প্রয়োজনে সহকারী ওয়ার্ডেনের অনুমতি আবশ্যক।'
    }
  ];

  renderAnnouncements(fallbackAnnouncements, container);
}

function renderAnnouncements(items, container) {
  const isBn = I18N.currentLang === 'bn';
  container.innerHTML = items.map((item) => {
    const title = isBn && item.titleBn ? item.titleBn : item.title;
    const content = isBn && item.contentBn ? item.contentBn : item.content;
    const dateFormatted = Utils.formatDate(item.publishedAt, isBn ? 'bn' : 'en');
    const priorityBadge = item.priority === 'urgent' || item.priority === 'important'
      ? `<span class="badge badge-danger">${isBn ? 'জরুরি' : 'Important'}</span>`
      : `<span class="badge badge-info">${isBn ? 'সাধারণ' : 'General'}</span>`;

    return `
      <article class="announcement-card">
        <div class="announcement-meta">
          ${priorityBadge}
          <span class="announcement-date">${dateFormatted}</span>
        </div>
        <h3 class="announcement-title">${Utils.escapeHtml(title)}</h3>
        <p class="announcement-snippet">${Utils.escapeHtml(content)}</p>
      </article>
    `;
  }).join('');
}
