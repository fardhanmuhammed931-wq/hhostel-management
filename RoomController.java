package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.Hostel;
import com.hostel.management.entity.Room;
import com.hostel.management.entity.RoomAllocation;
import com.hostel.management.entity.Student;
import com.hostel.management.repository.HostelRepository;
import com.hostel.management.repository.RoomAllocationRepository;
import com.hostel.management.repository.RoomRepository;
import com.hostel.management.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomAllocationRepository allocationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRooms(
            @RequestParam(required = false) Long hostel_id,
            @RequestParam(required = false) String status) {

        List<Room> rooms = (hostel_id != null) ? roomRepository.findByHostelId(hostel_id) : roomRepository.findAll();
        Map<Long, Hostel> hostelMap = new HashMap<>();
        hostelRepository.findAll().forEach(h -> hostelMap.put(h.getId(), h));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Room r : rooms) {
            if (status != null && !status.trim().isEmpty() && !r.getStatus().equalsIgnoreCase(status.trim())) {
                continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("hostel_id", r.getHostelId());
            map.put("room_number", r.getRoomNumber());
            map.put("floor", r.getFloor());
            map.put("room_type", r.getRoomType());
            map.put("capacity", r.getCapacity());
            map.put("current_occupancy", r.getCurrentOccupancy());
            map.put("available_beds", Math.max(0, r.getCapacity() - r.getCurrentOccupancy()));
            map.put("fee_per_month", r.getFeePerMonth());
            map.put("status", r.getStatus());
            map.put("amenities", r.getAmenities());
            map.put("description", r.getDescription());

            Hostel h = hostelMap.get(r.getHostelId());
            map.put("hostel_name", h != null ? h.getName() : "Unknown");
            map.put("hostel_code", h != null ? h.getCode() : "");

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoomById(@PathVariable Long id) {
        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Room not found."));
        }

        Room r = roomOpt.get();
        Map<String, Object> data = new HashMap<>();
        data.put("room", r);

        hostelRepository.findById(r.getHostelId()).ifPresent(h -> data.put("hostel", h));

        // Get occupants
        List<RoomAllocation> activeAllocations = allocationRepository.findByRoomId(r.getId());
        List<Map<String, Object>> occupants = new ArrayList<>();
        for (RoomAllocation alloc : activeAllocations) {
            if ("active".equalsIgnoreCase(alloc.getStatus())) {
                studentRepository.findById(alloc.getStudentId()).ifPresent(s -> {
                    Map<String, Object> occ = new HashMap<>();
                    occ.put("allocation_id", alloc.getId());
                    occ.put("student_id", s.getId());
                    occ.put("student_code", s.getStudentId());
                    occ.put("full_name", s.getFullName());
                    occ.put("bed_number", alloc.getBedNumber());
                    occ.put("start_date", alloc.getStartDate());
                    occupants.add(occ);
                });
            }
        }
        data.put("occupants", occupants);

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Room>> createRoom(@RequestBody Room room) {
        Optional<Room> existing = roomRepository.findByHostelIdAndRoomNumber(room.getHostelId(), room.getRoomNumber());
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Room number already exists in this hostel."));
        }

        Room saved = roomRepository.save(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Room created successfully.", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Room>> updateRoom(@PathVariable Long id, @RequestBody Room update) {
        Optional<Room> opt = roomRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Room not found."));
        }

        Room r = opt.get();
        if (update.getCapacity() != null) r.setCapacity(update.getCapacity());
        if (update.getFeePerMonth() != null) r.setFeePerMonth(update.getFeePerMonth());
        if (update.getStatus() != null) r.setStatus(update.getStatus());
        if (update.getAmenities() != null) r.setAmenities(update.getAmenities());
        if (update.getDescription() != null) r.setDescription(update.getDescription());

        return ResponseEntity.ok(ApiResponse.ok("Room updated successfully.", roomRepository.save(r)));
    }
}
