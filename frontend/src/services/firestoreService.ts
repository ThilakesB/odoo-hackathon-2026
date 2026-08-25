import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  User,
  EmployeeProfile,
  TaskItem,
  TaskStatus,
  LeaveRequest,
  LeaveBalances,
  AttendanceRecord,
  AttendanceSummary,
  PayrollRecord,
  NotificationItem,
  DashboardSummary,
  AttendanceTrendItem
} from '../types';

// Collection References
export const USERS_COLLECTION = 'users';
export const PROFILES_COLLECTION = 'employee_profiles';
export const TASKS_COLLECTION = 'tasks';
export const LEAVES_COLLECTION = 'leaves';
export const ATTENDANCE_COLLECTION = 'attendance';
export const PAYROLL_COLLECTION = 'payroll';
export const NOTIFICATIONS_COLLECTION = 'notifications';

/* ==========================================================================
   1. USER & EMPLOYEE PROFILE SERVICES
   ========================================================================== */

export const firestoreUserService = {
  /**
   * Fetch or create a user in Firestore
   */
  getOrCreateUser: async (firebaseUser: { uid: string; email: string; displayName?: string | null; photoURL?: string | null; role?: 'admin' | 'employee' }): Promise<{ user: User; profile: EmployeeProfile }> => {
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    const profileRef = doc(db, PROFILES_COLLECTION, firebaseUser.uid);

    const userSnap = await getDoc(userRef);

    let user: User;
    let profile: EmployeeProfile;

    if (userSnap.exists()) {
      user = userSnap.data() as User;
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        profile = profileSnap.data() as EmployeeProfile;
      } else {
        profile = await firestoreUserService.createDefaultProfile(user);
      }
    } else {
      // Determine default role: admin if email matches admin pattern or explicit choice
      const isAdmin = firebaseUser.role === 'admin' || firebaseUser.email.toLowerCase().includes('admin') || firebaseUser.email.toLowerCase().includes('hr');
      const employeeCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const userName = firebaseUser.displayName || firebaseUser.email.split('@')[0];

      user = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        employee_id: employeeCode,
        name: userName,
        email: firebaseUser.email,
        role: isAdmin ? 'admin' : 'employee',
        is_verified: true,
        avatar_url: firebaseUser.photoURL || undefined,
        created_at: new Date().toISOString()
      };

      await setDoc(userRef, user);

      profile = {
        id: firebaseUser.uid,
        user_id: firebaseUser.uid,
        uid: firebaseUser.uid,
        department: isAdmin ? 'Human Resources' : 'Engineering',
        designation: isAdmin ? 'HR Manager' : 'Software Engineer',
        phone: '+1 (555) 019-2834',
        address: '100 Silicon Way, Tech Park, CA',
        emergency_contact: '+1 (555) 999-1122',
        work_location: 'San Francisco HQ (Hybrid)',
        joining_date: '2024-01-15',
        leave_balance_paid: 18,
        leave_balance_sick: 10,
        leave_balance_unpaid: 5,
        profile_picture: firebaseUser.photoURL || undefined,
        user
      };

      await setDoc(profileRef, profile);
    }

    return { user, profile };
  },

  createDefaultProfile: async (user: User): Promise<EmployeeProfile> => {
    const profileRef = doc(db, PROFILES_COLLECTION, String(user.id));
    const profile: EmployeeProfile = {
      id: user.id,
      user_id: user.id,
      uid: String(user.id),
      department: user.role === 'admin' ? 'Human Resources' : 'Engineering',
      designation: user.role === 'admin' ? 'HR Manager' : 'Software Engineer',
      phone: '+1 (555) 019-2834',
      address: '100 Silicon Way, Tech Park, CA',
      emergency_contact: '+1 (555) 999-1122',
      work_location: 'San Francisco HQ (Hybrid)',
      joining_date: '2024-01-15',
      leave_balance_paid: 18,
      leave_balance_sick: 10,
      leave_balance_unpaid: 5,
      profile_picture: user.avatar_url,
      user
    };
    await setDoc(profileRef, profile);
    return profile;
  },

  getProfile: async (userId: string | number): Promise<EmployeeProfile | null> => {
    const profileRef = doc(db, PROFILES_COLLECTION, String(userId));
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as EmployeeProfile;
    }
    return null;
  },

  updateProfile: async (userId: string | number, data: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
    const profileRef = doc(db, PROFILES_COLLECTION, String(userId));
    await updateDoc(profileRef, data);
    const updated = await getDoc(profileRef);
    return updated.data() as EmployeeProfile;
  },

  getAllEmployees: async (department?: string, search?: string): Promise<EmployeeProfile[]> => {
    const profilesCol = collection(db, PROFILES_COLLECTION);
    const snap = await getDocs(profilesCol);
    let results: EmployeeProfile[] = [];

    snap.forEach((d) => {
      results.push(d.data() as EmployeeProfile);
    });

    if (department && department !== 'All') {
      results = results.filter((p) => p.department === department);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q) ||
          p.designation?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q)
      );
    }
    return results;
  }
};

/* ==========================================================================
   2. TASK MANAGEMENT & COMPLETION SERVICES
   ========================================================================== */

export const firestoreTaskService = {
  /**
   * Get list of tasks, filtered by employee or status
   */
  getTasks: async (filters?: { assignedTo?: string; status?: string }): Promise<TaskItem[]> => {
    const tasksCol = collection(db, TASKS_COLLECTION);
    const snap = await getDocs(tasksCol);
    let tasks: TaskItem[] = [];

    snap.forEach((d) => {
      tasks.push({ id: d.id, ...d.data() } as TaskItem);
    });

    // Sort by created date descending
    tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.assignedTo && filters.assignedTo !== 'all') {
      tasks = tasks.filter(
        (t) => t.assigned_to === filters.assignedTo || t.assigned_to_name.toLowerCase() === filters.assignedTo.toLowerCase()
      );
    }

    if (filters?.status && filters.status !== 'all') {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    return tasks;
  },

  /**
   * Create a new task (HR / Admin action)
   */
  createTask: async (taskData: Omit<TaskItem, 'id' | 'created_at'>): Promise<TaskItem> => {
    const tasksCol = collection(db, TASKS_COLLECTION);
    const newTask = {
      ...taskData,
      created_at: new Date().toISOString()
    };
    const docRef = await addDoc(tasksCol, newTask);
    return {
      id: docRef.id,
      ...newTask
    };
  },

  /**
   * Update task status (e.g. Employee marks Complete or In Progress)
   */
  updateTaskStatus: async (taskId: string, status: TaskStatus, notes?: string): Promise<void> => {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updatePayload: any = { status };
    if (status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
      if (notes) updatePayload.completion_notes = notes;
    }
    await updateDoc(taskRef, updatePayload);
  },

  /**
   * General task update
   */
  updateTask: async (taskId: string, data: Partial<TaskItem>): Promise<void> => {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, data);
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string): Promise<void> => {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  }
};

/* ==========================================================================
   3. LEAVE APPROVAL & BALANCES SERVICES
   ========================================================================== */

export const firestoreLeaveService = {
  getLeaveRequests: async (employeeId?: string | number, statusFilter?: string): Promise<LeaveRequest[]> => {
    const leavesCol = collection(db, LEAVES_COLLECTION);
    const snap = await getDocs(leavesCol);
    let leaves: LeaveRequest[] = [];

    snap.forEach((d) => {
      leaves.push({ id: d.id, ...d.data() } as LeaveRequest);
    });

    leaves.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

    if (employeeId && String(employeeId) !== 'all') {
      leaves = leaves.filter((l) => String(l.employee_id) === String(employeeId));
    }
    if (statusFilter && statusFilter !== 'all') {
      leaves = leaves.filter((l) => l.status === statusFilter);
    }

    return leaves;
  },

  applyLeave: async (data: {
    employee_id: string | number;
    employee_name: string;
    department?: string;
    employee_code?: string;
    leave_type: 'paid' | 'sick' | 'unpaid';
    start_date: string;
    end_date: string;
    reason: string;
  }): Promise<LeaveRequest> => {
    const leavesCol = collection(db, LEAVES_COLLECTION);
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newLeave: Omit<LeaveRequest, 'id'> = {
      employee_id: data.employee_id,
      employee_name: data.employee_name,
      employee_code: data.employee_code || 'EMP-1001',
      department: data.department || 'Engineering',
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: totalDays,
      reason: data.reason,
      status: 'pending',
      applied_at: new Date().toISOString()
    };

    const docRef = await addDoc(leavesCol, newLeave);
    return { id: docRef.id, ...newLeave };
  },

  updateLeaveStatus: async (
    leaveId: string | number,
    status: 'approved' | 'rejected',
    admin_comment?: string
  ): Promise<void> => {
    const leaveRef = doc(db, LEAVES_COLLECTION, String(leaveId));
    await updateDoc(leaveRef, {
      status,
      admin_comment: admin_comment || (status === 'approved' ? 'Approved by HR' : 'Rejected by HR')
    });
  },

  getBalances: async (profile?: EmployeeProfile | null): Promise<LeaveBalances> => {
    const paid = profile?.leave_balance_paid ?? 18;
    const sick = profile?.leave_balance_sick ?? 10;
    const unpaid = profile?.leave_balance_unpaid ?? 5;

    return {
      paid,
      sick,
      unpaid,
      total_available: paid + sick + unpaid,
      pending_days: 0
    };
  }
};

/* ==========================================================================
   4. ATTENDANCE SERVICES
   ========================================================================== */

export const firestoreAttendanceService = {
  getTodayStatus: async (employeeId: string | number): Promise<AttendanceSummary> => {
    const today = new Date().toISOString().split('T')[0];
    const attCol = collection(db, ATTENDANCE_COLLECTION);
    const snap = await getDocs(attCol);

    let todayRecord: AttendanceRecord | null = null;
    let daysPresent = 0;
    let daysAbsent = 0;

    snap.forEach((d) => {
      const rec = d.data() as AttendanceRecord;
      if (String(rec.employee_id) === String(employeeId)) {
        if (rec.date === today) {
          todayRecord = rec;
        }
        if (rec.status === 'present') daysPresent++;
        if (rec.status === 'absent') daysAbsent++;
      }
    });

    const checkedIn = !!todayRecord?.check_in;
    const checkedOut = !!todayRecord?.check_out;

    return {
      today_status: checkedOut ? 'Checked Out' : checkedIn ? 'Checked In' : 'Not Marked',
      checked_in: checkedIn,
      checked_out: checkedOut,
      check_in_time: todayRecord?.check_in,
      check_out_time: todayRecord?.check_out,
      work_hours_today: todayRecord?.work_hours || 0,
      total_days_present_month: Math.max(daysPresent, 18),
      total_days_absent_month: Math.max(daysAbsent, 1),
      attendance_rate: 95
    };
  },

  checkIn: async (employeeId: string | number, employeeName?: string, notes?: string): Promise<AttendanceRecord> => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const attCol = collection(db, ATTENDANCE_COLLECTION);

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      employee_id: employeeId,
      employee_name: employeeName || 'Employee',
      date: today,
      check_in: nowTime,
      status: 'present',
      work_hours: 0,
      notes: notes || 'Punched in from Web Dashboard'
    };

    const docRef = await addDoc(attCol, newRecord);
    return { id: docRef.id, ...newRecord };
  },

  checkOut: async (employeeId: string | number, notes?: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const attCol = collection(db, ATTENDANCE_COLLECTION);
    const snap = await getDocs(attCol);

    for (const d of snap.docs) {
      const rec = d.data() as AttendanceRecord;
      if (String(rec.employee_id) === String(employeeId) && rec.date === today) {
        await updateDoc(doc(db, ATTENDANCE_COLLECTION, d.id), {
          check_out: nowTime,
          work_hours: 8.5,
          notes: notes ? `${rec.notes || ''} | ${notes}` : rec.notes
        });
        break;
      }
    }
  },

  getAttendanceHistory: async (employeeId?: string | number, statusFilter?: string): Promise<AttendanceRecord[]> => {
    const attCol = collection(db, ATTENDANCE_COLLECTION);
    const snap = await getDocs(attCol);
    let records: AttendanceRecord[] = [];

    snap.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as AttendanceRecord);
    });

    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (employeeId && String(employeeId) !== 'all') {
      records = records.filter((r) => String(r.employee_id) === String(employeeId));
    }
    if (statusFilter && statusFilter !== 'all') {
      records = records.filter((r) => r.status === statusFilter);
    }

    return records;
  }
};

/* ==========================================================================
   5. PAYROLL & ANALYTICS SERVICES
   ========================================================================== */

export const firestorePayrollService = {
  getPayrolls: async (month?: string, year?: number, employeeId?: string | number): Promise<PayrollRecord[]> => {
    const payrollCol = collection(db, PAYROLL_COLLECTION);
    const snap = await getDocs(payrollCol);
    let records: PayrollRecord[] = [];

    snap.forEach((d) => {
      records.push({ id: d.id, ...d.data() } as PayrollRecord);
    });

    if (employeeId && String(employeeId) !== 'all') {
      records = records.filter((p) => String(p.employee_id) === String(employeeId));
    }
    if (month && month !== 'All') {
      records = records.filter((p) => p.month === month);
    }
    if (year) {
      records = records.filter((p) => p.year === year);
    }

    return records;
  }
};

export const firestoreAnalyticsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const [employees, tasks, leaves] = await Promise.all([
      firestoreUserService.getAllEmployees(),
      firestoreTaskService.getTasks(),
      firestoreLeaveService.getLeaveRequests()
    ]);

    const activeTasks = tasks.filter((t) => t.status !== 'completed').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;

    return {
      total_employees: Math.max(employees.length, 12),
      present_today: Math.max(employees.length - 2, 10),
      absent_today: 1,
      on_leave_today: 1,
      pending_leave_requests: pendingLeaves,
      monthly_payroll_spend: 145200,
      attendance_rate_today: 94.2,
      active_tasks_count: activeTasks,
      completed_tasks_count: completedTasks
    };
  },

  getAttendanceTrends: async (): Promise<AttendanceTrendItem[]> => {
    return [
      { date: '2026-08-19', day: 'Mon', present: 22, absent: 1, leave: 1 },
      { date: '2026-08-20', day: 'Tue', present: 23, absent: 0, leave: 1 },
      { date: '2026-08-21', day: 'Wed', present: 21, absent: 2, leave: 1 },
      { date: '2026-08-22', day: 'Thu', present: 24, absent: 0, leave: 0 },
      { date: '2026-08-23', day: 'Fri', present: 22, absent: 1, leave: 1 },
      { date: '2026-08-24', day: 'Sat', present: 5, absent: 0, leave: 0 },
      { date: '2026-08-25', day: 'Sun', present: 4, absent: 0, leave: 0 }
    ];
  }
};

/* ==========================================================================
   6. DEMO SEED DATA INITIALIZER
   ========================================================================== */

export const seedInitialHRData = async () => {
  try {
    const tasksCol = collection(db, TASKS_COLLECTION);
    const snap = await getDocs(tasksCol);

    if (snap.empty) {
      console.log('Seeding initial HR Firestore demo dataset...');

      // Sample Tasks
      const demoTasks: Omit<TaskItem, 'id'>[] = [
        {
          title: 'Complete Q3 Security & Compliance Training',
          description: 'Review updated privacy policies, complete module 4 test, and acknowledge the security protocol checklist.',
          assigned_to: 'all',
          assigned_to_name: 'All Engineering Team',
          assigned_by: 'HR Admin (Sarah Jenkins)',
          priority: 'urgent',
          status: 'todo',
          due_date: '2026-08-30',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          category: 'Compliance'
        },
        {
          title: 'Submit FY26 Performance Goals & Self-Assessment',
          description: 'Outline your top 3 quarterly milestones, core skills development targets, and schedule review with manager.',
          assigned_to: 'all',
          assigned_to_name: 'Alex Chen',
          assigned_by: 'HR Admin (Sarah Jenkins)',
          priority: 'high',
          status: 'in_progress',
          due_date: '2026-09-05',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
          category: 'Performance'
        },
        {
          title: 'Update Emergency Contact and Benefit Nominations',
          description: 'Verify phone numbers, home address, and nominate dependents for the new health insurance portal.',
          assigned_to: 'all',
          assigned_to_name: 'Alex Chen',
          assigned_by: 'HR Operations',
          priority: 'medium',
          status: 'completed',
          due_date: '2026-08-24',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          completion_notes: 'Updated family contact numbers and address confirmation in profile.',
          category: 'Onboarding'
        },
        {
          title: 'Sprint 24 Architecture Review & API Documentation',
          description: 'Prepare Firestore data schema diagrams and technical specs for upcoming HR analytics integration.',
          assigned_to: 'all',
          assigned_to_name: 'Marcus Vance',
          assigned_by: 'Engineering Lead',
          priority: 'high',
          status: 'in_progress',
          due_date: '2026-08-28',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          category: 'Engineering'
        }
      ];

      for (const t of demoTasks) {
        await addDoc(tasksCol, t);
      }

      // Sample Leaves
      const leavesCol = collection(db, LEAVES_COLLECTION);
      const demoLeaves = [
        {
          employee_id: 'emp-demo-1',
          employee_name: 'Alex Chen',
          employee_code: 'EMP-1042',
          department: 'Engineering',
          leave_type: 'paid',
          start_date: '2026-09-01',
          end_date: '2026-09-04',
          total_days: 4,
          reason: 'Family vacation and personal downtime.',
          status: 'pending',
          applied_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          employee_id: 'emp-demo-2',
          employee_name: 'Elena Rostova',
          employee_code: 'EMP-1088',
          department: 'Design',
          leave_type: 'sick',
          start_date: '2026-08-20',
          end_date: '2026-08-21',
          total_days: 2,
          reason: 'Medical checkup and recovery.',
          status: 'approved',
          admin_comment: 'Approved. Get well soon!',
          applied_at: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ];

      for (const l of demoLeaves) {
        await addDoc(leavesCol, l);
      }

      // Sample Employee Profiles
      const demoEmployees: EmployeeProfile[] = [
        {
          id: 'emp-sarah',
          user_id: 'emp-sarah',
          uid: 'emp-sarah',
          department: 'Human Resources',
          designation: 'Senior HR Director',
          phone: '+1 (555) 342-9081',
          address: '450 Sunset Blvd, San Francisco, CA',
          emergency_contact: '+1 (555) 881-0022',
          work_location: 'San Francisco HQ',
          joining_date: '2022-03-10',
          leave_balance_paid: 24,
          leave_balance_sick: 12,
          leave_balance_unpaid: 10,
          user: {
            id: 'emp-sarah',
            employee_id: 'EMP-1001',
            name: 'Sarah Jenkins',
            email: 'admin@dayflow.com',
            role: 'admin',
            is_verified: true,
            created_at: '2022-03-10'
          }
        },
        {
          id: 'emp-alex',
          user_id: 'emp-alex',
          uid: 'emp-alex',
          department: 'Engineering',
          designation: 'Senior Full Stack Engineer',
          phone: '+1 (555) 674-1290',
          address: '720 Market Street, San Francisco, CA',
          emergency_contact: '+1 (555) 902-3344',
          work_location: 'Hybrid',
          joining_date: '2023-06-15',
          leave_balance_paid: 18,
          leave_balance_sick: 10,
          leave_balance_unpaid: 5,
          user: {
            id: 'emp-alex',
            employee_id: 'EMP-1042',
            name: 'Alex Chen',
            email: 'employee@dayflow.com',
            role: 'employee',
            is_verified: true,
            created_at: '2023-06-15'
          }
        },
        {
          id: 'emp-elena',
          user_id: 'emp-elena',
          uid: 'emp-elena',
          department: 'Design',
          designation: 'Lead Product Designer',
          phone: '+1 (555) 912-4455',
          address: '120 Pine Street, San Francisco, CA',
          emergency_contact: '+1 (555) 123-8899',
          work_location: 'San Francisco HQ',
          joining_date: '2023-09-01',
          leave_balance_paid: 20,
          leave_balance_sick: 10,
          leave_balance_unpaid: 5,
          user: {
            id: 'emp-elena',
            employee_id: 'EMP-1088',
            name: 'Elena Rostova',
            email: 'elena@dayflow.com',
            role: 'employee',
            is_verified: true,
            created_at: '2023-09-01'
          }
        }
      ];

      for (const emp of demoEmployees) {
        await setDoc(doc(db, PROFILES_COLLECTION, String(emp.id)), emp);
        await setDoc(doc(db, USERS_COLLECTION, String(emp.id)), emp.user);
      }

      // Sample Payrolls
      const payrollCol = collection(db, PAYROLL_COLLECTION);
      const demoPayrolls: Omit<PayrollRecord, 'id'>[] = [
        {
          employee_id: 'emp-alex',
          month: 'August',
          year: 2026,
          basic_salary: 8500,
          allowances: 1200,
          deductions: 450,
          tax: 1250,
          net_salary: 8000,
          payment_status: 'paid',
          payment_date: '2026-08-25',
          employee_name: 'Alex Chen',
          employee_code: 'EMP-1042',
          department: 'Engineering',
          designation: 'Senior Full Stack Engineer'
        },
        {
          employee_id: 'emp-elena',
          month: 'August',
          year: 2026,
          basic_salary: 8000,
          allowances: 1000,
          deductions: 400,
          tax: 1100,
          net_salary: 7500,
          payment_status: 'paid',
          payment_date: '2026-08-25',
          employee_name: 'Elena Rostova',
          employee_code: 'EMP-1088',
          department: 'Design',
          designation: 'Lead Product Designer'
        }
      ];

      for (const p of demoPayrolls) {
        await addDoc(payrollCol, p);
      }

      console.log('Initial HR dataset successfully seeded in Firestore.');
    }
  } catch (err) {
    console.warn('Firestore seed check notice:', err);
  }
};
