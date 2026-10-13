package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomAllocationRepository allocationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAttendance(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Long hostel_id) {

        LocalDate targetDate = (date != null && !date.trim().isEmpty())
                ? LocalDate.parse(date.trim())
                : LocalDate.now();

        List<Student> students = studentRepository.findAll();
        Map<Long, Attendance> attendanceMap = new HashMap<>();
        attendanceRepository.findByDate(targetDate).forEach(a -> attendanceMap.put(a.getStudentId(), a));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : students) {
            if (!"active".equalsIgnoreCase(s.getStatus())) continue;

            Map<String, Object> map = new HashMap<>();
            map.put("student_id", s.getId());
            map.put("student_code", s.getStudentId());
            map.put("student_name", s.getFullName());
            map.put("department", s.getDepartment());
            map.put("attendance_date", targetDate);

            // Active room
            allocationRepository.findByStudentIdAndStatus(s.getId(), "active").ifPresent(alloc -> {
                roomRepository.findById(alloc.getRoomId()).ifPresent(r -> {
                    map.put("room_number", r.getRoomNumber());
                    hostelRepository.findById(r.getHostelId()).ifPresent(h -> {
                        map.put("hostel_id", h.getId());
                        map.put("hostel_name", h.getName());
                    });
                });
            });

            if (hostel_id != null && !hostel_id.equals(map.get("hostel_id"))) {
                continue;
            }

            Attendance att = attendanceMap.get(s.getId());
            if (att != null) {
                map.put("attendance_status", att.getStatus());
                map.put("attendance_id", att.getId());
                map.put("remarks", att.getRemarks());
            } else {
                map.put("attendance_status", "not_marked");
                map.put("attendance_id", null);
                map.put("remarks", null);
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Attendance>> markAttendance(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        LocalDate date = LocalDate.parse(body.get("date").toString());
        String status = (String) body.get("status");
        String remarks = (String) body.get("remarks");

        Attendance att = attendanceRepository.findByStudentIdAndDate(studentId, date)
                .orElseGet(() -> {
                    Attendance a = new Attendance();
                    a.setStudentId(studentId);
                    a.setDate(date);
                    return a;
                });

        att.setStatus(status);
        att.setRemarks(remarks);
        Attendance saved = attendanceRepository.save(att);

        return ResponseEntity.ok(ApiResponse.ok("Attendance recorded successfully.", saved));
    }
}
