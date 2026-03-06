/* ═══════════════════════════════════════════════════
   ARCHIVE.JS — Archive System
═══════════════════════════════════════════════════ */

'use strict';

const Archive = (() => {

  let currentPage = 1;
  let perPage     = 10;
  let searchQuery = '';

  function getFiltered() {
    const q = searchQuery.toLowerCase();
    if (!q) return [...db.archivedRecords];
    return db.archivedRecords.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      r.idNumber.toLowerCase().includes(q)
    );
  }

  function render() {
    const filtered   = getFiltered();
    const total      = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);

    const tbody = document.getElementById('archive-tbody');
    const empty = document.getElementById('archive-empty');
    const table = document.getElementById('archive-table');

    if (!tbody) return;

    const admin = isAdmin();

    // Update total count
    const countEl = document.getElementById('archive-total-count');
    if (countEl) countEl.textContent = total;

    if (slice.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      if (table) table.style.display = 'none';
    } else {
      if (empty) empty.classList.add('hidden');
      if (table) table.style.display = '';
      tbody.innerHTML = slice.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.fullName)}</strong></td>
          <td><span class="badge badge-muted">${escapeHtml(r.idNumber)}</span></td>
          <td>${roleBadge(r.role)}</td>
          <td title="${escapeHtml(r.chiefComplaint)}">${escapeHtml(truncateText(r.chiefComplaint, 35))}</td>
          <td>${formatDate(r.dateOfVisit)}</td>
          <td>${escapeHtml(r.attendingStaff)}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-success" onclick="Archive.restore('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
                Restore
              </button>
              ${admin ? `
              <button class="btn btn-sm btn-danger" onclick="Archive.confirmDelete('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete
              </button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    }

    renderPagination(totalPages, total);
  }

  function renderPagination(totalPages, total) {
    const container = document.getElementById('archive-pagination');
    if (!container) return;
    container.innerHTML = buildPaginationHtml(currentPage, totalPages, total, perPage, 'Archive');
  }

  function restore(id) {
    const r = db.archivedRecords.find(rec => rec.id === id);
    if (!r) return;
    Modal.confirm(
      'Restore Record',
      `Restore the record for <strong>${escapeHtml(r.fullName)}</strong> back to active records?`,
      () => {
        const { archivedAt, ...record } = r;
        db.records.push({
          ...record,
          admitted: true,
          status: 'admitted'
        });
        db.archivedRecords = db.archivedRecords.filter(rec => rec.id !== id);
        db.persist();
        if (isAdmin()) {
          db.addNotification(`Record restored: ${r.fullName} (${r.idNumber})`);
          Notifications.refresh();
        }
        showToast(`Record restored: ${r.fullName}`, 'success');
        render();
        Dashboard.refresh();
      }
    );
  }

  function confirmDelete(id) {
    if (!isAdmin()) return;
    const r = db.archivedRecords.find(rec => rec.id === id);
    if (!r) return;
    Modal.confirm(
      'Permanently Delete Record',
      `<strong>This action cannot be undone.</strong> Are you sure you want to permanently delete the record for <strong>${escapeHtml(r.fullName)}</strong>?`,
      () => {
        db.archivedRecords = db.archivedRecords.filter(rec => rec.id !== id);
        db.persist();
        if (isAdmin()) {
          db.addNotification(`Record permanently deleted: ${r.fullName} (${r.idNumber})`);
          Notifications.refresh();
        }
        showToast(`Record permanently deleted.`, 'danger');
        render();
        Dashboard.refresh();
      },
      true
    );
  }

  function setPage(p) {
    currentPage = p;
    render();
  }

  function init() {
    const searchEl = document.getElementById('archive-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQuery = searchEl.value.trim();
        currentPage = 1;
        render();
      });
    }
    render();
  }

  return { init, render, restore, confirmDelete, setPage };
})();
