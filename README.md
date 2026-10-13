# 🎓 Hostel Management System - Java Spring Boot & MySQL Backend

**College Project Submission Documentation**  
**Technology:** Java 17+, Spring Boot 3.x, Spring Data JPA (Hibernate), MySQL 8+, Spring Security 6 (JWT)

---

## 🏛️ 1. Architecture Overview (MVC Pattern)

This backend is built on the industry-standard **Model-View-Controller (MVC)** and **Layered Architecture**:

```
[ Frontend Client: React (Port 5173) ]
                 │ (REST API / JSON via HTTP)
                 ▼
[ Controller Layer: @RestController ]
   ├── AuthController (/api/auth)
   ├── DashboardController (/api/dashboard)
   ├── StudentController (/api/students)
   ├── RoomController (/api/rooms)
   ├── AllocationController (/api/allocations)
   ├── FeeController (/api/fees)
   ├── PaymentController (/api/payments)
   ├── VisitorController (/api/visitors)
   ├── MaintenanceController (/api/maintenance)
   ├── AttendanceController (/api/attendance)
   └── ReportController (/api/reports)
                 │
                 ▼
[ Security & Filter Layer: Spring Security 6 + JJWT ]
   ├── JwtAuthenticationFilter (Extracts and validates Bearer tokens)
   ├── JwtTokenProvider (Signs & parses HMAC-SHA256 JWTs)
   └── SecurityConfig (CORS origin mapping & URL permissions)
                 │
                 ▼
[ Repository Layer: Spring Data JPA (Hibernate ORM) ]
   ├── UserRepository (extends JpaRepository<User, Long>)
   ├── StudentRepository (extends JpaRepository<Student, Long>)
   ├── RoomRepository (extends JpaRepository<Room, Long>)
   ├── RoomAllocationRepository (extends JpaRepository<RoomAllocation, Long>)
   └── ...
                 │
                 ▼
[ Database Layer: MySQL Server (Port 3306) ]
   Database: `hostel_management`
```

---

## 💾 2. MySQL Database Connection Configuration

Configuration file: `src/main/resources/application.properties`

```properties
server.port=5000

# MySQL Database Connection
spring.datasource.url=jdbc:mysql://localhost:3306/hostel_management?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / Hibernate ORM
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

---

## 🚀 3. How to Run the Java Backend

### Option A: Using IntelliJ IDEA / Eclipse / VS Code (Recommended for College Presentations)
1. Open your IDE (IntelliJ IDEA Ultimate/Community or Eclipse IDE for Enterprise Java).
2. Select **File -> Open** and choose the `backend-java` folder.
3. The IDE will automatically detect `pom.xml` as a Maven project and download the dependencies.
4. Locate `src/main/java/com/hostel/management/HostelManagementApplication.java`.
5. Right-click and choose **Run 'HostelManagementApplication'**.

### Option B: Using Maven from Terminal
```bash
cd backend-java
mvn clean install
mvn spring-boot:run
```

Once running, the backend will be live at:
- **API Base:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/api/health`

---

## 🔑 4. Demo Login Credentials (Seeded)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@hostel.com` | `password123` |
| **Warden (Boys)** | `warden.boys@hostel.com` | `password123` |
| **Student** | `alex.turner@hostel.com` | `password123` |

---

## 💡 5. College Viva Voce Questions & Answers (Java + MySQL)

### Q1: What is the difference between Spring Boot and traditional Spring Framework?
> **Answer:** Spring Framework requires manual XML configuration, manual DispatcherServlet configuration, and external Tomcat server setup. Spring Boot provides **Auto-Configuration**, **Starter POMs**, and an **Embedded Tomcat Server**, enabling production-ready applications with zero XML.

### Q2: How does Spring Data JPA interact with MySQL?
> **Answer:** Spring Data JPA provides repository abstractions (`JpaRepository`). Hibernate acts as the JPA vendor/ORM (Object-Relational Mapping) implementation that translates Java entity objects into SQL queries executed against MySQL via the JDBC driver (`mysql-connector-j`).

### Q3: What is the purpose of `@Transactional` in the AllocationController?
> **Answer:** When a room is allocated or checked out, two database updates must happen together: saving the `RoomAllocation` record and updating the `current_occupancy` of the `Room`. The `@Transactional` annotation guarantees ACID properties: if either operation fails, the entire transaction rolls back to avoid data corruption.

### Q4: How is password security implemented?
> **Answer:** Passwords are never stored in plain text. We use Spring Security's `BCryptPasswordEncoder`, which applies a one-way cryptographic hashing algorithm with a random salt value (work factor 10).
