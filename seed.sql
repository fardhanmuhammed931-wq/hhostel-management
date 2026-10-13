-- ========================================================
-- Hostel Management System - Demonstration Seed Data
-- ========================================================

USE `hostel_management`;

-- 1. Users
-- Default passwords:
-- admin@hostel.com  => Admin@123  (or password123)
-- warden@hostel.com => Warden@123 (or password123)
-- student@hostel.com => Student@123 (or password123)
-- Hash below corresponds to "password123" ($2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa)
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `phone`, `status`) VALUES
(1, 'admin@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Dr. Sarah Jenkins', 'admin', '+1 (555) 019-2834', 'active'),
(2, 'warden.boys@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Robert Vance', 'warden', '+1 (555) 019-5821', 'active'),
(3, 'warden.girls@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Elena Rostova', 'warden', '+1 (555) 019-9432', 'active'),
(4, 'alex.turner@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Alex Turner', 'student', '+1 (555) 012-4411', 'active'),
(5, 'sophia.chen@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Sophia Chen', 'student', '+1 (555) 012-7722', 'active'),
(6, 'marcus.rashford@hostel.com', '$2a$10$tfTCdi36/G0aIVnNrwHlP.Vf7nhRl2NRr7fpUx7qwO6SuBMz4iCQq', 'Marcus Bell', 'student', '+1 (555) 012-8833', 'active');

-- 2. Hostels
INSERT INTO `hostels` (`id`, `name`, `code`, `type`, `total_floors`, `warden_id`, `contact_number`, `address`, `description`, `status`) VALUES
(1, 'Olympus Hall (North Wing)', 'OLY-NORTH', 'boys', 4, 2, '+1 (555) 234-8001', 'North Campus Quad, Block A', 'Modern hostel facility with high-speed fiber internet and attached cafeteria.', 'active'),
(2, 'Athena Residence (South Wing)', 'ATH-SOUTH', 'girls', 4, 3, '+1 (555) 234-8002', 'South Campus Quad, Block B', 'Secure residential hall with 24/7 security, quiet study lounge, and laundry room.', 'active'),
(3, 'Phoenix International House', 'PHX-INTL', 'co-ed', 3, 1, '+1 (555) 234-8003', 'East Garden Boulevard, Block C', 'Executive style living for graduate scholars and international exchange students.', 'active');

-- 3. Students
INSERT INTO `students` (`id`, `user_id`, `student_id`, `full_name`, `email`, `phone`, `gender`, `date_of_birth`, `department`, `course`, `academic_year`, `guardian_name`, `guardian_phone`, `address`, `admission_date`, `status`) VALUES
(1, 4, 'STU-2024-001', 'Alex Turner', 'alex.turner@hostel.com', '+1 (555) 012-4411', 'male', '2003-05-14', 'Computer Science', 'B.Tech CS', '3rd Year', 'David Turner', '+1 (555) 901-3322', '742 Evergreen Terrace, Springfield', '2022-08-15', 'active'),
(2, 5, 'STU-2024-002', 'Sophia Chen', 'sophia.chen@hostel.com', '+1 (555) 012-7722', 'female', '2004-02-20', 'Electrical Engineering', 'B.Tech EE', '2nd Year', 'Li Chen', '+1 (555) 901-6644', '124 Conch Street, Pacific Grove', '2023-08-10', 'active'),
(3, 6, 'STU-2024-003', 'Marcus Bell', 'marcus.rashford@hostel.com', '+1 (555) 012-8833', 'male', '2002-11-09', 'Mechanical Engineering', 'B.Tech ME', '4th Year', 'Arthur Bell', '+1 (555) 901-8811', '304 King St, Metro City', '2021-08-20', 'active'),
(4, NULL, 'STU-2024-004', 'Emily Watson', 'emily.w@hostel.com', '+1 (555) 013-1122', 'female', '2003-09-17', 'Business Administration', 'BBA', '3rd Year', 'Helen Watson', '+1 (555) 902-5533', '89 Willow Creek Lane, Austin, TX', '2022-08-15', 'active'),
(5, NULL, 'STU-2024-005', 'Tariq Mansoor', 'tariq.m@hostel.com', '+1 (555) 013-3344', 'male', '2004-06-03', 'Civil Engineering', 'B.Tech Civil', '2nd Year', 'Farooq Mansoor', '+1 (555) 903-7722', '512 Desert Palm Way, Phoenix, AZ', '2023-08-12', 'active'),
(6, NULL, 'STU-2024-006', 'Aria Montgomery', 'aria.m@hostel.com', '+1 (555) 013-5566', 'female', '2005-01-25', 'Information Technology', 'B.Tech IT', '1st Year', 'Byron Montgomery', '+1 (555) 904-9911', '140 Rosewood Ave, Rosewood, PA', '2024-08-18', 'active');

-- 4. Rooms
INSERT INTO `rooms` (`id`, `hostel_id`, `room_number`, `floor`, `room_type`, `capacity`, `current_occupancy`, `fee_per_month`, `status`, `amenities`, `description`) VALUES
-- Olympus Hall (Boys)
(1, 1, '101', 1, 'double', 2, 2, 450.00, 'full', 'AC, Wi-Fi, Balcony, Attached Bath, Study Table', 'Spacious ground floor double room facing garden.'),
(2, 1, '102', 1, 'double', 2, 1, 450.00, 'partially_occupied', 'AC, Wi-Fi, Attached Bath, Study Table', 'Quiet corner room with garden views.'),
(3, 1, '103', 1, 'single', 1, 0, 650.00, 'available', 'AC, Wi-Fi, Refrigerator, Attached Bath', 'Executive single occupancy room.'),
(4, 1, '201', 2, 'triple', 3, 0, 350.00, 'available', 'Wi-Fi, Balcony, Common Bath', 'Economical triple room on second floor.'),
(5, 1, '202', 2, 'double', 2, 0, 450.00, 'under_maintenance', 'AC, Wi-Fi, Attached Bath', 'Under routine plumbing maintenance.'),

-- Athena Residence (Girls)
(6, 2, '101', 1, 'double', 2, 2, 480.00, 'full', 'AC, Wi-Fi, Balcony, Attached Bath, Study Lamps', 'First floor double room near study hall.'),
(7, 2, '102', 1, 'single', 1, 1, 680.00, 'full', 'AC, Wi-Fi, Wardrobe, Attached Bath', 'Deluxe single occupancy room.'),
(8, 2, '201', 2, 'double', 2, 0, 480.00, 'available', 'AC, Wi-Fi, Attached Bath', 'Sunny second floor room with mountain views.'),
(9, 2, '202', 2, 'triple', 3, 0, 380.00, 'available', 'Wi-Fi, Balcony, Geyser', 'Spacious triple room with panoramic view.'),

-- Phoenix International House (Co-ed)
(10, 3, '301', 3, 'single', 1, 0, 750.00, 'available', 'Central AC, High-speed LAN, Smart TV, En-suite', 'Premium international scholar suite.'),
(11, 3, '302', 3, 'double', 2, 0, 550.00, 'available', 'Central AC, Wi-Fi, En-suite bath, Mini-fridge', 'Premium double bedroom.');

-- 5. Room Allocations
INSERT INTO `room_allocations` (`id`, `student_id`, `room_id`, `bed_number`, `start_date`, `end_date`, `checkout_date`, `status`, `notes`, `allocated_by`) VALUES
(1, 1, 1, '101-A', '2024-01-10', '2024-12-31', NULL, 'active', 'Allocated for Spring/Fall 2024 academic term.', 1),
(2, 3, 1, '101-B', '2024-01-10', '2024-12-31', NULL, 'active', 'Allocated for Spring/Fall 2024 academic term.', 1),
(3, 5, 2, '102-A', '2024-01-15', '2024-12-31', NULL, 'active', 'Regular allocation.', 2),
(4, 2, 6, '101-A', '2024-01-12', '2024-12-31', NULL, 'active', 'Allocated with roommate Emily Watson.', 3),
(5, 4, 6, '101-B', '2024-01-12', '2024-12-31', NULL, 'active', 'Allocated with roommate Sophia Chen.', 3),
(6, 6, 7, '102-A', '2024-02-01', '2024-12-31', NULL, 'active', 'Single occupancy request approved.', 3);

-- 6. Fee Records
INSERT INTO `fee_records` (`id`, `student_id`, `fee_category`, `academic_period`, `amount_due`, `amount_paid`, `due_date`, `status`, `description`) VALUES
(1, 1, 'hostel_rent', 'Fall 2024', 2700.00, 2700.00, '2024-08-30', 'paid', 'Semester Room Rent (6 Months) - Room 101'),
(2, 1, 'mess_fee', 'Fall 2024', 1200.00, 600.00, '2024-09-15', 'partially_paid', 'Semester Meal Plan Subscription'),
(3, 2, 'hostel_rent', 'Fall 2024', 2880.00, 2880.00, '2024-08-30', 'paid', 'Semester Room Rent (6 Months) - Room 101 Athena'),
(4, 2, 'mess_fee', 'Fall 2024', 1200.00, 1200.00, '2024-09-15', 'paid', 'Semester Meal Plan Subscription'),
(5, 3, 'hostel_rent', 'Fall 2024', 2700.00, 1500.00, '2024-08-30', 'partially_paid', 'Semester Room Rent (6 Months) - Room 101 Olympus'),
(6, 4, 'hostel_rent', 'Fall 2024', 2880.00, 0.00, '2024-09-01', 'overdue', 'Semester Room Rent (6 Months) - Room 101 Athena'),
(7, 5, 'hostel_rent', 'Fall 2024', 2700.00, 2700.00, '2024-08-30', 'paid', 'Semester Room Rent (6 Months) - Room 102 Olympus'),
(8, 6, 'hostel_rent', 'Fall 2024', 4080.00, 2000.00, '2024-09-10', 'partially_paid', 'Deluxe Single Room Rent (6 Months) - Room 102 Athena');

-- 7. Payments
INSERT INTO `payments` (`id`, `fee_record_id`, `student_id`, `receipt_number`, `amount`, `payment_method`, `transaction_reference`, `payment_date`, `recorded_by`, `remarks`) VALUES
(1, 1, 1, 'REC-2024-0801', 2700.00, 'upi', 'UPI/24810294821', '2024-08-25', 1, 'Full tuition & room fee cleared through GPay.'),
(2, 2, 1, 'REC-2024-0902', 600.00, 'bank_transfer', 'WIRE-TXN-99881', '2024-09-10', 1, 'First installment for mess plan.'),
(3, 3, 2, 'REC-2024-0803', 2880.00, 'card', 'AUTH-8491024', '2024-08-28', 1, 'Debit card swipe at hostel finance desk.'),
(4, 4, 2, 'REC-2024-0904', 1200.00, 'upi', 'UPI/77192049102', '2024-09-12', 3, 'Mess fees paid via online portal.'),
(5, 5, 3, 'REC-2024-0805', 1500.00, 'cash', 'CASH-RCPT-0041', '2024-08-29', 2, 'Cash payment at warden office.');

-- 8. Visitors
INSERT INTO `visitors` (`id`, `name`, `phone`, `id_proof_type`, `id_proof_number`, `address`) VALUES
(1, 'David Turner', '+1 (555) 901-3322', 'Drivers License', 'DL-8839102-TX', '742 Evergreen Terrace, Springfield'),
(2, 'Li Chen', '+1 (555) 901-6644', 'Passport', 'P-99281729', '124 Conch Street, Pacific Grove'),
(3, 'Samantha Reed', '+1 (555) 902-8821', 'National ID', 'NID-5561029', '44 Hilltop Avenue, Springfield');

-- 9. Visitor Logs
INSERT INTO `visitor_logs` (`id`, `visitor_id`, `student_id`, `relationship`, `purpose`, `check_in_time`, `check_out_time`, `status`, `recorded_by`, `remarks`) VALUES
(1, 1, 1, 'Father', 'Delivering books and winter clothes', '2024-10-10 14:00:00', '2024-10-10 16:30:00', 'checked_out', 2, 'Checked out safely.'),
(2, 2, 2, 'Mother', 'Family weekend visit', '2024-10-12 11:15:00', '2024-10-12 15:45:00', 'checked_out', 3, 'Stayed in visitors reception lounge.'),
(3, 3, 1, 'Sister', 'Handing over urgent prescription medication', NOW(), NULL, 'checked_in', 2, 'Currently in visitor lounge area.');

-- 10. Maintenance Requests
INSERT INTO `maintenance_requests` (`id`, `ticket_number`, `student_id`, `room_id`, `category`, `title`, `description`, `priority`, `status`, `assigned_to`, `resolution_notes`, `resolved_at`) VALUES
(1, 'TKT-2024-1001', 1, 1, 'electrical', 'Ceiling Fan Making Rattle Noise', 'The ceiling fan speed regulator is jammed and wobbles on high speed setting.', 'medium', 'resolved', 2, 'Tightened ceiling mount bracket and replaced 5-step regulator unit.', '2024-10-05 16:00:00'),
(2, 'TKT-2024-1002', 2, 6, 'plumbing', 'Bathroom Sink Faucet Dripping Constantly', 'Water leaking slowly under the sink counter causing puddles.', 'high', 'in_progress', 3, 'Plumber has been dispatched with replacement washer and pipe seal.', NULL),
(3, 'TKT-2024-1003', 3, 1, 'internet', 'Ethernet Port In Wall Unresponsive', 'LAN connection drops frequently, green LED does not blink.', 'low', 'submitted', NULL, NULL, NULL),
(4, 'TKT-2024-1004', 6, 7, 'furniture', 'Wardrobe Door Hinge Loose', 'Left wardrobe door is loose and will not close completely.', 'medium', 'submitted', NULL, NULL, NULL);

-- 11. Attendance
INSERT INTO `attendance` (`student_id`, `date`, `status`, `remarks`, `recorded_by`) VALUES
(1, CURDATE(), 'present', 'Checked in on time', 2),
(2, CURDATE(), 'present', 'In room study', 3),
(3, CURDATE(), 'present', 'Normal attendance', 2),
(4, CURDATE(), 'absent', 'Medical clinic appointment', 3),
(5, CURDATE(), 'present', 'In library', 2),
(6, CURDATE(), 'present', 'Checked in on time', 3);

-- 12. Audit Logs
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`) VALUES
(1, 'SYSTEM_INITIALIZATION', 'system', 1, 'Database initialized and seeded with baseline configuration', '127.0.0.1'),
(1, 'STUDENT_ALLOCATED', 'room_allocations', 1, 'Allocated Alex Turner to Room 101 Olympus Hall', '127.0.0.1'),
(1, 'FEE_PAYMENT_RECORDED', 'payments', 1, 'Recorded payment of $2,700 for Alex Turner', '127.0.0.1');
