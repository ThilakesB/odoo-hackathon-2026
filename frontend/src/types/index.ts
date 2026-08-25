export type Role = 'admin' | 'employee';

export interface User {
  id: number | string;
  uid?: string;
  employee_id: string;
  name: string;
  email: string;
  role: Role;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface EmployeeProfile {
  id: number | string;
  user_id: number | string;
  uid?: string;
  department: string;
  designation: string;
  joining_date?: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  emergency_contact?: string;
  work_location?: string;
  leave_balance_paid: number;
  leave_balance_sick: number;
  leave_balance_unpaid: number;
  user: User;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'under_review';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigned_to: string; // employee_id or uid
  assigned_to_name: string;
  assigned_to_email?: string;
  assigned_by: string; // admin name or id
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  created_at: string;
  completed_at?: string;
  completion_notes?: string;
  category?: string;
}

export interface AttendanceRecord {
  id: number | string;
  employee_id: number | string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  work_hours: number;
  notes?: string;
  employee_name?: string;
  employee_code?: string;
  department?: string;
}

export interface AttendanceSummary {
  today_status: string;
  checked_in: boolean;
  checked_out: boolean;
  check_in_time?: string;
  check_out_time?: string;
  work_hours_today: number;
  total_days_present_month: number;
  total_days_absent_month: number;
  attendance_rate: number;
}

export interface LeaveRequest {
  id: number | string;
  employee_id: number | string;
  leave_type: 'paid' | 'sick' | 'unpaid';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
  applied_at: string;
  employee_name?: string;
  employee_code?: string;
  department?: string;
}

export interface LeaveBalances {
  paid: number;
  sick: number;
  unpaid: number;
  total_available: number;
  pending_days: number;
}

export interface PayrollRecord {
  id: number | string;
  employee_id: number | string;
  month: string;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  tax: number;
  net_salary: number;
  payment_status: 'paid' | 'pending' | 'processing';
  payment_date?: string;
  payslip_url?: string;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  designation?: string;
}

export interface NotificationItem {
  id: number | string;
  employee_id: number | string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_leave_requests: number;
  monthly_payroll_spend: number;
  attendance_rate_today: number;
  active_tasks_count?: number;
  completed_tasks_count?: number;
}

export interface AttendanceTrendItem {
  date: string;
  day: string;
  present: number;
  absent: number;
  leave: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: Array<{
    title: string;
    category?: string;
    text?: string;
    source?: string;
    score?: number;
  }>;
  action_type?: string;
  action_payload?: any;
}
