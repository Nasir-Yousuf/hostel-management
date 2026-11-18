/**
 * Maintenance Workflow Test Suite
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_niyd_12345';
process.env.JWT_EXPIRE = '7d';

const request = require('supertest');
const { app } = require('../server');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const Building = require('../models/Building');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const RoomAllocation = require('../models/RoomAllocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { ROLES, MAINTENANCE_STATUS, MAINTENANCE_PRIORITY } = require('../utils/constants');

let adminToken;
let studentToken;
let otherStudentToken;
let staffToken;
let otherStaffToken;
let staffDoc;
let otherStaffDoc;
let studentDoc;
let roomId;
let buildingId;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // 1. Admin
  await User.create({
    firstName: 'Warden',
    lastName: 'Admin',
    email: 'admin@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.ADMIN,
    phone: '01711000000'
  });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@niyd.gov.bd', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // 2. Staff 1 (Electrician)
  const staffUser = await User.create({
    firstName: 'Alim',
    lastName: 'Electrician',
    email: 'alim@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STAFF,
    phone: '01711000001'
  });
  staffDoc = await Staff.create({
    user: staffUser._id,
    staffId: 'STF-001',
    designation: 'Senior Electrician',
    department: 'Electrical'
  });
  const staffLogin = await request(app).post('/api/auth/login').send({ email: 'alim@niyd.gov.bd', password: 'Password123!' });
  staffToken = staffLogin.body.data.accessToken;

  // 3. Staff 2 (Plumber)
  const otherStaffUser = await User.create({
    firstName: 'Sohel',
    lastName: 'Plumber',
    email: 'sohel@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STAFF,
    phone: '01711000002'
  });
  otherStaffDoc = await Staff.create({
    user: otherStaffUser._id,
    staffId: 'STF-002',
    designation: 'Hostel Plumber',
    department: 'Plumbing'
  });
  const otherStaffLogin = await request(app).post('/api/auth/login').send({ email: 'sohel@niyd.gov.bd', password: 'Password123!' });
  otherStaffToken = otherStaffLogin.body.data.accessToken;

  // 4. Hostel, Building, Room, Bed
  const hostel = await Hostel.create({ name: 'Shaheed Minar Hall', code: 'SMH', type: 'male' });
  const building = await Building.create({ hostel: hostel._id, name: 'Block C', code: 'C', floors: 3 });
  buildingId = building._id;
  const room = await Room.create({ building: building._id, roomNumber: '305', floor: 3, capacity: 2, currentOccupancy: 1 });
  roomId = room._id;
  const bed = await Bed.create({ room: roomId, bedNumber: '305-A', status: 'occupied' });

  // 5. Student 1 (Allocated to Room 305)
  const studentUser = await User.create({
    firstName: 'Arif',
    lastName: 'Hasan',
    email: 'arif@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STUDENT,
    phone: '01711000003'
  });
  studentDoc = await Student.create({
    user: studentUser._id,
    studentId: 'NIYD-2026-0001',
    department: 'Computer Science',
    status: 'active'
  });
  const alloc = await RoomAllocation.create({
    student: studentDoc._id,
    room: roomId,
    bed: bed._id,
    hostel: hostel._id,
    building: buildingId,
    allocatedBy: adminLogin.body.data.user.id,
    academicSession: '2025-2026',
    status: 'active',
    startDate: new Date()
  });
  studentDoc.allocation = alloc._id;
  await studentDoc.save();

  const studentLogin = await request(app).post('/api/auth/login').send({ email: 'arif@niyd.gov.bd', password: 'Password123!' });
  studentToken = studentLogin.body.data.accessToken;

  // 6. Student 2 (Unallocated student)
  const unallocUser = await User.create({
    firstName: 'Tanvir',
    lastName: 'Ahmed',
    email: 'tanvir@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STUDENT,
    phone: '01711000004'
  });
  await Student.create({
    user: unallocUser._id,
    studentId: 'NIYD-2026-0002',
    department: 'Civil Engineering',
    status: 'active'
  });
  const unallocLogin = await request(app).post('/api/auth/login').send({ email: 'tanvir@niyd.gov.bd', password: 'Password123!' });
  otherStudentToken = unallocLogin.body.data.accessToken;
});

describe('Maintenance Request Lifecycle Tests', () => {
  it('should allow allocated student to submit maintenance request', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'electrical',
        priority: MAINTENANCE_PRIORITY.HIGH,
        title: 'Ceiling fan regulator sparking',
        description: 'The fan regulator in room 305 sparks whenever switched to speed 3.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('requestNumber');
    expect(res.body.data.status).toBe(MAINTENANCE_STATUS.SUBMITTED);
  });

  it('should reject maintenance request from unallocated student', async () => {
    const res = await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        category: 'plumbing',
        title: 'Water tap loose',
        description: 'Water tap leaking.'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/actively allocated/i);
  });

  it('should allow admin to assign staff member to a request', async () => {
    // Submit request
    const reqDoc = await MaintenanceRequest.create({
      student: studentDoc._id,
      room: roomId,
      building: buildingId,
      category: 'electrical',
      title: 'Power socket burned',
      description: 'The wall socket near bed A is burned.',
      status: MAINTENANCE_STATUS.SUBMITTED
    });

    const assignRes = await request(app)
      .put(`/api/maintenance/${reqDoc._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        staffId: staffDoc._id.toString(),
        priority: MAINTENANCE_PRIORITY.URGENT,
        adminNote: 'Check immediately for short circuit safety'
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
    expect(assignRes.body.data.status).toBe(MAINTENANCE_STATUS.ASSIGNED);
    expect(assignRes.body.data.assignedTo.toString()).toBe(staffDoc._id.toString());
  });

  it('should allow assigned staff to update work order progress and complete it', async () => {
    const reqDoc = await MaintenanceRequest.create({
      student: studentDoc._id,
      room: roomId,
      building: buildingId,
      category: 'electrical',
      title: 'Light tube replacement',
      description: 'Tubelight flickers constantly.',
      status: MAINTENANCE_STATUS.ASSIGNED,
      assignedTo: staffDoc._id
    });

    // 1. Staff 1 updates to in_progress
    const progRes = await request(app)
      .put(`/api/maintenance/${reqDoc._id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: MAINTENANCE_STATUS.IN_PROGRESS,
        note: 'Sourcing 28W LED tube from store'
      });

    expect(progRes.status).toBe(200);
    expect(progRes.body.data.status).toBe(MAINTENANCE_STATUS.IN_PROGRESS);

    // 2. Staff 1 marks completed
    const compRes = await request(app)
      .put(`/api/maintenance/${reqDoc._id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: MAINTENANCE_STATUS.COMPLETED,
        note: 'Fitted new LED tubelight. Tested working perfectly.'
      });

    expect(compRes.status).toBe(200);
    expect(compRes.body.data.status).toBe(MAINTENANCE_STATUS.COMPLETED);
    expect(compRes.body.data).toHaveProperty('completedAt');
  });

  it('should prevent an unassigned staff member from updating someone else’s work order', async () => {
    const reqDoc = await MaintenanceRequest.create({
      student: studentDoc._id,
      room: roomId,
      building: buildingId,
      category: 'electrical',
      title: 'AC repair',
      description: 'AC not cooling',
      status: MAINTENANCE_STATUS.ASSIGNED,
      assignedTo: staffDoc._id // Assigned to Staff 1
    });

    // Staff 2 tries to update Staff 1's task
    const forbiddenRes = await request(app)
      .put(`/api/maintenance/${reqDoc._id}/status`)
      .set('Authorization', `Bearer ${otherStaffToken}`)
      .send({
        status: MAINTENANCE_STATUS.COMPLETED,
        note: 'Trying to update'
      });

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);
  });
});
