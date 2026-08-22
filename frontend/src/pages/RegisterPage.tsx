import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import {
  Lock,
  Mail,
  User,
  Shield,
  Briefcase,
  BadgeCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { authService } from '../services/api';
import { signInWithGoogle, checkGoogleRedirectResult } from '../config/firebase';
import confetti from 'canvas-confetti';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    employee_id: `DF-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    email: '',
    password: '',
    role: 'employee', // 'employee' | 'admin' (HR)
    department: 'Engineering',
    designation: 'Associate Specialist',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [demoPreviewCode, setDemoPreviewCode] = useState<string | null>(null);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check for redirect sign-in result on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const googleUser = await checkGoogleRedirectResult();
        if (googleUser) {
          setLoading(true);
          await loginWithGoogle({
            email: googleUser.email,
            name: googleUser.name,
            photo_url: googleUser.photoUrl,
            id_token: googleUser.idToken
          });
          navigate('/');
        }
      } catch (err: any) {
        console.error('Redirect sign-in error:', err);
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, []);

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (!googleUser) {
        // Redirect initiated
        return;
      }
      await loginWithGoogle({
        email: googleUser.email,
        name: googleUser.name,
        photo_url: googleUser.photoUrl,
        id_token: googleUser.idToken
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-up was closed.');
      } else {
        console.error('Google Sign-Up Error:', err);
        setError(err.response?.data?.detail || err.message || 'Google registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Security Rules Validation
  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [formData.password]);

  const passwordScore = useMemo(() => {
    const checks = Object.values(passwordCriteria);
    return checks.filter(Boolean).length;
  }, [passwordCriteria]);

  const isPasswordValid = passwordScore === 5;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      // Reset verification if email changes
      setIsEmailVerified(false);
      setIsCodeSent(false);
      setVerificationCode('');
      setVerificationMsg(null);
      setDemoPreviewCode(null);
    }
  };

  // Step 1: Send 6-digit Verification Code
  const handleSendVerificationCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setVerificationMsg({ text: 'Please enter a valid email address first.', type: 'error' });
      return;
    }

    setSendingCode(true);
    setVerificationMsg(null);
    try {
      const res = await authService.sendVerificationCode(formData.email);
      setIsCodeSent(true);
      if (res.code_preview) {
        setDemoPreviewCode(res.code_preview);
      }
      setVerificationMsg({
        text: `Verification code generated for ${formData.email}. Enter the 6-digit code below.`,
        type: 'info',
      });
    } catch (err: any) {
      setVerificationMsg({
        text: err.response?.data?.detail || 'Failed to send verification code',
        type: 'error',
      });
    } finally {
      setSendingCode(false);
    }
  };

  // Step 2: Verify 6-digit Code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerificationMsg({ text: 'Please enter the 6-digit verification code.', type: 'error' });
      return;
    }

    setVerifyingCode(true);
    try {
      await authService.verifyEmailCode(formData.email, verificationCode.trim());
      setIsEmailVerified(true);
      setVerificationMsg({ text: 'Email verified successfully! ✨', type: 'success' });
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setVerificationMsg({
        text: err.response?.data?.detail || 'Invalid verification code. Please check and try again.',
        type: 'error',
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  // Step 3: Complete Sign Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.employee_id || !formData.name || !formData.email || !formData.password) {
      setError('Please fill in all mandatory registration fields.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please satisfy all password security requirements before proceeding.');
      return;
    }

    if (!isEmailVerified) {
      setError('Email verification is required. Please verify your email with the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        verification_code: verificationCode,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      navigate(formData.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-xl relative z-10 space-y-6 my-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-black text-white items-center justify-center font-black text-2xl shadow-sm mb-1">
            D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Create Dayflow Account
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            3.1.1 Sign Up • Secure Employee & HR Registration
          </p>
        </div>

        {/* Sign Up Card */}
        <GlassCard className="p-6 sm:p-8 shadow-2xl border border-zinc-200 bg-white/95 space-y-4">
          
          {/* Google 1-Click Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-zinc-200/80 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
              Or register with Email & Password
            </span>
            <div className="border-t border-zinc-200/80 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Employee ID & Role Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="EMP-1001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono font-bold focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Access Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'employee' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      formData.role === 'employee'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Employee
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      formData.role === 'admin'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    HR / Admin
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sanjai Kumar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  required
                />
              </div>
            </div>

            {/* 3. Email & Verification Code Section */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                {isEmailVerified && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isEmailVerified}
                    placeholder="sanjai@company.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500"
                    required
                  />
                </div>

                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={sendingCode || !formData.email}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                  >
                    {sendingCode ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isCodeSent ? 'Resend' : 'Send Code'}</span>
                  </button>
                )}
              </div>

              {/* Verification Code Box (Visible when code is sent and email not yet verified) */}
              {isCodeSent && !isEmailVerified && (
                <div className="pt-2 mt-2 border-t border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-600">
                      Enter 6-digit Verification Code:
                    </span>
                    {demoPreviewCode && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationCode(demoPreviewCode);
                        }}
                        className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 hover:bg-brand-100 transition"
                        title="Click to auto-fill"
                      >
                        Code: {demoPreviewCode} (Click to Fill)
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-36 px-3 py-1.5 rounded-xl text-center font-mono font-bold text-sm tracking-widest bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifyingCode || verificationCode.length !== 6}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{verifyingCode ? 'Verifying...' : 'Verify Code'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {verificationMsg && (
                <p
                  className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${
                    verificationMsg.type === 'success'
                      ? 'text-emerald-700'
                      : verificationMsg.type === 'error'
                      ? 'text-rose-600'
                      : 'text-zinc-600'
                  }`}
                >
                  {verificationMsg.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{verificationMsg.text}</span>
                </p>
              )}
            </div>

            {/* 4. Department & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            {/* 5. Password with Real-time Security Rules */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                Password <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-zinc-500">Password Strength</span>
                    <span
                      className={
                        passwordScore <= 2
                          ? 'text-rose-600'
                          : passwordScore <= 4
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }
                    >
                      {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong & Compliant'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= 1
                          ? passwordScore >= 5
                            ? 'bg-emerald-500'
                            : passwordScore >= 3
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= 2
                          ? passwordScore >= 5
                            ? 'bg-emerald-500'
                            : passwordScore >= 3
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= 3
                          ? passwordScore >= 5
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                          : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= 4
                          ? passwordScore >= 5
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                          : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= 5 ? 'bg-emerald-500' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Password Security Rules Checklist */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Security Policy Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                    {passwordCriteria.minLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>At least 8 characters</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                    {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>1+ uppercase letter (A-Z)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                    {passwordCriteria.hasLower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>1+ lowercase letter (a-z)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                    {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>1+ number (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordCriteria.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                    {passwordCriteria.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>1+ special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isEmailVerified || !isPasswordValid}
              className="w-full btn-primary py-3 text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Registering Account...' : 'Complete Sign Up'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </GlassCard>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500">
          Already have an organization account?{' '}
          <Link to="/login" className="font-bold text-zinc-900 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
