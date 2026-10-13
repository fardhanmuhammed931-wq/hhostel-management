import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Building,
  Bed,
  DollarSign,
  Wrench,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
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
import { reportService } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'occupancy' | 'fees' | 'maintenance'>('occupancy');
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        if (activeTab === 'occupancy') {
          const res = await reportService.getOccupancyReport();
          if (res.data?.success) setOccupancyData(res.data.data);
        } else if (activeTab === 'fees') {
          const res = await reportService.getFeeReport();
          if (res.data?.success) setFeeData(res.data.data);
        } else if (activeTab === 'maintenance') {
          const res = await reportService.getMaintenanceReport();
          if (res.data?.success) setMaintenanceData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load report analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [activeTab]);

  const handleExportCsv = (type: string) => {
    window.open(reportService.exportCsvUrl(type), '_blank');
  };

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real MySQL-backed aggregations for facility capacity, fee collections, and maintenance.
          </p>
        </div>

        <Button
          variant="glass"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => handleExportCsv(activeTab)}
        >
          Export Current Report (CSV)
        </Button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('occupancy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'occupancy'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Room Occupancy Report</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'fees'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fee Collections Report</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'maintenance'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance Analytics</span>
        </button>
      </div>

      {/* Tab 1: Occupancy Report */}
      {activeTab === 'occupancy' && (
        <div className="space-y-6">
          {/* Hostel Occupancy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {occupancyData?.hostelStats?.map((h: any) => (
              <GlassCard key={h.id}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-base">{h.name}</h4>
                  <Badge status={h.type} size="sm" />
                </div>
                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Occupancy Rate:</span>
                    <strong className="text-cyan-300 font-mono text-sm">{h.occupancy_rate || 0}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, h.occupancy_rate || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-white/5">
                    <span>Total Capacity: {h.total_capacity} Beds</span>
                    <span className="text-emerald-400 font-semibold">{h.available_beds} Free</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Detailed Room Inventory Table */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-800/40">
              <h4 className="text-sm font-bold text-white">Full Room Inventory Status</h4>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} cols={7} />
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 uppercase text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4">Hostel Wing</th>
                      <th className="py-2.5 px-4">Room No</th>
                      <th className="py-2.5 px-4">Floor</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Capacity</th>
                      <th className="py-2.5 px-4">Occupancy</th>
                      <th className="py-2.5 px-4">Available Beds</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {occupancyData?.roomsList?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-semibold text-white">{r.hostel_name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">#{r.room_number}</td>
                        <td className="py-3 px-4 text-slate-300">Floor {r.floor}</td>
                        <td className="py-3 px-4 capitalize text-slate-300">{r.room_type}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{r.capacity}</td>
                        <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{r.current_occupancy}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{r.available_beds}</td>
                        <td className="py-3 px-4">
                          <Badge status={r.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 2: Fees Report */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-slate-800/40">
                <h4 className="text-sm font-bold text-white">Collections by Fee Category</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 uppercase text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Invoiced</th>
                      <th className="py-2.5 px-4">Collected</th>
                      <th className="py-2.5 px-4">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {feeData?.categoryBreakdown?.map((cat: any) => (
                      <tr key={cat.fee_category} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-semibold text-white capitalize">
                          {cat.fee_category.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">${Number(cat.total_due).toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                          ${Number(cat.total_paid).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-400 font-bold">
                          ${Number(cat.total_balance).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Payment Method Distribution */}
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-4">Payment Method Distribution</h4>
              <div className="space-y-3">
                {feeData?.paymentMethods?.map((pm: any, idx: number) => (
                  <div key={pm.payment_method} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-slate-300">
                      {pm.payment_method}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400 font-mono text-sm">${Number(pm.total_amount).toFixed(2)}</p>
                      <p className="text-slate-400 text-[10px]">{pm.count} Transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Report */}
      {activeTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-800/40">
              <h4 className="text-sm font-bold text-white">Tickets by Category</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Total Filed</th>
                    <th className="py-2.5 px-4">Resolved</th>
                    <th className="py-2.5 px-4">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {maintenanceData?.byCategory?.map((cat: any) => (
                    <tr key={cat.category} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-semibold text-white capitalize">{cat.category}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{cat.total}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{cat.resolved_count}</td>
                      <td className="py-3 px-4 font-mono text-amber-400 font-bold">{cat.pending_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <h4 className="text-sm font-bold text-white mb-4">Tickets by Priority Distribution</h4>
            <div className="space-y-3">
              {maintenanceData?.byPriority?.map((p: any) => (
                <div key={p.priority} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <Badge status={p.priority} />
                  <span className="font-mono text-white font-bold text-sm">{p.total} Tickets</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
