import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { PayslipModal } from '../components/PayslipModal';
import {
  CreditCard,
  DollarSign,
  FileText,
  Download,
  Plus,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Filter,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { payrollService, employeeService } from '../services/api';
import type { PayrollRecord, EmployeeProfile } from '../types';
import confetti from 'canvas-confetti';

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  // Admin New Payroll Run State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    employee_id: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    tax: 0,
  });

  const months = [
    'All',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, empData] = await Promise.all([
        payrollService.getPayrolls(selectedMonth !== 'All' ? selectedMonth : undefined),
        isAdmin ? employeeService.listEmployees() : Promise.resolve([]),
      ]);
      setPayrolls(pData || []);
      if (empData) {
        setEmployees(empData || []);
        if (empData.length > 0 && formData.employee_id === 0) {
          setFormData((prev) => ({ ...prev, employee_id: empData[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load payroll data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id) {
      alert('Please select an employee first.');
      return;
    }
    setSubmitting(true);
    try {
      await payrollService.createPayroll(formData);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
      setShowCreateModal(false);
      // Reset salary inputs for next run
      setFormData((prev) => ({
        ...prev,
        basic_salary: 0,
        allowances: 0,
        deductions: 0,
        tax: 0,
      }));
      await loadData();
    } catch (err) {
      console.error('Failed to create payroll', err);
      alert('Failed to generate payroll record. Please check the inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter payroll records by search term
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = p.employee_name?.toLowerCase().includes(searchLower);
        const matchCode = p.employee_code?.toLowerCase().includes(searchLower);
        const matchDept = p.department?.toLowerCase().includes(searchLower);
        if (!matchName && !matchCode && !matchDept) return false;
      }
      return true;
    });
  }, [payrolls, search]);

  // Dynamic calculations from database records
  const hasPayrollData = payrolls.length > 0;
  const totalDisbursed = payrolls.reduce((acc, p) => acc + (p.net_salary || 0), 0);
  const totalAllowances = payrolls.reduce((acc, p) => acc + (p.allowances || 0), 0);
  const totalTaxWithholdings = payrolls.reduce((acc, p) => acc + (p.tax || 0) + (p.deductions || 0), 0);
  const totalActiveEmployees = isAdmin ? employees.length : (hasPayrollData ? 1 : 0);

  const exportCSV = () => {
    if (filteredPayrolls.length === 0) return;
    const headers = ['ID,Employee Name,Employee Code,Department,Month,Year,Basic Salary,Allowances,Deductions,Tax,Net Salary,Payment Status,Payment Date\n'];
    const rows = filteredPayrolls.map(
      (p) =>
        `${p.id},"${p.employee_name || ''}","${p.employee_code || ''}","${p.department || ''}",${p.month},${p.year},${p.basic_salary},${p.allowances},${p.deductions},${p.tax},${p.net_salary},"${p.payment_status}","${p.payment_date}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dayflow_Payroll_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-zinc-900" />
            <span>{isAdmin ? 'Compensation & Payroll Central' : 'My Compensation & Payslips'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            {isAdmin
              ? 'Real-time database payroll records, tax withholdings, allowances, and official employee salary statements.'
              : 'View monthly net earnings, breakdown of tax benefits, and download official PDF statements.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasPayrollData && (
            <button
              onClick={exportCSV}
              className="btn-secondary text-xs px-3.5 py-2.5 flex items-center gap-2 font-semibold"
            >
              <Download className="w-4 h-4 text-zinc-700" />
              <span>Export CSV</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                if (employees.length > 0 && formData.employee_id === 0) {
                  setFormData((prev) => ({ ...prev, employee_id: employees[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Payroll Run</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Database-Driven Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Payroll Expense */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total Payroll Expense
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-7 w-28 bg-zinc-200 rounded-lg" />
                <div className="h-3 w-20 bg-zinc-100 rounded" />
              </div>
            ) : hasPayrollData ? (
              <div>
                <span className="text-2xl font-extrabold text-zinc-950 font-mono tracking-tight">
                  ₹{totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Real-time database sum
                </p>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-zinc-400 block">
                  No Payroll Data Available
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">₹0.00</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 2. Total Allowances */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total Allowances
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-7 w-24 bg-zinc-200 rounded-lg" />
                <div className="h-3 w-16 bg-zinc-100 rounded" />
              </div>
            ) : hasPayrollData ? (
              <div>
                <span className="text-2xl font-extrabold text-zinc-950 font-mono tracking-tight">
                  +₹{totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  HRA, Special & Travel Perks
                </p>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-zinc-400 block">
                  No Payroll Data Available
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">₹0.00</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 3. Total Tax Withholdings */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total Tax Withholdings
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-7 w-24 bg-zinc-200 rounded-lg" />
                <div className="h-3 w-16 bg-zinc-100 rounded" />
              </div>
            ) : hasPayrollData ? (
              <div>
                <span className="text-2xl font-extrabold text-zinc-950 font-mono tracking-tight">
                  -₹{totalTaxWithholdings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  TDS, PF & Deductions
                </p>
              </div>
            ) : (
              <div>
                <span className="text-base font-bold text-zinc-400 block">
                  No Payroll Data Available
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">₹0.00</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 4. Employee Count */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Employee Count
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-7 w-16 bg-zinc-200 rounded-lg" />
                <div className="h-3 w-24 bg-zinc-100 rounded" />
              </div>
            ) : (
              <div>
                <span className="text-2xl font-extrabold text-zinc-950 font-mono tracking-tight">
                  {totalActiveEmployees}
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {totalActiveEmployees === 1 ? '1 active workforce member' : `${totalActiveEmployees} active workforce members`}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-700">Filter Records:</span>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Months' : m}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search employee name, code, dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </GlassCard>

      {/* Payroll Table */}
      <GlassCard className="p-0 overflow-hidden">
        {loading ? (
          /* Loading Skeletons */
          <div className="p-6 space-y-4">
            <div className="h-4 bg-zinc-100 rounded w-1/4 animate-pulse" />
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-zinc-50 rounded-xl animate-pulse flex items-center justify-between px-4">
                <div className="h-4 bg-zinc-200 rounded w-1/5" />
                <div className="h-4 bg-zinc-200 rounded w-1/6" />
                <div className="h-4 bg-zinc-200 rounded w-1/6" />
                <div className="h-4 bg-zinc-200 rounded w-1/12" />
              </div>
            ))}
          </div>
        ) : filteredPayrolls.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-7 h-7 stroke-1" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800">
                No payroll records found. Add employees and payroll information to get started.
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {isAdmin
                  ? 'Click "Generate Payroll Run" above to disburse salary and issue the first official payslip.'
                  : 'Your organization has not yet released any payslips for this period.'}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  if (employees.length > 0 && formData.employee_id === 0) {
                    setFormData((prev) => ({ ...prev, employee_id: employees[0].id }));
                  }
                  setShowCreateModal(true);
                }}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 font-semibold mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate First Payroll Run</span>
              </button>
            )}
          </div>
        ) : (
          /* Database Records Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase tracking-wider text-[10px] bg-zinc-50/70">
                  <th className="py-3 px-4">Period</th>
                  {isAdmin && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">TDS Tax</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      {p.month} {p.year}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-zinc-900 block">{p.employee_name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {p.employee_code} • {p.department}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-4 font-mono text-zinc-700">
                      ₹{p.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">
                      +₹{p.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-600">
                      -₹{p.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-600">
                      -₹{p.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-zinc-950 text-sm">
                      ₹{p.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {p.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayroll(p)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-700" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Admin New Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-zinc-900" />
              <span>Generate Monthly Payroll Run</span>
            </h3>

            <form onSubmit={handleCreatePayroll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                {employees.length === 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    No active employees registered in database. Please register employees first.
                  </div>
                ) : (
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user.name} ({emp.user.employee_id} • {emp.department})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                  >
                    {months.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Basic Salary (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.basic_salary || ''}
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Allowances (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.allowances || ''}
                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deductions || ''}
                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Tax Withholding / TDS (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.tax || ''}
                    onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs flex justify-between items-center font-bold">
                <span className="text-zinc-600">Calculated Net Take-Home:</span>
                <span className="text-zinc-950 font-mono text-base">
                  ₹{Math.max(0, formData.basic_salary + formData.allowances - formData.deductions - formData.tax).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || employees.length === 0}
                  className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Generating...' : 'Disburse & Create Payslip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payslip View Modal */}
      <PayslipModal
        payroll={selectedPayroll}
        isOpen={Boolean(selectedPayroll)}
        onClose={() => setSelectedPayroll(null)}
      />
    </div>
  );
};
