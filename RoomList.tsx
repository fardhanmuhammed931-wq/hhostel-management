import React, { useEffect, useState } from 'react';
import {
  Bed,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Users,
  DollarSign,
  Building,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { roomService, hostelService } from '../../services/api';
import { Room, Hostel } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton, CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const RoomList: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [hostelId, setHostelId] = useState('');
  const [status, setStatus] = useState('');
  const [roomType, setRoomType] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOccupantsModalOpen, setIsOccupantsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Room form state
  const [formData, setFormData] = useState({
    hostel_id: '',
    room_number: '',
    floor: 1,
    room_type: 'double',
    capacity: 2,
    fee_per_month: 450,
    status: 'available',
    amenities: 'Wi-Fi, Study Table, AC, Wardrobe',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, hostelsRes] = await Promise.all([
        roomService.getRooms({
          hostel_id: hostelId,
          status,
          room_type: roomType,
          search,
        }),
        hostelService.getHostels(),
      ]);

      if (roomsRes.data?.success) setRooms(roomsRes.data.data);
      if (hostelsRes.data?.success) {
        setHostels(hostelsRes.data.data);
        if (!formData.hostel_id && hostelsRes.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, hostel_id: String(hostelsRes.data.data[0].id) }));
        }
      }
    } catch (err) {
      toast.error('Failed to load rooms inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostelId, status, roomType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await roomService.createRoom(formData);
      if (res.data?.success) {
        toast.success(`Room ${formData.room_number} added successfully.`);
        setIsAddModalOpen(false);
        setFormData({
          ...formData,
          room_number: '',
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not add room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOccupants = async (roomId: number) => {
    try {
      const res = await roomService.getRoomById(roomId);
      if (res.data?.success) {
        setSelectedRoom(res.data.data);
        setIsOccupantsModalOpen(true);
      }
    } catch (err) {
      toast.error('Could not fetch room occupant details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Rooms & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive visual room occupancy grid, bed capacities, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {user?.role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Room
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            options={[
              { value: '', label: 'All Hostels' },
              ...hostels.map((h) => ({ value: h.id, label: h.name })),
            ]}
            value={hostelId}
            onChange={(e) => setHostelId(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Room Types' },
              { value: 'single', label: 'Single Occupancy' },
              { value: 'double', label: 'Double Occupancy' },
              { value: 'triple', label: 'Triple Occupancy' },
              { value: 'quad', label: 'Quad Occupancy' },
              { value: 'dormitory', label: 'Dormitory Hall' },
            ]}
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'available', label: 'Available (Empty)' },
              { value: 'partially_occupied', label: 'Partially Occupied' },
              { value: 'full', label: 'Full Capacity' },
              { value: 'under_maintenance', label: 'Under Maintenance' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </form>
      </GlassCard>

      {/* View Content */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <GlassCard className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </GlassCard>
        )
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No rooms found"
          description="No rooms match the selected filter criteria. Modify your filters or add a new room."
        />
      ) : viewMode === 'grid' ? (
        /* Visual Room Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {rooms.map((room) => {
            const availBeds = room.capacity - room.current_occupancy;
            return (
              <GlassCard
                key={room.id}
                hoverEffect
                className="flex flex-col justify-between p-5 border-t-2"
              >
                <div>
                  {/* Card Header: Room Number & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-2xl font-black text-white tracking-tight">
                        #{room.room_number}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">
                        Floor {room.floor} &bull; {room.hostel_name}
                      </p>
                    </div>
                    <Badge status={room.status} size="sm" />
                  </div>

                  {/* Bed Occupancy Graphic Dots */}
                  <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">Bed Occupancy</span>
                      <span className="font-bold text-white">
                        {room.current_occupancy} / {room.capacity} Beds
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: room.capacity }).map((_, i) => {
                        const isOccupied = i < room.current_occupancy;
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              isOccupied
                                ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                                : 'bg-slate-800 border border-white/10'
                            }`}
                            title={isOccupied ? 'Occupied Bed' : 'Available Bed'}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Room Type:</span>
                      <span className="font-semibold capitalize text-white">{room.room_type}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Monthly Rent:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${room.fee_per_month}
                      </span>
                    </p>
                    {room.amenities && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 pt-1 border-t border-white/5">
                        {room.amenities}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${availBeds > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {availBeds > 0 ? `${availBeds} Bed(s) Free` : 'Room Full'}
                  </span>
                  <Button
                    variant="glass"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => handleViewOccupants(room.id)}
                  >
                    Occupants
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        /* Administrative Table View */
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Room No</th>
                  <th className="py-3.5 px-4">Hostel Wing</th>
                  <th className="py-3.5 px-4">Floor</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Occupancy</th>
                  <th className="py-3.5 px-4">Fee / Mo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-white/5 text-xs">
                    <td className="py-3 px-4 font-extrabold text-white font-mono text-sm">
                      #{room.room_number}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{room.hostel_name}</td>
                    <td className="py-3 px-4 text-slate-300">Floor {room.floor}</td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{room.room_type}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{room.capacity} Beds</td>
                    <td className="py-3 px-4 font-bold text-cyan-300 font-mono">
                      {room.current_occupancy} / {room.capacity}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">${room.fee_per_month}</td>
                    <td className="py-3 px-4">
                      <Badge status={room.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleViewOccupants(room.id)}
                      >
                        Occupants
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Room to Inventory"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Select
            label="Assigned Hostel *"
            options={hostels.map((h) => ({ value: h.id, label: `${h.name} (${h.code})` }))}
            value={formData.hostel_id}
            onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Number *"
              placeholder="e.g. 101, 204"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              required
            />
            <Input
              label="Floor Number *"
              type="number"
              min={0}
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) || 1 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Room Type *"
              options={[
                { value: 'single', label: 'Single Occupancy (1 Bed)' },
                { value: 'double', label: 'Double Occupancy (2 Beds)' },
                { value: 'triple', label: 'Triple Occupancy (3 Beds)' },
                { value: 'quad', label: 'Quad Occupancy (4 Beds)' },
                { value: 'dormitory', label: 'Dormitory Hall (6+ Beds)' },
              ]}
              value={formData.room_type}
              onChange={(e) => {
                const type = e.target.value;
                let defaultCap = 2;
                if (type === 'single') defaultCap = 1;
                else if (type === 'triple') defaultCap = 3;
                else if (type === 'quad') defaultCap = 4;
                else if (type === 'dormitory') defaultCap = 8;
                setFormData({ ...formData, room_type: type as any, capacity: defaultCap });
              }}
            />
            <Input
              label="Bed Capacity *"
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Monthly Fee ($) *"
              type="number"
              step="0.01"
              value={formData.fee_per_month}
              onChange={(e) => setFormData({ ...formData, fee_per_month: parseFloat(e.target.value) || 0 })}
              required
            />
            <Select
              label="Initial Status *"
              options={[
                { value: 'available', label: 'Available' },
                { value: 'under_maintenance', label: 'Under Maintenance' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            />
          </div>

          <Input
            label="Amenities"
            placeholder="e.g. AC, Attached Bath, Wi-Fi, Balcony"
            value={formData.amenities}
            onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Room Occupants Modal */}
      <Modal
        isOpen={isOccupantsModalOpen}
        onClose={() => setIsOccupantsModalOpen(false)}
        title={`Room #${selectedRoom?.room_number} Occupants`}
        description={`${selectedRoom?.hostel_name} • Floor ${selectedRoom?.floor} • ${selectedRoom?.capacity} Beds Total`}
        size="md"
      >
        <div className="space-y-4">
          {selectedRoom?.occupants?.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400">
              This room currently has no registered student occupants.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedRoom?.occupants?.map((occ: any) => (
                <div
                  key={occ.student_id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
                      {occ.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{occ.full_name}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{occ.student_code} &bull; {occ.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Bed: {occ.bed_number || 'Standard'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Since {occ.start_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-white/10">
            <Button variant="ghost" onClick={() => setIsOccupantsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
