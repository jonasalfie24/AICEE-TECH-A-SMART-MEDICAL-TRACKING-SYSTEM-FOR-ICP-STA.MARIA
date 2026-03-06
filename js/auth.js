/* ═══════════════════════════════════════════════════
   AUTH.JS — Authentication Module
═══════════════════════════════════════════════════ */

'use strict';

const Auth = (() => {

  /* ─── Panel Navigation ─── */
  function showPanel(id) {
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
  }

  /* ─── Field Validation Helpers ─── */
  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors(...ids) {
    ids.forEach(id => setError(id, ''));
  }

  function setInputError(inputId, errId, msg) {
    const inp = document.getElementById(inputId);
    if (inp) inp.style.borderColor = msg ? 'var(--danger)' : '';
    setError(errId, msg);
  }

  function clearGlobalError(id) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }

  function showGlobalError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  /* ─── Password Eye Toggles ─── */
  function initEyeToggles() {
    document.querySelectorAll('.btn-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const inp = document.getElementById(targetId);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });
  }

  /* ─── LOGIN ─── */
  function initLogin() {
    const form = document.getElementById('form-login');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors('err-login-email', 'err-login-password');
      clearGlobalError('err-login-global');

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      let valid = true;
      if (!email) {
        setInputError('login-email', 'err-login-email', 'Email is required.');
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setInputError('login-email', 'err-login-email', 'Enter a valid email address.');
        valid = false;
      }

      if (!password) {
        setInputError('login-password', 'err-login-password', 'Password is required.');
        valid = false;
      }

      if (!valid) return;

      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        showGlobalError('err-login-global', 'No account found with that email address.');
        return;
      }

      if (user.passwordHash !== simpleHash(password)) {
        showGlobalError('err-login-global', 'Incorrect password. Please try again.');
        return;
      }

      if (!isAllowedRole(user.role)) {
        showGlobalError('err-login-global', 'Access denied for this account role.');
        return;
      }

      if (user.status && user.status !== 'active') {
        showGlobalError('err-login-global', 'Your account is inactive. Contact the admin.');
        return;
      }

      setCurrentUser(user);
      App.enterApp();
    });
  }

  /* ─── FORGOT PASSWORD ─── */
  function initForgot() {
    const form = document.getElementById('form-forgot');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors('err-forgot-email');

      const email = document.getElementById('forgot-email').value.trim();
      if (!email) {
        setInputError('forgot-email', 'err-forgot-email', 'Email is required.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setInputError('forgot-email', 'err-forgot-email', 'Enter a valid email address.');
        return;
      }

      const sentEl = document.getElementById('forgot-sent-email');
      if (sentEl) sentEl.textContent = email;
      document.getElementById('forgot-step1').classList.add('hidden');
      document.getElementById('forgot-step2').classList.remove('hidden');
    });
  }

  /* ─── Links ─── */
  function initLinks() {
    document.getElementById('link-forgot')?.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('forgot-step1').classList.remove('hidden');
      document.getElementById('forgot-step2').classList.add('hidden');
      document.getElementById('form-forgot').reset();
      clearErrors('err-forgot-email');
      showPanel('panel-forgot');
    });

    document.getElementById('link-forgot-back')?.addEventListener('click', e => {
      e.preventDefault();
      showPanel('panel-login');
    });
  }

  function init() {
    initEyeToggles();
    initLogin();
    initForgot();
    initLinks();
  }

  return { init, showPanel };
})();
