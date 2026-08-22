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
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-r border-zinc-200/90 dark:border-zinc-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Close button on mobile */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg shadow-sm">
                L
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  Libreo
                </h1>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  {isAdmin ? 'HR Administration' : 'Workday Portal'}
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                      isActive
                        ? 'text-white bg-black dark:text-black dark:bg-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
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
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold">AI HR Copilot</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Instant answers on leaves, salary breakdown & attendance queries.
            </p>
            <button
              onClick={() => {
                onCloseMobile();
                onOpenAIChat();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-black hover:bg-zinc-800 dark:text-black dark:bg-white dark:hover:bg-zinc-100 shadow-sm transition"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
