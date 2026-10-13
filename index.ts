export type UserRole = 'admin' | 'warden' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  status: UserStatus;
  last_login?: string | null;
  created_at: string;
  student_id?: string | null;
  studentRecordId?: number | null;
  hostel_id?: number | null;
  hostel_name?: string | null;
  room_id?: number | null;
  room_number?: string | null;
  department?: string | null;
  course?: string | null;
}

export interface Student {
  id: number;
  user_id?: number | null;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth?: string | null;
  department: string;
  course: string;
  academic_year: string;
  guardian_name: string;
  guardian_phone: string;
  address: string;
  admission_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  created_at: string;
  updated_at: string;
  hostel_id?: number | null;
  hostel_name?: string | null;
  room_id?: number | null;
  room_number?: string | null;
  allocation_id?: number | null;
  bed_number?: string | null;
  allocated_since?: string | null;
}

export interface Hostel {
  id: number;
  name: string;
  code: string;
  type: 'boys' | 'girls' | 'co-ed';
  total_floors: number;
  warden_id?: number | null;
  warden_name?: string | null;
  contact_number?: string | null;
  address?: string | null;
  description?: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
  total_rooms?: number;
  total_capacity?: number;
  total_occupants?: number;
}

export interface Room {
  id: number;
  hostel_id: number;
  hostel_name?: string;
  hostel_code?: string;
  room_number: string;
  floor: number;
  room_type: 'single' | 'double' | 'triple' | 'quad' | 'dormitory';
  capacity: number;
  current_occupancy: number;
  fee_per_month: number;
  status: 'available' | 'partially_occupied' | 'full' | 'under_maintenance';
  amenities?: string | null;
  description?: string | null;
  available_beds?: number;
  created_at: string;
  updated_at: string;
  occupants?: any[];
}

export interface RoomAllocation {
  id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  student_phone?: string;
  room_id: number;
  room_number?: string;
  room_type?: string;
  floor?: number;
  hostel_id?: number;
  hostel_name?: string;
  bed_number?: string | null;
  start_date: string;
  end_date?: string | null;
  checkout_date?: string | null;
  status: 'active' | 'transferred' | 'checked_out' | 'cancelled';
  notes?: string | null;
  allocated_by?: number | null;
  allocated_by_name?: string | null;
  created_at: string;
}

export interface FeeRecord {
  id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  room_number?: string;
  hostel_name?: string;
  fee_category: 'hostel_rent' | 'mess_fee' | 'maintenance' | 'caution_deposit' | 'utilities' | 'other';
  academic_period: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  description?: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  fee_record_id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  student_phone?: string;
  department?: string;
  course?: string;
  fee_category?: string;
  academic_period?: string;
  amount_due?: number;
  total_fee_paid?: number;
  room_number?: string;
  hostel_name?: string;
  receipt_number: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'online';
  transaction_reference?: string | null;
  payment_date: string;
  recorded_by?: number | null;
  recorded_by_name?: string | null;
  remarks?: string | null;
  created_at: string;
}

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  id_proof_type?: string | null;
  id_proof_number?: string | null;
  address?: string | null;
}

export interface VisitorLog {
  id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_phone: string;
  id_proof_type?: string | null;
  id_proof_number?: string | null;
  student_id: number;
  student_name: string;
  student_code: string;
  room_number?: string;
  hostel_name?: string;
  relationship: string;
  purpose: string;
  check_in_time: string;
  check_out_time?: string | null;
  status: 'checked_in' | 'checked_out';
  recorded_by?: number | null;
  recorded_by_name?: string | null;
  remarks?: string | null;
}

export interface MaintenanceRequest {
  id: number;
  ticket_number: string;
  student_id: number;
  student_name: string;
  student_code: string;
  student_phone?: string;
  room_id: number;
  room_number: string;
  floor?: number;
  hostel_id?: number;
  hostel_name: string;
  category: 'electrical' | 'plumbing' | 'cleaning' | 'furniture' | 'internet' | 'room_facilities' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'submitted' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  student_id: number;
  student_code: string;
  student_name: string;
  department: string;
  room_number?: string;
  hostel_name?: string;
  hostel_id?: number;
  attendance_status: 'present' | 'absent' | 'on_leave' | 'not_marked';
  attendance_id?: number;
  remarks?: string | null;
  attendance_date?: string;
  recorded_by_name?: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalCapacity: number;
  totalOccupancy: number;
  totalPendingFees: number;
  totalCollectedFees: number;
  pendingMaintenance: number;
  todayVisitors: number;
  occupancyPercentage: number;
}
