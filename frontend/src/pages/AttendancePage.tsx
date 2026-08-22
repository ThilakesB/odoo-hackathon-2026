import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { QuickClockWidget } from '../components/QuickClockWidget';
import {
  Clock,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer
} from 'lucide-react';
import { attendanceService } from '../services/api';
import type { AttendanceRecord, AttendanceSummary } from '../types';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'month'>('all');

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getAttendanceHistory(statusFilter);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [statusFilter]);

  const filteredRecords = records.filter((r) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchName = r.employee_name?.toLowerCase().includes(searchLower);
      const matchCode = r.employee_code?.toLowerCase().includes(searchLower);
      const matchDept = r.department?.toLowerCase().includes(searchLower);
      if (!matchName && !matchCode && !matchDept) return false;
    }
    if (viewMode === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return r.date === todayStr;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID,Employee Name,Employee Code,Department,Date,Check In,Check Out,Work Hours,Status\n'];
    const rows = filteredRecords.map(
      (r) =>
        `${r.id},"${r.employee_name || ''}","${r.employee_code || ''}","${r.department || ''}",${r.date},"${r.check_in || ''}","${r.check_out || ''}",${r.work_hours},${r.status}`
    );
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dayflow_Attendance_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Present
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Timer className="w-3 h-3" /> Half Day
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAdmin ? 'Organization Attendance Central' : 'My Attendance & Shifts'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track daily working hours, check-in punch times, and monthly presence compliance.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Quick Clock in/out widget for regular employees */}
      {!isAdmin && <QuickClockWidget />}

      {/* Filter and View Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isAdmin ? "Search employee name, ID, department..." : "Filter records..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-brand-500 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* View Toggles & Status Select */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'all' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setViewMode('today')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'today' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                Today Only
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Attendance Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading attendance data...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">No attendance records found matching filters.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Date</th>
                  {isAdmin && <th className="pb-3 px-3">Employee</th>}
                  <th className="pb-3 px-3">Check In</th>
                  <th className="pb-3 px-3">Check Out</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {rec.date}
                    </td>

                    {isAdmin && (
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{rec.employee_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rec.employee_code} • {rec.department}</span>
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {rec.check_in || '—'}
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {rec.check_out || '—'}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-brand-600 dark:text-brand-400">
                      {rec.work_hours > 0 ? `${rec.work_hours} hrs` : '—'}
                    </td>

                    <td className="py-3 px-3">{getStatusBadge(rec.status)}</td>

                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {rec.notes || 'Routine check-in'}
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
