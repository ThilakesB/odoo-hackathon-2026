import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  HeartHandshake
} from 'lucide-react';
import { employeeService } from '../services/api';
import confetti from 'canvas-confetti';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
    profile_picture: '',
    department: '',
    designation: '',
    work_location: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        address: profile.address || '',
        emergency_contact: profile.emergency_contact || '',
        profile_picture: profile.profile_picture || user?.avatar_url || '',
        department: profile.department || 'Engineering',
        designation: profile.designation || 'Software Engineer',
        work_location: profile.work_location || 'Remote (Hybrid)',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      if (isAdmin && profile) {
        await employeeService.adminUpdateEmployee(profile.id, formData);
      } else {
        await employeeService.updateMyProfile({
          phone: formData.phone,
          address: formData.address,
          emergency_contact: formData.emergency_contact,
          profile_picture: formData.profile_picture,
        });
      }
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
      setStatusMsg({ text: 'Profile updated successfully!', type: 'success' });
      await refreshProfile();
    } catch (err: any) {
      setStatusMsg({ text: err.response?.data?.detail || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Employee Identity & Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your organizational contact records, profile picture, and emergency details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card Header */}
        <GlassCard glow className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative group">
              <img
                src={
                  formData.profile_picture ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                }
                alt={user?.name}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-brand-500/25 shadow-xl transition group-hover:opacity-90"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  {user?.role === 'admin' ? 'HR Administrator' : 'Staff Member'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profile?.designation} • {profile?.department}
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
                <span className="font-mono font-semibold">ID: {user?.employee_id}</span>
                <span>•</span>
                <span>Joined {profile?.joining_date || 'Jan 15, 2023'}</span>
              </div>
            </div>
          </div>

          {/* Quick Avatar Preset Selector */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Choose Avatar Preset or Custom URL
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {avatarPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt="avatar"
                  onClick={() => setFormData({ ...formData, profile_picture: preset })}
                  className={`w-9 h-9 rounded-xl object-cover cursor-pointer transition ${
                    formData.profile_picture === preset ? 'ring-2 ring-brand-500 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Contact & Personal Details */}
        <GlassCard className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contact & Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email (Read-Only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address, City, State, ZIP..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Person & Phone
              </label>
              <div className="relative">
                <HeartHandshake className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="Name & Contact (e.g. Jane Smith +1 555-987-6543)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Admin Editable Role / Department */}
        {isAdmin && (
          <GlassCard className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Organizational Placement
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  name="work_location"
                  value={formData.work_location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </GlassCard>
        )}

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
