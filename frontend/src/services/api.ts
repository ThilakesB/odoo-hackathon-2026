import axios from 'axios';
import type {
  User,
  EmployeeProfile,
  AttendanceRecord,
  AttendanceSummary,
  LeaveRequest,
  LeaveBalances,
  PayrollRecord,
  NotificationItem,
  DashboardSummary,
  AttendanceTrendItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dayflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if session expired
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('dayflow_token');
        localStorage.removeItem('dayflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const employeeService = {
  getMyProfile: async (): Promise<EmployeeProfile> => {
    const res = await api.get('/employees/me');
    return res.data;
  },
  updateMyProfile: async (data: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
    const res = await api.put('/employees/me', data);
    return res.data;
  },
  listEmployees: async (department?: string, search?: string): Promise<EmployeeProfile[]> => {
    const params: any = {};
    if (department && department !== 'All') params.department = department;
    if (search) params.search = search;
    const res = await api.get('/employees', { params });
    return res.data;
  },
  getEmployee: async (id: number): Promise<EmployeeProfile> => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },
  adminUpdateEmployee: async (id: number, data: any): Promise<EmployeeProfile> => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await api.get('/employees/me/notifications');
    return res.data;
  },
  markNotificationRead: async (notifId: number) => {
    const res = await api.put(`/employees/me/notifications/${notifId}/read`);
    return res.data;
  }
};

export const attendanceService = {
  getTodayStatus: async (): Promise<AttendanceSummary> => {
    const res = await api.get('/attendance/status');
    return res.data;
  },
  checkIn: async (notes?: string): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-in', { notes });
    return res.data;
  },
  checkOut: async (notes?: string): Promise<AttendanceRecord> => {
    const res = await api.post('/attendance/check-out', { notes });
    return res.data;
  },
  getAttendanceHistory: async (statusFilter?: string, employeeId?: number): Promise<AttendanceRecord[]> => {
    const params: any = {};
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    if (employeeId) params.employee_id = employeeId;
    const res = await api.get('/attendance', { params });
    return res.data;
  }
};

export const leaveService = {
  getBalances: async (): Promise<LeaveBalances> => {
    const res = await api.get('/leave/balances');
    return res.data;
  },
  getLeaveRequests: async (statusFilter?: string): Promise<LeaveRequest[]> => {
    const params: any = {};
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    const res = await api.get('/leave', { params });
    return res.data;
  },
  applyLeave: async (data: { leave_type: string; start_date: string; end_date: string; reason: string }): Promise<LeaveRequest> => {
    const res = await api.post('/leave', data);
    return res.data;
  },
  updateLeaveStatus: async (id: number, status: 'approved' | 'rejected', admin_comment?: string): Promise<LeaveRequest> => {
    const res = await api.put(`/leave/${id}`, { status, admin_comment });
    return res.data;
  }
};

export const payrollService = {
  getPayrolls: async (month?: string, year?: number): Promise<PayrollRecord[]> => {
    const params: any = {};
    if (month && month !== 'All') params.month = month;
    if (year) params.year = year;
    const res = await api.get('/payroll', { params });
    return res.data;
  },
  getPayrollById: async (id: number): Promise<PayrollRecord> => {
    const res = await api.get(`/payroll/${id}`);
    return res.data;
  },
  createPayroll: async (data: any): Promise<PayrollRecord> => {
    const res = await api.post('/payroll', data);
    return res.data;
  },
  updatePayroll: async (id: number, data: any): Promise<PayrollRecord> => {
    const res = await api.put(`/payroll/${id}`, data);
    return res.data;
  }
};

export const analyticsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/analytics/dashboard-summary');
    return res.data;
  },
  getAttendanceTrends: async (days: number = 7): Promise<AttendanceTrendItem[]> => {
    const res = await api.get('/analytics/attendance-trends', { params: { days } });
    return res.data;
  },
  getDepartmentBreakdown: async () => {
    const res = await api.get('/analytics/department-breakdown');
    return res.data;
  },
  getLeaveDistribution: async () => {
    const res = await api.get('/analytics/leave-distribution');
    return res.data;
  },
  getPayrollHistory: async () => {
    const res = await api.get('/analytics/payroll-history');
    return res.data;
  }
};

export const aiAssistantService = {
  sendMessage: async (message: string, history: any[] = []) => {
    const res = await api.post('/ai-assistant/chat', { message, history });
    return res.data;
  }
};
