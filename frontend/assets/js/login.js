/**
 * NIYD Hostel Management System - Authentication & Admission Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPasswordToggle();
  initLoginForm();
  initAdmissionForm();
  parseUrlParams();
});

// Demo Credentials Configuration
const DEMO_CREDENTIALS = {
  admin: { email: 'admin@niyd.gov.bd', pass: 'Admin@NIYD2026', role: 'admin' },
  warden: { email: 'warden@niyd.gov.bd', pass: 'Warden@NIYD2026', role: 'admin' },
  student: { email: 'student1@niyd.gov.bd', pass: 'Student@123', role: 'student' },
  staff: { email: 'staff1@niyd.gov.bd', pass: 'Staff@123', role: 'staff' }
};

// Global function to auto-fill demo credentials
window.fillCredentials = function(type) {
  const creds = DEMO_CREDENTIALS[type];
  if (!creds) return;

  // Switch tab if needed
  switchTab(creds.role);

  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');

  if (emailInput && passInput) {
    emailInput.value = creds.email;
    passInput.value = creds.pass;
    UI.showToast(`Loaded ${type.toUpperCase()} demo credentials.`, 'info');
  }
};

// Parse URL params (?role=admin or ?tab=apply)
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  const tab = urlParams.get('tab');

  if (tab === 'apply') {
    switchTab('apply');
  } else if (role && ['admin', 'student', 'staff'].includes(role)) {
    switchTab(role);
  }
}

// Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll('.auth-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(target) {
  const tabs = document.querySelectorAll('.auth-tab-btn');
  tabs.forEach((t) => {
    if (t.getAttribute('data-tab') === target) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  const loginForm = document.getElementById('loginForm');
  const admissionForm = document.getElementById('admissionForm');
  const demoBox = document.getElementById('demoBox');
  const authCard = document.getElementById('authCard');
  const title = document.getElementById('authCardTitle');
  const sub = document.getElementById('authCardSub');
  const emailLabel = document.getElementById('loginEmailLabel');
  const roleInput = document.getElementById('loginRole');

  if (target === 'apply') {
    loginForm.style.display = 'none';
    admissionForm.style.display = 'block';
    demoBox.style.display = 'none';
    authCard.classList.add('wide');
    title.textContent = 'Hostel Admission Application';
    sub.textContent = 'Submit your details for hostel accommodation assessment';
  } else {
    loginForm.style.display = 'block';
    admissionForm.style.display = 'none';
    demoBox.style.display = 'block';
    authCard.classList.remove('wide');
    roleInput.value = target;

    if (target === 'admin') {
      title.textContent = 'Warden & Administrator Sign In';
      sub.textContent = 'Authorized Administrative & Warden Access Portal';
      emailLabel.textContent = 'Official Email Address';
    } else if (target === 'staff') {
      title.textContent = 'Maintenance Staff Sign In';
      sub.textContent = 'Hostel Engineering & Maintenance Crew Portal';
      emailLabel.textContent = 'Staff ID or Work Email';
    } else {
      title.textContent = 'Student Resident Sign In';
      sub.textContent = 'Access rooms, fee invoices, attendance, and requests';
      emailLabel.textContent = 'Student Email or Student ID';
    }
  }
}

// Password toggle
function initPasswordToggle() {
  const toggleBtn = document.getElementById('togglePassword');
  const passInput = document.getElementById('loginPassword');
  if (!toggleBtn || !passInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPass = passInput.getAttribute('type') === 'password';
    passInput.setAttribute('type', isPass ? 'text' : 'password');
    toggleBtn.textContent = isPass ? '🙈' : '👁️';
  });
}

// Login Form Handling
function initLoginForm() {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitLoginBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    if (!email || !password) {
      UI.showToast('Please provide both credentials to sign in.', 'warning');
      return;
    }

    UI.setLoading(submitBtn, true, 'Authenticating...');

    try {
      const response = await Auth.login(email, password, role);
      UI.showToast(`Welcome back, ${response.user.firstName}!`, 'success');

      // Check if redirect URL is specified in query
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');

      setTimeout(() => {
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          Auth.redirectToDashboard(response.user.role);
        }
      }, 700);

    } catch (err) {
      console.error('Login error:', err);
      const msg = err.data?.message || err.message || 'Invalid email or password. Please try again.';
      UI.showToast(msg, 'error', 'Authentication Failed');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  });
}

// Admission Application Form Handling
function initAdmissionForm() {
  const form = document.getElementById('admissionForm');
  const submitBtn = document.getElementById('submitAppBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      applicant: {
        firstName: document.getElementById('appFirstName').value.trim(),
        lastName: document.getElementById('appLastName').value.trim(),
        email: document.getElementById('appEmail').value.trim(),
        phone: document.getElementById('appPhone').value.trim(),
        gender: document.getElementById('appGender').value,
        nidNumber: document.getElementById('appNid').value.trim(),
        permanentAddress: {
          street: document.getElementById('appAddress').value.trim()
        },
        emergencyContact: {
          name: document.getElementById('appEmergencyName').value.trim(),
          phone: document.getElementById('appEmergencyPhone').value.trim()
        }
      },
      academic: {
        department: document.getElementById('appDepartment').value,
        session: document.getElementById('appSession').value.trim()
      },
      preferences: {
        roomType: document.getElementById('appRoomType').value
      }
    };

    UI.setLoading(submitBtn, true, 'Submitting Application...');

    try {
      const result = await API.post('/admissions', payload);
      const appNum = result.data?.applicationNumber || result.applicationNumber || 'PENDING';

      UI.confirm({
        title: 'Application Submitted Successfully!',
        message: `Your Hostel Admission application has been received. Your Tracking Application Number is: ${appNum}. You will be notified via email once the Warden Committee completes review.`,
        confirmText: 'Return to Login',
        cancelText: 'Close',
        onConfirm: () => {
          form.reset();
          switchTab('student');
        }
      });

    } catch (err) {
      console.error('Admission submit error:', err);
      const msg = err.data?.message || err.message || 'Failed to submit application. Please verify all fields.';
      UI.showToast(msg, 'error', 'Submission Failed');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  });
}
