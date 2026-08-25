<div align="center">

# 🌊 Dayflow — Human Resource Management System ✨

### *Every Workday, Perfectly Aligned.*

<p align="center">
  <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Modern_UI-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Cloud-Project_dayfloe--fe234-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

### 🚀 **Overview**

**Dayflow** is an enterprise-grade HR Management System built with **Firebase Authentication**, **Cloud Firestore Database**, **React (TypeScript)**, and **Tailwind CSS**. It connects Employees and HR Administrators in real-time for seamless task delegation, leave approvals, personal profile tracking, and attendance telemetry.

---

</div>

<div align="center">

## 🔐 **Authentication & Security**

> **Note:** Full Firebase Authentication (Email/Password & Google Sign-In) has been integrated into the system with project `dayfloe-fe234`.

| Provider | Description | Status |
| :---: | :---: | :---: |
| 🔑 **Email & Password** | Secure Firebase Auth registration and login with real-time profile sync | ✅ Active |
| 🌐 **Google Sign-In** | 1-Click interactive Google Authentication popup with auto-linking | ✅ Active |
| ⚡ **1-Click Demo Logins** | Instant sandbox access for HR Admin (`Sarah Jenkins`) and Employee (`Alex Chen`) | ✅ Active |

---

## 🌟 **Core Modules & Capabilities**

</div>

<div align="center">

### 1. 📋 **Task Management & Milestone Completion**
* **HR / Admin Workspace:** Create and assign tasks with due dates, priority tags (`Urgent`, `High`, `Medium`, `Low`), categories, and employee delegation.
* **Employee Workspace:** Track assigned deliverables, toggle active statuses (`To Do` → `In Progress` → `Completed`), and submit completion notes with confetti celebration.
* **Interactive Dashboard Tiles:** Live summary tiles on both Employee and Admin dashboards for instant task oversight.

---

### 2. 🌴 **Leave Approvals & Real-Time Quotas**
* **Dynamic Balances:** Live calculation for **Paid Annual**, **Sick / Medical**, and **Unpaid** leaves stored in Cloud Firestore.
* **Leave Application Modal:** Automated duration calculation and conflict prevention.
* **HR Review Queue:** 1-Click **Approve / Reject** with custom HR feedback comments.

---

### 3. 👤 **Dedicated Employee & HR Profiles**
* **Personalized Dossier:** Every employee has their own individual profile with designation, department, work location, joining date, and emergency contacts.
* **HR Directory:** Comprehensive workforce registry with live filtering and search by department or employee name.

---

### 4. ⏱️ **Real-Time Attendance Telemetry**
* **Quick Clock In / Clock Out:** Live shift tracking with duration calculation and punch history (`Present`, `Half Day`, `Absent`, `Leave`).
* **Weekly Presence Trends:** Interactive Area charts visualizing workforce activity over time.

---

### 5. 💵 **Payroll & Digital Payslips**
* Comprehensive salary breakdown (Basic Salary, HRA, Allowances, Tax Withholdings, Net Take-Home Pay).
* Printable & downloadable digital payslip view with verification stamps.

---

</div>

<div align="center">

## 🎯 **Demo Credentials**

| Role | Email | Password |
| :---: | :---: | :---: |
| 🛡️ **HR Admin (Sarah Jenkins)** | `admin@dayflow.com` | `Admin@123` |
| 👤 **Employee (Alex Chen)** | `employee@dayflow.com` | `Employee@123` |
| 🌐 **Google Sign-In** | *Any Google Account* | *Popup Auth* |

*(You can also use the 1-Click Demo buttons on the login screen for instant access!)*

---

## 🛠️ **Quick Start & Local Setup**

</div>

<div align="center">

### 1. Clone the Repository

```bash
git clone https://github.com/Thilakeswaran/odoo-hackathon-2026.git
cd odoo-hackathon-2026
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Firebase Environment (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=AIzaSyAmOa-8MmZQhwlRMezNM3G5movTWoSpHaM
VITE_FIREBASE_AUTH_DOMAIN=dayfloe-fe234.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dayfloe-fe234
VITE_FIREBASE_STORAGE_BUCKET=dayfloe-fe234.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=991828345165
VITE_FIREBASE_APP_ID=1:991828345165:web:f92c7b357052396bb73704
VITE_FIREBASE_MEASUREMENT_ID=G-5J7SFCN56X
```

### 4. Start the Application

```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 📂 **Project Architecture**

```text
├── .agents/skills/              # Firebase Agent Skills & Guides
├── firestore.rules              # Cloud Firestore Security Rules
├── firestore.indexes.json       # Cloud Firestore Composite Indexes
├── firebase.json                # Firebase Hosting & Database Config
├── frontend/
│   ├── src/
│   │   ├── config/firebase.ts   # Firebase App, Auth & Firestore Init
│   │   ├── services/            # Firestore Realtime Services (Tasks, Leaves, Profiles)
│   │   ├── context/AuthContext  # Firebase Auth Provider & State Sync
│   │   ├── pages/               # Dashboards, TasksPage, Leaves, Profiles
│   │   └── types/               # TypeScript Schema Definitions
└── README.md                    # Project Documentation
```

---

<p align="center">
  <sub>Built with ❤️ for Odoo Hackathon 2026 • Powered by Google Firebase</sub>
</p>

</div>
