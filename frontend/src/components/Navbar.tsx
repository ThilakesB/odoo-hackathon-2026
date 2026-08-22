import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  Bell,
  Sparkles,
  Search,
  LogOut,
  User,
  Shield,
  Menu,
  Check,
  Calendar,
} from 'lucide-react';
import { employeeService } from '../services/api';
import type { NotificationItem } from '../types';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenAIChat: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAIChat, onToggleMobileSidebar }) => {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await employeeService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: number) => {
    try {
      await employeeService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 lg:px-8 py-3.5 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile menu trigger + App Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform duration-300">
              D
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-600 dark:from-white dark:via-brand-300 dark:to-indigo-300 bg-clip-text text-transparent">
                Dayflow
              </span>
              <span className="text-[10px] block font-semibold text-slate-400 dark:text-slate-500 -mt-1 tracking-wider uppercase">
                HRMS Core
              </span>
            </div>
          </Link>
        </div>

        {/* Center Search / Workspace status */}
        <div className="hidden md:flex items-center max-w-xs lg:max-w-md w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, policies, teams..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* AI HR Copilot Action Pill */}
          <button
            onClick={onOpenAIChat}
            className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 active:scale-95 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Ask AI HR</span>
            <span className="inline sm:hidden">AI</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                          n.is_read
                            ? 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-500'
                            : 'bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {!n.is_read && (
                          <div className="p-1 text-brand-500 hover:text-brand-600">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <img
                src={
                  profile?.profile_picture ||
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                }
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/30"
              />
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role === 'admin' ? 'HR / Admin' : 'Employee'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-card p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-800/80 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-brand-500/15 text-brand-600 dark:text-brand-400">
                    ID: {user?.employee_id}
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
