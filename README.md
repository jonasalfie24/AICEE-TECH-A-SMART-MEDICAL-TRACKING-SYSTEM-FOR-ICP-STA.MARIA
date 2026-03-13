# MediFlow - Patient Records Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Mermaid](https://img.shields.io/badge/diagrams-Mermaid-FF3670)

A clean, responsive web-based **Patient Records Management System** with role-based authentication, real-time dashboard, full CRUD operations, archiving, and local data persistence. Built as a single-page application (SPA) prototype using vanilla JavaScript + localStorage.

---

## ✨ Features

- **Secure Authentication** (Login, Forgot Password, Role & Status Check)
- **Role-based Access** (Admin, Nurse, etc.)
- **Real-time Dashboard** with clock, stats cards & monthly visits chart
- **Full Patient Records Module** (Add, View, Edit, Discharge, Archive)
- **Archive System** with restore & permanent delete (Admin only)
- **User Management** (Admin only)
- **Notifications System**
- **Form Validation** & Data Persistence via `localStorage`

---

## 📊 System Flowchart

```mermaid
flowchart TB
    subgraph AUTH["Authentication Module"]
        LOGIN["Login Page"]
        FORGOT["Forgot Password"]
        VALIDATE["Validate Credentials"]
        AUTH_CHECK["Check Role & Status"]
        SESSION["Create Session"]
    end
    subgraph APP["Main Application"]
        DASHBOARD["Dashboard"]
        RECORDS["Patient Records"]
        ARCHIVE["Archive"]
        USERS["User Management"]
        NOTIFICATIONS["Notifications"]
    end
    subgraph DASH_MOD["Dashboard Module"]
        CLOCK["Real-Time Clock"]
        STATS["Statistics Cards"]
        CHART["Monthly Visits Chart"]
    end
    subgraph REC_MOD["Records Module"]
        ADD["Add Record"]
        VIEW["View Record"]
        EDIT["Edit Record"]
        ARCHIVE_REC["Archive Record"]
        DISCHARGE["Discharge Patient"]
        VALIDATE_REC["Form Validation"]
    end
    subgraph ARCH_MOD["Archive Module"]
        VIEW_ARCH["View Archived"]
        RESTORE["Restore Record"]
        DELETE_ARCH["Delete Permanently"]
    end
    subgraph USER_MOD["User Management"]
        LIST_USERS["List Users"]
        ADD_USER["Add User"]
        EDIT_USER["Edit User"]
        TOGGLE_STATUS["Toggle Status"]
    end
    subgraph NOTIF_MOD["Notification Module"]
        VIEW_NOTIF["View Notifications"]
        MARK_READ["Mark All Read"]
        ADD_NOTIF["Add Notification"]
    end
    subgraph DB["Data Layer"]
        LOCAL_STORAGE["localStorage"]
        PERSIST["Persist Data"]
    end

    %% Authentication Flow
    LOGIN --> VALIDATE
    VALIDATE --> AUTH_CHECK
    AUTH_CHECK -->|Valid| SESSION
    AUTH_CHECK -->|Invalid| LOGIN
    SESSION --> APP

    %% Main Navigation
    APP --> DASHBOARD
    APP --> RECORDS
    APP --> ARCHIVE
    APP --> USERS
    APP --> NOTIFICATIONS

    %% Dashboard Flow
    DASHBOARD --> CLOCK
    DASHBOARD --> STATS
    DASHBOARD --> CHART

    %% Records Flow
    RECORDS --> ADD
    RECORDS --> VIEW
    RECORDS --> EDIT
    RECORDS --> ARCHIVE_REC
    RECORDS --> DISCHARGE
   
    ADD --> VALIDATE_REC
    VALIDATE_REC -->|Valid| PERSIST
    VALIDATE_REC -->|Invalid| ADD
   
    ARCHIVE_REC -->|Admin/Nurse| ARCH_MOD
    DISCHARGE -->|Admin/Nurse| PERSIST

    %% Archive Flow
    ARCH_MOD --> VIEW_ARCH
    VIEW_ARCH --> RESTORE
    VIEW_ARCH --> DELETE_ARCH
    RESTORE -->|Admin| RECORDS
    DELETE_ARCH -->|Admin Only| DB

    %% User Management Flow (Admin Only)
    USERS --> LIST_USERS
    LIST_USERS --> ADD_USER
    LIST_USERS --> EDIT_USER
    EDIT_USER --> TOGGLE_STATUS
    TOGGLE_STATUS --> PERSIST

    %% Notifications Flow (Admin Only)
    NOTIFICATIONS --> VIEW_NOTIF
    VIEW_NOTIF --> MARK_READ
    ADD_NOTIF -->|System Events| NOTIF_MOD

    %% Data Persistence
    PERSIST --> LOCAL_STORAGE

    %% Styling
    classDef module fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef action fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
   
    class AUTH,APP module
    class DB,LOCAL_STORAGE data
    class LOGIN,ADD,VIEW,EDIT,ACTION action
