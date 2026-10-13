# Hostel Management System (HostelSync ERP)

A full-stack, responsive, production-ready **Hostel Management System Web Application** built with a premium **Glassmorphism (glass-style) UI**, Express.js REST API, and a real MySQL database.

---

## 🚀 Key Features

### 1. Premium Glassmorphism UI
- **Aesthetic**: Frosted translucent glass panels (`backdrop-filter: blur(16px)`), gradient ambient glow, refined borders, and soft shadows.
- **Dark & Light Themes**: Dark Glass default theme with toggleable Light Glass mode.
- **Application Shell**: Collapsible glass sidebar, top navigation bar with live notifications and profile menu, and mobile-friendly responsive drawer.
- **Feedback & States**: Animated skeleton loaders, empty states, and toast notifications.

### 2. Authentication & Role-Based Access Control (RBAC)
- **Roles**:
  - **Administrator**: Full privileges over students, buildings, rooms, allocations, fees, visitors, maintenance, and user accounts.
  - **Warden**: Manages room allocations, logs gate visitors, records daily roll call attendance, and dispatches maintenance staff.
  - **Student**: Views personal room allocation, tracks fee invoices and payment receipts, submits repair complaints, and monitors visitor logs.
- **Security**: JWT session tokens, bcrypt password hashing with salt rounds, parameterized SQL queries preventing SQL injection, and route guards.

### 3. Core Modules
- **Data-Driven Dashboard**: 8 summary KPI cards (Total Students, Total Rooms, Occupied Rooms, Available Beds, Pending Fees, Maintenance Pending, Today's Visitors, Occupancy %), monthly collection area chart, room occupancy bar chart, and recent activities.
- **Student Management**: Full CRUD, search, department/status filters, detailed student profiles with historical allocations, fees, and CSV export.
- **Hostel & Room Management**: Hostel building cards with floor counts and occupancy progress bars; Room inventory with visual bed occupancy grid and occupant modals.
- **Room Allocation Workflow**: Atomic database transaction checks capacity, prevents double active allocations, tracks dates, and supports room transfers and check-outs.
- **Fee & Payment Management**: Automated balance tracking, partial or full payments, overpayment prevention, and printable receipts (`REC-YYYY-XXXX`).
- **Visitor Gate Management**: Check-in with live timestamp, visitor directory, active visitor tracking, and one-click check-out.
- **Maintenance & Complaints**: Student issue filing (electrical, plumbing, cleaning, internet, furniture), priority badges, staff assignment, and resolution notes.
- **Daily Roll Call Attendance**: Date-based attendance sheet, present/absent/on-leave tracking, and bulk "Mark All Present" action.
- **Reports & Analytics**: Occupancy, fees, and maintenance reports with CSV export.
- **User Account Administration**: Administrator module to manage accounts and reset passwords.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Recharts, React Router v6, Axios |
| **Backend** | Node.js, Express.js, TypeScript, JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), Helmet, CORS, Morgan |
| **Database** | MySQL 8+ / MariaDB (`mysql2/promise` connection pool, transactions, InnoDB, indexes, foreign keys) |

---

## 📂 Project Structure

```
hostel-management-system/
├── client/                     # React + TypeScript + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # GlassCard, Button, Input, Select, Badge, Modal, etc.
│   │   │   └── layout/         # AppShell, Sidebar, TopNavbar, MobileNav
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/              # Login, Dashboard, Students, Rooms, Fees, Visitors, etc.
│   │   ├── services/           # Axios API client
│   │   ├── types/              # TypeScript domain types
│   │   ├── App.tsx             # Routes & ProtectedRoute configuration
│   │   ├── index.css           # Glassmorphism design system & gradients
│   │   └── main.tsx            # Application entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Express.js + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Database pool & environment variables
│   │   ├── controllers/        # Auth, Dashboard, Students, Rooms, Allocations, Fees, etc.
│   │   ├── middleware/         # Auth JWT verification, RBAC, error handling, rate limiting
│   │   ├── routes/             # REST API routes
│   │   ├── types/              # Server TypeScript interfaces
│   │   ├── utils/              # Password hashing, JWT, CSV generation, audit logging
│   │   └── index.ts            # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── database/                   # Database scripts
│   ├── schema.sql              # MySQL DDL (tables, foreign keys, indexes)
│   ├── seed.sql                # Demonstration data with hashed credentials
│   └── init-db.js              # Automatic database setup and seeder script
├── .env.example
├── .gitignore
├── package.json                # Root package orchestration
└── README.md
```

---

## ⚙️ Prerequisites

1. **Node.js** (v18.0.0 or higher recommended)
2. **npm** (v9.0.0 or higher)
3. **MySQL Server** (v8.0+ or MariaDB 10.4+) running locally or remotely (e.g., through MySQL Community Server, XAMPP, or Docker).

---

## 📦 Setup & Installation Instructions

### Step 1: Clone or Navigate to the Workspace
```bash
cd C:\Users\user\.gemini\antigravity\scratch\hostel-management-system
```

### Step 2: Install Dependencies
Install dependencies for root, server, and client:

```bash
# Using the root convenience command:
npm run install:all

# OR manually in each folder:
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 🗄️ MySQL Database Setup

### Option A: Automatic Setup via Script (Recommended)
Configure your MySQL credentials in `server/.env` (see below), then run:

```bash
npm run db:init
```
To also load demonstration data:
```bash
npm run db:seed
```

### Option B: Manual Import via MySQL CLI or Workbench
1. Open your terminal or MySQL Workbench:
```bash
mysql -u root -p
```
2. Execute the schema file:
```sql
SOURCE database/schema.sql;
```
3. (Optional) Load demonstration data:
```sql
SOURCE database/seed.sql;
```

---

## ⚙️ Environment Configuration (`.env`)

A default `.env` is provided in `server/.env`. Adjust credentials as needed:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostel_management
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_CONNECTION_LIMIT=10

# Security
JWT_SECRET=super_secret_jwt_key_hostel_management_2024_secure
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10
```

---

## 🚀 Running the Application

### Option 1: Run Both Client & Server Concurrently (Root)
```bash
npm run dev
```

### Option 2: Run Separately in Two Terminals
**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Demonstration Accounts

The database comes pre-seeded with three accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@hostel.com` | `password123` | Full access across all modules, settings, and user management. |
| **Hostel Warden** | `warden.boys@hostel.com` | `password123` | Student directory, allocations, visitor gate logs, roll call attendance. |
| **Student** | `alex.turner@hostel.com` | `password123` | Personal room view, fee invoices, payment receipts, maintenance tickets. |

*Quick-select buttons on the Login page allow one-click evaluation without typing credentials.*

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate and receive JWT token + user profile.
- `GET /api/auth/me` — Retrieve active authenticated user session.
- `POST /api/auth/change-password` — Change password.
- `POST /api/auth/logout` — Invalidate session.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Real KPI card metrics from MySQL.
- `GET /api/dashboard/charts` — Monthly fee revenue & occupancy distribution data.
- `GET /api/dashboard/recent-activity` — Recent activity feed.

### Students (`/api/students`)
- `GET /api/students` — Paginated student list with search & department filters.
- `GET /api/students/:id` — Student profile with allocation, fee, and ticket history.
- `POST /api/students` — Register a student.
- `PUT /api/students/:id` — Update student information.
- `DELETE /api/students/:id` — Delete or archive student record.
- `GET /api/students/export/csv` — Export student directory as CSV.

### Hostels & Rooms (`/api/hostels`, `/api/rooms`)
- `GET /api/hostels` — All hostel buildings with floor counts and occupancy totals.
- `POST /api/hostels` — Create new hostel building.
- `GET /api/rooms` — Filter rooms by hostel, floor, type, status.
- `GET /api/rooms/:id` — Room details and active student occupants.
- `POST /api/rooms` — Create room with capacity check.

### Allocations (`/api/allocations`)
- `GET /api/allocations` — List active and historical allocations.
- `POST /api/allocations` — Allocate student to room (verifies capacity & conflicts).
- `POST /api/allocations/:id/check-out` — Check out student and free room bed.
- `POST /api/allocations/:id/transfer` — Transfer student to new room in single transaction.

### Fees & Payments (`/api/fees`, `/api/payments`)
- `GET /api/fees` — List fee invoices and balance summaries.
- `POST /api/fees` — Create new fee obligation.
- `GET /api/payments` — Transaction history.
- `POST /api/payments` — Record payment with balance verification & receipt generation.
- `GET /api/payments/receipt/:id` — Full printable receipt details.
- `GET /api/payments/export/csv` — Export payments to CSV.

### Visitors (`/api/visitors`)
- `GET /api/visitors` — Gate log entries (filtered by status or date).
- `POST /api/visitors/check-in` — Register visitor and record entry time.
- `POST /api/visitors/:id/check-out` — Record exit time.
- `GET /api/visitors/export/csv` — Export visitor report.

### Maintenance (`/api/maintenance`)
- `GET /api/maintenance` — List maintenance tickets by status and priority.
- `POST /api/maintenance` — Submit repair complaint.
- `PUT /api/maintenance/:id` — Update ticket status, technician assignment, resolution notes.

### Attendance (`/api/attendance`)
- `GET /api/attendance` — Roll call sheet for date & hostel.
- `POST /api/attendance` — Mark individual student presence.
- `POST /api/attendance/bulk` — Fast bulk roll call update.

### Reports (`/api/reports`)
- `GET /api/reports/occupancy` — Detailed room & bed occupancy breakdown.
- `GET /api/reports/fees` — Category and period collection metrics.
- `GET /api/reports/maintenance` — Ticket volume and resolution metrics.
- `GET /api/reports/export/:type` — Direct CSV export.

---

## 🛠️ Troubleshooting

1. **MySQL connection error (`ECONNREFUSED` or `ER_ACCESS_DENIED_ERROR`):**
   - Ensure MySQL service is running on `localhost:3306`.
   - Update `DB_USER` and `DB_PASSWORD` in `server/.env`.
2. **CORS issues:**
   - The backend allows `http://localhost:5173` and common localhost ports by default. Adjust `CLIENT_URL` in `server/.env` if running on a custom port.
3. **Resetting database:**
   - Run `npm run db:init -- --seed` to recreate all tables and demonstration records.
