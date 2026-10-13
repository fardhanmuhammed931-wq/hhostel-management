import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Users,
  Building2,
  Bed,
  DoorOpen,
  Receipt,
  CreditCard,
  UserCheck,
  Wrench,
  CalendarCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'warden', 'student'] },
    { label: 'Students', path: '/students', icon: Users, roles: ['admin', 'warden'] },
    { label: 'Hostel Buildings', path: '/hostels', icon: Building2, roles: ['admin', 'warden'] },
    { label: 'Rooms Inventory', path: '/rooms', icon: Bed, roles: ['admin', 'warden'] },
    { label: 'Room Allocation', path: '/allocations', icon: DoorOpen, roles: ['admin', 'warden'] },
    { label: 'Fee Management', path: '/fees', icon: Receipt, roles: ['admin', 'warden', 'student'] },
    { label: 'Payment Receipts', path: '/payments', icon: CreditCard, roles: ['admin', 'warden', 'student'] },
    { label: 'Visitor Logs', path: '/visitors', icon: UserCheck, roles: ['admin', 'warden', 'student'] },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['admin', 'warden', 'student'] },
    { label: 'Daily Attendance', path: '/attendance', icon: CalendarCheck, roles: ['admin', 'warden', 'student'] },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['admin', 'warden'] },
    { label: 'User Accounts', path: '/users', icon: ShieldCheck, roles: ['admin'] },
    { label: 'Settings & Profile', path: '/settings', icon: Settings, roles: ['admin', 'warden', 'student'] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'student')
  );

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-72 max-w-[80vw] h-full bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-tight">HostelSync ERP</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
