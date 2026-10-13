package com.hostel.management.repository;

import com.hostel.management.entity.RoomAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomAllocationRepository extends JpaRepository<RoomAllocation, Long> {
    List<RoomAllocation> findByStudentId(Long studentId);
    List<RoomAllocation> findByRoomId(Long roomId);
    Optional<RoomAllocation> findByStudentIdAndStatus(Long studentId, String status);
    List<RoomAllocation> findByStatus(String status);
}
