import React from 'react';
import { NavLink } from 'react-router-dom';
import {
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Students',
      path: '/students',
      icon: Users,
      roles: ['admin', 'warden'],
    },
    {
      label: 'Hostel Buildings',
      path: '/hostels',
      icon: Building2,
      roles: ['admin', 'warden'],
    },
    {
      label: 'Rooms Inventory',
      path: '/rooms',
      icon: Bed,
      roles: ['admin', 'warden'],
    },
    {
      label: 'Room Allocation',
      path: '/allocations',
      icon: DoorOpen,
      roles: ['admin', 'warden'],
    },
    {
      label: 'Fee Management',
      path: '/fees',
      icon: Receipt,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Payment Receipts',
      path: '/payments',
      icon: CreditCard,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Visitor Logs',
      path: '/visitors',
      icon: UserCheck,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Daily Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['admin', 'warden', 'student'],
    },
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'warden'],
    },
    {
      label: 'User Accounts',
      path: '/users',
      icon: ShieldCheck,
      roles: ['admin'],
    },
    {
      label: 'Settings & Profile',
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'warden', 'student'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'student')
  );

  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0 z-30
        transition-all duration-300 ease-in-out
        glass-sidebar
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                HostelSync
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Glass ERP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                group relative
                ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Toggle Section */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs flex-shrink-0">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                {user.role}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-1 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
