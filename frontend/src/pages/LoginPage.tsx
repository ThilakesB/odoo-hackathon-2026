import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  UserCheck,
  AlertCircle,
  Sparkles,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { signInWithGooglePopup } from '../config/firebase';
import confetti from 'canvas-confetti';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginAsDemo } = useAuth();

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // -------------------------------------------------------------
  // Google Sign-In with Firebase SDK
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        console.error('Google Sign-In Error:', err);
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Standard Firebase Email/Password Login
  // -------------------------------------------------------------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 1-Click Fast Demo Login
  // -------------------------------------------------------------
  const handleQuickDemo = async (role: 'admin' | 'employee') => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(role);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      navigate('/');
    } catch (err: any) {
      setError('Failed to launch demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#070b14] relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black items-center justify-center font-black text-2xl shadow-sm mb-1">
            D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Welcome to Dayflow
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            Firebase-Powered HR Management System • Project: <code className="text-primary-600 font-mono">dayfloe-fe234</code>
          </p>
        </div>

        {/* Main Authentication Card */}
        <GlassCard className="p-6 sm:p-8 space-y-5 bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-xl">

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* 1. Google Single Sign-On Button (Firebase SDK) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200/90 dark:border-zinc-700 text-zinc-800 dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Continue with Google Sign-In</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-zinc-200/80 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
              Or with Email & Password
            </span>
            <div className="border-t border-zinc-200/80 dark:border-zinc-800 w-full" />
          </div>

          {/* Firebase Email/Password Sign-In Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@dayflow.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Signing in with Firebase...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo 1-Click Fast Login Section */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 mb-2.5 text-zinc-400 dark:text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Instant 1-Click Demo Profiles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-left transition"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">HR Admin</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Sarah Jenkins</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('employee')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-left transition"
              >
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Employee</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Alex Chen</p>
              </button>
            </div>
          </div>

          {/* Footer Sign Up Link */}
          <div className="text-center pt-2 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 font-medium">
            Don't have a Dayflow account yet?{' '}
            <Link to="/register" className="font-bold text-zinc-950 dark:text-white hover:underline">
              Create an Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default LoginPage;
