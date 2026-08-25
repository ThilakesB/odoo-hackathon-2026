import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import { QuickClockWidget } from '../components/QuickClockWidget';
import { LeaveApplyModal } from '../components/LeaveApplyModal';
import { PayslipModal } from '../components/PayslipModal';
import {
  CalendarDays,
  Clock,
  CreditCard,
  Sparkles,
  Calendar,
  ChevronRight,
  TrendingUp,
  FileText,
  Palmtree,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  ArrowUpRight
} from 'lucide-react';
import { leaveService, payrollService, attendanceService } from '../services/api';
import { firestoreTaskService } from '../services/firestoreService';
import type { LeaveBalances, LeaveRequest, PayrollRecord, AttendanceSummary, TaskItem } from '../types';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface EmployeeDashboardProps {
  onOpenAIChat: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onOpenAIChat }) => {
  const { user, profile } = useAuth();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalances | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [latestPayroll, setLatestPayroll] = useState<PayrollRecord | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<PayrollRecord | null>(null);

  const loadData = async () => {
    try {
      const [balances, leaves, payrolls, att, tasks] = await Promise.all([
        leaveService.getBalances(),
        leaveService.getLeaveRequests(),
        payrollService.getPayrolls(),
        attendanceService.getTodayStatus(),
        firestoreTaskService.getTasks()
      ]);
      setLeaveBalances(balances);
      setRecentLeaves(leaves.slice(0, 3));
      if (payrolls.length > 0) {
        setLatestPayroll(payrolls[0]);
      }
      setAttendanceSummary(att);

      // Filter tasks assigned to this employee or company-wide
      const employeeTasks = tasks.filter(
        (t) =>
          t.assigned_to === 'all' ||
          t.assigned_to === String(user?.id) ||
          t.assigned_to === user?.employee_id ||
          t.assigned_to_name.toLowerCase().includes(user?.name.toLowerCase() || '')
      );
      setMyTasks(employeeTasks);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleQuickCompleteTask = async (task: TaskItem) => {
    try {
      await firestoreTaskService.updateTaskStatus(task.id, 'completed', 'Completed from Dashboard');
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 }
      });
      await loadData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const upcomingHolidays = [
    { name: 'Labor Day Weekend', date: 'Sep 01, 2026', type: 'Public Holiday' },
    { name: 'Autumn Equinox Day', date: 'Sep 22, 2026', type: 'Company Off' },
    { name: 'Thanksgiving Break', date: 'Nov 27, 2026', type: 'Public Holiday' },
  ];

  const pendingTasks = myTasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Good day, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {profile?.designation} • {profile?.department} ({profile?.work_location || 'San Francisco HQ'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4 text-brand-500" />
            <span>Apply Leave</span>
          </button>

          <Link
            to="/tasks"
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks Hub</span>
          </Link>
        </div>
      </div>

      {/* Live Check-In Widget */}
      <QuickClockWidget />

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tasks"
          value={`${pendingTasks.length} Pending`}
          subtitle={myTasks.length > 0 ? `${myTasks.length - pendingTasks.length} finished this cycle` : 'No deliverables'}
          icon={CheckSquare}
          accentColor="brand"
        />

        <StatCard
          title="Remaining Leaves"
          value={leaveBalances ? `${leaveBalances.total_available} Days` : '18 Days'}
          subtitle={leaveBalances ? `${leaveBalances.paid} Paid • ${leaveBalances.sick} Sick` : 'Standard quota'}
          icon={Palmtree}
          accentColor="emerald"
        />

        <StatCard
          title="Attendance Rate"
          value={attendanceSummary ? `${attendanceSummary.attendance_rate}%` : '95.0%'}
          subtitle={attendanceSummary ? `${attendanceSummary.total_days_present_month} days present this month` : 'Active status'}
          icon={Clock}
          accentColor="indigo"
        />

        <StatCard
          title="Latest Net Salary"
          value={latestPayroll ? `₹${latestPayroll.net_salary.toLocaleString()}` : '₹8,000'}
          subtitle={latestPayroll ? `${latestPayroll.month} ${latestPayroll.year} Disbursed` : 'Monthly statement'}
          icon={CreditCard}
          accentColor="amber"
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Tasks Tile & Leave Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* ASSIGNED TASKS & DELIVERABLES TILE */}
          <GlassCard>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Assigned Tasks & Milestones</h3>
                  <p className="text-xs text-zinc-500">Active deliverables tracked in Cloud Firestore</p>
                </div>
              </div>

              <Link
                to="/tasks"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Task Board</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 pt-4">
              {myTasks.length === 0 ? (
                <div className="text-xs text-slate-400 p-6 text-center">
                  🎉 No pending tasks assigned right now!
                </div>
              ) : (
                myTasks.slice(0, 3).map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        isCompleted
                          ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/60 opacity-80'
                          : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-950 dark:text-white'}`}>
                            {task.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-zinc-500 line-clamp-1">{task.description}</p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>Due: {task.due_date}</span>
                          <span>•</span>
                          <span>Assigned by: {task.assigned_by}</span>
                        </div>
                      </div>

                      {!isCompleted ? (
                        <button
                          onClick={() => handleQuickCompleteTask(task)}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center justify-center gap-1.5 self-start sm:self-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Completed
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* Leave Quota & Recent Requests */}
          <GlassCard>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Leave Balance & Requests</h3>
                  <p className="text-xs text-zinc-500">Your vacation quotas and status history</p>
                </div>
              </div>

              <Link
                to="/leave"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Leave Balance Meters */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase text-zinc-400 block">Annual Paid</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                    {leaveBalances?.paid ?? 18}
                  </span>
                  <span className="text-xs text-zinc-400">days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase text-zinc-400 block">Sick Leave</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                    {leaveBalances?.sick ?? 10}
                  </span>
                  <span className="text-xs text-zinc-400">days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase text-zinc-400 block">Unpaid Leave</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                    {leaveBalances?.unpaid ?? 5}
                  </span>
                  <span className="text-xs text-zinc-400">days</span>
                </div>
              </div>
            </div>

            {/* Recent Requests list */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Recent Submissions
              </span>
              {recentLeaves.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center">No recent leave requests.</div>
              ) : (
                recentLeaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {l.leave_type} Leave ({l.total_days} {l.total_days === 1 ? 'day' : 'days'})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            l.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : l.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 line-clamp-1">{l.reason}</p>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {l.start_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Col: Profile Card & Upcoming Holidays */}
        <div className="space-y-6">
          {/* Profile Overview Card */}
          <GlassCard className="text-center p-6 space-y-3">
            <div className="relative inline-block">
              <img
                src={
                  profile?.profile_picture ||
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                }
                alt={user?.name}
                className="w-20 h-20 rounded-2xl mx-auto object-cover ring-4 ring-brand-500/20 shadow-lg"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <p className="text-xs text-slate-500">{profile?.designation}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-600 dark:text-brand-400">
                {profile?.department}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-left space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee ID:</span>
                <span className="font-mono font-semibold">{user?.employee_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Work Location:</span>
                <span className="font-medium">{profile?.work_location || 'San Francisco HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium truncate max-w-[150px]">{user?.email}</span>
              </div>
            </div>

            <Link
              to="/profile"
              className="w-full btn-secondary text-xs py-2 block text-center mt-3 font-semibold"
            >
              Manage My Profile
            </Link>
          </GlassCard>

          {/* Upcoming Holidays */}
          <GlassCard>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Upcoming Holidays
              </h3>
            </div>

            <div className="space-y-3 pt-3">
              {upcomingHolidays.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{h.name}</p>
                    <p className="text-[10px] text-slate-400">{h.type}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {h.date}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Leave Application Modal */}
      <LeaveApplyModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onSuccess={loadData}
      />

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayrollForModal}
        payroll={selectedPayrollForModal}
        onClose={() => setSelectedPayrollForModal(null)}
      />
    </div>
  );
};
