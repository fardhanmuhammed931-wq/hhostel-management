import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  DollarSign,
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Printer,
} from 'lucide-react';
import { feeService, paymentService, studentService } from '../../services/api';
import { FeeRecord, Student, Payment } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { TableSkeleton, CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const FeeList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newFeeForm, setNewFeeForm] = useState({
    student_id: '',
    fee_category: 'hostel_rent',
    academic_period: 'Fall 2024',
    amount_due: 2700,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: 'Semester Room Rent & Facility Charges',
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'upi',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: 'Hostel fee installment payment',
  });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await feeService.getFees({
        status,
        category,
        search,
      });

      if (res.data?.success) {
        setFees(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      toast.error('Failed to load fee management records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents({ limit: 100, status: 'active' });
      if (res.data?.success) {
        setStudents(res.data.data);
        if (!newFeeForm.student_id && res.data.data.length > 0) {
          setNewFeeForm((prev) => ({ ...prev, student_id: String(res.data.data[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFees();
    if (user?.role !== 'student') {
      fetchStudents();
    }
  }, [status, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFees();
  };

  const handleOpenPayModal = (fee: FeeRecord) => {
    setSelectedFee(fee);
    const balance = Number(fee.amount_due) - Number(fee.amount_paid);
    setPayForm({
      amount: String(balance),
      payment_method: 'upi',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      remarks: `Payment for ${fee.fee_category.replace(/_/g, ' ')} (${fee.academic_period})`,
    });
    setIsPayModalOpen(true);
  };

  const handleCreateFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await feeService.createFee(newFeeForm);
      if (res.data?.success) {
        toast.success('Fee obligation created successfully.');
        setIsAddFeeModalOpen(false);
        fetchFees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create fee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    const remaining = Number(selectedFee.amount_due) - Number(selectedFee.amount_paid);
    const payVal = parseFloat(payForm.amount);

    if (payVal > remaining) {
      toast.error(`Payment amount ($${payVal}) cannot exceed remaining balance of $${remaining.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentService.recordPayment({
        fee_record_id: selectedFee.id,
        amount: payVal,
        payment_method: payForm.payment_method,
        transaction_reference: payForm.transaction_reference,
        payment_date: payForm.payment_date,
        remarks: payForm.remarks,
      });

      if (res.data?.success) {
        toast.success(`Payment recorded! Receipt: ${res.data.data.receiptNumber}`);
        setIsPayModalOpen(false);
        // Show printable receipt modal
        setCompletedPayment({
          ...res.data.data,
          student_name: selectedFee.student_name,
          student_code: selectedFee.student_code,
          room_number: selectedFee.room_number,
          hostel_name: selectedFee.hostel_name,
          fee_category: selectedFee.fee_category,
          academic_period: selectedFee.academic_period,
          amount: payVal,
          payment_method: payForm.payment_method,
          payment_date: payForm.payment_date,
        });
        fetchFees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment recording failed.');
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
            Fee Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Track student fee obligations, outstanding semester balances, and record payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="glass"
            size="sm"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => navigate('/payments')}
          >
            Payment Receipts History
          </Button>

          {user?.role !== 'student' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddFeeModalOpen(true)}
            >
              Create Fee Obligation
            </Button>
          )}
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <GlassCard hoverEffect>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Billed Due</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                ${Number(summary?.totalDue || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cumulative Invoiced</p>
            </GlassCard>

            <GlassCard hoverEffect>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Collected</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                ${Number(summary?.totalPaid || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Payments Verified
              </p>
            </GlassCard>

            <GlassCard hoverEffect>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Outstanding Balance</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
                ${Number(summary?.totalOutstanding || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-amber-300/80 mt-1">Awaiting Clearance</p>
            </GlassCard>

            <GlassCard hoverEffect>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Overdue Balances</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
                ${Number(summary?.totalOverdue || 0).toLocaleString()}
              </h3>
              <p className="text-xs text-rose-400/80 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Past Due Date
              </p>
            </GlassCard>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search student name, ID, or period..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            options={[
              { value: '', label: 'All Fee Categories' },
              { value: 'hostel_rent', label: 'Hostel Room Rent' },
              { value: 'mess_fee', label: 'Mess & Food Plan' },
              { value: 'maintenance', label: 'Facility Maintenance' },
              { value: 'caution_deposit', label: 'Caution Deposit' },
              { value: 'utilities', label: 'Utilities & Internet' },
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Payment Statuses' },
              { value: 'pending', label: 'Pending (Unpaid)' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'paid', label: 'Paid in Full' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Fee Records Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : fees.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Receipt}
                title="No fee records found"
                description="No fees match your current search and filters. Create a fee obligation to begin tracking."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Fee Category</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Billed Due</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Remaining Balance</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  {user?.role !== 'student' && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fees.map((fee) => {
                  const balance = Number(fee.amount_due) - Number(fee.amount_paid);
                  return (
                    <tr key={fee.id} className="hover:bg-white/5 transition-colors text-xs">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{fee.student_name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{fee.student_code}</p>
                      </td>

                      <td className="py-3.5 px-4 capitalize text-slate-200 font-medium">
                        {fee.fee_category.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">{fee.academic_period}</td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                        ${Number(fee.amount_due).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                        ${Number(fee.amount_paid).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        {balance > 0 ? (
                          <span className="text-rose-400">${balance.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-400">$0.00</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">{fee.due_date}</td>

                      <td className="py-3.5 px-4">
                        <Badge status={fee.status} size="sm" />
                      </td>

                      {user?.role !== 'student' && (
                        <td className="py-3.5 px-4 text-right">
                          {balance > 0 ? (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenPayModal(fee)}
                            >
                              Record Payment
                            </Button>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Cleared
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Create Fee Obligation Modal */}
      <Modal
        isOpen={isAddFeeModalOpen}
        onClose={() => setIsAddFeeModalOpen(false)}
        title="Create New Fee Obligation"
        size="md"
      >
        <form onSubmit={handleCreateFeeSubmit} className="space-y-4">
          <Select
            label="Select Student *"
            options={students.map((s) => ({
              value: s.id,
              label: `${s.full_name} (${s.student_id}) • Room ${s.room_number || 'N/A'}`,
            }))}
            value={newFeeForm.student_id}
            onChange={(e) => setNewFeeForm({ ...newFeeForm, student_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fee Category *"
              options={[
                { value: 'hostel_rent', label: 'Hostel Room Rent' },
                { value: 'mess_fee', label: 'Mess / Meal Plan' },
                { value: 'maintenance', label: 'Facility Maintenance' },
                { value: 'caution_deposit', label: 'Caution Deposit (Refundable)' },
                { value: 'utilities', label: 'Utilities & Internet' },
              ]}
              value={newFeeForm.fee_category}
              onChange={(e) => setNewFeeForm({ ...newFeeForm, fee_category: e.target.value as any })}
            />
            <Input
              label="Academic Period *"
              placeholder="e.g. Fall 2024"
              value={newFeeForm.academic_period}
              onChange={(e) => setNewFeeForm({ ...newFeeForm, academic_period: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount Due ($) *"
              type="number"
              step="0.01"
              value={newFeeForm.amount_due}
              onChange={(e) => setNewFeeForm({ ...newFeeForm, amount_due: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Payment Due Date *"
              type="date"
              value={newFeeForm.due_date}
              onChange={(e) => setNewFeeForm({ ...newFeeForm, due_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description / Invoice Remarks"
            value={newFeeForm.description}
            onChange={(e) => setNewFeeForm({ ...newFeeForm, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddFeeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Fee Payment"
        description={`Student: ${selectedFee?.student_name} (${selectedFee?.student_code}) • Category: ${selectedFee?.fee_category}`}
        size="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-xs flex items-center justify-between">
            <span className="text-slate-400">Total Billed: ${selectedFee?.amount_due}</span>
            <span className="text-slate-400">Paid So Far: ${selectedFee?.amount_paid}</span>
            <span className="font-bold text-rose-400">
              Remaining: ${(Number(selectedFee?.amount_due || 0) - Number(selectedFee?.amount_paid || 0)).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Amount ($) *"
              type="number"
              step="0.01"
              max={Number(selectedFee?.amount_due || 0) - Number(selectedFee?.amount_paid || 0)}
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              required
            />
            <Select
              label="Payment Method *"
              options={[
                { value: 'upi', label: 'UPI / QR Code' },
                { value: 'bank_transfer', label: 'Bank Wire / EFT' },
                { value: 'card', label: 'Credit / Debit Card' },
                { value: 'cash', label: 'Cash at Desk' },
                { value: 'cheque', label: 'Cheque' },
              ]}
              value={payForm.payment_method}
              onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value as any })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction / Reference Ref"
              placeholder="e.g. UPI/883912048"
              value={payForm.transaction_reference}
              onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
            />
            <Input
              label="Payment Date *"
              type="date"
              value={payForm.payment_date}
              onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Payment Notes"
            value={payForm.remarks}
            onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Confirm & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedPayment}
        onClose={() => setCompletedPayment(null)}
        payment={completedPayment}
      />
    </div>
  );
};
