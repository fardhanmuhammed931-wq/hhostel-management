package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.FeeRecord;
import com.hostel.management.entity.Student;
import com.hostel.management.repository.FeeRecordRepository;
import com.hostel.management.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFees(
            @RequestParam(required = false) Long student_id,
            @RequestParam(required = false) String status) {

        List<FeeRecord> fees = (student_id != null)
                ? feeRecordRepository.findByStudentId(student_id)
                : ((status != null && !status.trim().isEmpty())
                    ? feeRecordRepository.findByStatus(status.trim())
                    : feeRecordRepository.findAll());

        Map<Long, Student> studentMap = new HashMap<>();
        studentRepository.findAll().forEach(s -> studentMap.put(s.getId(), s));

        List<Map<String, Object>> result = new ArrayList<>();
        for (FeeRecord f : fees) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("student_id", f.getStudentId());
            map.put("fee_category", f.getFeeCategory());
            map.put("academic_period", f.getAcademicPeriod());
            map.put("amount_due", f.getAmountDue());
            map.put("amount_paid", f.getAmountPaid());
            BigDecimal balance = (f.getAmountDue() != null ? f.getAmountDue() : BigDecimal.ZERO)
                    .subtract(f.getAmountPaid() != null ? f.getAmountPaid() : BigDecimal.ZERO);
            map.put("balance", balance);
            map.put("due_date", f.getDueDate());
            map.put("status", f.getStatus());
            map.put("description", f.getDescription());
            map.put("created_at", f.getCreatedAt());

            Student s = studentMap.get(f.getStudentId());
            if (s != null) {
                map.put("student_name", s.getFullName());
                map.put("student_code", s.getStudentId());
                map.put("student_email", s.getEmail());
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeeStats() {
        List<FeeRecord> all = feeRecordRepository.findAll();
        BigDecimal totalDue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        int overdueCount = 0;
        LocalDate today = LocalDate.now();

        for (FeeRecord f : all) {
            totalDue = totalDue.add(f.getAmountDue() != null ? f.getAmountDue() : BigDecimal.ZERO);
            totalPaid = totalPaid.add(f.getAmountPaid() != null ? f.getAmountPaid() : BigDecimal.ZERO);
            if (!"paid".equalsIgnoreCase(f.getStatus()) && f.getDueDate() != null && f.getDueDate().isBefore(today)) {
                overdueCount++;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDue", totalDue);
        stats.put("totalPaid", totalPaid);
        stats.put("totalPending", totalDue.subtract(totalPaid));
        stats.put("overdueCount", overdueCount);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeeRecord>> createFeeRecord(@RequestBody FeeRecord fee) {
        if (fee.getStudentId() == null || fee.getAmountDue() == null || fee.getDueDate() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Student ID, amount due, and due date are required."));
        }
        if (fee.getAmountPaid() == null) {
            fee.setAmountPaid(BigDecimal.ZERO);
        }
        fee.setStatus("pending");
        FeeRecord saved = feeRecordRepository.save(fee);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Fee invoice created successfully.", saved));
    }
}
