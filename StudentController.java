package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomAllocationRepository allocationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {

        List<Student> students = studentRepository.searchStudents(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                (department != null && !department.trim().isEmpty()) ? department.trim() : null,
                (status != null && !status.trim().isEmpty()) ? status.trim() : null
        );

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : students) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("user_id", s.getUserId());
            map.put("student_id", s.getStudentId());
            map.put("full_name", s.getFullName());
            map.put("email", s.getEmail());
            map.put("phone", s.getPhone());
            map.put("gender", s.getGender());
            map.put("date_of_birth", s.getDateOfBirth());
            map.put("department", s.getDepartment());
            map.put("course", s.getCourse());
            map.put("academic_year", s.getAcademicYear());
            map.put("guardian_name", s.getGuardianName());
            map.put("guardian_phone", s.getGuardianPhone());
            map.put("address", s.getAddress());
            map.put("admission_date", s.getAdmissionDate());
            map.put("status", s.getStatus());
            map.put("created_at", s.getCreatedAt());

            // Attach active room details
            allocationRepository.findByStudentIdAndStatus(s.getId(), "active").ifPresent(alloc -> {
                map.put("room_id", alloc.getRoomId());
                map.put("bed_number", alloc.getBedNumber());
                roomRepository.findById(alloc.getRoomId()).ifPresent(r -> {
                    map.put("room_number", r.getRoomNumber());
                    map.put("floor", r.getFloor());
                    hostelRepository.findById(r.getHostelId()).ifPresent(h -> {
                        map.put("hostel_id", h.getId());
                        map.put("hostel_name", h.getName());
                    });
                });
            });

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentById(@PathVariable Long id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Student not found."));
        }

        Student s = studentOpt.get();
        Map<String, Object> data = new HashMap<>();
        data.put("student", s);

        // Allocations history
        List<RoomAllocation> allocations = allocationRepository.findByStudentId(s.getId());
        data.put("allocations", allocations);

        // Fee history
        List<FeeRecord> fees = feeRecordRepository.findByStudentId(s.getId());
        data.put("fees", fees);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Student>> createStudent(@RequestBody Student student) {
        if (student.getStudentId() == null || student.getStudentId().trim().isEmpty()) {
            student.setStudentId("STU-" + System.currentTimeMillis() % 1000000);
        }

        if (studentRepository.existsByStudentId(student.getStudentId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Student ID already exists."));
        }

        if (studentRepository.existsByEmail(student.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Email already in use."));
        }

        Student saved = studentRepository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Student created successfully.", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Student>> updateStudent(@PathVariable Long id, @RequestBody Student update) {
        Optional<Student> opt = studentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Student not found."));
        }

        Student s = opt.get();
        if (update.getFullName() != null) s.setFullName(update.getFullName());
        if (update.getPhone() != null) s.setPhone(update.getPhone());
        if (update.getDepartment() != null) s.setDepartment(update.getDepartment());
        if (update.getCourse() != null) s.setCourse(update.getCourse());
        if (update.getAcademicYear() != null) s.setAcademicYear(update.getAcademicYear());
        if (update.getGuardianName() != null) s.setGuardianName(update.getGuardianName());
        if (update.getGuardianPhone() != null) s.setGuardianPhone(update.getGuardianPhone());
        if (update.getAddress() != null) s.setAddress(update.getAddress());
        if (update.getStatus() != null) s.setStatus(update.getStatus());

        Student saved = studentRepository.save(s);
        return ResponseEntity.ok(ApiResponse.ok("Student updated successfully.", saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteStudent(@PathVariable Long id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Student not found."));
        }
        studentRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Student deleted successfully.", null));
    }
}
