package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.FeeRecord;
import com.hostel.management.entity.Payment;
import com.hostel.management.entity.Student;
import com.hostel.management.repository.FeeRecordRepository;
import com.hostel.management.repository.PaymentRepository;
import com.hostel.management.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPayments(
            @RequestParam(required = false) Long student_id) {

        List<Payment> payments = (student_id != null)
                ? paymentRepository.findByStudentId(student_id)
                : paymentRepository.findAll();

        Map<Long, Student> studentMap = new HashMap<>();
        studentRepository.findAll().forEach(s -> studentMap.put(s.getId(), s));

        Map<Long, FeeRecord> feeMap = new HashMap<>();
        feeRecordRepository.findAll().forEach(f -> feeMap.put(f.getId(), f));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Payment p : payments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("fee_record_id", p.getFeeRecordId());
            map.put("student_id", p.getStudentId());
            map.put("receipt_number", p.getReceiptNumber());
            map.put("amount", p.getAmount());
            map.put("payment_method", p.getPaymentMethod());
            map.put("transaction_reference", p.getTransactionReference());
            map.put("payment_date", p.getPaymentDate());
            map.put("remarks", p.getRemarks());
            map.put("created_at", p.getCreatedAt());

            Student s = studentMap.get(p.getStudentId());
            if (s != null) {
                map.put("student_name", s.getFullName());
                map.put("student_code", s.getStudentId());
            }

            FeeRecord f = feeMap.get(p.getFeeRecordId());
            if (f != null) {
                map.put("fee_category", f.getFeeCategory());
                map.put("academic_period", f.getAcademicPeriod());
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> recordPayment(@RequestBody Payment payment) {
        if (payment.getFeeRecordId() == null || payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Valid fee record ID and payment amount are required."));
        }

        Optional<FeeRecord> feeOpt = feeRecordRepository.findById(payment.getFeeRecordId());
        if (feeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Fee record not found."));
        }

        FeeRecord fee = feeOpt.get();
        payment.setStudentId(fee.getStudentId());

        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(LocalDate.now());
        }

        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().trim().isEmpty()) {
            String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            payment.setReceiptNumber("REC-" + datePrefix + "-" + (System.currentTimeMillis() % 10000));
        }

        Payment savedPayment = paymentRepository.save(payment);

        // Update fee record balance & status
        BigDecimal newPaid = (fee.getAmountPaid() != null ? fee.getAmountPaid() : BigDecimal.ZERO).add(payment.getAmount());
        fee.setAmountPaid(newPaid);
        if (newPaid.compareTo(fee.getAmountDue()) >= 0) {
            fee.setStatus("paid");
        } else {
            fee.setStatus("partially_paid");
        }
        feeRecordRepository.save(fee);

        Map<String, Object> resp = new HashMap<>();
        resp.put("payment", savedPayment);
        resp.put("receiptNumber", savedPayment.getReceiptNumber());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Payment recorded successfully.", resp));
    }
}
