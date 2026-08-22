import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Lock, Mail, ArrowRight, Shield, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (emailToUse: string, passToUse: string, targetPath: string) => {
    setLoading(true);
    setError(null);
    try {
      await login({ email: emailToUse, password: passToUse });
      navigate(targetPath);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-white dark:bg-black bg-mesh-glow relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black items-center justify-center font-black text-2xl shadow-sm mb-1">
            L
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Welcome to Libreo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Every Workday, Perfectly Aligned. Sign in to your workspace.
          </p>
        </div>

        {/* Login Card */}
        <GlassCard className="p-6 sm:p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="thilskeb@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition shadow-inner"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Quick Login Section */}
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              <span>1-Click User Access</span>
            </div>

            {/* HR Admin Button */}
            <button
              type="button"
              onClick={() => handleCustomLogin('thilskeb@gmail.com', 'admin@123', '/admin')}
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-black dark:hover:bg-white flex items-center justify-between transition active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>HR Admin (thilskeb@gmail.com)</span>
              </div>
              <span className="text-[10px] opacity-70 font-mono">admin@123</span>
            </button>

            {/* Employee Quick Login Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCustomLogin('sanjai@gmail.com', 'sanjai@2006', '/')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-0.5 transition active:scale-95 text-center"
              >
                <span className="font-bold">Sanjai</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-full">sanjai@2006</span>
              </button>

              <button
                type="button"
                onClick={() => handleCustomLogin('santhiya@gmail.com', 'Santhiya@2006', '/')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-0.5 transition active:scale-95 text-center"
              >
                <span className="font-bold">Santhiya</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-full">Santhiya@2006</span>
              </button>

              <button
                type="button"
                onClick={() => handleCustomLogin('preevena@gmail.com', 'Prevvena@2006', '/')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-0.5 transition active:scale-95 text-center"
              >
                <span className="font-bold">Preevena</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-full">Prevvena@2006</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Need an organization account?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Register new employee
          </Link>
        </p>
      </div>
    </div>
  );
};
