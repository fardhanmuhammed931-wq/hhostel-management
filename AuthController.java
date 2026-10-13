package com.hostel.management.controller;

import com.hostel.management.dto.ApiResponse;
import com.hostel.management.dto.AuthResponse;
import com.hostel.management.dto.LoginRequest;
import com.hostel.management.entity.*;
import com.hostel.management.repository.*;
import com.hostel.management.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomAllocationRepository allocationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password."));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password."));
        }

        if (!"active".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Your account is " + user.getStatus() + ". Please contact the hostel administrator."));
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("email", user.getEmail());
        userData.put("full_name", user.getFullName());
        userData.put("role", user.getRole());
        userData.put("phone", user.getPhone());
        userData.put("status", user.getStatus());

        // Find linked student and room details if applicable
        Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
        if (studentOpt.isPresent()) {
            Student s = studentOpt.get();
            userData.put("student_id", s.getStudentId());
            userData.put("studentRecordId", s.getId());

            Optional<RoomAllocation> allocOpt = allocationRepository.findByStudentIdAndStatus(s.getId(), "active");
            if (allocOpt.isPresent()) {
                RoomAllocation alloc = allocOpt.get();
                roomRepository.findById(alloc.getRoomId()).ifPresent(r -> {
                    userData.put("room_id", r.getId());
                    userData.put("room_number", r.getRoomNumber());
                    hostelRepository.findById(r.getHostelId()).ifPresent(h -> {
                        userData.put("hostel_id", h.getId());
                        userData.put("hostel_name", h.getName());
                    });
                });
            }
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName(), userData);
        AuthResponse response = new AuthResponse(token, userData);

        return ResponseEntity.ok(ApiResponse.ok("Login successful.", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String fullName = (String) body.get("full_name");
        String phone = (String) body.get("phone");
        String role = (String) body.getOrDefault("role", "student");

        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Full name, email, and password are required."));
        }

        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("An account with this email address already exists."));
        }

        User user = new User();
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName.trim());
        user.setRole(role);
        user.setPhone(phone);
        user.setStatus("active");
        User savedUser = userRepository.save(user);

        Map<String, Object> userData = new HashMap<>();
        userData.put("id", savedUser.getId());
        userData.put("email", savedUser.getEmail());
        userData.put("full_name", savedUser.getFullName());
        userData.put("role", savedUser.getRole());
        userData.put("phone", savedUser.getPhone());
        userData.put("status", savedUser.getStatus());

        if ("student".equalsIgnoreCase(role)) {
            Student student = new Student();
            student.setUserId(savedUser.getId());
            student.setStudentId((String) body.getOrDefault("student_id", "STU-" + System.currentTimeMillis() % 1000000));
            student.setFullName(fullName.trim());
            student.setEmail(cleanEmail);
            student.setPhone(phone != null ? phone : "N/A");
            student.setGender((String) body.getOrDefault("gender", "other"));
            student.setDepartment((String) body.getOrDefault("department", "General"));
            student.setCourse((String) body.getOrDefault("course", "Undergraduate"));
            student.setAcademicYear((String) body.getOrDefault("academic_year", "1st Year"));
            student.setStatus("active");
            Student savedStudent = studentRepository.save(student);

            userData.put("student_id", savedStudent.getStudentId());
            userData.put("studentRecordId", savedStudent.getId());
        }

        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole(), savedUser.getFullName(), userData);
        AuthResponse response = new AuthResponse(token, userData);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully!", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof Claims claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated."));
        }

        String email = claims.getSubject();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("User not found."));
        }

        User user = userOpt.get();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("email", user.getEmail());
        userData.put("full_name", user.getFullName());
        userData.put("role", user.getRole());
        userData.put("phone", user.getPhone());
        userData.put("avatar_url", user.getAvatarUrl());
        userData.put("status", user.getStatus());
        userData.put("created_at", user.getCreatedAt());

        studentRepository.findByUserId(user.getId()).ifPresent(s -> {
            userData.put("student_id", s.getStudentId());
            userData.put("studentRecordId", s.getId());
            userData.put("department", s.getDepartment());
            userData.put("course", s.getCourse());
            userData.put("academic_year", s.getAcademicYear());

            allocationRepository.findByStudentIdAndStatus(s.getId(), "active").ifPresent(alloc -> {
                roomRepository.findById(alloc.getRoomId()).ifPresent(r -> {
                    userData.put("room_id", r.getId());
                    userData.put("room_number", r.getRoomNumber());
                    hostelRepository.findById(r.getHostelId()).ifPresent(h -> {
                        userData.put("hostel_id", h.getId());
                        userData.put("hostel_name", h.getName());
                    });
                });
            });
        });

        return ResponseEntity.ok(ApiResponse.ok(userData));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully.", null));
    }
}
