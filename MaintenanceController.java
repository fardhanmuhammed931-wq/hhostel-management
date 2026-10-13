package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceRequestRepository maintenanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMaintenanceRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        List<MaintenanceRequest> requests = (status != null && !status.trim().isEmpty())
                ? maintenanceRepository.findByStatus(status.trim())
                : maintenanceRepository.findAll();

        Map<Long, Student> studentMap = new HashMap<>();
        studentRepository.findAll().forEach(s -> studentMap.put(s.getId(), s));

        Map<Long, Room> roomMap = new HashMap<>();
        roomRepository.findAll().forEach(r -> roomMap.put(r.getId(), r));

        Map<Long, Hostel> hostelMap = new HashMap<>();
        hostelRepository.findAll().forEach(h -> hostelMap.put(h.getId(), h));

        List<Map<String, Object>> result = new ArrayList<>();
        for (MaintenanceRequest r : requests) {
            if (category != null && !category.trim().isEmpty() && !r.getCategory().equalsIgnoreCase(category.trim())) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("ticket_number", r.getTicketNumber());
            map.put("student_id", r.getStudentId());
            map.put("room_id", r.getRoomId());
            map.put("category", r.getCategory());
            map.put("title", r.getTitle());
            map.put("description", r.getDescription());
            map.put("priority", r.getPriority());
            map.put("status", r.getStatus());
            map.put("resolution_notes", r.getResolutionNotes());
            map.put("resolved_at", r.getResolvedAt());
            map.put("created_at", r.getCreatedAt());

            Student s = studentMap.get(r.getStudentId());
            if (s != null) {
                map.put("student_name", s.getFullName());
                map.put("student_code", s.getStudentId());
            }

            Room rm = roomMap.get(r.getRoomId());
            if (rm != null) {
                map.put("room_number", rm.getRoomNumber());
                Hostel h = hostelMap.get(rm.getHostelId());
                if (h != null) {
                    map.put("hostel_name", h.getName());
                }
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceRequest>> submitRequest(@RequestBody MaintenanceRequest req) {
        if (req.getStudentId() == null || req.getRoomId() == null || req.getTitle() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Student ID, Room ID, and complaint title are required."));
        }

        req.setTicketNumber("TKT-" + LocalDateTime.now().getYear() + "-" + (System.currentTimeMillis() % 10000));
        req.setStatus("submitted");
        MaintenanceRequest saved = maintenanceRepository.save(req);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Maintenance request submitted successfully.", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceRequest>> updateRequest(@PathVariable Long id, @RequestBody MaintenanceRequest update) {
        Optional<MaintenanceRequest> opt = maintenanceRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Ticket not found."));
        }

        MaintenanceRequest r = opt.get();
        if (update.getStatus() != null) {
            r.setStatus(update.getStatus());
            if ("resolved".equalsIgnoreCase(update.getStatus())) {
                r.setResolvedAt(LocalDateTime.now());
            }
        }
        if (update.getResolutionNotes() != null) r.setResolutionNotes(update.getResolutionNotes());
        if (update.getPriority() != null) r.setPriority(update.getPriority());

        return ResponseEntity.ok(ApiResponse.ok("Ticket updated successfully.", maintenanceRepository.save(r)));
    }
}
