import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
  Shield,
  CreditCard,
  Wrench,
  Clock,
  Printer,
} from 'lucide-react';
import { studentService } from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../context/ToastContext';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocations' | 'fees' | 'complaints'>('allocations');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      try {
        const res = await studentService.getStudentById(id);
        if (res.data?.success) {
          setStudent(res.data.data);
        }
      } catch (err: any) {
        toast.error('Could not load student profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!student) {
    return (
      <GlassCard className="text-center py-12">
        <h3 className="text-lg font-bold text-white mb-2">Student Not Found</h3>
        <p className="text-slate-400 text-sm mb-4">The requested student profile could not be located.</p>
        <Button variant="primary" onClick={() => navigate('/students')}>
          Return to Student Directory
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/students')}
        >
          Back to Students
        </Button>
      </div>

      {/* Main Student Header Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-2xl shadow-xl shadow-cyan-500/25 border border-cyan-400/30 flex-shrink-0">
              {student.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white">{student.full_name}</h2>
                <Badge status={student.status} />
              </div>
              <p className="text-sm font-mono text-cyan-300 font-semibold mt-1">
                {student.student_id} &bull; {student.department} ({student.course})
              </p>
            </div>
          </div>

          {/* Current Room Allocation Badge */}
          <div className="flex flex-col md:items-end">
            <span className="text-xs uppercase font-semibold text-slate-400 mb-1">Current Residence</span>
            {student.room_number ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                <Building className="w-4 h-4" />
                <span>{student.hostel_name} &bull; Room {student.room_number}</span>
                {student.bed_number && <span className="text-xs text-emerald-400">({student.bed_number})</span>}
              </div>
            ) : (
              <span className="text-sm text-slate-500 italic bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                No active room allocated
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Email Address</p>
            <p className="text-slate-200 font-semibold flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> {student.email}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Phone Number</p>
            <p className="text-slate-200 font-semibold flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> {student.phone}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Guardian Name & Phone</p>
            <p className="text-slate-200 font-semibold mt-1">
              {student.guardian_name} ({student.guardian_phone})
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Admission Date</p>
            <p className="text-slate-200 font-semibold flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {student.admission_date}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'allocations'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Room Allocation History ({student.allocations?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'fees'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Fee Records & Payments ({student.payments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'complaints'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Maintenance Tickets ({student.complaints?.length || 0})
        </button>
      </div>

      {/* Tab 1: Allocations */}
      {activeTab === 'allocations' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Hostel & Room</th>
                  <th className="py-3 px-4">Bed</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Allocated By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {student.allocations?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {a.hostel_name} - Room {a.room_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{a.bed_number || 'Standard'}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {a.start_date} &rarr; {a.checkout_date || a.end_date || 'Present'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{a.allocated_by_name || 'Staff'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={a.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Tab 2: Fees & Payments */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-800/40">
              <h4 className="text-sm font-bold text-white">Fee Obligations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Amount Due</th>
                    <th className="py-2.5 px-4">Amount Paid</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {student.feeRecords?.map((f: any) => (
                    <tr key={f.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-semibold text-white capitalize">
                        {f.fee_category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{f.academic_period}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">${f.amount_due}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono font-semibold">${f.amount_paid}</td>
                      <td className="py-3 px-4 text-rose-400 font-mono font-semibold">
                        ${(f.amount_due - f.amount_paid).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{f.due_date}</td>
                      <td className="py-3 px-4">
                        <Badge status={f.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-800/40">
              <h4 className="text-sm font-bold text-white">Payment Receipts History</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Receipt No</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Amount Paid</th>
                    <th className="py-2.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {student.payments?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-300">{p.receipt_number}</td>
                      <td className="py-3 px-4 text-slate-300">{p.payment_date}</td>
                      <td className="py-3 px-4 uppercase text-slate-300">{p.payment_method}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono font-bold">${p.amount}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedReceipt({ ...p, student_name: student.full_name, student_code: student.student_id })}
                        >
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 3: Complaints */}
      {activeTab === 'complaints' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {student.complaints?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5 text-xs">
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-300">{c.ticket_number}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-300">{c.category}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{c.title}</p>
                      <p className="text-slate-400 text-[11px] max-w-md line-clamp-1">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
