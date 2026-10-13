package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.entity.Hostel;
import com.hostel.management.entity.Room;
import com.hostel.management.repository.HostelRepository;
import com.hostel.management.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hostels")
public class HostelController {

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHostels() {
        List<Hostel> hostels = hostelRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Hostel h : hostels) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            map.put("code", h.getCode());
            map.put("type", h.getType());
            map.put("total_floors", h.getTotalFloors());
            map.put("warden_id", h.getWardenId());
            map.put("contact_number", h.getContactNumber());
            map.put("address", h.getAddress());
            map.put("description", h.getDescription());
            map.put("status", h.getStatus());
            map.put("created_at", h.getCreatedAt());

            int totalRooms = 0;
            int totalCapacity = 0;
            int currentOccupancy = 0;

            for (Room r : allRooms) {
                if (r.getHostelId().equals(h.getId())) {
                    totalRooms++;
                    totalCapacity += r.getCapacity();
                    currentOccupancy += r.getCurrentOccupancy();
                }
            }

            map.put("total_rooms", totalRooms);
            map.put("total_capacity", totalCapacity);
            map.put("current_occupancy", currentOccupancy);
            map.put("available_beds", Math.max(0, totalCapacity - currentOccupancy));

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Hostel>> getHostelById(@PathVariable Long id) {
        return hostelRepository.findById(id)
                .map(h -> ResponseEntity.ok(ApiResponse.ok(h)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Hostel not found.")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Hostel>> createHostel(@RequestBody Hostel hostel) {
        if (hostelRepository.existsByCode(hostel.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("Hostel code already exists."));
        }
        Hostel saved = hostelRepository.save(hostel);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Hostel created successfully.", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Hostel>> updateHostel(@PathVariable Long id, @RequestBody Hostel update) {
        Optional<Hostel> opt = hostelRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Hostel not found."));
        }
        Hostel h = opt.get();
        if (update.getName() != null) h.setName(update.getName());
        if (update.getType() != null) h.setType(update.getType());
        if (update.getTotalFloors() != null) h.setTotalFloors(update.getTotalFloors());
        if (update.getContactNumber() != null) h.setContactNumber(update.getContactNumber());
        if (update.getAddress() != null) h.setAddress(update.getAddress());
        if (update.getDescription() != null) h.setDescription(update.getDescription());
        if (update.getStatus() != null) h.setStatus(update.getStatus());

        return ResponseEntity.ok(ApiResponse.ok("Hostel updated successfully.", hostelRepository.save(h)));
    }
}
