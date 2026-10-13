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
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOccupancyReport() {
        List<Hostel> hostels = hostelRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();

        List<Map<String, Object>> hostelStats = new ArrayList<>();
        for (Hostel h : hostels) {
            int totalRooms = 0;
            int totalCap = 0;
            int currentOcc = 0;

            for (Room r : allRooms) {
                if (r.getHostelId().equals(h.getId())) {
                    totalRooms++;
                    totalCap += r.getCapacity();
                    currentOcc += r.getCurrentOccupancy();
                }
            }

            double rate = totalCap > 0 ? ((double) currentOcc / totalCap) * 100 : 0.0;
            BigDecimal roundedRate = BigDecimal.valueOf(rate).setScale(1, RoundingMode.HALF_UP);

            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            map.put("code", h.getCode());
            map.put("type", h.getType());
            map.put("total_rooms", totalRooms);
            map.put("total_capacity", totalCap);
            map.put("current_occupancy", currentOcc);
            map.put("available_beds", Math.max(0, totalCap - currentOcc));
            map.put("occupancy_rate", roundedRate.doubleValue());

            hostelStats.add(map);
        }

        Map<Long, Hostel> hostelMap = new HashMap<>();
        hostels.forEach(h -> hostelMap.put(h.getId(), h));

        List<Map<String, Object>> roomsList = new ArrayList<>();
        for (Room r : allRooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("room_number", r.getRoomNumber());
            Hostel h = hostelMap.get(r.getHostelId());
            map.put("hostel_name", h != null ? h.getName() : "Unknown");
            map.put("floor", r.getFloor());
            map.put("room_type", r.getRoomType());
            map.put("capacity", r.getCapacity());
            map.put("current_occupancy", r.getCurrentOccupancy());
            map.put("available_beds", Math.max(0, r.getCapacity() - r.getCurrentOccupancy()));
            map.put("status", r.getStatus());
            map.put("fee_per_month", r.getFeePerMonth());
            roomsList.add(map);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("hostelStats", hostelStats);
        data.put("roomsList", roomsList);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/fees")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeeReport() {
        List<FeeRecord> fees = feeRecordRepository.findAll();
        Map<String, BigDecimal[]> catTotals = new HashMap<>(); // [totalDue, totalPaid]

        for (FeeRecord f : fees) {
            String cat = f.getFeeCategory() != null ? f.getFeeCategory() : "other";
            BigDecimal due = f.getAmountDue() != null ? f.getAmountDue() : BigDecimal.ZERO;
            BigDecimal paid = f.getAmountPaid() != null ? f.getAmountPaid() : BigDecimal.ZERO;

            BigDecimal[] current = catTotals.getOrDefault(cat, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            current[0] = current[0].add(due);
            current[1] = current[1].add(paid);
            catTotals.put(cat, current);
        }

        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        catTotals.forEach((cat, amounts) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("fee_category", cat);
            item.put("total_due", amounts[0]);
            item.put("total_paid", amounts[1]);
            item.put("outstanding", amounts[0].subtract(amounts[1]));
            categoryBreakdown.add(item);
        });

        Map<String, Object> data = new HashMap<>();
        data.put("categoryBreakdown", categoryBreakdown);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
