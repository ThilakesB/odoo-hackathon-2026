<div align="center">

# Dayflow - Human Resource Management System

### *Every Workday, Perfectly Aligned.*

<p align="center">
  <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Modern_UI-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Cloud-Project_dayfloe--fe234-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>
<br>

**Dayflow** is an enterprise-grade Human Resource Management System built on **Firebase Authentication**, **Cloud Firestore Database**, **React (TypeScript)**, and **Tailwind CSS**. It connects Employees and HR Administrators in real time for streamlined task delegation, leave approvals, profile tracking, and attendance telemetry.

</div>

---

<div align="center">

## Authentication & Security

> **System Notice:** Full Firebase Authentication (Email/Password & Google Sign-In) is configured and active for project `dayfloe-fe234`.

| Provider | Description | Status |
| :---: | :---: | :---: |
| **Email & Password** | Secure Firebase Auth registration and login with real-time profile synchronization | Active |
| **Google Sign-In** | One-click Google Identity Provider authentication with automatic account linking | Active |
| **Demo Access** | Direct sandbox evaluation access for HR Administration and Employee roles | Active |

</div>

---

<div align="center">

## Core Modules & Functional Specifications

### 1. Task Management & Deliverables Tracking
* **HR Administration Hub:** Create, prioritize, and assign deliverables with deadlines, severity categories (Urgent, High, Medium, Low), and team-wide or individual delegation.
* **Employee Workspace:** Track assigned responsibilities, update progress status (To Do, In Progress, Completed), and submit deliverables with optional verification notes.
* **Dashboard Summary Tiles:** Real-time metrics displayed across both Admin and Employee portals.

---

### 2. Leave Administration & Quotas
* **Dynamic Allowance Tracking:** Real-time quota calculation for Annual Paid Leave, Medical/Sick Leave, and Unpaid Leave backed by Cloud Firestore.
* **Application Workflow:** Automated duration computing and schedule overlap validation.
* **Decision Pipeline:** One-click review with approval/rejection logging and official HR feedback comments.

---

### 3. Employee & Administrative Directory
* **Individual Employee Profiles:** Detailed profiles covering designation, department, work location, joining date, and emergency contacts.
* **Workforce Registry:** Administrative directory with real-time filtering and querying across departments and designations.

---

### 4. Real-Time Attendance Telemetry
* **Check-In / Check-Out Interface:** Live shift tracking, punch telemetry, and historical presence logs (Present, Half Day, Absent, Leave).
* **Workforce Trends:** Analytical area graphs visualizing daily attendance performance.

---

### 5. Payroll Management & Digital Payslips
* Comprehensive salary calculations including basic pay, allowances, deductions, tax withholdings, and net remuneration.
* Official printable and downloadable payslip documentation with digital verification indicators.

</div>

---

<div align="center">

## Evaluation Credentials

| Role | Email | Password |
| :---: | :---: | :---: |
| **HR Administrator (Sarah Jenkins)** | `admin@dayflow.com` | `Admin@123` |
| **Employee (Alex Chen)** | `employee@dayflow.com` | `Employee@123` |
| **Google Identity Provider** | *Any authorized Google Account* | *OAuth Popup* |

</div>

---

<div align="center">

## Setup & Deployment Guide

### 1. Repository Clone

```bash
git clone https://github.com/Thilakeswaran/odoo-hackathon-2026.git
cd odoo-hackathon-2026
```

### 2. Dependency Installation

```bash
cd frontend
npm install
```

### 3. Environment Configuration (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Development Server Execution

```bash
npm run dev
```

Application URL: `http://localhost:5173`

</div>

---

<div align="center">

## System Directory Hierarchy

```text
├── .agents/skills/              # Official Firebase Agent Skills & References
├── firestore.rules              # Cloud Firestore Security Rules
├── firestore.indexes.json       # Cloud Firestore Composite Index Definitions
├── firebase.json                # Firebase Hosting and Project Configuration
├── frontend/
│   ├── src/
│   │   ├── config/firebase.ts   # Firebase SDK, Auth & Database Initialization
│   │   ├── services/            # Firestore Data Access Layer (Tasks, Leaves, Profiles)
│   │   ├── context/AuthContext  # Authentication Provider & State Synchronization
│   │   ├── pages/               # Enterprise Portals (Tasks, Leaves, Profiles, Dashboards)
│   │   └── types/               # Type Definitions and Schema Models
└── README.md                    # System Documentation
```

---

<p align="center">
  <sub>Built for Odoo Hackathon 2026 | Powered by Google Cloud Platform & Firebase</sub>
</p>

</div>
