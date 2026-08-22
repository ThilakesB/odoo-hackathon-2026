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
  AlertCircle
} from 'lucide-react';
import { leaveService, payrollService, attendanceService } from '../services/api';
import type { LeaveBalances, LeaveRequest, PayrollRecord, AttendanceSummary } from '../types';
import { Link } from 'react-router-dom';

interface EmployeeDashboardProps {
  onOpenAIChat: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onOpenAIChat }) => {
  const { user, profile } = useAuth();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalances | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [latestPayroll, setLatestPayroll] = useState<PayrollRecord | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedPayrollForModal, setSelectedPayrollForModal] = useState<PayrollRecord | null>(null);

  const loadData = async () => {
    try {
      const [balances, leaves, payrolls, att] = await Promise.all([
        leaveService.getBalances(),
        leaveService.getLeaveRequests(),
        payrollService.getPayrolls(),
        attendanceService.getTodayStatus(),
      ]);
      setLeaveBalances(balances);
      setRecentLeaves(leaves.slice(0, 3));
      if (payrolls.length > 0) {
        setLatestPayroll(payrolls[0]);
      }
      setAttendanceSummary(att);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcomingHolidays = [
    { name: 'Labor Day Weekend', date: 'Sep 01, 2025', type: 'Public Holiday' },
    { name: 'Autumn Equinox Day', date: 'Sep 22, 2025', type: 'Company Off' },
    { name: 'Thanksgiving Break', date: 'Nov 27, 2025', type: 'Public Holiday' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Good day, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {profile?.designation} • {profile?.department} ({profile?.work_location || 'Remote'})
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

          <button
            onClick={onOpenAIChat}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Dayflow AI</span>
          </button>
        </div>
      </div>

      {/* Live Check-In Widget */}
      <QuickClockWidget />

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={attendanceSummary ? `${attendanceSummary.attendance_rate}%` : '0.0%'}
          subtitle={attendanceSummary ? `${attendanceSummary.total_days_present_month} days present this month` : 'No attendance logged'}
          icon={Clock}
          accentColor="brand"
        />

        <StatCard
          title="Remaining Leaves"
          value={leaveBalances ? `${leaveBalances.total_available} Days` : '0 Days'}
          subtitle={leaveBalances ? `${leaveBalances.paid} Paid • ${leaveBalances.sick} Sick` : 'No quota loaded'}
          icon={Palmtree}
          accentColor="emerald"
        />

        <StatCard
          title="Latest Net Salary"
          value={latestPayroll ? `$${latestPayroll.net_salary.toLocaleString()}` : '$0.00'}
          subtitle={latestPayroll ? `${latestPayroll.month} ${latestPayroll.year} Disbursed` : 'No records yet'}
          icon={CreditCard}
          accentColor="indigo"
        />

        <StatCard
          title="Pending Requests"
          value={leaveBalances?.pending_days ? `${leaveBalances.pending_days} Days` : '0 Days'}
          subtitle={leaveBalances?.pending_days ? 'Awaiting HR review' : 'All requests resolved'}
          icon={Calendar}
          accentColor="amber"
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leave Activity & Salary Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Quota & Recent Requests */}
          <GlassCard>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leave Balance & Requests</h3>
                  <p className="text-xs text-slate-500">Your live vacation quotas and status history</p>
                </div>
              </div>

              <Link
                to="/leave"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Leave Balance Meters */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Annual Paid</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                    {leaveBalances?.paid ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Sick Leave</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {leaveBalances?.sick ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Unpaid Leave</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {leaveBalances?.unpaid ?? 0}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
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

          {/* Salary & Payslip Preview Card */}
          {latestPayroll && (
            <GlassCard>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Latest Salary Payslip</h3>
                    <p className="text-xs text-slate-500">{latestPayroll.month} {latestPayroll.year} Statement</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayrollForModal(latestPayroll)}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Full Slip</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Basic Pay</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${latestPayroll.basic_salary.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Allowances</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +${latestPayroll.allowances.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deductions</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    -${(latestPayroll.deductions + latestPayroll.tax).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <span className="text-brand-600 dark:text-brand-400 block text-[10px] uppercase font-bold">Take Home Net</span>
                  <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                    ${latestPayroll.net_salary.toLocaleString()}
                  </span>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Col: Profile Card, Upcoming Holidays, AI Helper Teaser */}
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
                <span className="font-medium">{profile?.work_location || 'Not Specified'}</span>
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
