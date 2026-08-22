import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { LeaveApplyModal } from '../components/LeaveApplyModal';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Palmtree,
  Stethoscope,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { leaveService } from '../services/api';
import type { LeaveRequest, LeaveBalances } from '../types';
import confetti from 'canvas-confetti';

export const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalances | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Admin decision state
  const [selectedLeaveForAction, setSelectedLeaveForAction] = useState<LeaveRequest | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');

  const loadData = async () => {
    setLoading(true);
    try {
      const [leavesData, balData] = await Promise.all([
        leaveService.getLeaveRequests(statusFilter),
        !isAdmin ? leaveService.getBalances() : Promise.resolve(null),
      ]);
      setLeaves(leavesData);
      if (balData) setBalances(balData);
    } catch (err) {
      console.error('Failed to load leave records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleDecisionSubmit = async () => {
    if (!selectedLeaveForAction) return;
    try {
      await leaveService.updateLeaveStatus(
        selectedLeaveForAction.id,
        actionType,
        actionComment || (actionType === 'approved' ? 'Approved by HR' : 'Declined per company policy')
      );
      if (actionType === 'approved') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      setSelectedLeaveForAction(null);
      setActionComment('');
      await loadData();
    } catch (err) {
      console.error('Failed to process leave decision', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isAdmin ? 'Leave Approvals & Management' : 'My Leave & Time Off'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'Review pending time-off requests and manage employee holiday quotas.'
              : 'Submit vacation, sick leave, and view remaining annual balances.'}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Leave Balances Grid (For Employees) */}
      {!isAdmin && balances && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Paid Annual Leave
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono">
                  {balances.paid}
                </span>
                <span className="text-xs text-zinc-400 font-medium">Days remaining</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Palmtree className="w-6 h-6" />
            </div>
          </GlassCard>

          <GlassCard className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Sick / Medical Leave
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono">
                  {balances.sick}
                </span>
                <span className="text-xs text-zinc-400 font-medium">Days remaining</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Stethoscope className="w-6 h-6" />
            </div>
          </GlassCard>

          <GlassCard className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Unpaid Time Off
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono">
                  {balances.unpaid}
                </span>
                <span className="text-xs text-zinc-400 font-medium">Days available</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <HelpCircle className="w-6 h-6" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Filter Tabs */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === f
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {f === 'all' ? 'All Requests' : f}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Leave List Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">No leave requests found in this category.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  {isAdmin && <th className="pb-3 px-3">Employee</th>}
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Dates & Duration</th>
                  <th className="pb-3 px-3">Reason</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Admin Notes</th>
                  {isAdmin && <th className="pb-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    {isAdmin && (
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{l.employee_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{l.employee_code} • {l.department}</span>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-3">
                      <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        {l.leave_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {l.start_date} → {l.end_date}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="text-slate-600 dark:text-slate-300 leading-snug">{l.reason}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Applied on {new Date(l.applied_at).toLocaleDateString()}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          l.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : l.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {l.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {l.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {l.status === 'pending' && <Clock className="w-3 h-3" />}
                        <span>{l.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {l.admin_comment || '—'}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-3 text-right">
                        {l.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLeaveForAction(l);
                                setActionType('approved');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition"
                              title="Approve Leave"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLeaveForAction(l);
                                setActionType('rejected');
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition"
                              title="Reject Leave"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Leave Application Modal */}
      <LeaveApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={loadData}
      />

      {/* Admin Action Dialog Modal */}
      {selectedLeaveForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {actionType === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              <span>Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedLeaveForAction.employee_name} ({selectedLeaveForAction.leave_type.toUpperCase()})
              </p>
              <p className="text-slate-500">
                {selectedLeaveForAction.start_date} to {selectedLeaveForAction.end_date} ({selectedLeaveForAction.total_days} days)
              </p>
              <p className="italic text-slate-600 dark:text-slate-400">"{selectedLeaveForAction.reason}"</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                HR Manager Feedback / Reason
              </label>
              <textarea
                rows={2}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={actionType === 'approved' ? 'e.g. Approved. Have a wonderful break!' : 'e.g. Due to ongoing release sprint...'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedLeaveForAction(null)}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md ${
                  actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionType === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
