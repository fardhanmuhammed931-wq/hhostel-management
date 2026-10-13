package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/allocations")
public class AllocationController {

    @Autowired
    private RoomAllocationRepository allocationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllocations(
            @RequestParam(required = false) String status) {

        List<RoomAllocation> allocations = (status != null && !status.trim().isEmpty())
                ? allocationRepository.findByStatus(status.trim())
                : allocationRepository.findAll();

        Map<Long, Student> studentMap = new HashMap<>();
        studentRepository.findAll().forEach(s -> studentMap.put(s.getId(), s));

        Map<Long, Room> roomMap = new HashMap<>();
        roomRepository.findAll().forEach(r -> roomMap.put(r.getId(), r));

        Map<Long, Hostel> hostelMap = new HashMap<>();
        hostelRepository.findAll().forEach(h -> hostelMap.put(h.getId(), h));

        List<Map<String, Object>> result = new ArrayList<>();
        for (RoomAllocation a : allocations) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("student_id", a.getStudentId());
            map.put("room_id", a.getRoomId());
            map.put("bed_number", a.getBedNumber());
            map.put("start_date", a.getStartDate());
            map.put("end_date", a.getEndDate());
            map.put("checkout_date", a.getCheckoutDate());
            map.put("status", a.getStatus());
            map.put("notes", a.getNotes());
            map.put("created_at", a.getCreatedAt());

            Student s = studentMap.get(a.getStudentId());
            if (s != null) {
                map.put("student_name", s.getFullName());
                map.put("student_code", s.getStudentId());
                map.put("student_email", s.getEmail());
                map.put("student_phone", s.getPhone());
            }

            Room r = roomMap.get(a.getRoomId());
            if (r != null) {
                map.put("room_number", r.getRoomNumber());
                map.put("floor", r.getFloor());
                map.put("room_type", r.getRoomType());

                Hostel h = hostelMap.get(r.getHostelId());
                if (h != null) {
                    map.put("hostel_id", h.getId());
                    map.put("hostel_name", h.getName());
                }
            }

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<RoomAllocation>> allocateRoom(@RequestBody RoomAllocation allocation) {
        if (allocation.getStudentId() == null || allocation.getRoomId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Student ID and Room ID are required."));
        }

        // Prevent duplicate active allocation
        Optional<RoomAllocation> activeAlloc = allocationRepository.findByStudentIdAndStatus(allocation.getStudentId(), "active");
        if (activeAlloc.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Student already has an active room allocation. Checkout or transfer first."));
        }

        Optional<Room> roomOpt = roomRepository.findById(allocation.getRoomId());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Room not found."));
        }

        Room room = roomOpt.get();
        if (room.getCurrentOccupancy() >= room.getCapacity()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Room is already at full capacity."));
        }

        if (allocation.getStartDate() == null) {
            allocation.setStartDate(LocalDate.now());
        }
        allocation.setStatus("active");

        RoomAllocation saved = allocationRepository.save(allocation);

        // Update room occupancy
        room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
        if (room.getCurrentOccupancy() >= room.getCapacity()) {
            room.setStatus("full");
        } else {
            room.setStatus("partially_occupied");
        }
        roomRepository.save(room);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Room allocated successfully.", saved));
    }

    @PutMapping("/{id}/checkout")
    @Transactional
    public ResponseEntity<ApiResponse<String>> checkoutAllocation(@PathVariable Long id) {
        Optional<RoomAllocation> allocOpt = allocationRepository.findById(id);
        if (allocOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Allocation not found."));
        }

        RoomAllocation alloc = allocOpt.get();
        if (!"active".equalsIgnoreCase(alloc.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Allocation is not active."));
        }

        alloc.setStatus("checked_out");
        alloc.setCheckoutDate(LocalDate.now());
        allocationRepository.save(alloc);

        // Release bed in room
        roomRepository.findById(alloc.getRoomId()).ifPresent(room -> {
            room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
            if (room.getCurrentOccupancy() == 0) {
                room.setStatus("available");
            } else {
                room.setStatus("partially_occupied");
            }
            roomRepository.save(room);
        });

        return ResponseEntity.ok(ApiResponse.ok("Checkout completed and bed released.", null));
    }
}
