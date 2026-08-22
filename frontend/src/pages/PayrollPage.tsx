import React, { useState, useEffect } from 'react';
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
  Edit2
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
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  // Admin New Payroll Run State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: 1,
    month: 'August',
    year: 2025,
    basic_salary: 6000,
    allowances: 1500,
    deductions: 400,
    tax: 500,
  });

  const months = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, empData] = await Promise.all([
        payrollService.getPayrolls(selectedMonth !== 'All' ? selectedMonth : undefined),
        isAdmin ? employeeService.listEmployees() : Promise.resolve([]),
      ]);
      setPayrolls(pData);
      if (empData) {
        setEmployees(empData);
        if (empData.length > 0) {
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
    try {
      await payrollService.createPayroll(formData);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create payroll', err);
    }
  };

  // Compute summary stats
  const totalDisbursed = payrolls.reduce((acc, p) => acc + p.net_salary, 0);
  const totalTax = payrolls.reduce((acc, p) => acc + p.tax, 0);
  const totalAllowances = payrolls.reduce((acc, p) => acc + p.allowances, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAdmin ? 'Compensation & Payroll Administration' : 'My Compensation & Payslips'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'Disburse salaries, manage tax deductions, allowances and generate verified payslips.'
              : 'View monthly net earnings, breakdown of tax benefits, and download official PDF statements.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Payroll Run</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Total Payroll Expense' : 'Latest Net Earnings'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                ${(isAdmin ? totalDisbursed : payrolls[0]?.net_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              ✓ All disbursed successfully
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Total Allowances Given' : 'Allowances & Perks'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                +${(isAdmin ? totalAllowances : payrolls[0]?.allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">HRA, Travel, Performance</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Tax Withholdings Total' : 'Deductions & Tax'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                -${(isAdmin ? totalTax : (payrolls[0]?.deductions || 0) + (payrolls[0]?.tax || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Compliant with State & Federal</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-3">
        <div className="flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Month:</span>
            {months.slice(0, 7).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedMonth === m
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Payroll Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading payroll data...</div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">No payroll statements found for this period.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Period</th>
                  {isAdmin && <th className="pb-3 px-3">Employee</th>}
                  <th className="pb-3 px-3">Basic Salary</th>
                  <th className="pb-3 px-3">Allowances</th>
                  <th className="pb-3 px-3">Deductions</th>
                  <th className="pb-3 px-3">Tax</th>
                  <th className="pb-3 px-3">Net Take-Home</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {p.month} {p.year}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{p.employee_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.employee_code} • {p.department}</span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      ${p.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      +${p.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-rose-600 dark:text-rose-400">
                      -${p.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-rose-600 dark:text-rose-400">
                      -${p.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                      ${p.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {p.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedPayroll(p)}
                        className="px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-xs transition inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Admin New Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" />
              <span>Generate Monthly Payroll Run</span>
            </h3>

            <form onSubmit={handleCreatePayroll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Employee
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.user.employee_id} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {months.filter((m) => m !== 'All').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Basic Salary ($)
                  </label>
                  <input
                    type="number"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Allowances ($)
                  </label>
                  <input
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deductions ($)
                  </label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Withholding ($)
                  </label>
                  <input
                    type="number"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs flex justify-between font-bold">
                <span className="text-slate-600 dark:text-slate-300">Estimated Net Payout:</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono text-sm">
                  ${(formData.basic_salary + formData.allowances - formData.deductions - formData.tax).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold"
                >
                  Disburse & Create Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayroll}
        payroll={selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
      />
    </div>
  );
};
