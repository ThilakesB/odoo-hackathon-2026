import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { QuickClockWidget } from '../components/QuickClockWidget';
import {
  Clock,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  User,
  Info,
  X,
  Sparkles
} from 'lucide-react';
import { attendanceService, employeeService } from '../services/api';
import type { AttendanceRecord, EmployeeProfile } from '../types';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    dateStr: string;
    records: AttendanceRecord[];
  } | null>(null);

  // Fetch employees list if admin
  useEffect(() => {
    if (isAdmin) {
      employeeService.listEmployees().then(setEmployees).catch(console.warn);
    }
  }, [isAdmin]);

  // Load attendance records
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const empId = selectedEmployeeId !== 'all' ? parseInt(selectedEmployeeId) : undefined;
      const data = await attendanceService.getAttendanceHistory(statusFilter, empId);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [statusFilter, selectedEmployeeId]);

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = r.employee_name?.toLowerCase().includes(searchLower);
        const matchCode = r.employee_code?.toLowerCase().includes(searchLower);
        const matchDept = r.department?.toLowerCase().includes(searchLower);
        if (!matchName && !matchCode && !matchDept) return false;
      }
      return true;
    });
  }, [records, search]);

  // Calendar Computations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

  // Map records by date string "YYYY-MM-DD"
  const recordsByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord[]> = {};
    filteredRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [filteredRecords]);

  // Month summary statistics
  const currentMonthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthRecs = filteredRecords.filter((r) => r.date.startsWith(monthPrefix));

    let present = 0;
    let absent = 0;
    let halfDay = 0;

    monthRecs.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent' || r.status === 'leave') absent++;
      else if (r.status === 'half_day') halfDay++;
    });

    const total = monthRecs.length || 1;
    const rate = Math.round(((present + halfDay * 0.5) / total) * 100);

    return { present, absent, halfDay, total: monthRecs.length, rate };
  }, [filteredRecords, year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const exportCSV = () => {
    const headers = ['ID,Employee Name,Employee Code,Department,Date,Check In,Check Out,Work Hours,Status,Notes\n'];
    const rows = filteredRecords.map(
      (r) =>
        `${r.id},"${r.employee_name || ''}","${r.employee_code || ''}","${r.department || ''}",${r.date},"${r.check_in || ''}","${r.check_out || ''}",${r.work_hours},${r.status},"${r.notes || ''}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dayflow_Attendance_${year}_${month + 1}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Present
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Half Day
          </span>
        );
      case 'absent':
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Absent / Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
            {status}
          </span>
        );
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-zinc-900" />
            <span>{isAdmin ? 'Organization Attendance Central' : 'My Attendance & Calendar'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {isAdmin
              ? 'View and monitor attendance records for all employees across the organization.'
              : 'View your personal monthly attendance calendar with daily check-in status.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'calendar'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Clock in/out widget for regular employees */}
      {!isAdmin && <QuickClockWidget />}

      {/* Monthly Statistics Overview Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            🟢
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Present Days
            </span>
            <span className="text-xl font-extrabold text-zinc-950">
              {currentMonthStats.present}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            🔴
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Absent / Leaves
            </span>
            <span className="text-xl font-extrabold text-zinc-950">
              {currentMonthStats.absent}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            🟡
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Half Days
            </span>
            <span className="text-xl font-extrabold text-zinc-950">
              {currentMonthStats.halfDay}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold">
            📊
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Compliance Rate
            </span>
            <span className="text-xl font-extrabold text-zinc-950">
              {currentMonthStats.rate}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Navigation Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Calendar Month Selector Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-extrabold text-zinc-900 min-w-[140px] text-center">
              {monthName} {year}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition ml-1"
            >
              Today
            </button>
          </div>

          {/* Filters for Admin / Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={isAdmin ? "Search employee name / ID..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 w-44 sm:w-56"
              />
            </div>

            {/* Admin Employee Picker */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                >
                  <option value="all">All Employees (Team Overview)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.user.employee_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="present">🟢 Present</option>
              <option value="absent">🔴 Absent / Leave</option>
              <option value="half_day">🟡 Half Day</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 1. CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <GlassCard className="p-4 sm:p-6 overflow-hidden">
          {/* Calendar Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-zinc-700">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="text-zinc-600 font-medium">Present (Green)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                <span className="text-zinc-600 font-medium">Leave / Absent (Red)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                <span className="text-zinc-600 font-medium">Half Day (Yellow)</span>
              </div>
            </div>

            <span className="text-[11px] text-zinc-400 font-medium">
              Click any date to inspect daily logs
            </span>
          </div>

          {/* Weekday Column Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Matrix */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty padding boxes for days before month start */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[85px] sm:min-h-[105px] rounded-2xl bg-zinc-50/40 border border-transparent opacity-30"
              />
            ))}

            {/* Actual Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayRecords = recordsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;

              // Compute counts for the day
              const presentRecs = dayRecords.filter((r) => r.status === 'present');
              const absentRecs = dayRecords.filter((r) => r.status === 'absent' || r.status === 'leave');
              const halfDayRecs = dayRecords.filter((r) => r.status === 'half_day');

              const hasRecords = dayRecords.length > 0;
              const isWeekend = new Date(year, month, dayNumber).getDay() === 0 || new Date(year, month, dayNumber).getDay() === 6;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (hasRecords) {
                      setSelectedDayDetails({ dateStr, records: dayRecords });
                    }
                  }}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border transition flex flex-col justify-between group ${
                    hasRecords ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''
                  } ${
                    isToday
                      ? 'border-zinc-900 bg-zinc-50/90 ring-2 ring-zinc-900/10'
                      : isWeekend
                      ? 'border-zinc-100 bg-zinc-50/50'
                      : 'border-zinc-200/80 bg-white hover:border-zinc-400'
                  }`}
                >
                  {/* Top Day Number & Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]'
                          : isWeekend
                          ? 'text-zinc-400'
                          : 'text-zinc-800'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {/* Dot Indicators */}
                    {hasRecords && (
                      <div className="flex items-center gap-1">
                        {presentRecs.length > 0 && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-in zoom-in duration-200"
                            title={`${presentRecs.length} Present`}
                          />
                        )}
                        {absentRecs.length > 0 && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100 animate-in zoom-in duration-200"
                            title={`${absentRecs.length} Absent / On Leave`}
                          />
                        )}
                        {halfDayRecs.length > 0 && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 animate-in zoom-in duration-200"
                            title={`${halfDayRecs.length} Half Day`}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="pt-1">
                    {!hasRecords ? (
                      <span className="text-[10px] text-zinc-300 font-medium">
                        {isWeekend ? 'Weekend' : 'No data'}
                      </span>
                    ) : selectedEmployeeId !== 'all' || !isAdmin ? (
                      // Single Employee View: Show punch in/out & hours
                      <div className="space-y-0.5">
                        {dayRecords[0]?.check_in && (
                          <span className="text-[10px] font-mono font-bold text-zinc-700 block truncate">
                            {dayRecords[0].check_in}
                          </span>
                        )}
                        {dayRecords[0]?.status === 'present' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                            🟢 Present
                          </span>
                        )}
                        {(dayRecords[0]?.status === 'absent' || dayRecords[0]?.status === 'leave') && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                            🔴 Leave
                          </span>
                        )}
                        {dayRecords[0]?.status === 'half_day' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            🟡 Half Day
                          </span>
                        )}
                      </div>
                    ) : (
                      // Admin Multi-Employee Team View: Show count badges
                      <div className="flex flex-wrap gap-1">
                        {presentRecs.length > 0 && (
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                            🟢 {presentRecs.length}
                          </span>
                        )}
                        {absentRecs.length > 0 && (
                          <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded-md">
                            🔴 {absentRecs.length}
                          </span>
                        )}
                        {halfDayRecs.length > 0 && (
                          <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                            🟡 {halfDayRecs.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* 2. TABLE / LIST VIEW */}
      {viewMode === 'table' && (
        <GlassCard>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-xs text-zinc-400">Loading attendance data...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400">
                No attendance records found matching filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-4">Date</th>
                    {isAdmin && <th className="pb-3 px-4">Employee</th>}
                    <th className="pb-3 px-4">Check In</th>
                    <th className="pb-3 px-4">Check Out</th>
                    <th className="pb-3 px-4">Work Hours</th>
                    <th className="pb-3 px-4">Status Indicator</th>
                    <th className="pb-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                        {rec.date}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-zinc-900 block">{rec.employee_name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {rec.employee_code} • {rec.department}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-700 whitespace-nowrap">
                        {rec.check_in || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-700 whitespace-nowrap">
                        {rec.check_out || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                        {rec.work_hours > 0 ? `${rec.work_hours} hrs` : '—'}
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(rec.status)}</td>

                      <td className="py-3.5 px-4 text-zinc-500 max-w-xs truncate">
                        {rec.notes || 'Routine check-in'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>
      )}

      {/* Daily Inspector Drawer / Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Attendance Details • {selectedDayDetails.dateStr}
                </h3>
                <p className="text-xs text-zinc-500">
                  {selectedDayDetails.records.length} record(s) logged on this date
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: List of logs */}
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedDayDetails.records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-zinc-900 block">
                        {rec.employee_name || user?.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {rec.employee_code || user?.employee_id} • {rec.department || 'Engineering'}
                      </span>
                    </div>
                    {getStatusBadge(rec.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Check In</span>
                      <span className="font-mono font-semibold text-zinc-800">
                        {rec.check_in || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Check Out</span>
                      <span className="font-mono font-semibold text-zinc-800">
                        {rec.check_out || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Work Hours</span>
                      <span className="font-mono font-bold text-zinc-950">
                        {rec.work_hours > 0 ? `${rec.work_hours} hrs` : '—'}
                      </span>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-[11px] text-zinc-500 pt-1">
                      <strong>Notes:</strong> {rec.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
