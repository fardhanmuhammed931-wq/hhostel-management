import React, { useState } from 'react';
import {
  User,
  Lock,
  Moon,
  Sun,
  Shield,
  Building,
  CheckCircle,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.data?.success) {
        toast.success('Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Profile & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your personal credentials, UI theme preferences, and security settings.
        </p>
      </div>

      {/* User Information Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-2xl shadow-xl shadow-cyan-500/25 border border-cyan-400/30 flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white">{user?.full_name}</h3>
              {user?.role && <Badge status={user.role} />}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-slate-400">Assigned Role</p>
            <p className="font-semibold text-white capitalize mt-0.5">{user?.role}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-slate-400">Residential Assignment</p>
            <p className="font-semibold text-white mt-0.5">
              {user?.hostel_name ? `${user.hostel_name} (Room ${user.room_number || 'N/A'})` : 'Administrative Staff'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-slate-400">Contact Number</p>
            <p className="font-semibold text-white mt-0.5">{user?.phone || 'Not recorded'}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-slate-400">Security Clearance</p>
            <p className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Authenticated via JWT
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Theme Preference Card */}
      <GlassCard className="p-6">
        <h3 className="text-base font-bold text-white mb-2">Display Theme</h3>
        <p className="text-xs text-slate-400 mb-4">
          Toggle between Dark Glass and Light Glass visual styling.
        </p>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                Current Theme: {theme === 'dark' ? 'Dark Glassmorphism (Default)' : 'Light Glass'}
              </p>
              <p className="text-xs text-slate-400">
                Translucent frosted panels with dynamic gradient background.
              </p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </GlassCard>

      {/* Change Password Card */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Change Password</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Update your secure login password. Bcrypt salted hashing is applied on the server.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <Input
            label="Current Password *"
            isPassword
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password *"
            isPassword
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password *"
            isPassword
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isChangingPassword}
          >
            Update Password
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
