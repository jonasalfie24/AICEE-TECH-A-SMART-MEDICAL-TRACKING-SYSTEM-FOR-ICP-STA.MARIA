/* ═══════════════════════════════════════════════════
   DB.JS — In-Memory Data Store & Utility Functions
   (Now with localStorage persistence)
 ═══════════════════════════════════════════════════ */

'use strict';

/* ─── STORAGE KEYS ─── */
const STORAGE_KEYS = {
  users: 'aicee-users',
  records: 'aicee-records',
  archivedRecords: 'aicee-archived',
  notifications: 'aicee-notifications'
};

/* ─── STORAGE HELPERS ─── */
function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from storage:`, e);
  }
  return fallback;
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to storage:`, e);
  }
}

/* ─── UTILITY FUNCTIONS ─── */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function simpleHash(str) {
  // Very simple non-cryptographic hash for demo purposes
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function truncateText(str, maxLength = 40) {
  if (!str) return '—';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ALLOWED_ROLES = ['admin', 'nurse', 'aider'];

/* ─── IN-MEMORY DATABASE ─── */
const defaultUsers = [
  {
    id: 'user-admin-001',
    fullName: 'Admin User',
    email: 'admin@clinic.com',
    passwordHash: simpleHash('admin123'),
    role: 'admin',
    status: 'active'
  },
  {
    id: 'user-nurse-001',
    fullName: 'Maria Santos',
    email: 'nurse@clinic.com',
    passwordHash: simpleHash('nurse123'),
    role: 'nurse',
    status: 'active'
  },
  {
    id: 'user-staff-001',
    fullName: 'Pedro Reyes',
    email: 'aider@clinic.com',
    passwordHash: simpleHash('aider123'),
    role: 'aider',
    status: 'active'
  }
];

const defaultRecords = [
  {
    id: generateId(),
    fullName: 'Juan Dela Cruz',
    idNumber: '2024-00001',
    role: 'Student',
    age: 20,
    weight: 65,
    chiefComplaint: 'Fever and headache',
    medicalHistory: 'No known allergies',
    diagnosis: 'Viral flu, prescribed rest and fluids',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-01-15',
    timeIn: '09:30',
    timeOut: '10:00',
    createdAt: new Date('2025-01-15').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Ana Lim',
    idNumber: '2024-00002',
    role: 'Student',
    age: 19,
    weight: 52,
    chiefComplaint: 'Stomachache and nausea',
    medicalHistory: 'Gastric issues',
    diagnosis: 'Gastritis',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-02-10',
    timeIn: '08:00',
    timeOut: '08:45',
    createdAt: new Date('2025-02-10').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Carlos Mendoza',
    idNumber: '2024-00003',
    role: 'Teacher',
    age: 42,
    weight: 78,
    chiefComplaint: 'High blood pressure episode',
    medicalHistory: 'Hypertension (on medication)',
    diagnosis: 'Hypertensive episode, referred to physician',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-02-18',
    timeIn: '10:15',
    timeOut: '11:00',
    createdAt: new Date('2025-02-18').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Sofia Garcia',
    idNumber: '2024-00004',
    role: 'Student',
    age: 21,
    weight: 55,
    chiefComplaint: 'Sprained ankle (sports activity)',
    medicalHistory: 'None',
    diagnosis: 'Grade 1 ankle sprain, RICE method advised',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-03-05',
    timeIn: '13:00',
    timeOut: '13:30',
    createdAt: new Date('2025-03-05').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Miguel Torres',
    idNumber: '2025-00005',
    role: 'Staff',
    age: 30,
    weight: 70,
    chiefComplaint: 'Allergic reaction — skin rash',
    medicalHistory: 'Known shellfish allergy',
    diagnosis: 'Allergic dermatitis, antihistamine given',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-04-12',
    timeIn: '14:30',
    timeOut: '',
    createdAt: new Date('2025-04-12').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Lea Pascual',
    idNumber: '2025-00006',
    role: 'Student',
    age: 22,
    weight: 48,
    chiefComplaint: 'Dizziness and fatigue',
    medicalHistory: 'Anemia',
    diagnosis: 'Iron-deficiency anemia, dietary advice given',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-05-20',
    timeIn: '09:00',
    timeOut: '09:45',
    createdAt: new Date('2025-05-20').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Ramon Bautista',
    idNumber: '2025-00007',
    role: 'Teacher',
    age: 38,
    weight: 82,
    chiefComplaint: 'Back pain',
    medicalHistory: 'Lumbar strain history',
    diagnosis: 'Muscle strain, prescribed pain relief',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-06-08',
    timeIn: '11:30',
    timeOut: '12:00',
    createdAt: new Date('2025-06-08').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Patricia Villanueva',
    idNumber: '2025-00008',
    role: 'Student',
    age: 18,
    weight: 50,
    chiefComplaint: 'Menstrual cramps',
    medicalHistory: 'No significant history',
    diagnosis: 'Dysmenorrhea, pain reliever given',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-07-14',
    timeIn: '10:00',
    timeOut: '10:30',
    createdAt: new Date('2025-07-14').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Enrique Flores',
    idNumber: '2025-00009',
    role: 'Student',
    age: 20,
    weight: 73,
    chiefComplaint: 'Eye strain and headache',
    medicalHistory: 'Myopia (wears glasses)',
    diagnosis: 'Computer vision syndrome, advised breaks',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-08-22',
    timeIn: '15:00',
    timeOut: '15:30',
    createdAt: new Date('2025-08-22').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Carmela Navarro',
    idNumber: '2025-00010',
    role: 'Staff',
    age: 35,
    weight: 60,
    chiefComplaint: 'Chest tightness (stress)',
    medicalHistory: 'Anxiety disorder',
    diagnosis: 'Anxiety attack, breathing exercises and rest',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-09-03',
    timeIn: '08:30',
    timeOut: '',
    createdAt: new Date('2025-09-03').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Jose Bernardo',
    idNumber: '2025-00011',
    role: 'Student',
    age: 23,
    weight: 68,
    chiefComplaint: 'Cold and sore throat',
    medicalHistory: 'None',
    diagnosis: 'URTI, rest and fluids advised',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-10-11',
    timeIn: '09:15',
    timeOut: '09:45',
    createdAt: new Date('2025-10-11').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Linda Cruz',
    idNumber: '2025-00012',
    role: 'Teacher',
    age: 50,
    weight: 62,
    chiefComplaint: 'Knee pain (chronic)',
    medicalHistory: 'Osteoarthritis',
    diagnosis: 'OA flare-up, referred to orthopedic',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2025-11-07',
    timeIn: '13:30',
    timeOut: '14:15',
    createdAt: new Date('2025-11-07').toISOString()
  },
  {
    id: generateId(),
    fullName: 'Marco Ramos',
    idNumber: '2025-00013',
    role: 'Student',
    age: 19,
    weight: 71,
    chiefComplaint: 'Laceration on right hand',
    medicalHistory: 'None',
    diagnosis: 'Minor wound, cleaned and bandaged',
    attendingStaff: 'Pedro Reyes',
    dateOfVisit: '2025-12-02',
    timeIn: '10:45',
    timeOut: '11:10',
    createdAt: new Date('2025-12-02').toISOString()
  }
];

const defaultArchivedRecords = [
  {
    id: generateId(),
    fullName: 'Roberto Aquino',
    idNumber: '2023-00050',
    role: 'Student',
    age: 21,
    weight: 67,
    chiefComplaint: 'Flu symptoms',
    medicalHistory: 'No significant history',
    diagnosis: 'Influenza, advised rest',
    attendingStaff: 'Maria Santos',
    dateOfVisit: '2024-11-20',
    timeIn: '09:00',
    timeOut: '09:30',
    createdAt: new Date('2024-11-20').toISOString(),
    archivedAt: new Date('2025-01-01').toISOString()
  }
];

const defaultNotifications = [
  {
    id: generateId(),
    message: 'System initialized. Welcome to AICEE-TEC Medical Tracking System.',
    timestamp: new Date().toISOString(),
    read: false
  }
];

const db = {
  /* ── Users ── */
  users: loadFromStorage(STORAGE_KEYS.users, defaultUsers),

  /* ── Patient Records ── */
  records: loadFromStorage(STORAGE_KEYS.records, defaultRecords),

  /* ── Archived Records ── */
  archivedRecords: loadFromStorage(STORAGE_KEYS.archivedRecords, defaultArchivedRecords),

  /* ── Notifications ── */
  notifications: loadFromStorage(STORAGE_KEYS.notifications, defaultNotifications)
};

/* ─── DB HELPER METHODS ─── */

db.persist = function() {
  saveToStorage(STORAGE_KEYS.users, this.users);
  saveToStorage(STORAGE_KEYS.records, this.records);
  saveToStorage(STORAGE_KEYS.archivedRecords, this.archivedRecords);
  saveToStorage(STORAGE_KEYS.notifications, this.notifications);
};

db.addNotification = function(message) {
  this.notifications.unshift({
    id: generateId(),
    message,
    timestamp: new Date().toISOString(),
    read: false
  });
  this.persist();
};

db.getUnreadCount = function() {
  return this.notifications.filter(n => !n.read).length;
};

db.markAllRead = function() {
  this.notifications.forEach(n => { n.read = true; });
  this.persist();
};

db.getTotalPatients = function() {
  const names = new Set(this.records.map(r => r.idNumber));
  return names.size;
};

db.getCurrentlyAdmitted = function() {
  return this.records.filter(r => {
    if (typeof r.admitted === 'boolean') return r.admitted;
    return !r.timeOut || r.timeOut.trim() === '';
  }).length;
};

db.getArchivedPatientsCount = function() {
  return this.archivedRecords.filter(r => r.status === 'archived').length;
};

db.getDischargedPatients = function() {
  return this.records.filter(r => r.status === 'discharged').length;
};

db.getMonthlyVisits = function(year) {
  const counts = new Array(12).fill(0);
  this.records.forEach(r => {
    if (!r.dateOfVisit) return;
    const d = new Date(r.dateOfVisit + 'T00:00:00');
    if (d.getFullYear() === year) {
      counts[d.getMonth()]++;
    }
  });
  return counts;
};

db.normalizeRecordShape = function(record) {
  return {
    ...record,
    strand: record.strand || '',
    gradeLevel: record.gradeLevel || '',
    section: record.section || '',
    status: record.status || 'admitted',
    admitted: typeof record.admitted === 'boolean' ? record.admitted : record.status !== 'archived',
    admissionDate: record.admissionDate || record.createdAt || new Date().toISOString()
  };
};

db.records = db.records.map(record => {
  if (record.status && record.status !== 'admitted') {
    return db.normalizeRecordShape(record);
  }
  return db.normalizeRecordShape({
    ...record,
    status: 'admitted',
    admitted: true,
    admissionDate: record.admissionDate || record.createdAt || new Date().toISOString()
  });
});

db.archivedRecords = db.archivedRecords.map(record => db.normalizeRecordShape({
  ...record,
  status: 'archived',
  admitted: false,
  archivedAt: record.archivedAt || new Date().toISOString()
}));

/* current logged-in session */
const SESSION_KEY = 'aicee-session';
let currentUser = null;

function setCurrentUser(user) { 
  currentUser = user;
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}
function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch (e) {
      localStorage.removeItem(SESSION_KEY);
    }
  }
  return currentUser;
}
function isAuthenticated()    { return !!currentUser; }
function isAllowedRole(role)  { return ALLOWED_ROLES.includes(role); }
function hasRole(...roles)    { return !!currentUser && roles.includes(currentUser.role); }
function isAdmin()            { return hasRole('admin'); }
function isNurse()            { return hasRole('nurse'); }
function isStaff()            { return hasRole('aider'); }
