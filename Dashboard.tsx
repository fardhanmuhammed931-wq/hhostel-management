import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Bed,
  DoorOpen,
  DollarSign,
  Wrench,
  UserCheck,
  TrendingUp,
  Percent,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/api';
import { DashboardStats } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recent, setRecent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, chartsRes, recentRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getCharts(),
          dashboardService.getRecentActivity(),
        ]);

        if (statsRes.data?.success) setStats(statsRes.data.data);
        if (chartsRes.data?.success) setCharts(chartsRes.data.data);
        if (recentRes.data?.success) setRecent(recentRes.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-glass">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Campus Intelligence Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Welcome back, {user?.full_name || 'Administrator'} 👋
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Live residential occupancy, financial collections, security gate visitors, and facility maintenance dispatch.
            </p>
          </div>

          {/* Quick-Action Command Buttons */}
          {user?.role !== 'student' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => navigate('/students')}
              >
                Register Student
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<DoorOpen className="w-4 h-4" />}
                onClick={() => navigate('/allocations')}
              >
                Allocate Room
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<DollarSign className="w-4 h-4" />}
                onClick={() => navigate('/fees')}
              >
                Record Fee
              </Button>
              <Button
                variant="glass"
                size="sm"
                leftIcon={<UserCheck className="w-4 h-4" />}
                onClick={() => navigate('/visitors')}
              >
                Log Visitor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Metric Cards (8 Core Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* 1. Total Students */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Students</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.totalStudents || 0}</h3>
                  <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> Enrolled in Hostel
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 2. Total Rooms */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Rooms</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.totalRooms || 0}</h3>
                  <p className="text-xs text-slate-400 mt-1">Capacity: {stats?.totalCapacity || 0} Beds</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bed className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 3. Occupied Rooms */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Occupied Rooms</p>
                  <h3 className="text-3xl font-extrabold text-amber-300 mt-1">{stats?.occupiedRooms || 0}</h3>
                  <p className="text-xs text-amber-400/80 mt-1">Active Bed Occupants: {stats?.totalOccupancy || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <DoorOpen className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 4. Available Rooms */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Available Rooms</p>
                  <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats?.availableRooms || 0}</h3>
                  <p className="text-xs text-emerald-400/80 mt-1">
                    Free Beds: {(stats?.totalCapacity || 0) - (stats?.totalOccupancy || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 5. Total Pending Fees */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Fees</p>
                  <h3 className="text-3xl font-extrabold text-rose-400 mt-1">
                    ${Number(stats?.totalPendingFees || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Collected: ${Number(stats?.totalCollectedFees || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 6. Maintenance Pending */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Complaints</p>
                  <h3 className="text-3xl font-extrabold text-purple-400 mt-1">{stats?.pendingMaintenance || 0}</h3>
                  <p className="text-xs text-purple-300 mt-1">Awaiting Technician</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 7. Today's Visitors */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Today's Visitors</p>
                  <h3 className="text-3xl font-extrabold text-sky-400 mt-1">{stats?.todayVisitors || 0}</h3>
                  <p className="text-xs text-sky-300 mt-1">Security Gate Check-ins</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>

            {/* 8. Overall Occupancy Percentage */}
            <GlassCard hoverEffect>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Occupancy Rate</p>
                  <h3 className="text-3xl font-extrabold text-cyan-300 mt-1">{stats?.occupancyPercentage || 0}%</h3>
                  <div className="w-28 bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, stats?.occupancyPercentage || 0)}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Percent className="w-6 h-6" />
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>

      {/* Visual Charts Section (Monthly Collections & Hostel Capacities) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Fee Collection Area Chart */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Fee Revenue</h3>
              <p className="text-xs text-slate-400">Collection trends over past 6 months</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Financial Health
            </span>
          </div>

          <div className="h-64 w-full">
            {charts?.monthlyFees?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyFees}>
                  <defs>
                    <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Collected']}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#feeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No fee payment records found.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Room Occupancy Bar Chart by Hostel */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Occupancy by Hostel Wing</h3>
              <p className="text-xs text-slate-400">Total capacity vs current occupied beds</p>
            </div>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Bed Allocations
            </span>
          </div>

          <div className="h-64 w-full">
            {charts?.hostelOccupancy?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.hostelOccupancy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hostelCode" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="capacity" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Capacity" />
                  <Bar dataKey="occupied" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Occupied" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No hostel buildings configured.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Activities Grid (Students, Payments, Visitors, Complaints) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Fee Transactions */}
        <GlassCard>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-base font-bold text-white">Recent Fee Payments</h3>
            <button
              onClick={() => navigate('/payments')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentPayments?.length > 0 ? (
              recent.recentPayments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                      $
                    </div>
                    <div>
                      <p className="font-semibold text-white">{p.student_name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{p.receipt_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400 font-mono text-sm">+${p.amount}</p>
                    <p className="text-slate-400 text-[10px] uppercase">{p.payment_method}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No recent payments recorded.</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Maintenance Complaints */}
        <GlassCard>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-base font-bold text-white">Maintenance Tickets</h3>
            <button
              onClick={() => navigate('/maintenance')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentMaintenance?.length > 0 ? (
              recent.recentMaintenance.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/20 transition-all text-xs"
                >
                  <div className="truncate mr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white truncate">{m.title}</span>
                      <Badge status={m.priority} size="sm" />
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Room {m.room_number} &bull; {m.student_name}
                    </p>
                  </div>
                  <Badge status={m.status} size="sm" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No complaints submitted.</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Gate Visitors */}
        <GlassCard>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-base font-bold text-white">Gate Visitor Entries</h3>
            <button
              onClick={() => navigate('/visitors')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentVisitors?.length > 0 ? (
              recent.recentVisitors.map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{v.visitor_name}</p>
                    <p className="text-slate-400 text-[11px]">
                      Visiting: <span className="text-slate-300">{v.student_name}</span> ({v.relationship})
                    </p>
                  </div>
                  <Badge status={v.status} size="sm" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No visitors logged today.</p>
            )}
          </div>
        </GlassCard>

        {/* Recent Student Registrations */}
        <GlassCard>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-base font-bold text-white">New Student Registrations</h3>
            <button
              onClick={() => navigate('/students')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentStudents?.length > 0 ? (
              recent.recentStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{s.full_name}</p>
                    <p className="text-slate-400 text-[11px]">
                      {s.student_id} &bull; {s.department}
                    </p>
                  </div>
                  <Badge status={s.status} size="sm" />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No students registered yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
