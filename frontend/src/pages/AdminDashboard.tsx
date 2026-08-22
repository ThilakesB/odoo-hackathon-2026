import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  CalendarDays,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Shield,
  Download
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { analyticsService, leaveService, employeeService } from '../services/api';
import type { DashboardSummary, AttendanceTrendItem, LeaveRequest } from '../types';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const PIE_COLORS = ['#0c8ee9', '#10b981', '#f59e0b', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrendItem[]>([]);
  const [leaveDistribution, setLeaveDistribution] = useState<any[]>([]);
  const [deptBreakdown, setDeptBreakdown] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [sum, trends, leaveDist, depts, leaves] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getAttendanceTrends(7),
        analyticsService.getLeaveDistribution(),
        analyticsService.getDepartmentBreakdown(),
        leaveService.getLeaveRequests('pending'),
      ]);

      setSummary(sum);
      setAttendanceTrends(trends);
      setLeaveDistribution(leaveDist);
      setDeptBreakdown(depts);
      setPendingLeaves(leaves);
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLeaveAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await leaveService.updateLeaveStatus(id, status, `Decision recorded by Admin on ${new Date().toLocaleDateString()}`);
      if (status === 'approved') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      await loadAdminData();
    } catch (err) {
      console.error('Failed to update leave status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Executive Overview
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Organization Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time workforce monitoring, leave approvals, attendance telemetry & payroll metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/analytics"
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4 text-brand-500" />
            <span>Full Analytics</span>
          </Link>

          <Link
            to="/admin/employees"
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Headcount"
          value={summary?.total_employees || 0}
          subtitle="Active workforce"
          icon={Users}
          accentColor="brand"
        />

        <StatCard
          title="Present Today"
          value={summary?.present_today || 0}
          subtitle={`${summary?.attendance_rate_today || 0}% present`}
          icon={UserCheck}
          accentColor="emerald"
        />

        <StatCard
          title="Absent / Off"
          value={summary?.absent_today || 0}
          subtitle="Unlogged today"
          icon={UserX}
          accentColor="rose"
        />

        <StatCard
          title="Pending Leaves"
          value={summary?.pending_leave_requests || 0}
          subtitle="Awaiting approval"
          icon={CalendarDays}
          accentColor="amber"
        />

        <StatCard
          title="Monthly Payroll"
          value={`$${(summary?.monthly_payroll_spend || 0).toLocaleString()}`}
          subtitle="Total net expenditure"
          icon={DollarSign}
          accentColor="purple"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Trend Area Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Telemetry (Last 7 Days)</h3>
                <p className="text-xs text-slate-500">Daily check-in and presence trend</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8ee9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8ee9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#0c8ee9" strokeWidth={2.5} fillOpacity={1} fill="url(#presentGrad)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#absentGrad)" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Leave Distribution Donut Chart */}
        <GlassCard>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leave Distribution</h3>
                <p className="text-xs text-slate-500">Breakdown by category</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center pt-2">
            {leaveDistribution.length === 0 ? (
              <p className="text-xs text-slate-400">No leave requests logged</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="type"
                  >
                    {leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Pending Leave Requests Queue */}
      <GlassCard>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pending Leave Approvals Queue ({pendingLeaves.length})
              </h3>
              <p className="text-xs text-slate-500">Action employee time-off requests</p>
            </div>
          </div>

          <Link
            to="/leave"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Leave Management Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto pt-3">
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              🎉 All leave requests have been reviewed and resolved!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">Leave Type</th>
                  <th className="pb-3 px-3">Dates & Duration</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {pendingLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{l.employee_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{l.employee_code} • {l.department}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {l.leave_type} Leave
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {l.start_date} to {l.end_date}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        ({l.total_days} {l.total_days === 1 ? 'day' : 'days'})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="truncate text-slate-600 dark:text-slate-300">{l.reason}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleLeaveAction(l.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleLeaveAction(l.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
