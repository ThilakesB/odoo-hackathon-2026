import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Loading Dayflow Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Root Dashboard Router based on Role
const HomeRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <EmployeeDashboard onOpenAIChat={() => {}} />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeRouter />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/employees"
                element={
                  <ProtectedRoute adminOnly>
                    <EmployeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leave" element={<LeavePage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute adminOnly>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
