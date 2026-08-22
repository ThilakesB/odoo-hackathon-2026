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

  const handleDemoLogin = async (role: 'admin' | 'employee') => {
    setLoading(true);
    setError(null);
    try {
      if (role === 'admin') {
        await login({ email: 'admin@dayflow.io', password: 'admin123' });
        navigate('/admin');
      } else {
        await login({ email: 'alex.rivera@dayflow.io', password: 'employee123' });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#070b14] bg-mesh-glow relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float [animation-delay:2s]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 text-white font-black text-2xl shadow-xl shadow-brand-500/30 mb-2">
            D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to Dayflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Every Workday, Perfectly Aligned
          </p>
        </div>

        {/* Login Glass Card */}
        <GlassCard glow className="p-6 sm:p-8 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-[11px] text-brand-600 dark:text-brand-400 font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-inner"
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
              className="w-full btn-primary py-3 text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Section */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>One-Click Admin Access</span>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Instant HR Admin Demo (admin@dayflow.io)</span>
            </button>
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
