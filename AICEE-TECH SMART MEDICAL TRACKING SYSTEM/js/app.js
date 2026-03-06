/* ═══════════════════════════════════════════════════
   APP.JS — Main Entry Point, Router, Modal, Toast
═══════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    danger:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

/* ═══════════════════════════════════════════════════
   MODAL SYSTEM
═══════════════════════════════════════════════════ */
const Modal = (() => {
  let confirmCallback = null;

  function open(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.remove('hidden');
  }

  function close(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.add('hidden');
  }

  function confirm(title, message, callback, isDanger = false) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').innerHTML = message;
    const btn = document.getElementById('btn-confirm-ok');
    if (btn) {
      btn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'}`;
      btn.textContent = 'Confirm';
    }
    confirmCallback = callback;
    open('modal-confirm-backdrop');
  }

  function initListeners() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => close(btn.dataset.close));
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) close(backdrop.id);
      });
    });

    document.getElementById('btn-confirm-ok')?.addEventListener('click', () => {
      close('modal-confirm-backdrop');
      if (typeof confirmCallback === 'function') {
        confirmCallback();
        confirmCallback = null;
      }
    });
  }

  return { open, close, confirm, initListeners };
})();

/* ═══════════════════════════════════════════════════
   THEME SYSTEM
═══════════════════════════════════════════════════ */
const Theme = (() => {
  function getCurrent() {
    return localStorage.getItem('aicee-theme') || 'light';
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aicee-theme', theme);
    const sunIcon  = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      }
    }
    if (typeof Dashboard !== 'undefined') {
      Dashboard.updateChart();
    }
  }
  function toggle() {
    const current = getCurrent();
    apply(current === 'dark' ? 'light' : 'dark');
  }
  function init() {
    apply(getCurrent());
    document.getElementById('btn-theme')?.addEventListener('click', toggle);
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════
   ROUTER — Page Navigation with RBAC
═══════════════════════════════════════════════════ */
const Router = (() => {
  let activePage = 'dashboard';

  function navigate(page) {
    // RBAC: User Management - admin only
    if (page === 'users') {
      if (!isAdmin()) {
        showToast('Access denied. Admin only.', 'danger');
        return;
      }
    }

    // RBAC: Staff can only access Dashboard and Records (view/add)
    if (isStaff() && (page === 'users' || page === 'archive')) {
      showToast('Access denied. Insufficient permissions.', 'danger');
      return;
    }

    // Deactivate all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const linkEl = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (linkEl) linkEl.classList.add('active');

    activePage = page;

    // Refresh page data
    if (page === 'records') Records.render();
    if (page === 'archive') Archive.render();
    if (page === 'users')   Users.render();
    if (page === 'dashboard') Dashboard.refresh();

    // Close mobile menu
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('open');
  }

  function init() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });
  }

  return { init, navigate };
})();

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
const App = (() => {

  let appInitialized = false;

  function enterApp() {
    const user = getCurrentUser();
    if (!user) return;

    // Update UI with user info
    const nameEl   = document.getElementById('user-name-display');
    const roleEl   = document.getElementById('user-role-display');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl)   nameEl.textContent   = user.fullName;
    if (roleEl)   roleEl.textContent   = capitalize(user.role === 'admin' ? 'Clinic Admin' : capitalize(user.role));
    if (avatarEl) avatarEl.textContent = user.fullName.charAt(0).toUpperCase();

    // Show/hide admin-only nav links
    document.querySelectorAll('.nav-admin-only').forEach(el => {
      el.style.display = isAdmin() ? '' : 'none';
    });

    // Switch screens
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');

    // Initialize app modules only once (avoid duplicate listeners on re-login)
    if (!appInitialized) {
      Dashboard.init();
      Records.init();
      Archive.init();
      Users.init();
      Notifications.init();
      Router.init();
      appInitialized = true;
    } else {
      // Re-render data for new session
      Dashboard.refresh();
      Records.render();
      Archive.render();
      Users.render();
      Notifications.refresh();
    }
    Router.navigate('dashboard');
  }

  function logout() {
    setCurrentUser(null);
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    Auth.showPanel('panel-login');
    document.getElementById('form-login').reset();
    ['err-login-email','err-login-password','err-login-global'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    showToast('You have been logged out.', 'info');
  }

  function initNavbar() {
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      Modal.confirm('Log Out', 'Are you sure you want to log out?', logout);
    });

    document.getElementById('nav-hamburger')?.addEventListener('click', () => {
      const navLinks = document.getElementById('nav-links');
      if (navLinks) navLinks.classList.toggle('open');
    });
  }

  function init() {
    Theme.init();
    Modal.initListeners();
    Auth.init();
    initNavbar();
    
    // Check for existing session and auto-login
    const user = getCurrentUser();
    if (user) {
      App.enterApp();
    }
  }

  return { init, enterApp, logout };
})();

/* ─── BOOTSTRAP ─── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
