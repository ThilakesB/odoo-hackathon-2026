import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  CreditCard,
  UserCircle,
  Users,
  BarChart3,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAIChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile, onOpenAIChat }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const employeeLinks = [
    { to: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/leave', label: 'Leave Requests', icon: CalendarDays },
    { to: '/payroll', label: 'Salary & Payslips', icon: CreditCard },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employee Directory', icon: Users },
    { to: '/attendance', label: 'Attendance Log', icon: Clock },
    { to: '/leave', label: 'Leave Approvals', icon: CalendarDays },
    { to: '/payroll', label: 'Payroll Manager', icon: CreditCard },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
  ];

  const navLinks = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Close button on mobile */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-brand-500/30">
                D
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-950 to-brand-700 dark:from-white dark:to-brand-300 bg-clip-text text-transparent">
                  Dayflow
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isAdmin ? 'HR Administration' : 'Workday Portal'}
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isAdmin ? 'Management Modules' : 'Workspace'}
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/' || item.to === '/admin'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 shadow-md shadow-brand-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom AI Assistant promo card */}
        <div className="pt-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-brand-500/10 to-purple-500/10 dark:from-indigo-950/40 dark:via-brand-950/40 dark:to-purple-950/40 border border-indigo-500/20 dark:border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold">AI HR Copilot</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Instant answers on leaves, salary breakdown & attendance queries.
            </p>
            <button
              onClick={() => {
                onCloseMobile();
                onOpenAIChat();
              }}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
