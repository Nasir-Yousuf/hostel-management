# NIYD Hostel Management System — REST API Documentation

**Organization**: National Institute of Youth Development (NIYD), Bangladesh  
**API Base URL**: `/api`  
**Authentication Scheme**: Bearer JWT (`Authorization: Bearer <token>`) & HTTP-only Cookie

---

## 1. System & Health

### Health Check
- **GET** `/api/health`
- **Access**: Public
- **Response**:
```json
{
  "status": "healthy",
  "uptime": 128,
  "timestamp": "2026-11-19T00:30:00.000Z",
  "organization": "National Institute of Youth Development (NIYD), Bangladesh",
  "system": "Hostel Management System (HMS)",
  "database": {
    "status": "connected",
    "healthy": true
  }
}
```

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/login` | Public | Authenticates user (email & password). Returns JWT accessToken, refreshToken, and role info. Sets HTTP-only cookie. |
| `POST` | `/logout` | Authenticated | Clears auth cookies and invalidates session. |
| `GET` | `/me` | Authenticated | Retrieves current user profile with role-specific data (Student / Staff). |
| `POST` | `/change-password` | Authenticated | Changes user password after verifying current password. |

---

## 3. Admission Applications (`/api/admissions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Public | Submit online hostel admission application with academic and guardian information. |
| `GET` | `/` | Admin | List all applications with pagination and filters (`status`, `department`, `search`). |
| `GET` | `/:id` | Admin | Get full details of a specific application. |
| `PUT` | `/:id/status` | Admin | Update status (`under_review`, `rejected`, `waitlisted`, `info_required`) with notes. |
| `PUT` | `/:id/allocate` | Admin | Allocates a verified vacant bed in a room with capacity and marks bed as `reserved`. |
| `PUT` | `/:id/confirm` | Admin | Finalizes admission: auto-provisions Student & User account, marks bed `occupied`, increments room occupancy, and issues initial billing. |

---

## 4. Room Management (`/api/rooms`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | List all active rooms with occupancy, bed statuses, and student occupant names. |
| `GET` | `/:id` | Authenticated | Get detailed room specifications, amenities, and current occupants. |
| `POST` | `/` | Admin | Create a new room within a building block and auto-generates beds (`A`, `B`, ...). |
| `PUT` | `/:id` | Admin | Update room status (`available`, `maintenance`, `full`), amenities, or monthly rent. |

---

## 5. Student Management (`/api/students`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Admin | Searchable directory of admitted students with room allocations and department filters. |
| `GET` | `/:id` | Admin | Full student 360° dossier (academic, personal, room, roommates, invoices, attendance, complaints). |
| `GET` | `/me/profile` | Student | Student's own personal and academic profile. |
| `GET` | `/me/room` | Student | Student's allocated room details, building, bed, and list of current roommates. |
| `POST` | `/me/room-change-request` | Student | Submit a room transfer or reallocation request. |

---

## 6. Fee & Payment Management (`/api/fees`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/structures` | Admin | View fee rates, seat rent tariffs, and deposit requirements. |
| `POST` | `/structures` | Admin | Define new fee tariff or utility rate. |
| `GET` | `/invoices` | Admin / Student | View billing invoices. Students only see their own invoices; admins see all. |
| `GET` | `/invoices/:id` | Admin / Student | Get invoice breakdown with line items and payment transactions. |
| `POST` | `/invoices` | Admin | Create single custom invoice for a student. |
| `POST` | `/invoices/generate-monthly` | Admin | Bulk generate monthly invoices for all active resident students. |
| `POST` | `/payments/simulate` | Student | Simulated bKash / Nagad payment gateway (marks verified in dev mode and generates money receipt). |
| `POST` | `/payments/record` | Admin | Record verified offline counter / cash payment with money receipt generation. |
| `GET` | `/receipt/:id` | Authenticated | Official printable NIYD money receipt with seal and transaction verification. |

---

## 7. Attendance Management (`/api/attendance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/daily` | Admin | Daily attendance roll call sheet by date and building block. |
| `POST` | `/mark` | Admin | Mark individual student status (`present`, `absent`, `late_return`, `checked_out`). |
| `POST` | `/bulk-checkin` | Admin | Bulk mark all resident students present for evening roll call. |
| `GET` | `/student/:id` | Admin | Attendance history and compliance statistics for a student. |
| `GET` | `/me` | Student | Student's own attendance records and monthly percentage. |

---

## 8. Maintenance Management (`/api/maintenance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/` | Student | Submit maintenance defect complaint linked automatically to the student's room. |
| `GET` | `/my-requests` | Student | View history and live progress of student's submitted complaints. |
| `GET` | `/` | Admin / Staff | List maintenance requests with status, priority, and category filters. |
| `GET` | `/:id` | Authenticated | Get complaint details, technician assignments, and timeline history. |
| `PUT` | `/:id/assign` | Admin | Assign maintenance staff technician and set priority (`urgent`, `high`, etc.). |
| `PUT` | `/:id/status` | Admin / Staff | Update work order status (`in_progress`, `completed`) and attach technician notes. |

---

## 9. Announcements & Notices (`/api/announcements`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | List circulars and announcements targeted to user role with bilingual EN/BN support. |
| `POST` | `/` | Admin | Publish notice with priority pinning and target audience selection. |
| `DELETE` | `/:id` | Admin | Remove notice. |

---

## 10. Reports & Analytics (`/api/reports`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/occupancy` | Admin | Building-by-building and floor-by-floor occupancy analytics. |
| `GET` | `/financial` | Admin | Revenue collection, outstanding balances, and monthly fee performance. |
| `GET` | `/attendance` | Admin | Monthly attendance compliance and absenteeism audit. |
| `GET` | `/export/csv` | Admin | Download institutional CSV dataset for students, invoices, or occupancy. |
