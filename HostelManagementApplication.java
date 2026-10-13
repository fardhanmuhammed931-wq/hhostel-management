package com.hostel.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HostelManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(HostelManagementApplication.class, args);
        System.out.println("\n=======================================================");
        System.out.println("🚀 Hostel Management Java Spring Boot Backend Running!");
        System.out.println("📡 REST API Endpoints: http://localhost:5000/api");
        System.out.println("💾 Connected to MySQL:  jdbc:mysql://localhost:3306/hostel_management");
        System.out.println("🌐 Frontend UI:        http://localhost:5173");
        System.out.println("=======================================================\n");
    }
}
