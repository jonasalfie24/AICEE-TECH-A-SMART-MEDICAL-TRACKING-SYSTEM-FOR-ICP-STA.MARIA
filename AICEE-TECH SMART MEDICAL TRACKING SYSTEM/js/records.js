/* ═══════════════════════════════════════════════════
   RECORDS.JS — Patient Record Management
═══════════════════════════════════════════════════ */

'use strict';

const Records = (() => {

  let currentPage  = 1;
  let perPage      = 10;
  let searchQuery  = '';
  let editingId    = null;

  /* ─── Date/Time Helpers ─── */
  function getDateBounds() {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 7);
    return {
      min: minDate.toISOString().split('T')[0],
      max: today.toISOString().split('T')[0]
    };
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /* ─── RBAC Guards ─── */
  function canEditRecord() {
    return isAdmin() || isNurse();
  }

  function canAddRecord() {
    return isAdmin() || isNurse() || isStaff();
  }

  /* ─── Filtering ─── */
  function getFiltered() {
    const q = searchQuery.toLowerCase();
    if (!q) return [...db.records];
    return db.records.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      r.idNumber.toLowerCase().includes(q)
    );
  }

  /* ─── Render Table ─── */
  function render() {
    const filtered = getFiltered();
    const total    = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);

    const tbody  = document.getElementById('records-tbody');
    const empty  = document.getElementById('records-empty');
    const table  = document.getElementById('records-table');

    if (!tbody) return;

    const canEdit = canEditRecord();

    if (slice.length === 0) {
      tbody.innerHTML = '';
      if (empty)  empty.classList.remove('hidden');
      if (table)  table.style.display = 'none';
    } else {
      if (empty)  empty.classList.add('hidden');
      if (table)  table.style.display = '';
      tbody.innerHTML = slice.map(r => {
        const isDischarged = r.status === 'discharged';
        return `
        <tr>
          <td>
            ${isDischarged ? '<span class="badge badge-success" style="display:block;margin-bottom:4px;width:fit-content;">Discharged</span>' : '<span class="badge badge-warning" style="display:block;margin-bottom:4px;width:fit-content;">Admitted</span>'}
            <strong>${escapeHtml(r.fullName)}</strong>
          </td>
          <td><span class="badge badge-muted">${escapeHtml(r.idNumber)}</span></td>
          <td>${roleBadge(r.role)}</td>
          <td title="${escapeHtml(r.chiefComplaint)}">${escapeHtml(truncateText(r.chiefComplaint, 35))}</td>
          <td>${formatDate(r.dateOfVisit)}</td>
          <td>${escapeHtml(r.attendingStaff)}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm btn-primary" onclick="Records.viewRecord('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View
              </button>
              ${canEdit ? `
              <button class="btn btn-sm btn-ghost" onclick="Records.openEdit('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="btn btn-sm btn-warning" onclick="Records.confirmArchive('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                Archive
              </button>` : ''}
            </div>
          </td>
        </tr>
      `}).join('');
    }

    renderPagination(totalPages, total);
    updateAddButtonVisibility();
  }

  function updateAddButtonVisibility() {
    const btn = document.getElementById('btn-add-record');
    if (btn) {
      btn.style.display = canAddRecord() ? '' : 'none';
    }
  }

  /* ─── Pagination ─── */
  function renderPagination(totalPages, total) {
    const container = document.getElementById('records-pagination');
    if (!container) return;
    container.innerHTML = buildPaginationHtml(currentPage, totalPages, total, perPage, 'Records');
  }

  /* ─── View Record ─── */
  function viewRecord(id) {
    const r = db.records.find(rec => rec.id === id);
    if (!r) return;
    const body = document.getElementById('modal-view-body');
    if (!body) return;
    
    const isDischarged = r.status === 'discharged';
    const canEdit = canEditRecord();
    
    body.innerHTML = `
      <div class="record-detail-grid">
        <div class="record-detail-item">
          <span class="record-detail-label">Full Name</span>
          <span class="record-detail-value">${escapeHtml(r.fullName)}</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">ID Number</span>
          <span class="record-detail-value">${escapeHtml(r.idNumber)}</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Role</span>
          <span class="record-detail-value">${roleBadge(r.role)}</span>
        </div>
        ${r.strand ? `<div class="record-detail-item"><span class="record-detail-label">Strand</span><span class="record-detail-value">${escapeHtml(r.strand)}</span></div>` : ''}
        ${r.gradeLevel ? `<div class="record-detail-item"><span class="record-detail-label">Grade Level</span><span class="record-detail-value">${escapeHtml(r.gradeLevel)}</span></div>` : ''}
        ${r.section ? `<div class="record-detail-item"><span class="record-detail-label">Section</span><span class="record-detail-value">${escapeHtml(r.section)}</span></div>` : ''}
        <div class="record-detail-item">
          <span class="record-detail-label">Age</span>
          <span class="record-detail-value">${r.age} years</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Weight</span>
          <span class="record-detail-value">${r.weight} kg</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Attending Aider</span>
          <span class="record-detail-value">${escapeHtml(r.attendingStaff)}</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Date of Visit</span>
          <span class="record-detail-value">${formatDate(r.dateOfVisit)}</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Time-In / Time-Out</span>
          <span class="record-detail-value">${formatTime(r.timeIn)} — ${formatTime(r.timeOut)}</span>
        </div>
        <div class="record-detail-item">
          <span class="record-detail-label">Status</span>
          <span class="record-detail-value">${isDischarged ? '<span class="badge badge-success">Discharged</span>' : '<span class="badge badge-warning">Admitted</span>'}</span>
        </div>
        ${r.dischargeDate ? `<div class="record-detail-item"><span class="record-detail-label">Discharge Date</span><span class="record-detail-value">${formatDate(r.dischargeDate)}</span></div>` : ''}
        <hr class="record-detail-divider" />
        <div class="record-detail-item record-detail-full">
          <span class="record-detail-label">Chief Complaint</span>
          <span class="record-detail-value">${escapeHtml(r.chiefComplaint)}</span>
        </div>
        <div class="record-detail-item record-detail-full">
          <span class="record-detail-label">Medical History</span>
          <span class="record-detail-value">${escapeHtml(r.medicalHistory || '—')}</span>
        </div>
        <div class="record-detail-item record-detail-full">
          <span class="record-detail-label">Diagnosis</span>
          <span class="record-detail-value">${escapeHtml(r.diagnosis || '—')}</span>
        </div>
      </div>
      ${canEdit && !isDischarged ? `
      <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="btn btn-sm btn-success" onclick="Records.dischargePatient('${r.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Discharge Patient
        </button>
      </div>
      ` : ''}
    `;
    Modal.open('modal-view-backdrop');
  }

  /* ─── Open Add Modal ─── */
  function openAdd() {
    if (!canAddRecord()) {
      showToast('You do not have permission to add records.', 'danger');
      return;
    }
    editingId = null;
    const form = document.getElementById('form-record');
    if (form) form.reset();
    clearFormErrors();
    document.getElementById('record-id').value = '';
    document.getElementById('modal-record-title').textContent = 'Add Patient Record';
    
    const user = getCurrentUser();
    const staffEl = document.getElementById('rec-staff');
    if (staffEl && user) staffEl.value = user.fullName;
    
    const dateEl = document.getElementById('rec-date');
    const bounds = getDateBounds();
    if (dateEl) {
      dateEl.value = bounds.max;
      dateEl.min = bounds.min;
      dateEl.max = bounds.max;
    }
    
    const timeInEl = document.getElementById('rec-timein');
    const timeOutEl = document.getElementById('rec-timeout');
    if (timeInEl) {
      timeInEl.min = '06:00';
      timeInEl.max = '18:00';
    }
    if (timeOutEl) {
      timeOutEl.min = '06:00';
      timeOutEl.max = '18:00';
      timeOutEl.disabled = true;
      timeOutEl.title = 'Time-Out can only be set after patient is discharged';
      const label = timeOutEl.previousElementSibling;
      if (label) {
        label.innerHTML = 'Time-Out <small>(available after discharge)</small>';
      }
    }
    
    Modal.open('modal-record-backdrop');
  }

  /* ─── Open Edit Modal ─── */
  function openEdit(id) {
    if (!canEditRecord()) {
      showToast('You do not have permission to edit records.', 'danger');
      return;
    }
    const r = db.records.find(rec => rec.id === id);
    if (!r) return;
    editingId = id;
    clearFormErrors();
    document.getElementById('modal-record-title').textContent = 'Edit Patient Record';
    document.getElementById('record-id').value    = r.id;
    document.getElementById('rec-fullname').value = r.fullName;
    document.getElementById('rec-idnumber').value = r.idNumber;
    document.getElementById('rec-role').value     = r.role;
    document.getElementById('rec-strand').value   = r.strand || '';
    document.getElementById('rec-gradelevel').value = r.gradeLevel || '';
    document.getElementById('rec-section').value = r.section || '';
    document.getElementById('rec-age').value      = r.age;
    document.getElementById('rec-weight').value   = r.weight;
    document.getElementById('rec-complaint').value= r.chiefComplaint;
    document.getElementById('rec-history').value  = r.medicalHistory || '';
    document.getElementById('rec-diagnosis').value= r.diagnosis || '';
    document.getElementById('rec-staff').value    = r.attendingStaff;
    document.getElementById('rec-date').value     = r.dateOfVisit;
    document.getElementById('rec-timein').value   = r.timeIn;
    document.getElementById('rec-timeout').value  = r.timeOut || '';
    
    const bounds = getDateBounds();
    const dateEl = document.getElementById('rec-date');
    if (dateEl) {
      dateEl.min = bounds.min;
      dateEl.max = bounds.max;
    }
    
    const timeInEl = document.getElementById('rec-timein');
    const timeOutEl = document.getElementById('rec-timeout');
    if (timeInEl) {
      timeInEl.min = '06:00';
      timeInEl.max = '18:00';
    }
    if (timeOutEl) {
      timeOutEl.min = '06:00';
      timeOutEl.max = '18:00';
      const isAdmitted = r.status === 'admitted';
      timeOutEl.disabled = isAdmitted;
      timeOutEl.title = isAdmitted ? 'Time-Out can only be set after patient is discharged' : '';
      const label = timeOutEl.previousElementSibling;
      if (label) {
        label.innerHTML = isAdmitted 
          ? 'Time-Out <small>(available after discharge)</small>' 
          : 'Time-Out';
      }
    }
    
    Modal.open('modal-record-backdrop');
  }

  /* ─── Save Record ─── */
  function saveRecord() {
    if (!validateForm()) return;

    const fullName       = document.getElementById('rec-fullname').value.trim();
    const idNumber       = document.getElementById('rec-idnumber').value.trim();
    const role           = document.getElementById('rec-role').value;
    const strand         = document.getElementById('rec-strand').value.trim();
    const gradeLevel     = document.getElementById('rec-gradelevel').value.trim();
    const section        = document.getElementById('rec-section').value.trim();
    const age            = parseInt(document.getElementById('rec-age').value, 10);
    const weight         = parseFloat(document.getElementById('rec-weight').value);
    const chiefComplaint = document.getElementById('rec-complaint').value.trim();
    const medicalHistory = document.getElementById('rec-history').value.trim();
    const diagnosis      = document.getElementById('rec-diagnosis').value.trim();
    const attendingStaff = document.getElementById('rec-staff').value.trim();
    const dateOfVisit    = document.getElementById('rec-date').value;
    const timeIn         = document.getElementById('rec-timein').value;
    const timeOut        = document.getElementById('rec-timeout').value;
    
    const timestamp = new Date().toISOString();

    if (editingId) {
      const idx = db.records.findIndex(r => r.id === editingId);
      if (idx > -1) {
        db.records[idx] = {
          ...db.records[idx],
          fullName, idNumber, role, strand, gradeLevel, section, age, weight,
          chiefComplaint, medicalHistory, diagnosis,
          attendingStaff, dateOfVisit, timeIn, timeOut
        };
        db.persist();
        if (isAdmin()) {
          db.addNotification(`Record updated: ${fullName} (${idNumber})`);
        }
        showToast('Record successfully updated.', 'success');
      }
    } else {
      const newRecord = {
        id: generateId(),
        fullName, idNumber, role, strand, gradeLevel, section, age, weight,
        chiefComplaint, medicalHistory, diagnosis,
        attendingStaff, dateOfVisit, timeIn, timeOut,
        createdAt: timestamp,
        admissionDate: timestamp,
        admitted: true,
        status: 'admitted'
      };
      db.records.push(newRecord);
      db.persist();
      if (isAdmin()) {
        db.addNotification(`New patient record added: ${fullName} (${idNumber})`);
      }
      showToast('Record successfully added.', 'success');
    }

    Modal.close('modal-record-backdrop');
    render();
    Dashboard.refresh();
    if (isAdmin()) {
      Notifications.refresh();
    }
  }

  /* ─── Archive ─── */
  function confirmArchive(id) {
    const r = db.records.find(rec => rec.id === id);
    if (!r) return;
    Modal.confirm(
      'Archive Record',
      `Archive the record for <strong>${escapeHtml(r.fullName)}</strong>? It can be restored later from the Archive section.`,
      () => {
        const archivedRecord = {
          ...r,
          archivedAt: new Date().toISOString(),
          status: 'archived',
          admitted: false
        };
        db.archivedRecords.push(archivedRecord);
        db.records = db.records.filter(rec => rec.id !== id);
        db.persist();
        if (isAdmin()) {
          db.addNotification(`Record archived: ${r.fullName} (${r.idNumber})`);
          Notifications.refresh();
        }
        showToast(`Record archived: ${r.fullName}`, 'warning');
        render();
        Dashboard.refresh();
      }
    );
  }

  /* ─── Discharge Patient ─── */
  function dischargePatient(id) {
    const r = db.records.find(rec => rec.id === id);
    if (!r) return;
    Modal.confirm(
      'Discharge Patient',
      `Discharge <strong>${escapeHtml(r.fullName)}</strong>? The patient will be marked as discharged and shown in the dashboard.`,
      () => {
        const idx = db.records.findIndex(rec => rec.id === id);
        if (idx > -1) {
          db.records[idx] = {
            ...db.records[idx],
            status: 'discharged',
            admitted: false,
            dischargeDate: new Date().toISOString().split('T')[0],
            timeOut: db.records[idx].timeOut || new Date().toTimeString().slice(0, 5)
          };
          db.persist();
          if (isAdmin() || isNurse()) {
            db.addNotification(`Patient discharged: ${r.fullName} (${r.idNumber})`);
            Notifications.refresh();
          }
          showToast(`Patient discharged: ${r.fullName}`, 'success');
          viewRecord(id);
          Dashboard.refresh();
        }
      }
    );
  }

  /* ─── Form Validation ─── */
  function validateForm() {
    clearFormErrors();
    let valid = true;
    
    const bounds = getDateBounds();

    const required = [
      ['rec-fullname','err-rec-fullname','Full name is required.'],
      ['rec-idnumber','err-rec-idnumber','ID number is required.'],
      ['rec-complaint','err-rec-complaint','Chief complaint is required.'],
      ['rec-staff','err-rec-staff','Attending staff is required.'],
      ['rec-date','err-rec-date','Date of visit is required.'],
      ['rec-timein','err-rec-timein','Time-In is required.'],
    ];
    required.forEach(([fid, eid, msg]) => {
      const el = document.getElementById(fid);
      if (!el || !el.value.trim()) {
        setFieldError(fid, eid, msg);
        valid = false;
      }
    });

    const roleEl = document.getElementById('rec-role');
    if (!roleEl.value) {
      setFieldError('rec-role','err-rec-role','Role is required.');
      valid = false;
    }
    
    const ageEl = document.getElementById('rec-age');
    if (!ageEl.value || isNaN(ageEl.value) || parseInt(ageEl.value) < 1) {
      setFieldError('rec-age','err-rec-age','Enter a valid age.');
      valid = false;
    }
    
    const weightEl = document.getElementById('rec-weight');
    if (!weightEl.value || isNaN(weightEl.value) || parseFloat(weightEl.value) < 1) {
      setFieldError('rec-weight','err-rec-weight','Enter a valid weight.');
      valid = false;
    }

    // Date validation: must be within last 7 days
    const dateEl = document.getElementById('rec-date');
    if (dateEl.value) {
      const selectedDate = new Date(dateEl.value + 'T00:00:00');
      const minDate = new Date(bounds.min + 'T00:00:00');
      const maxDate = new Date(bounds.max + 'T00:00:00');
      if (selectedDate < minDate || selectedDate > maxDate) {
        setFieldError('rec-date', 'err-rec-date', `Date must be within the last 7 days (${bounds.min} to ${bounds.max}).`);
        valid = false;
      }
    }

    // Time validation: must be between 06:00 and 18:00
    const timeInEl  = document.getElementById('rec-timein');
    const timeOutEl = document.getElementById('rec-timeout');
    
    if (timeInEl.value) {
      const timeInMins = timeToMinutes(timeInEl.value);
      if (timeInMins < 6 * 60 || timeInMins > 18 * 60) {
        setFieldError('rec-timein', 'err-rec-timein', 'Time-In must be between 06:00 and 18:00.');
        valid = false;
      }
    }
    
    if (timeOutEl.value) {
      const timeOutMins = timeToMinutes(timeOutEl.value);
      if (timeOutMins < 6 * 60 || timeOutMins > 18 * 60) {
        setFieldError('rec-timeout', 'err-rec-timeout', 'Time-Out must be between 06:00 and 18:00.');
        valid = false;
      }
    }

    // Time-Out must be strictly after Time-In
    if (timeOutEl.value && timeInEl.value) {
      const timeInMins = timeToMinutes(timeInEl.value);
      const timeOutMins = timeToMinutes(timeOutEl.value);
      if (timeOutMins <= timeInMins) {
        setFieldError('rec-timeout','err-rec-timeout','Time-Out must be later than Time-In.');
        valid = false;
      }
    }

    return valid;
  }

  function setFieldError(inputId, errId, msg) {
    const inp = document.getElementById(inputId);
    if (inp) inp.style.borderColor = 'var(--danger)';
    const err = document.getElementById(errId);
    if (err) err.textContent = msg;
  }

  function clearFormErrors() {
    const errorIds = [
      'err-rec-fullname','err-rec-idnumber','err-rec-role','err-rec-age','err-rec-weight',
      'err-rec-complaint','err-rec-staff','err-rec-date','err-rec-timein','err-rec-timeout',
      'err-rec-strand','err-rec-gradelevel','err-rec-section'
    ];
    errorIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    const inputIds = [
      'rec-fullname','rec-idnumber','rec-role','rec-age','rec-weight',
      'rec-complaint','rec-staff','rec-date','rec-timein','rec-timeout',
      'rec-strand','rec-gradelevel','rec-section'
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.borderColor = '';
    });
  }

  /* ─── Init ─── */
  function init() {
    document.getElementById('btn-add-record')?.addEventListener('click', openAdd);
    document.getElementById('btn-save-record')?.addEventListener('click', saveRecord);

    const searchEl = document.getElementById('records-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQuery = searchEl.value.trim();
        currentPage = 1;
        render();
      });
    }

    const perPageEl = document.getElementById('records-per-page');
    if (perPageEl) {
      perPageEl.addEventListener('change', () => {
        perPage = parseInt(perPageEl.value, 10);
        currentPage = 1;
        render();
      });
    }

    render();
  }

  function setPage(p) {
    currentPage = p;
    render();
  }

  return { init, render, viewRecord, openEdit, confirmArchive, dischargePatient, setPage };
})();

/* ─── SHARED HELPERS ─── */
function escapeHtml(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function roleBadge(role) {
  const map = { Student: 'badge-primary', Teacher: 'badge-success', Staff: 'badge-warning' };
  const cls = map[role] || 'badge-muted';
  return `<span class="badge ${cls}">${escapeHtml(role)}</span>`;
}

function buildPaginationHtml(current, total, itemCount, perPage, namespace) {
  if (total <= 1) {
    return `<span style="font-size:12px;color:var(--text-muted);">Showing ${itemCount} record${itemCount !== 1?'s':''}</span>`;
  }
  let html = `<span style="font-size:12px;color:var(--text-muted);margin-right:8px;">Showing ${Math.min((current-1)*perPage+1,itemCount)}–${Math.min(current*perPage,itemCount)} of ${itemCount}</span>`;
  html += `<button class="page-btn" onclick="${namespace}.setPage(${current-1})" ${current===1?'disabled':''}>‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - current) > 1) {
      if (i === 3 || i === total - 2) html += `<span class="page-btn" style="border:none;background:none;cursor:default;">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i===current?'active':''}" onclick="${namespace}.setPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="${namespace}.setPage(${current+1})" ${current===total?'disabled':''}>›</button>`;
  return html;
}
