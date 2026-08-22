import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsService } from '../services/api';
import type { AttendanceTrendItem } from '../types';

const MONO_COLORS = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46', '#18181b'];

export const AnalyticsPage: React.FC = () => {
  const [trends, setTrends] = useState<AttendanceTrendItem[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllAnalytics = async () => {
      try {
        const [t, d, l, p] = await Promise.all([
          analyticsService.getAttendanceTrends(14),
          analyticsService.getDepartmentBreakdown(),
          analyticsService.getLeaveDistribution(),
          analyticsService.getPayrollHistory(),
        ]);
        setTrends(t);
        setDepts(d);
        setLeaves(l);
        setPayrolls(p);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllAnalytics();
  }, []);

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      departments: depts,
      leaveDistribution: leaves,
      payrollTrend: payrolls,
      attendanceHistory: trends,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dayflow_Executive_Report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Intelligence & BI
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white mt-1">
            Workforce Intelligence & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time visual reports on presence trends, leave burn rates, and financial compensations.
          </p>
        </div>

        <button
          onClick={exportReport}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Full BI Report</span>
        </button>
      </div>

      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends Area Chart */}
        <GlassCard>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">14-Day Attendance Telemetry</h3>
                <p className="text-xs text-zinc-500">Presence vs Absence tracking</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaPres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#ffffff" strokeWidth={2.5} fill="url(#areaPres)" name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#71717a" strokeWidth={2} fill="transparent" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Department Distribution Bar Chart */}
        <GlassCard>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Department Headcount</h3>
                <p className="text-xs text-zinc-500">Talent distribution across departments</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis dataKey="department" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#ffffff" radius={[8, 8, 0, 0]} name="Headcount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Type Breakdown */}
        <GlassCard>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Leave Category Utilization</h3>
                <p className="text-xs text-zinc-500">Share of taken days</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaves}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {leaves.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
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

        {/* Monthly Payroll Burn Rate Bar Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Monthly Payroll Expenditure</h3>
                <p className="text-xs text-zinc-500">Net payout vs tax deductions</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrolls} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
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
                <Bar dataKey="total" fill="#ffffff" radius={[6, 6, 0, 0]} name="Net Paid (₹)" />
                <Bar dataKey="tax" fill="#71717a" radius={[6, 6, 0, 0]} name="Taxes (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
