/* ═══════════════════════════════════════════════════
   NOTIFICATIONS.JS — Notification System (Admin Only)
═══════════════════════════════════════════════════ */

'use strict';

const Notifications = (() => {

  let dropdownOpen = false;

  function isAvailable() {
    return isAdmin();
  }

  function updateBadge() {
    if (!isAvailable()) return;
    
    const count = db.getUnreadCount();
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function renderList() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (db.notifications.length === 0) {
      list.innerHTML = '<div class="notif-empty">No notifications</div>';
      return;
    }
    list.innerHTML = db.notifications.slice(0, 30).map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-item-msg">${escapeHtml(n.message)}</div>
        <div class="notif-item-time">${formatDateTime(n.timestamp)}</div>
      </div>
    `).join('');
  }

  function openDropdown() {
    if (!isAvailable()) return;
    
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;
    renderList();
    dropdown.classList.remove('hidden');
    dropdownOpen = true;
  }

  function closeDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;
    dropdown.classList.add('hidden');
    dropdownOpen = false;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function refresh() {
    if (!isAvailable()) {
      const notifWrap = document.getElementById('notif-wrap');
      if (notifWrap) notifWrap.style.display = 'none';
      return;
    }
    
    const notifWrap = document.getElementById('notif-wrap');
    if (notifWrap) notifWrap.style.display = '';
    
    updateBadge();
    if (dropdownOpen) renderList();
  }

  function init() {
    // Hide notification bell for non-admins
    refresh();
    
    const btn = document.getElementById('btn-notifications');
    if (btn) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (dropdownOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });
    }

    document.getElementById('btn-mark-all-read')?.addEventListener('click', e => {
      e.stopPropagation();
      db.markAllRead();
      refresh();
    });

    document.addEventListener('click', e => {
      if (dropdownOpen) {
        const wrap = document.getElementById('notif-wrap');
        if (wrap && !wrap.contains(e.target)) {
          closeDropdown();
        }
      }
    });

    updateBadge();
  }

  return { init, refresh, updateBadge };
})();
