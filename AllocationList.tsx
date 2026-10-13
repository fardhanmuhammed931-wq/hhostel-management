import React, { useEffect, useState } from 'react';
import {
  DoorOpen,
  Plus,
  ArrowRightLeft,
  LogOut,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Building,
  Bed,
  Calendar,
} from 'lucide-react';
import { allocationService, studentService, roomService, hostelService } from '../../services/api';
import { RoomAllocation, Student, Room, Hostel } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

export const AllocationList: React.FC = () => {
  const toast = useToast();

  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('active');
  const [hostelId, setHostelId] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<RoomAllocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [allocateForm, setAllocateForm] = useState({
    student_id: '',
    room_id: '',
    bed_number: 'Bed A',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: 'Academic term residential allocation',
  });

  const [transferForm, setTransferForm] = useState({
    new_room_id: '',
    bed_number: 'Bed A',
    transfer_date: new Date().toISOString().split('T')[0],
    reason: 'Student room change request',
  });

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await allocationService.getAllocations({
        status,
        hostel_id: hostelId,
        search,
      });
      if (res.data?.success) {
        setAllocations(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load room allocations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [stuRes, rmRes, hstRes] = await Promise.all([
        studentService.getStudents({ limit: 100, status: 'active' }),
        roomService.getRooms(),
        hostelService.getHostels(),
      ]);

      if (stuRes.data?.success) setStudents(stuRes.data.data);
      if (rmRes.data?.success) setRooms(rmRes.data.data);
      if (hstRes.data?.success) setHostels(hstRes.data.data);
    } catch (err) {
      console.error('Error fetching allocation dependencies:', err);
    }
  };

  useEffect(() => {
    fetchAllocations();
    fetchDependencies();
  }, [status, hostelId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAllocations();
  };

  const handleOpenAllocateModal = () => {
    // Default to first student not yet allocated if available
    const unallocated = students.find((s) => !s.room_number);
    const availableRoom = rooms.find((r) => r.capacity > r.current_occupancy && r.status !== 'under_maintenance');

    setAllocateForm({
      student_id: unallocated ? String(unallocated.id) : (students[0] ? String(students[0].id) : ''),
      room_id: availableRoom ? String(availableRoom.id) : (rooms[0] ? String(rooms[0].id) : ''),
      bed_number: 'Bed A',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: 'Academic term residential allocation',
    });
    setIsAllocateModalOpen(true);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await allocationService.allocateRoom(allocateForm);
      if (res.data?.success) {
        toast.success('Room allocated successfully! Occupancy updated.');
        setIsAllocateModalOpen(false);
        fetchAllocations();
        fetchDependencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not allocate room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedAllocation) return;
    setIsSubmitting(true);
    try {
      const res = await allocationService.checkOut(selectedAllocation.id);
      if (res.data?.success) {
        toast.success(res.data.message || 'Student checked out successfully.');
        setIsCheckoutDialogOpen(false);
        fetchAllocations();
        fetchDependencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    setIsSubmitting(true);
    try {
      const res = await allocationService.transferRoom(selectedAllocation.id, transferForm);
      if (res.data?.success) {
        toast.success('Room transferred successfully.');
        setIsTransferModalOpen(false);
        fetchAllocations();
        fetchDependencies();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Room transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find target room for allocation modal capacity indicator
  const targetRoom = rooms.find((r) => String(r.id) === String(allocateForm.room_id));
  const isRoomFull = targetRoom ? targetRoom.current_occupancy >= targetRoom.capacity : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Room Allocations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Capacity-controlled bed assignment workflow, room transfers, and check-out management.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAllocateModal}
        >
          Allocate Student
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search student, ID, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            options={[
              { value: 'active', label: 'Active Allocations' },
              { value: 'checked_out', label: 'Checked Out' },
              { value: 'transferred', label: 'Transferred History' },
              { value: '', label: 'All Allocation Records' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Hostel Wings' },
              ...hostels.map((h) => ({ value: h.id, label: h.name })),
            ]}
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* Allocations Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : allocations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={DoorOpen}
                title="No allocation records found"
                description="No student allocations match the current filters. Click below to allocate a bed."
                actionLabel="Allocate Student"
                onAction={handleOpenAllocateModal}
              />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Allocated Room</th>
                  <th className="py-3.5 px-4">Bed No</th>
                  <th className="py-3.5 px-4">Allocation Period</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-white/5 transition-colors text-xs">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{alloc.student_name}</p>
                      <p className="text-slate-400 text-[11px]">{alloc.student_email}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-300">
                      {alloc.student_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <Building className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{alloc.hostel_name} &bull; Room {alloc.room_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">Floor {alloc.floor} ({alloc.room_type})</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {alloc.bed_number || 'Standard'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{alloc.start_date}</span>
                      <span className="text-slate-500 mx-1">&rarr;</span>
                      <span className={alloc.checkout_date ? 'text-amber-400' : 'text-emerald-400'}>
                        {alloc.checkout_date || alloc.end_date || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={alloc.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {alloc.status === 'active' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAllocation(alloc);
                              setIsTransferModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="Transfer Room"
                            aria-label="Transfer room"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAllocation(alloc);
                              setIsCheckoutDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Check Out Student"
                            aria-label="Check out student"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Allocate Room Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Allocate Bed to Student"
        description="Select the student and available hostel room. The backend transaction verifies capacity constraints."
        size="md"
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4">
          <Select
            label="Select Student *"
            options={students.map((s) => ({
              value: s.id,
              label: `${s.full_name} (${s.student_id}) ${s.room_number ? '• Currently in ' + s.room_number : '• [Unallocated]'}`,
            }))}
            value={allocateForm.student_id}
            onChange={(e) => setAllocateForm({ ...allocateForm, student_id: e.target.value })}
            required
          />

          <Select
            label="Select Destination Room *"
            options={rooms.map((r) => {
              const free = r.capacity - r.current_occupancy;
              return {
                value: r.id,
                label: `Room ${r.room_number} (${r.hostel_name}) • ${free} Free / ${r.capacity} Beds • $${r.fee_per_month}/mo`,
              };
            })}
            value={allocateForm.room_id}
            onChange={(e) => setAllocateForm({ ...allocateForm, room_id: e.target.value })}
            required
          />

          {/* Room Capacity Status Callout */}
          {targetRoom && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                isRoomFull
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>
                Capacity: <strong>{targetRoom.current_occupancy} / {targetRoom.capacity} Beds Occupied</strong>
              </span>
              <span>{isRoomFull ? '⚠️ Cannot allocate (Room Full)' : '✅ Capacity Available'}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bed Label / Number"
              placeholder="e.g. Bed 101-A"
              value={allocateForm.bed_number}
              onChange={(e) => setAllocateForm({ ...allocateForm, bed_number: e.target.value })}
            />
            <Input
              label="Allocation Start Date *"
              type="date"
              value={allocateForm.start_date}
              onChange={(e) => setAllocateForm({ ...allocateForm, start_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Allocation Notes"
            placeholder="e.g. Approved for Fall/Spring term"
            value={allocateForm.notes}
            onChange={(e) => setAllocateForm({ ...allocateForm, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAllocateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isRoomFull}
              isLoading={isSubmitting}
            >
              Confirm Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Room Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Student Room"
        description={`Transfer ${selectedAllocation?.student_name} from Room ${selectedAllocation?.room_number} to a new room.`}
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <Select
            label="Target Destination Room *"
            options={rooms
              .filter((r) => r.id !== selectedAllocation?.room_id)
              .map((r) => {
                const free = r.capacity - r.current_occupancy;
                return {
                  value: r.id,
                  label: `Room ${r.room_number} (${r.hostel_name}) • ${free} Beds Free • $${r.fee_per_month}/mo`,
                };
              })}
            value={transferForm.new_room_id}
            onChange={(e) => setTransferForm({ ...transferForm, new_room_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="New Bed Label"
              placeholder="e.g. Bed A"
              value={transferForm.bed_number}
              onChange={(e) => setTransferForm({ ...transferForm, bed_number: e.target.value })}
            />
            <Input
              label="Effective Date"
              type="date"
              value={transferForm.transfer_date}
              onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Transfer Reason"
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Execute Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Check-Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setIsCheckoutDialogOpen(false)}
        onConfirm={handleCheckoutConfirm}
        title="Confirm Student Check-Out"
        message={`Are you sure you want to check out ${selectedAllocation?.student_name} from Room ${selectedAllocation?.room_number}? This will release the bed, decrease current room occupancy, and update the allocation status.`}
        confirmLabel="Check Out Student"
        isLoading={isSubmitting}
      />
    </div>
  );
};
