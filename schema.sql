-- ========================================================
-- Hostel Management System - Database Schema
-- Database: hostel_management
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================

CREATE DATABASE IF NOT EXISTS `hostel_management`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hostel_management`;

-- 1. Users Table (Authentication and Role-Based Access Control)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` ENUM('admin', 'warden', 'student') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(30) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Hostels Table (Hostel buildings and properties)
CREATE TABLE IF NOT EXISTS `hostels` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `type` ENUM('boys', 'girls', 'co-ed') NOT NULL DEFAULT 'co-ed',
  `total_floors` INT UNSIGNED NOT NULL DEFAULT 1,
  `warden_id` INT UNSIGNED NULL,
  `contact_number` VARCHAR(30) NULL,
  `address` TEXT NULL,
  `description` TEXT NULL,
  `status` ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hostels_warden` FOREIGN KEY (`warden_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_hostels_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Students Table (Student details and academic information)
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL UNIQUE,
  `student_id` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `gender` ENUM('male', 'female', 'other') NOT NULL,
  `date_of_birth` DATE NULL,
  `department` VARCHAR(100) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `guardian_name` VARCHAR(150) NOT NULL,
  `guardian_phone` VARCHAR(30) NOT NULL,
  `address` TEXT NOT NULL,
  `admission_date` DATE NOT NULL,
  `status` ENUM('active', 'inactive', 'graduated', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_students_student_id` (`student_id`),
  INDEX `idx_students_department` (`department`),
  INDEX `idx_students_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Rooms Table (Room inventory, capacities, and pricing)
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `hostel_id` INT UNSIGNED NOT NULL,
  `room_number` VARCHAR(30) NOT NULL,
  `floor` INT NOT NULL DEFAULT 1,
  `room_type` ENUM('single', 'double', 'triple', 'quad', 'dormitory') NOT NULL DEFAULT 'double',
  `capacity` INT UNSIGNED NOT NULL DEFAULT 2,
  `current_occupancy` INT UNSIGNED NOT NULL DEFAULT 0,
  `fee_per_month` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('available', 'partially_occupied', 'full', 'under_maintenance') NOT NULL DEFAULT 'available',
  `amenities` TEXT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rooms_hostel` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_hostel_room` (`hostel_id`, `room_number`),
  INDEX `idx_rooms_status` (`status`),
  INDEX `idx_rooms_type` (`room_type`),
  INDEX `idx_rooms_hostel_floor` (`hostel_id`, `floor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Room Allocations Table (Bed assignments and historical records)
CREATE TABLE IF NOT EXISTS `room_allocations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `room_id` INT UNSIGNED NOT NULL,
  `bed_number` VARCHAR(20) NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `checkout_date` DATE NULL,
  `status` ENUM('active', 'transferred', 'checked_out', 'cancelled') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `allocated_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_allocations_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_allocations_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_allocations_user` FOREIGN KEY (`allocated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_allocations_status` (`status`),
  INDEX `idx_allocations_student_active` (`student_id`, `status`),
  INDEX `idx_allocations_room_active` (`room_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Fee Records Table (Obligations, semester fees, utilities)
CREATE TABLE IF NOT EXISTS `fee_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `fee_category` ENUM('hostel_rent', 'mess_fee', 'maintenance', 'caution_deposit', 'utilities', 'other') NOT NULL DEFAULT 'hostel_rent',
  `academic_period` VARCHAR(50) NOT NULL,
  `amount_due` DECIMAL(10, 2) NOT NULL,
  `amount_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `balance` DECIMAL(10, 2) GENERATED ALWAYS AS (`amount_due` - `amount_paid`) STORED,
  `due_date` DATE NOT NULL,
  `status` ENUM('pending', 'partially_paid', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fees_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  INDEX `idx_fees_student` (`student_id`),
  INDEX `idx_fees_status` (`status`),
  INDEX `idx_fees_period` (`academic_period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Payments Table (Financial transactions, receipts)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `fee_record_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'online') NOT NULL DEFAULT 'upi',
  `transaction_reference` VARCHAR(100) NULL,
  `payment_date` DATE NOT NULL,
  `recorded_by` INT UNSIGNED NULL,
  `remarks` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_fee` FOREIGN KEY (`fee_record_id`) REFERENCES `fee_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_payments_receipt` (`receipt_number`),
  INDEX `idx_payments_student` (`student_id`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Visitors Table (Registered visitors directory)
CREATE TABLE IF NOT EXISTS `visitors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `id_proof_type` VARCHAR(50) NULL,
  `id_proof_number` VARCHAR(50) NULL,
  `address` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Visitor Logs Table (Entry/exit tracking for hostel security)
CREATE TABLE IF NOT EXISTS `visitor_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `visitor_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `relationship` VARCHAR(50) NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `check_in_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check_out_time` DATETIME NULL,
  `status` ENUM('checked_in', 'checked_out') NOT NULL DEFAULT 'checked_in',
  `recorded_by` INT UNSIGNED NULL,
  `remarks` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_visitor_logs_visitor` FOREIGN KEY (`visitor_id`) REFERENCES `visitors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_visitor_logs_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_visitor_logs_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_visitor_logs_status` (`status`),
  INDEX `idx_visitor_logs_check_in` (`check_in_time`),
  INDEX `idx_visitor_logs_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Maintenance Requests Table (Complaints & maintenance tracking)
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT UNSIGNED NOT NULL,
  `room_id` INT UNSIGNED NOT NULL,
  `category` ENUM('electrical', 'plumbing', 'cleaning', 'furniture', 'internet', 'room_facilities', 'other') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium',
  `status` ENUM('submitted', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'submitted',
  `assigned_to` INT UNSIGNED NULL,
  `resolution_notes` TEXT NULL,
  `resolved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maintenance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_maintenance_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_maintenance_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_maintenance_status` (`status`),
  INDEX `idx_maintenance_priority` (`priority`),
  INDEX `idx_maintenance_category` (`category`),
  INDEX `idx_maintenance_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Attendance Table (Daily hostel roll call)
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('present', 'absent', 'on_leave') NOT NULL DEFAULT 'present',
  `remarks` VARCHAR(255) NULL,
  `recorded_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_student_attendance_date` (`student_id`, `date`),
  INDEX `idx_attendance_date` (`date`),
  INDEX `idx_attendance_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Audit Logs Table (Administrative accountability and tracking)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
