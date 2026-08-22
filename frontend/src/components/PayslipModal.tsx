import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PayrollRecord } from '../types';

interface PayslipModalProps {
  payroll: PayrollRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ payroll, isOpen, onClose }) => {
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 font-bold text-xs">
              PAYSLIP #{payroll.id.toString().padStart(5, '0')}
            </span>
            <span className="text-xs text-slate-500 font-medium">{payroll.month} {payroll.year}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="mt-6 space-y-6 text-slate-800 dark:text-slate-200 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                D
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Dayflow Technologies, Inc.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every Workday, Perfectly Aligned • Global HR & Payroll
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> PAID CONFIRMED
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Disbursed on {payroll.payment_date || 'End of Month'}</p>
            </div>
          </div>

          {/* Employee & Pay Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
              <span className="font-bold text-slate-900 dark:text-white">{payroll.employee_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee ID</span>
              <span className="font-bold text-slate-900 dark:text-white">{payroll.employee_code}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="font-bold text-slate-900 dark:text-white">{payroll.department}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
              <span className="font-bold text-slate-900 dark:text-white">{payroll.designation}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left">Earnings & Allowances</th>
                  <th className="px-4 py-3 text-right">Amount ($)</th>
                  <th className="px-4 py-3 text-left border-l border-slate-200 dark:border-slate-800">Deductions & Taxes</th>
                  <th className="px-4 py-3 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                <tr>
                  <td className="px-4 py-3">Basic Salary</td>
                  <td className="px-4 py-3 text-right font-medium">${payroll.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 border-l border-slate-200 dark:border-slate-800">Benefits & PF Deduction</td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">-${payroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Housing & Special Allowance</td>
                  <td className="px-4 py-3 text-right font-medium">${payroll.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 border-l border-slate-200 dark:border-slate-800">Income Tax Withholding</td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">-${payroll.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 font-semibold">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Total Gross Earnings</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                    ${(payroll.basic_salary + payroll.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Total Deductions</td>
                  <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                    -${(payroll.deductions + payroll.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 text-white flex items-center justify-between shadow-lg shadow-brand-500/20">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90 block">
                Net Disbursed Take-Home Pay
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono">
                ${payroll.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified by Dayflow Automated Engine</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
            This is a computer-generated document verified by Dayflow HRMS. No physical signature is required.
          </div>
        </div>
      </div>
    </div>
  );
};
