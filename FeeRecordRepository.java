package com.hostel.management.repository;

import com.hostel.management.entity.FeeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeRecordRepository extends JpaRepository<FeeRecord, Long> {
    List<FeeRecord> findByStudentId(Long studentId);
    List<FeeRecord> findByStatus(String status);
    List<FeeRecord> findByAcademicPeriod(String academicPeriod);
}
