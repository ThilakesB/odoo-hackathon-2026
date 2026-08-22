import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { leaveService } from '../services/api';
import type { LeaveBalances } from '../types';
import confetti from 'canvas-confetti';

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeaveApplyModal: React.FC<LeaveApplyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [leaveType, setLeaveType] = useState<'paid' | 'sick' | 'unpaid'>('paid');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [balances, setBalances] = useState<LeaveBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      leaveService.getBalances().then(setBalances).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate day count
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const calculatedDays = diffTime >= 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDays <= 0) {
      setError('End date must be after or on start date');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the leave request');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await leaveService.applyLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply for Leave</h3>
              <p className="text-xs text-slate-500">Submit a formal request to your HR manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance cards */}
        {balances && (
          <div className="grid grid-cols-3 gap-2 my-4">
            <div
              onClick={() => setLeaveType('paid')}
              className={`p-2.5 rounded-xl text-center cursor-pointer transition border ${
                leaveType === 'paid'
                  ? 'bg-brand-500/15 border-brand-500/50 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Paid</span>
              <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{balances.paid}d</span>
            </div>
            <div
              onClick={() => setLeaveType('sick')}
              className={`p-2.5 rounded-xl text-center cursor-pointer transition border ${
                leaveType === 'sick'
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Sick</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{balances.sick}d</span>
            </div>
            <div
              onClick={() => setLeaveType('unpaid')}
              className={`p-2.5 rounded-xl text-center cursor-pointer transition border ${
                leaveType === 'unpaid'
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Unpaid</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{balances.unpaid}d</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 flex items-center justify-between text-xs">
            <span className="text-slate-500">Requested Duration:</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {calculatedDays} {calculatedDays === 1 ? 'Working Day' : 'Working Days'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Remarks
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family travel, medical recovery, personal matters..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-slate-400"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || calculatedDays <= 0}
              className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
