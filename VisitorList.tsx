import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Plus,
  Download,
  Search,
  LogOut,
  Clock,
  Phone,
  Shield,
  CheckCircle,
  Building,
} from 'lucide-react';
import { visitorService, studentService } from '../../services/api';
import { VisitorLog, Student } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const VisitorList: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check-In Form
  const [checkInForm, setCheckInForm] = useState({
    name: '',
    phone: '',
    id_proof_type: 'National ID',
    id_proof_number: '',
    address: '',
    student_id: '',
    relationship: 'Parent',
    purpose: 'Visiting student during visitor hours',
    remarks: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await visitorService.getVisitorLogs({
        status,
        search,
      });
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load visitor logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents({ limit: 100, status: 'active' });
      if (res.data?.success) {
        setStudents(res.data.data);
        if (!checkInForm.student_id && res.data.data.length > 0) {
          setCheckInForm((prev) => ({ ...prev, student_id: String(res.data.data[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (user?.role !== 'student') {
      fetchStudents();
    }
  }, [status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await visitorService.checkIn(checkInForm);
      if (res.data?.success) {
        toast.success(`Visitor ${checkInForm.name} checked in successfully.`);
        setIsCheckInModalOpen(false);
        setCheckInForm({
          name: '',
          phone: '',
          id_proof_type: 'National ID',
          id_proof_number: '',
          address: '',
          student_id: students[0] ? String(students[0].id) : '',
          relationship: 'Parent',
          purpose: 'Visiting student during visitor hours',
          remarks: '',
        });
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (logId: number) => {
    try {
      const res = await visitorService.checkOut(logId);
      if (res.data?.success) {
        toast.success('Visitor checked out successfully.');
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    }
  };

  const handleExportCsv = () => {
    window.open(visitorService.exportCsvUrl(), '_blank');
  };

  const checkedInCount = logs.filter((l) => l.status === 'checked_in').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Visitor Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Campus security entry & exit tracking for guest and guardian visits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="glass"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export Logs
          </Button>

          {user?.role !== 'student' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCheckInModalOpen(true)}
            >
              Log Visitor Entry
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search visitor name, phone, student name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Select
            options={[
              { value: '', label: 'All Visitor Records' },
              { value: 'checked_in', label: `Currently Checked-In (${checkedInCount})` },
              { value: 'checked_out', label: 'Checked Out' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Visitor Logs Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UserCheck}
                title="No visitor logs recorded"
                description="No visitors found matching your search criteria."
                actionLabel={user?.role !== 'student' ? 'Log Entry' : undefined}
                onAction={user?.role !== 'student' ? () => setIsCheckInModalOpen(true) : undefined}
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Visitor</th>
                  <th className="py-3.5 px-4">Student Visited</th>
                  <th className="py-3.5 px-4">Relationship & Purpose</th>
                  <th className="py-3.5 px-4">Check-In Time</th>
                  <th className="py-3.5 px-4">Check-Out Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  {user?.role !== 'student' && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{log.visitor_name}</p>
                      <p className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {log.visitor_phone}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{log.student_name}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{log.student_code}</p>
                      {log.room_number && (
                        <p className="text-[10px] text-cyan-400">Room {log.room_number}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 font-medium">{log.relationship}</p>
                      <p className="text-slate-400 text-[11px] max-w-xs line-clamp-1">{log.purpose}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {log.check_in_time}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {log.check_out_time || (
                        <span className="text-cyan-400 font-semibold italic">Inside Hostel</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={log.status} size="sm" />
                    </td>

                    {user?.role !== 'student' && (
                      <td className="py-3.5 px-4 text-right">
                        {log.status === 'checked_in' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<LogOut className="w-3.5 h-3.5" />}
                            onClick={() => handleCheckOut(log.id)}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Completed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Log Visitor Entry Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Register Visitor Entry"
        size="md"
      >
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Visitor Name *"
              placeholder="e.g. John Doe"
              value={checkInForm.name}
              onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
              required
            />
            <Input
              label="Contact Phone *"
              placeholder="+1 (555) 000-0000"
              value={checkInForm.phone}
              onChange={(e) => setCheckInForm({ ...checkInForm, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="ID Proof Type"
              options={[
                { value: 'National ID', label: 'National ID' },
                { value: 'Drivers License', label: 'Drivers License' },
                { value: 'Passport', label: 'Passport' },
                { value: 'Other', label: 'Other Government ID' },
              ]}
              value={checkInForm.id_proof_type}
              onChange={(e) => setCheckInForm({ ...checkInForm, id_proof_type: e.target.value })}
            />
            <Input
              label="ID Document Number"
              placeholder="e.g. DL-883910"
              value={checkInForm.id_proof_number}
              onChange={(e) => setCheckInForm({ ...checkInForm, id_proof_number: e.target.value })}
            />
          </div>

          <Select
            label="Visiting Student *"
            options={students.map((s) => ({
              value: s.id,
              label: `${s.full_name} (${s.student_id}) • Room ${s.room_number || 'N/A'}`,
            }))}
            value={checkInForm.student_id}
            onChange={(e) => setCheckInForm({ ...checkInForm, student_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Relationship to Student *"
              placeholder="e.g. Father, Sister, Friend"
              value={checkInForm.relationship}
              onChange={(e) => setCheckInForm({ ...checkInForm, relationship: e.target.value })}
              required
            />
            <Input
              label="Purpose of Visit *"
              placeholder="e.g. Delivering luggage, Family visit"
              value={checkInForm.purpose}
              onChange={(e) => setCheckInForm({ ...checkInForm, purpose: e.target.value })}
              required
            />
          </div>

          <Input
            label="Security Desk Notes"
            placeholder="e.g. Issued visitor badge #04"
            value={checkInForm.remarks}
            onChange={(e) => setCheckInForm({ ...checkInForm, remarks: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Check In Visitor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
