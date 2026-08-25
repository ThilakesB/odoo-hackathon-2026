import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Shield,
  CheckSquare,
  ArrowUpRight,
  Plus
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
  Legend
} from 'recharts';
import { analyticsService, leaveService } from '../services/api';
import { firestoreTaskService } from '../services/firestoreService';
import type { DashboardSummary, AttendanceTrendItem, LeaveRequest, TaskItem } from '../types';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const PIE_COLORS = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46', '#18181b'];

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrendItem[]>([]);
  const [leaveDistribution, setLeaveDistribution] = useState<{ type: string; count: number }[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [sum, trends, leaveDist, leaves, allTasks] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getAttendanceTrends(),
        analyticsService.getLeaveDistribution(),
        leaveService.getLeaveRequests(),
        firestoreTaskService.getTasks()
      ]);
      setSummary(sum);
      setAttendanceTrends(trends);
      setLeaveDistribution(leaveDist);
      setPendingLeaves(leaves.filter((l) => l.status === 'pending'));
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLeaveAction = async (id: number | string, status: 'approved' | 'rejected') => {
    try {
      await leaveService.reviewLeaveRequest(
        id,
        status,
        `Decision recorded by HR Admin on ${new Date().toLocaleDateString()}`
      );
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
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Executive Overview
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mt-1">
            Organization Command Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time workforce monitoring, task delegation, leave approvals & payroll metrics powered by Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <span>Task Hub</span>
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
          value={summary?.total_employees || 12}
          subtitle="Active workforce"
          icon={Users}
          accentColor="brand"
        />

        <StatCard
          title="Present Today"
          value={summary?.present_today || 10}
          subtitle={`${summary?.attendance_rate_today || 94.2}% presence`}
          icon={UserCheck}
          accentColor="brand"
        />

        <StatCard
          title="Tasks Active"
          value={tasks.filter((t) => t.status !== 'completed').length}
          subtitle={`${tasks.filter((t) => t.status === 'completed').length} completed`}
          icon={CheckSquare}
          accentColor="brand"
        />

        <StatCard
          title="Pending Leaves"
          value={pendingLeaves.length}
          subtitle="Awaiting approval"
          icon={Calendar}
          accentColor="brand"
        />

        <StatCard
          title="Monthly Payroll"
          value={`₹${(summary?.monthly_payroll_spend || 145200).toLocaleString()}`}
          subtitle="Total net expenditure"
          icon={DollarSign}
          accentColor="brand"
        />
      </div>

      {/* Team Tasks Oversight & Leave Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Tasks Tile */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Active Tasks & Milestones Oversight</h3>
                <p className="text-xs text-zinc-500">Live employee deliverables in Cloud Firestore</p>
              </div>
            </div>

            <Link
              to="/tasks"
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1"
            >
              <span>Manage & Assign</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-4">
            {tasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950 dark:text-white">{t.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {t.priority}
                    </span>
                    <span className="capitalize text-[10px] font-semibold text-zinc-400">
                      • {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-0.5 line-clamp-1">
                    Assignee: <span className="font-semibold text-zinc-300">{t.assigned_to_name}</span> • Due: {t.due_date}
                  </p>
                </div>

                <Link
                  to="/tasks"
                  className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 text-xs font-semibold shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Leave Distribution Donut Chart */}
        <GlassCard>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Leave Distribution</h3>
                <p className="text-xs text-zinc-500">Breakdown by category</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveDistribution.length > 0 ? leaveDistribution : [{ type: 'paid', count: 12 }, { type: 'sick', count: 6 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="type"
                >
                  {leaveDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-zinc-400 capitalize">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Pending Leave Requests Queue */}
      <GlassCard>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Pending Leave Approvals Queue ({pendingLeaves.length})
              </h3>
              <p className="text-xs text-zinc-500">Action employee time-off requests directly</p>
            </div>
          </div>

          <Link
            to="/leave"
            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1"
          >
            <span>Leave Management Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto pt-3">
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400">
              🎉 All leave requests have been reviewed and resolved!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">Leave Type</th>
                  <th className="pb-3 px-3">Dates & Duration</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pendingLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-zinc-950 dark:text-white block">{l.employee_name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{l.employee_code || 'EMP-1042'} • {l.department || 'Engineering'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                        {l.leave_type} Leave
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {l.start_date} to {l.end_date}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-semibold">
                        ({l.total_days} {l.total_days === 1 ? 'day' : 'days'})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="truncate text-zinc-600 dark:text-zinc-400">{l.reason}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleLeaveAction(l.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleLeaveAction(l.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-semibold text-xs transition flex items-center gap-1"
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
export default AdminDashboard;
