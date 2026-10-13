package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.Visitor;
import com.hostel.management.entity.VisitorLog;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.repository.VisitorLogRepository;
import com.hostel.management.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private VisitorLogRepository visitorLogRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVisitorLogs(
            @RequestParam(required = false) String status) {

        List<VisitorLog> logs = (status != null && !status.trim().isEmpty())
                ? visitorLogRepository.findByStatus(status.trim())
                : visitorLogRepository.findAll();

        Map<Long, Visitor> visitorMap = new HashMap<>();
        visitorRepository.findAll().forEach(v -> visitorMap.put(v.getId(), v));

        Map<Long, Student> studentMap = new HashMap<>();
        studentRepository.findAll().forEach(s -> studentMap.put(s.getId(), s));

        List<Map<String, Object>> result = new ArrayList<>();
        for (VisitorLog l : logs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", l.getId());
            map.put("visitor_id", l.getVisitorId());
            map.put("student_id", l.getStudentId());
            map.put("relationship", l.getRelationship());
            map.put("purpose", l.getPurpose());
            map.put("check_in_time", l.getCheckInTime());
            map.put("check_out_time", l.getCheckOutTime());
            map.put("status", l.getStatus());
            map.put("remarks", l.getRemarks());

            Visitor v = visitorMap.get(l.getVisitorId());
            if (v != null) {
                map.put("name", v.getName());
                map.put("phone", v.getPhone());
                map.put("id_proof_type", v.getIdProofType());
                map.put("id_proof_number", v.getIdProofNumber());
            }

            Student s = studentMap.get(l.getStudentId());
            if (s != null) {
                map.put("student_name", s.getFullName());
                map.put("student_code", s.getStudentId());
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<VisitorLog>> checkInVisitor(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String phone = (String) payload.get("phone");
        Long studentId = payload.get("student_id") != null ? Long.valueOf(payload.get("student_id").toString()) : null;
        String relationship = (String) payload.get("relationship");
        String purpose = (String) payload.get("purpose");

        if (name == null || phone == null || studentId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Visitor name, phone, and student are required."));
        }

        // Find or create visitor
        Visitor visitor = visitorRepository.findByPhone(phone).orElseGet(() -> {
            Visitor v = new Visitor();
            v.setName(name);
            v.setPhone(phone);
            v.setIdProofType((String) payload.get("id_proof_type"));
            v.setIdProofNumber((String) payload.get("id_proof_number"));
            v.setAddress((String) payload.get("address"));
            return visitorRepository.save(v);
        });

        VisitorLog log = new VisitorLog();
        log.setVisitorId(visitor.getId());
        log.setStudentId(studentId);
        log.setRelationship(relationship != null ? relationship : "Guardian");
        log.setPurpose(purpose != null ? purpose : "Visit");
        log.setCheckInTime(LocalDateTime.now());
        log.setStatus("checked_in");
        log.setRemarks((String) payload.get("remarks"));

        VisitorLog saved = visitorLogRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Visitor checked in successfully.", saved));
    }

    @PutMapping("/{id}/checkout")
    public ResponseEntity<ApiResponse<String>> checkoutVisitor(@PathVariable Long id) {
        Optional<VisitorLog> opt = visitorLogRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Visitor log not found."));
        }

        VisitorLog log = opt.get();
        log.setStatus("checked_out");
        log.setCheckOutTime(LocalDateTime.now());
        visitorLogRepository.save(log);

        return ResponseEntity.ok(ApiResponse.ok("Visitor checked out successfully.", null));
    }
}
