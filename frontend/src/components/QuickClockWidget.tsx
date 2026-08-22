import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Clock, Play, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import { attendanceService } from '../services/api';
import type { AttendanceSummary } from '../types';
import confetti from 'canvas-confetti';

export const QuickClockWidget: React.FC = () => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await attendanceService.getTodayStatus();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load attendance status', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCheckIn = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      await attendanceService.checkIn('Checked in from Web Portal');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      setStatusMsg({ text: 'Checked in successfully! Have a great workday.', type: 'success' });
      await loadStatus();
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.detail || 'Check-in failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      await attendanceService.checkOut('Checked out from Web Portal');
      setStatusMsg({ text: 'Checked out successfully. Rest well!', type: 'success' });
      await loadStatus();
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.detail || 'Check-out failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const isCheckedIn = summary?.checked_in;
  const isCheckedOut = summary?.checked_out;

  return (
    <GlassCard glow className="relative overflow-hidden bg-gradient-to-br from-white/90 via-brand-50/30 to-indigo-50/20 dark:from-slate-900/90 dark:via-brand-950/20 dark:to-indigo-950/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Time display */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>Live Workday Tracker</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {timeStr || '--:--:--'}
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
            <span>Today's Log:</span>
            {isCheckedIn ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In at {summary?.check_in_time}
              </span>
            ) : (
              <span className="text-amber-500 font-medium">Not checked in</span>
            )}
            {isCheckedOut && (
              <span className="text-slate-500">| Out at {summary?.check_out_time}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={isLoading}
              className="btn-primary px-6 py-3 text-sm font-semibold shadow-brand-500/25 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Clock In Now</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 backdrop-blur-md active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Clock Out</span>
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shift Completed ({summary?.work_hours_today} hrs)</span>
            </div>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}
    </GlassCard>
  );
};
