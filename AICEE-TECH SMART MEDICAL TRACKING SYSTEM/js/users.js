/* ═══════════════════════════════════════════════════
   USERS.JS — Admin User Provisioning
═══════════════════════════════════════════════════ */

'use strict';

const Users = (() => {

  function guardAdmin() {
    if (!isAdmin()) {
      showToast('Only admin users can manage accounts.', 'danger');
      return false;
    }
    return true;
  }

  function setFieldError(inputId, errId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.style.borderColor = message ? 'var(--danger)' : '';
    if (err) err.textContent = message;
  }

  function clearCreateUserErrors() {
    ['new-user-name', 'new-user-email', 'new-user-role', 'new-user-password'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.style.borderColor = '';
    });
    ['err-new-user-name', 'err-new-user-email', 'err-new-user-role', 'err-new-user-password'].forEach(id => {
      const err = document.getElementById(id);
      if (err) err.textContent = '';
    });
  }

  function createUser(event) {
    event.preventDefault();
    if (!guardAdmin()) return;

    clearCreateUserErrors();

    const fullName = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim().toLowerCase();
    const role = document.getElementById('new-user-role').value;
    const password = document.getElementById('new-user-password').value;

    let valid = true;

    if (!fullName) {
      setFieldError('new-user-name', 'err-new-user-name', 'Full name is required.');
      valid = false;
    }

    if (!email) {
      setFieldError('new-user-email', 'err-new-user-email', 'Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('new-user-email', 'err-new-user-email', 'Enter a valid email address.');
      valid = false;
    } else if (db.users.some(u => u.email.toLowerCase() === email)) {
      setFieldError('new-user-email', 'err-new-user-email', 'Email already exists.');
      valid = false;
    }

    if (!role) {
      setFieldError('new-user-role', 'err-new-user-role', 'Role is required.');
      valid = false;
    } else if (!isAllowedRole(role)) {
      setFieldError('new-user-role', 'err-new-user-role', 'Role must be admin, nurse, or staff.');
      valid = false;
    }

    if (!password || password.length < 6) {
      setFieldError('new-user-password', 'err-new-user-password', 'Password must be at least 6 characters.');
      valid = false;
    }

    if (!valid) return;

    db.users.push({
      id: generateId(),
      fullName,
      email,
      passwordHash: simpleHash(password),
      role,
      status: 'active',
      createdAt: new Date().toISOString()
    });

    db.addNotification(`User provisioned by admin: ${fullName} (${capitalize(role)})`);
    Notifications.refresh();
    showToast(`Account created for ${fullName}.`, 'success');

    document.getElementById('form-create-user')?.reset();
    render();
  }

  function render() {
    renderUsersTable();
  }

  function renderUsersTable() {
    const tbody = document.getElementById('users-tbody');
    const empty = document.getElementById('users-empty');
    if (!tbody) return;

    const me = getCurrentUser();
    const users = db.users.filter(u => isAllowedRole(u.role));

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">No provisioned users found.</td></tr>';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    tbody.innerHTML = users.map(user => {
      const isSelf = user.id === me?.id;
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="user-avatar" style="width:30px;height:30px;font-size:13px;">
                ${escapeHtml(user.fullName.charAt(0).toUpperCase())}
              </div>
              <strong>${escapeHtml(user.fullName)}</strong>
              ${isSelf ? '<span class="badge badge-primary" style="margin-left:4px;">You</span>' : ''}
            </div>
          </td>
          <td>${escapeHtml(user.email)}</td>
          <td>${roleBadge(user.role)}</td>
          <td>
            ${isSelf
              ? '<span style="color:var(--text-muted);font-size:12px;">—</span>'
              : `<button class="btn btn-sm btn-danger" onclick="Users.remove('${user.id}')">Remove</button>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  function roleBadge(role) {
    if (role === 'admin') return '<span class="badge badge-danger">Admin</span>';
    if (role === 'nurse') return '<span class="badge badge-primary">Nurse</span>';
    return '<span class="badge badge-warning">Aider</span>';
  }

  function remove(id) {
    if (!guardAdmin()) return;

    const user = db.users.find(u => u.id === id);
    if (!user) return;

    Modal.confirm(
      'Remove User',
      `Permanently remove <strong>${escapeHtml(user.fullName)}</strong> from the system?`,
      () => {
        db.users = db.users.filter(u => u.id !== id);
        db.addNotification(`User removed by admin: ${user.fullName}`);
        Notifications.refresh();
        showToast(`User removed: ${user.fullName}`, 'danger');
        render();
      },
      true
    );
  }

  function init() {
    const form = document.getElementById('form-create-user');
    if (form) {
      form.addEventListener('submit', createUser);
    }
    render();
  }

  return { init, render, remove };
})();
