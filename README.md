# Dayflow – Every Workday, Perfectly Aligned 🌊✨

A full-stack, enterprise-ready Human Resource Management System (HRMS) built with **FastAPI**, **React**, **TypeScript**, **Tailwind CSS**, **Recharts**, and an intelligent **AI HR Copilot powered by Gemini**.

---

## 🌟 Key Highlights & Features

### 1. 💎 Apple-Inspired Liquid Glassmorphism UI
- **Frosted Glass Cards:** Dynamic backdrop-blur (`backdrop-blur-2xl`), luminous border highlights, subtle glowing rims.
- **Adaptive Themes:** Instant smooth toggle between **Dark Mode** and **Light Mode**.
- **Responsive Layout:** Optimized for desktop command centers and mobile workdays.
- **Micro-Interactions:** Smooth spring transitions, live ticking timer, and celebratory confetti effects.

### 2. 🔐 Authentication & Role-Based Access Control (RBAC)
- Secure JWT Bearer Token authentication with direct **Bcrypt** password hashing.
- Role separation between **HR / Admin** and **Employee**.
- **1-Click Demo Logins** on the login screen for instant evaluation.

### 3. ⏱️ Real-Time Attendance Management
- **Live Clock In / Clock Out** widget with duration counter and punch status.
- Attendance telemetry history with status tags: `Present`, `Half Day`, `Absent`, `Leave`.
- Search, filter, and 1-click **Export to CSV Report**.

### 4. 🌴 Leave Management & Workflow
- Visual remaining balances: **Paid Annual Leave**, **Sick Leave**, **Unpaid Leave**.
- Dynamic application modal with automatic duration and balance calculation.
- **Admin Approval Queue:** 1-click Approve / Reject with custom HR manager comments.
- Automatic balance deduction and real-time employee notifications.

### 5. 💵 Payroll & Interactive Payslip Engine
- Comprehensive salary calculations: Basic Salary, Allowances (HRA/Special), Deductions, Tax, and Net Take-Home Pay.
- **Official Printable / Downloadable Payslip Modal** with verification stamp.
- Admin Payroll Manager: generate monthly runs, adjust bonuses, deductions, and withholdings.

### 6. 📊 Workforce Intelligence & Analytics
- Visual data analytics using **Recharts**:
  - 14-Day Attendance Telemetry (Area Chart)
  - Department Headcount Distribution (Bar Chart)
  - Leave Utilization Breakdown (Donut Chart)
  - Monthly Payroll Expenditure vs Tax Withholdings (Bar Chart)
- 1-click **Export Full BI Report** in JSON/CSV.

### 7. 🤖 AI HR Assistant (Gemini Copilot)
- Natural language query understanding:
  - *"How many leave days do I have left?"*
  - *"Show my attendance summary for this month"*
  - *"What is my salary breakdown and take-home pay?"*
  - *"Apply sick leave for tomorrow"*
- Smart conversational tool execution with rich visual confirmation cards.
- Built-in deterministic NLP fallback engine so it works seamlessly even without an external API key.

---

## 🚀 Quick Start Guide

### Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **HR / Admin** | `admin@dayflow.io` | `admin123` |
| **Employee (Alex Rivera)** | `alex.rivera@dayflow.io` | `employee123` |
| **Employee (Sarah Chen)** | `sarah.chen@dayflow.io` | `employee123` |
| **Employee (Marcus Vance)** | `marcus.vance@dayflow.io` | `employee123` |

*(You can also use the 1-click Demo buttons on the login screen!)*

---

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with sample data:
   ```bash
   python seed.py
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

### Frontend Setup (React + Vite + TypeScript)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at: `http://localhost:5173`

---

## 🌐 Production Deployment

- **Frontend Deployment (Vercel):**
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variable: `VITE_API_URL=https://your-backend-api.onrender.com/api`

- **Backend Deployment (Render / Railway):**
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Environment Variables:
    - `DATABASE_URL`: `postgresql://user:password@neon.tech/dayflow` (or defaults to SQLite)
    - `SECRET_KEY`: `your-production-jwt-secret`
    - `GEMINI_API_KEY`: `your-gemini-api-key` (optional)

- **Database (Neon PostgreSQL):**
  - Simply paste your Neon PostgreSQL connection string into `DATABASE_URL`. SQLAlchemy will automatically connect and create tables on startup.
