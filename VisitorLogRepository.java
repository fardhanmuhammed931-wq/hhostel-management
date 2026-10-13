package com.hostel.management.repository;

import com.hostel.management.entity.VisitorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {
    List<VisitorLog> findByStudentId(Long studentId);
    List<VisitorLog> findByStatus(String status);
}
