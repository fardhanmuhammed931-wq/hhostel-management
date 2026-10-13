package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private MaintenanceRequestRepository maintenanceRepository;

    @Autowired
    private VisitorLogRepository visitorLogRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        long totalStudents = studentRepository.count();
        List<Room> allRooms = roomRepository.findAll();

        int totalRooms = allRooms.size();
        int occupiedRooms = 0;
        int availableRooms = 0;
        int totalCapacity = 0;
        int totalOccupancy = 0;

        for (Room r : allRooms) {
            totalCapacity += r.getCapacity();
            totalOccupancy += r.getCurrentOccupancy();
            if (r.getCurrentOccupancy() > 0) {
                occupiedRooms++;
            }
            if ("available".equalsIgnoreCase(r.getStatus()) || r.getCurrentOccupancy() < r.getCapacity()) {
                availableRooms++;
            }
        }

        double occupancyPercentage = totalCapacity > 0 ? ((double) totalOccupancy / totalCapacity) * 100 : 0.0;
        BigDecimal roundedOccupancy = BigDecimal.valueOf(occupancyPercentage).setScale(1, RoundingMode.HALF_UP);

        BigDecimal totalPendingFees = BigDecimal.ZERO;
        for (FeeRecord f : feeRecordRepository.findAll()) {
            if (!"paid".equalsIgnoreCase(f.getStatus())) {
                BigDecimal due = f.getAmountDue() != null ? f.getAmountDue() : BigDecimal.ZERO;
                BigDecimal paid = f.getAmountPaid() != null ? f.getAmountPaid() : BigDecimal.ZERO;
                totalPendingFees = totalPendingFees.add(due.subtract(paid));
            }
        }

        long pendingMaintenance = maintenanceRepository.findAll().stream()
                .filter(m -> !"resolved".equalsIgnoreCase(m.getStatus()) && !"closed".equalsIgnoreCase(m.getStatus()))
                .count();

        LocalDate today = LocalDate.now();
        long todayVisitors = visitorLogRepository.findAll().stream()
                .filter(v -> v.getCheckInTime() != null && v.getCheckInTime().toLocalDate().isEqual(today))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalRooms", totalRooms);
        stats.put("occupiedRooms", occupiedRooms);
        stats.put("availableRooms", availableRooms);
        stats.put("totalCapacity", totalCapacity);
        stats.put("totalOccupancy", totalOccupancy);
        stats.put("occupancyPercentage", roundedOccupancy.doubleValue());
        stats.put("totalPendingFees", totalPendingFees);
        stats.put("pendingMaintenance", pendingMaintenance);
        stats.put("todayVisitors", todayVisitors);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardCharts() {
        // 1. Monthly fee collection
        List<Payment> payments = paymentRepository.findAll();
        Map<String, BigDecimal> monthlyTotals = new TreeMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        DateTimeFormatter sortFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Payment p : payments) {
            if (p.getPaymentDate() != null) {
                String key = p.getPaymentDate().format(sortFormatter);
                monthlyTotals.put(key, monthlyTotals.getOrDefault(key, BigDecimal.ZERO).add(p.getAmount()));
            }
        }

        List<Map<String, Object>> monthlyFees = new ArrayList<>();
        monthlyTotals.forEach((sortKey, amount) -> {
            Map<String, Object> item = new HashMap<>();
            LocalDate d = LocalDate.parse(sortKey + "-01");
            item.put("month", d.format(monthFormatter));
            item.put("sortKey", sortKey);
            item.put("collected", amount);
            monthlyFees.add(item);
        });

        // 2. Hostel occupancy
        List<Hostel> hostels = hostelRepository.findAll();
        List<Room> rooms = roomRepository.findAll();
        List<Map<String, Object>> hostelOccupancy = new ArrayList<>();

        for (Hostel h : hostels) {
            int cap = 0;
            int occ = 0;
            for (Room r : rooms) {
                if (r.getHostelId().equals(h.getId())) {
                    cap += r.getCapacity();
                    occ += r.getCurrentOccupancy();
                }
            }
            Map<String, Object> item = new HashMap<>();
            item.put("hostelName", h.getName());
            item.put("hostelCode", h.getCode());
            item.put("capacity", cap);
            item.put("occupied", occ);
            hostelOccupancy.add(item);
        }

        // 3. Maintenance by Category & Status
        List<MaintenanceRequest> requests = maintenanceRepository.findAll();
        Map<String, Long> categoryCount = new HashMap<>();
        Map<String, Long> statusCount = new HashMap<>();

        for (MaintenanceRequest r : requests) {
            categoryCount.put(r.getCategory(), categoryCount.getOrDefault(r.getCategory(), 0L) + 1);
            statusCount.put(r.getStatus(), statusCount.getOrDefault(r.getStatus(), 0L) + 1);
        }

        List<Map<String, Object>> maintenanceByCategory = new ArrayList<>();
        categoryCount.forEach((cat, cnt) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("category", cat);
            m.put("count", cnt);
            maintenanceByCategory.add(m);
        });

        List<Map<String, Object>> maintenanceByStatus = new ArrayList<>();
        statusCount.forEach((st, cnt) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("status", st);
            m.put("count", cnt);
            maintenanceByStatus.add(m);
        });

        Map<String, Object> charts = new HashMap<>();
        charts.put("monthlyFees", monthlyFees);
        charts.put("hostelOccupancy", hostelOccupancy);
        charts.put("maintenanceByCategory", maintenanceByCategory);
        charts.put("maintenanceByStatus", maintenanceByStatus);

        return ResponseEntity.ok(ApiResponse.ok(charts));
    }
}
