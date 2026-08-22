import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  RotateCw,
  Clock,
  Send
} from 'lucide-react';
import { authService } from '../services/api';
import confetti from 'canvas-confetti';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const navigate = useNavigate();
  const { login, loginWithOtp } = useAuth();

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Passwordless Email OTP Two-Step State
  const [otpStep, setOtpStep] = useState<1 | 2>(1); // 1: Enter Email, 2: Enter OTP
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [sandboxPreview, setSandboxPreview] = useState<string | null>(null);

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Email format validator
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // -------------------------------------------------------------
  // Step 1: Request OTP
  // -------------------------------------------------------------
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(otpEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    setLoading(true);
    setError(null);
    setOtpMessage(null);

    try {
      const res = await authService.requestOtp(otpEmail.trim().toLowerCase());
      setOtpStep(2);
      setResendCooldown(res.cooldown_seconds || 60);
      setOtpMessage(res.message || `A 6-digit code has been sent to ${otpEmail}.`);
      if (res.code_preview) {
        setSandboxPreview(res.code_preview);
      }
      setOtpCode('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to send OTP. Please check your email and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Verify OTP
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Migrate to httpOnly cookie storage once backend supports cookie-based session tokens
      await loginWithOtp({
        email: otpEmail.trim().toLowerCase(),
        otp: otpCode.trim()
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid or expired OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Standard Password Login
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
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-black text-white items-center justify-center font-black text-2xl shadow-sm mb-1">
            D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Welcome to Dayflow
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            Every Workday, Perfectly Aligned. Sign in to your workspace.
          </p>
        </div>

        {/* Login Mode Switcher Pills */}
        <div className="flex items-center p-1 bg-zinc-200/80 rounded-2xl text-xs font-bold border border-zinc-300/60">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'otp'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>Email OTP Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              authMode === 'password'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-600" />
            <span>Password Sign-In</span>
          </button>
        </div>

        {/* Main Authentication Card */}
        <GlassCard className="p-6 sm:p-8 space-y-5 bg-white border border-zinc-200/90 shadow-xl">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* OPTION 1: TWO-STEP EMAIL OTP FLOW */}
          {/* ========================================================= */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              
              {/* STEP 1: Enter Email */}
              {otpStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-medium"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      We'll send a 6-digit one-time passcode to this email. No password required.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Sending One-Time Passcode...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-Digit OTP */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Success notification banner */}
                  {otpMessage && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{otpMessage}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-normal pl-6">
                        📩 If not in your primary inbox, please check your <strong>Spam / Promotions</strong> folder (Sender: <code>onboarding@resend.dev</code>).
                      </p>
                    </div>
                  )}

                  {/* Development Sandbox Preview & Auto-fill */}
                  {sandboxPreview && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-center justify-between shadow-sm">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Local Testing OTP</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Code: <strong className="font-mono text-sm tracking-wider font-extrabold text-amber-950">{sandboxPreview}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(sandboxPreview)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[11px] transition shadow-sm"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep(1);
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 underline"
                      >
                        Change Email ({otpEmail})
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg sm:text-xl font-mono tracking-[8px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-zinc-900"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>Code expires in 5 minutes</span>
                      <span>5 attempts max</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Passcode...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Resend OTP button with 60s cooldown */}
                  <div className="text-center pt-2">
                    {resendCooldown > 0 ? (
                      <span className="text-xs text-zinc-400 font-medium inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Resend code in <strong className="text-zinc-700 font-mono">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestOtp()}
                        disabled={loading}
                        className="text-xs font-bold text-zinc-900 hover:text-black transition inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Resend 6-Digit OTP</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* OPTION 2: PASSWORD SIGN-IN */}
          {/* ========================================================= */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="thilakesb@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-medium"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Sign Up Link */}
          <div className="text-center pt-2 text-xs text-zinc-500 border-t border-zinc-100 font-medium">
            Don't have a Dayflow account yet?{' '}
            <Link to="/register" className="font-bold text-zinc-950 hover:underline">
              Create an Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
