import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Key,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { userService } from '../../services/api';
import { User } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';

export const UserList: React.FC = () => {
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'warden',
    phone: '',
    status: 'active',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({
        role,
        search,
      });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await userService.createUser(userForm);
      if (res.data?.success) {
        toast.success(`User ${userForm.full_name} created successfully.`);
        setIsAddUserModalOpen(false);
        setUserForm({
          email: '',
          password: '',
          full_name: '',
          role: 'warden',
          phone: '',
          status: 'active',
        });
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj: User) => {
    const nextStatus = userObj.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await userService.updateUserStatus(userObj.id, { status: nextStatus });
      if (res.data?.success) {
        toast.success(`User status changed to ${nextStatus}.`);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await userService.resetPassword(selectedUser.id, { newPassword });
      if (res.data?.success) {
        toast.success(`Password reset for ${selectedUser.full_name}.`);
        setIsResetPasswordModalOpen(false);
        setNewPassword('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            User Accounts & Roles
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Control access roles, administrator credentials, wardens, and student user accounts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddUserModalOpen(true)}
        >
          Create User Account
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search user email or full name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Select
            options={[
              { value: '', label: 'All User Roles' },
              { value: 'admin', label: 'Administrator' },
              { value: 'warden', label: 'Hostel Warden' },
              { value: 'student', label: 'Student Resident' },
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {u.full_name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={u.role} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={u.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {u.last_login || 'Never logged in'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Reset Password"
                          aria-label="Reset password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === 'active'
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                          aria-label="Toggle user status"
                        >
                          {u.status === 'active' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Create User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Create System User Account"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Elena Rostova"
            value={userForm.full_name}
            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="user@hostel.com"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
            <Input
              label="Initial Password *"
              type="password"
              placeholder="Minimum 6 characters"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role Assignment *"
              options={[
                { value: 'warden', label: 'Hostel Warden' },
                { value: 'admin', label: 'Hostel Administrator' },
                { value: 'student', label: 'Student Account' },
              ]}
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
            />
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 000-0000"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={`Reset Password for ${selectedUser?.full_name}`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <Input
            label="New Password *"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
