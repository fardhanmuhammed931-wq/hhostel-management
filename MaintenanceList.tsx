import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  Edit2,
} from 'lucide-react';
import { maintenanceService, roomService } from '../../services/api';
import { MaintenanceRequest, Room } from '../../types';
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

export const MaintenanceList: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    room_id: user?.room_id ? String(user.room_id) : '',
    category: 'electrical',
    title: '',
    description: '',
    priority: 'medium',
  });

  const [updateForm, setUpdateForm] = useState({
    status: 'in_progress',
    priority: 'medium',
    resolution_notes: '',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await maintenanceService.getRequests({
        status,
        priority,
        category,
        search,
      });
      if (res.data?.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await roomService.getRooms();
      if (res.data?.success) {
        setRooms(res.data.data);
        if (!createForm.room_id && res.data.data.length > 0) {
          setCreateForm((prev) => ({ ...prev, room_id: String(res.data.data[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (user?.role !== 'student') {
      fetchRooms();
    }
  }, [status, priority, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await maintenanceService.createRequest(createForm);
      if (res.data?.success) {
        toast.success(`Complaint ticket ${res.data.data.ticketNumber} submitted successfully!`);
        setIsSubmitModalOpen(false);
        setCreateForm({
          room_id: user?.room_id ? String(user.room_id) : '',
          category: 'electrical',
          title: '',
          description: '',
          priority: 'medium',
        });
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUpdateModal = (ticket: MaintenanceRequest) => {
    setSelectedTicket(ticket);
    setUpdateForm({
      status: ticket.status,
      priority: ticket.priority,
      resolution_notes: ticket.resolution_notes || '',
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);
    try {
      const res = await maintenanceService.updateRequest(selectedTicket.id, updateForm);
      if (res.data?.success) {
        toast.success('Maintenance ticket updated successfully.');
        setIsUpdateModalOpen(false);
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed.');
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
            Maintenance & Complaints
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Submit facility repair tickets, assign staff dispatch, and record resolutions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            if (user?.room_id) {
              setCreateForm((prev) => ({ ...prev, room_id: String(user.room_id) }));
            }
            setIsSubmitModalOpen(true);
          }}
        >
          Submit New Complaint
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Search ticket, title, student, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            options={[
              { value: '', label: 'All Ticket Statuses' },
              { value: 'submitted', label: 'Submitted (New)' },
              { value: 'in_progress', label: 'In Progress (Dispatched)' },
              { value: 'resolved', label: 'Resolved (Fixed)' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'emergency', label: 'Emergency Priority' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'plumbing', label: 'Plumbing' },
              { value: 'cleaning', label: 'Cleaning & Janitorial' },
              { value: 'furniture', label: 'Furniture' },
              { value: 'internet', label: 'Wi-Fi / Internet' },
              { value: 'room_facilities', label: 'Room Facilities' },
              { value: 'other', label: 'Other Issue' },
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Complaints Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Wrench}
                title="No maintenance complaints found"
                description="No tickets match your filter criteria. Everything is currently in working order!"
                actionLabel="Submit Complaint"
                onAction={() => setIsSubmitModalOpen(true)}
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Room & Hostel</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Category & Title</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  {user?.role !== 'student' && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {ticket.ticket_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <Building className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Room {ticket.room_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ticket.hostel_name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{ticket.student_name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{ticket.student_code}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {ticket.category.replace(/_/g, ' ')}
                      </span>
                      <p className="font-bold text-white mt-1">{ticket.title}</p>
                      <p className="text-slate-400 text-[11px] max-w-sm line-clamp-1">{ticket.description}</p>
                      {ticket.resolution_notes && (
                        <p className="text-[11px] text-emerald-400 mt-1 italic">
                          Resolution: {ticket.resolution_notes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={ticket.priority} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={ticket.status} size="sm" />
                    </td>

                    {user?.role !== 'student' && (
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenUpdateModal(ticket)}
                        >
                          Update
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Submit Complaint Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Facility Maintenance Complaint"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {user?.role !== 'student' && (
            <Select
              label="Select Room *"
              options={rooms.map((r) => ({
                value: r.id,
                label: `Room ${r.room_number} (${r.hostel_name})`,
              }))}
              value={createForm.room_id}
              onChange={(e) => setCreateForm({ ...createForm, room_id: e.target.value })}
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Complaint Category *"
              options={[
                { value: 'electrical', label: 'Electrical (Fan, Light, Switch)' },
                { value: 'plumbing', label: 'Plumbing (Tap, Leakage, Flush)' },
                { value: 'cleaning', label: 'Cleaning & Sanitation' },
                { value: 'furniture', label: 'Furniture (Bed, Cupboard, Desk)' },
                { value: 'internet', label: 'Wi-Fi / Ethernet Port' },
                { value: 'room_facilities', label: 'Room Facilities' },
                { value: 'other', label: 'Other Issue' },
              ]}
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            />

            <Select
              label="Urgency / Priority *"
              options={[
                { value: 'low', label: 'Low (Routine check)' },
                { value: 'medium', label: 'Medium (Fix within 2 days)' },
                { value: 'high', label: 'High (Needs prompt attention)' },
                { value: 'emergency', label: 'Emergency (Water leak / Fire hazard)' },
              ]}
              value={createForm.priority}
              onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
            />
          </div>

          <Input
            label="Complaint Title *"
            placeholder="e.g. Ceiling fan speed regulator broken"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl bg-slate-900/60 border border-white/10 text-slate-100 placeholder-slate-500 text-sm p-3 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Provide exact details of the malfunction or issue..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Staff Update Ticket Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Ticket #${selectedTicket?.ticket_number}`}
        size="md"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Update Status *"
              options={[
                { value: 'submitted', label: 'Submitted' },
                { value: 'in_progress', label: 'In Progress (Technician Assigned)' },
                { value: 'resolved', label: 'Resolved (Work Completed)' },
                { value: 'closed', label: 'Closed' },
              ]}
              value={updateForm.status}
              onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
            />

            <Select
              label="Update Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'emergency', label: 'Emergency' },
              ]}
              value={updateForm.priority}
              onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Resolution Notes / Action Taken
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl bg-slate-900/60 border border-white/10 text-slate-100 placeholder-slate-500 text-sm p-3 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g. Replaced capacitor and checked speed switch. Working properly."
              value={updateForm.resolution_notes}
              onChange={(e) => setUpdateForm({ ...updateForm, resolution_notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
