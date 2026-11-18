# National Institute of Youth Development (NIYD) — Hostel Management System (HMS)

> **Official residential management platform for the National Institute of Youth Development (NIYD), Ministry of Youth and Sports, Bangladesh.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Vanilla JS](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20ES6%2B%20Vanilla%20JS-yellow.svg)](https://developer.mozilla.org/)
[![Tests](https://img.shields.io/badge/Tests-Jest%20Passing-success.svg)](https://jestjs.io/)

---

## 🏛️ Project Overview

The **NIYD Hostel Management System (HMS)** is a production-oriented, full-stack enterprise institutional management platform built specifically to digitize accommodation, admissions, room allocations, student welfare, attendance monitoring, fee collection, and facility maintenance for residential hostels across the NIYD campus in Bangladesh.

The application features three distinct role-based experiences:
1. **Hostel Administrator / Warden Portal** — Comprehensive facility oversight, admission reviews, bed capacity tracking, evening attendance roll calls, billing & offline money receipt verification, work order dispatch, and statistical reporting.
2. **Student Portal** — Mobile-friendly resident dashboard, allocated room and roommate directory, fee ledger with bKash/Nagad digital payment simulation, defect reporting with status tracking, official printable money receipts, and circulars board.
3. **Maintenance Staff Portal** — Technician work orders board, priority badges, progress updates, and completion notes for plumbing, electrical, and facility repairs.

---

## 🎨 Visual Identity & Institutional Design

- **Primary Colors**:
  - Institutional Green: `#146B45`
  - Dark Navy: `#17324D`
  - Warm Gold: `#D5A63C`
  - Neutral Background: `#F5F7F8`
  - Card Surface: `#FFFFFF`
  - Primary Text: `#202B35`
- **Typography**:
  - English: `Inter`
  - Bengali (বাংলা): `Noto Sans Bengali`
- **Bilingual Interface**: Seamless instant language toggle between English and বাংলা across portals.
- **Architectural Hero**: Includes enhanced architectural photograph of NIYD residential halls.

---

## 🚀 Key Modules & Capabilities

### 1. Online Admissions & Room Allocation Engine
- Public admission application workflow for new youth trainees and diploma students.
- Bed-level vacancy inspection — prevents double-booking or room overcapacity.
- Automated creation of student accounts, initial billing invoices, and room allocation documents upon confirmation.

### 2. Room & Bed Inventory Management
- Multi-hostel and building block hierarchy (floors, rooms, beds).
- Real-time occupancy tracking (`currentOccupancy < capacity`).
- Amenities tagging (Wi-Fi, AC, Attached Bathroom, Study Table, Wardrobe, Fan).

### 3. Invoicing, Payments & Printable Receipts
- Monthly automated billing generation for resident students.
- Dual payment workflow:
  - **Simulated Digital Gateway**: bKash and Nagad payment simulation for testing and student self-service.
  - **Offline Payment Verification**: Authorized administrative cash receipt recording.
- Instant generation of printable official **NIYD Money Receipts** with watermark and transaction verification.

### 4. Attendance Roll Call
- Daily attendance sheets with date picker and building filters.
- Bulk check-in for evening roll calls and status logging (`Present`, `Absent`, `Late Return`, `Checked Out`).
- Real-time compliance percentages on student profiles.

### 5. Facility Maintenance Lifecycle
- Automated linking of student room to defect submissions.
- Multi-role dispatch: Administrator assigns technician -> Staff logs progress notes -> Status updates to `Completed`.

---

## 📂 Project Architecture

```
hostel-management/
├── frontend/                     # Pure HTML5, CSS3, Vanilla ES6+ (Zero frameworks)
│   ├── index.html                # Institutional landing page with architectural hero & circulars
│   ├── login.html                # Multi-role authentication & online admission form
│   ├── admin/                    # 10 Admin & Warden management pages
│   ├── student/                  # 8 Resident student portal pages
│   ├── staff/                    # 2 Maintenance technician portal pages
│   └── assets/
│       ├── css/                  # Institutional design system (variables, components, responsive)
│       ├── js/                   # Core modules (API client, Auth, UI, Utils, I18N, Page scripts)
│       └── images/               # Architectural photographs and assets
├── backend/                      # Node.js + Express.js REST API
│   ├── config/                   # Database connection with graceful test fallback
│   ├── controllers/              # 12 REST API business controllers
│   ├── middleware/               # Auth, RBAC, Error handler, Validators
│   ├── models/                   # 19 Mongoose schemas with validation & virtuals
│   ├── routes/                   # Route declarations
│   ├── seeds/                    # Seed script with realistic Bangladeshi data
│   ├── tests/                    # Jest test suites with in-memory MongoDB
│   └── server.js                 # Express server & static asset host
├── docs/                         # API documentation & deployment guides
├── render.yaml                   # Render.com deployment blueprint
├── vercel.json                   # Vercel CDN deployment blueprint
└── package.json                  # Root runner script
```

---

## 🔐 Default Demo Accounts

Run `npm run seed` inside `backend/` to populate the database with complete initial data:

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Hostel Administrator** | `admin@niyd.gov.bd` | `Admin@NIYD2026` | Full administrative control |
| **Chief Warden** | `warden@niyd.gov.bd` | `Warden@NIYD2026` | Resident supervision & admissions |
| **Student** | `student1@niyd.gov.bd` | `Student@123` | Resident student in Room 101 |
| **Maintenance Staff** | `staff1@niyd.gov.bd` | `Staff@123` | Senior Electrician work orders |

*(Quick demo login buttons are also built directly into the login screen for instant evaluation).*

---

## 🛠️ Quickstart (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local `mongod` or MongoDB Atlas URI)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/niyd-gov-bd/hostel-management.git
cd hostel-management

# Install backend dependencies
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file inside `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/niyd_hms
JWT_SECRET=your_super_secret_niyd_jwt_key_2026
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000,http://localhost:5000
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Start Server
```bash
npm run dev
# or from root: npm start
```
Open **`http://localhost:5000/frontend/index.html`** in your browser.

---

## 🧪 Running Automated Tests

All tests run self-contained using `mongodb-memory-server` without requiring an active external MongoDB daemon:
```bash
cd backend
npm test
```
Test suites cover:
- Authentication, JWT token verification & role-based RBAC
- Admission submission, room capacity checks & bed reservation
- Room inventory & duplicate prevention
- Maintenance request submission, technician dispatch & resolution
- Fee structures, invoice generation & bKash/Nagad simulated payment workflows

---

## 📄 License
Developed for the National Institute of Youth Development (NIYD), Bangladesh.
All rights reserved.
