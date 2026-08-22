import React from 'react';
import { X, Printer, Download, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs">
              PAYSLIP #{payroll.id.toString().padStart(5, '0')}
            </span>
            <span className="text-xs text-zinc-500 font-medium">{payroll.month} {payroll.year}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="mt-6 space-y-6 text-zinc-800 dark:text-zinc-200 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-2xl shadow-sm">
                D
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  Dayflow Technologies, Inc.
                </h2>
                <p className="text-xs text-zinc-500 font-mono">100 Pine Street, Suite 2400 • San Francisco, CA</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  Official Salary Statement
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-zinc-400 block">Statement Period</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white block">
                {payroll.month} {payroll.year}
              </span>
              <span className="text-[11px] font-mono text-zinc-900 dark:text-zinc-100 font-bold block mt-1">
                PAID • {new Date(payroll.payment_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Employee Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Employee Name</span>
              <span className="font-bold text-zinc-900 dark:text-white">{payroll.employee_name}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Employee ID</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-white">{payroll.employee_code}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Department</span>
              <span className="font-medium text-zinc-900 dark:text-white">{payroll.department}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Designation</span>
              <span className="font-medium text-zinc-900 dark:text-white">{payroll.designation}</span>
            </div>
          </div>

          {/* Detailed Earnings vs Deductions Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings Column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <span>Earnings</span>
                <span>Amount (₹)</span>
              </h4>
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-mono font-semibold">₹{payroll.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-semibold">₹{(payroll.allowances * 0.6).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special & Medical Allowance</span>
                  <span className="font-mono font-semibold">₹{(payroll.allowances * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-bold text-zinc-900 dark:text-white">
                  <span>Gross Earnings</span>
                  <span className="font-mono">₹{(payroll.basic_salary + payroll.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <span>Deductions & Taxes</span>
                <span>Amount (₹)</span>
              </h4>
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Provident Fund / PF</span>
                  <span className="font-mono font-semibold">₹{(payroll.deductions * 0.6).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health & Insurance</span>
                  <span className="font-mono font-semibold">₹{(payroll.deductions * 0.4).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Income Tax (TDS)</span>
                  <span className="font-mono font-semibold">₹{payroll.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-bold text-zinc-900 dark:text-white">
                  <span>Total Deductions</span>
                  <span className="font-mono">-₹{(payroll.deductions + payroll.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight Card */}
          <div className="p-5 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">
                Net Take-Home Pay
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                ₹{payroll.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified by Dayflow HRMS</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
            This is a computer-generated document verified by Dayflow HRMS. No physical signature is required.
          </div>
        </div>
      </div>
    </div>
  );
};
