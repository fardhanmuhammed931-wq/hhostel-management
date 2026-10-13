import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Printer,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { paymentService } from '../../services/api';
import { Payment } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const PaymentHistory: React.FC = () => {
  const toast = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments({
        search,
        payment_method: paymentMethod,
      });
      if (res.data?.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [paymentMethod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleExportCsv = () => {
    window.open(paymentService.exportCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Payment Receipts & History
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit log of verified hostel fee receipts, payment gateways, and printable invoices.
          </p>
        </div>

        <Button
          variant="glass"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
      </div>

      {/* Filter and Search */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search receipt number, student name, student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Select
            options={[
              { value: '', label: 'All Payment Methods' },
              { value: 'upi', label: 'UPI / QR Code' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'card', label: 'Credit / Debit Card' },
              { value: 'cash', label: 'Cash' },
            ]}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Payments Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CreditCard}
                title="No payment records found"
                description="No payments match your search filter."
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Category & Period</th>
                  <th className="py-3.5 px-4">Method & Ref</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {p.receipt_number}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">{p.payment_date}</td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{p.student_name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{p.student_code}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="capitalize text-slate-200 font-medium">
                        {p.fee_category ? p.fee_category.replace(/_/g, ' ') : 'Hostel Fee'}
                      </p>
                      <p className="text-slate-400 text-[11px]">{p.academic_period}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono uppercase font-semibold text-slate-300">
                        {p.payment_method}
                      </span>
                      {p.transaction_reference && (
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {p.transaction_reference}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                      +${Number(p.amount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="glass"
                        size="sm"
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedReceipt(p)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
