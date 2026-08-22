import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { AvatarCustomizerModal } from '../components/AvatarCustomizerModal';
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
  HeartHandshake,
  Sparkles,
  Upload,
  RotateCcw,
  Sliders,
  Image as ImageIcon
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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [savingAvatar, setSavingAvatar] = useState(false);

  const handleAvatarSelect = async (newAvatarUrl: string) => {
    setFormData((prev) => ({ ...prev, profile_picture: newAvatarUrl }));
    setSavingAvatar(true);
    setStatusMsg(null);
    try {
      if (isAdmin && profile) {
        await employeeService.adminUpdateEmployee(profile.id, {
          ...formData,
          profile_picture: newAvatarUrl,
        });
      } else {
        await employeeService.updateMyProfile({
          profile_picture: newAvatarUrl,
        });
      }
      await refreshProfile();
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
      setStatusMsg({
        text: 'Profile picture saved and updated permanently in database! ✨',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to save profile picture:', err);
      setStatusMsg({
        text: err.response?.data?.detail || 'Failed to save profile picture to database',
        type: 'error',
      });
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            handleAvatarSelect(compressed);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hidden file input for direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleDirectFileUpload}
        className="hidden"
      />

      {/* Avatar Customizer Studio Modal */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={formData.profile_picture || user?.avatar_url || ''}
        userName={user?.name || 'User'}
        onSelectAvatar={handleAvatarSelect}
      />

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
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            
            {/* Interactive DP Container */}
            <div className="relative group shrink-0">
              <img
                src={
                  formData.profile_picture ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                }
                alt={user?.name}
                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-brand-500/30 shadow-xl transition group-hover:brightness-95 bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;
                }}
              />

              {/* Hover Change DP Action Badge */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center text-white backdrop-blur-[2px]"
                title="Open Avatar Customizer Studio"
              >
                <Camera className="w-6 h-6 mb-1 text-white animate-bounce" />
                <span className="text-[11px] font-bold tracking-wide">Change DP</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute -bottom-2 -right-2 p-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg ring-4 ring-white dark:ring-slate-900 transition hover:scale-110"
                title="Customize Profile Picture"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info & Quick Action Buttons */}
            <div className="space-y-2 flex-1 w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  {user?.role === 'admin' ? 'HR Administrator' : 'Staff Member'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profile?.designation} • {profile?.department}
              </p>

              <div className="pt-0.5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                <span className="font-mono font-semibold">ID: {user?.employee_id}</span>
                <span>•</span>
                <span>Joined {profile?.joining_date || 'Jan 15, 2023'}</span>
              </div>

              {/* DP Customization Quick Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  disabled={savingAvatar}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition flex items-center gap-1.5 shadow-sm shadow-brand-500/20 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {savingAvatar ? 'Saving DP...' : 'Avatar Studio'}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingAvatar}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {savingAvatar ? 'Uploading...' : 'Upload Photo'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;
                    handleAvatarSelect(defaultAvatar);
                  }}
                  disabled={savingAvatar}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 disabled:opacity-50"
                  title="Reset to default initials"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
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
