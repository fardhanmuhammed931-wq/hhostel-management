import React, { useEffect, useState } from 'react';
import { Building2, Plus, Users, Bed, Phone, MapPin, Shield } from 'lucide-react';
import { hostelService } from '../../services/api';
import { Hostel } from '../../types';
import { GlassCard } from '../../components/common/GlassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CardSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const HostelList: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'co-ed',
    total_floors: 3,
    contact_number: '',
    address: '',
    description: '',
    status: 'active',
  });

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const res = await hostelService.getHostels();
      if (res.data?.success) {
        setHostels(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load hostel buildings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await hostelService.createHostel(formData);
      if (res.data?.success) {
        toast.success(`Hostel ${formData.name} created successfully!`);
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          code: '',
          type: 'co-ed',
          total_floors: 3,
          contact_number: '',
          address: '',
          description: '',
          status: 'active',
        });
        fetchHostels();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create hostel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Hostel Buildings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Residential hall wings, warden leadership, and occupancy limits.
          </p>
        </div>

        {user?.role === 'admin' && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Hostel
          </Button>
        )}
      </div>

      {/* Hostels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          hostels.map((h) => {
            const occ = Number(h.total_occupants || 0);
            const cap = Number(h.total_capacity || 0);
            const occPercent = cap > 0 ? Math.round((occ / cap) * 100) : 0;

            return (
              <GlassCard key={h.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                        {h.code}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1.5">{h.name}</h3>
                    </div>
                    <Badge status={h.status} size="sm" />
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {h.description || 'Modern residential living facility with student support amenities.'}
                  </p>

                  {/* Occupancy Progress */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Bed Occupancy</span>
                      <span className="font-bold text-white">
                        {occ} / {cap} Beds ({occPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          occPercent >= 90
                            ? 'bg-rose-500'
                            : occPercent >= 70
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-slate-400 flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-cyan-400" /> Total Rooms
                      </p>
                      <p className="font-bold text-white text-sm mt-0.5">{h.total_rooms || 0}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Floors
                      </p>
                      <p className="font-bold text-white text-sm mt-0.5">{h.total_floors} Floors</p>
                    </div>
                  </div>
                </div>

                {/* Footer: Warden & Contact */}
                <div className="pt-3 border-t border-white/10 text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Warden: <strong>{h.warden_name || 'Assigned Staff'}</strong></span>
                  </p>
                  {h.contact_number && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{h.contact_number}</span>
                    </p>
                  )}
                  {h.address && (
                    <p className="flex items-center gap-1.5 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{h.address}</span>
                    </p>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Add Hostel Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Hostel Building"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Hostel Name *"
            placeholder="e.g. Olympus Hall (North Wing)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Building Code *"
              placeholder="e.g. OLY-NORTH"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Select
              label="Hostel Type *"
              options={[
                { value: 'boys', label: 'Boys Hostel' },
                { value: 'girls', label: 'Girls Hostel' },
                { value: 'co-ed', label: 'Co-Ed / Scholars' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Floors"
              type="number"
              min={1}
              value={formData.total_floors}
              onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value, 10) || 1 })}
            />
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 000-0000"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            />
          </div>

          <Input
            label="Address / Campus Quad"
            placeholder="Campus location or quad block"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label="Description / Amenities"
            placeholder="Brief description of rooms and facilities"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Hostel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
