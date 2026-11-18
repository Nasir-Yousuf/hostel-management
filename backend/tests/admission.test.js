/**
 * Admission & Room Allocation Test Suite
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_niyd_12345';
process.env.JWT_EXPIRE = '7d';

const request = require('supertest');
const { app } = require('../server');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Building = require('../models/Building');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Student = require('../models/Student');
const AdmissionApplication = require('../models/AdmissionApplication');
const { ROLES, ROOM_TYPE, APPLICATION_STATUS, BED_STATUS } = require('../utils/constants');

let adminToken;
let hostelId;
let buildingId;
let roomId;
let bed1Id;
let bed2Id;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create Admin
  await User.create({
    firstName: 'Admin',
    lastName: 'Warden',
    email: 'admin@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.ADMIN,
    phone: '01711000000'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@niyd.gov.bd',
      password: 'Password123!'
    });
  adminToken = loginRes.body.data.accessToken;

  // Create Hostel & Building
  const hostel = await Hostel.create({
    name: 'Bangabandhu Residential Hall',
    code: 'BRH',
    campus: 'Main Campus',
    type: 'male'
  });
  hostelId = hostel._id;

  const building = await Building.create({
    hostel: hostelId,
    name: 'Block A',
    code: 'A',
    floors: 4,
    totalRooms: 10
  });
  buildingId = building._id;

  // Create Room with capacity 2
  const room = await Room.create({
    hostel: hostelId,
    building: buildingId,
    roomNumber: '101',
    floor: 1,
    type: ROOM_TYPE.DOUBLE,
    capacity: 2,
    currentOccupancy: 0,
    monthlyRent: 2500
  });
  roomId = room._id;

  // Create 2 Beds
  const bed1 = await Bed.create({
    room: roomId,
    bedNumber: '101-A',
    status: BED_STATUS.AVAILABLE
  });
  bed1Id = bed1._id;

  const bed2 = await Bed.create({
    room: roomId,
    bedNumber: '101-B',
    status: BED_STATUS.AVAILABLE
  });
  bed2Id = bed2._id;

  // Link beds to room
  room.beds = [bed1Id, bed2Id];
  await room.save();
});

describe('Admission & Room Allocation Engine Tests', () => {
  it('should allow public submission of admission application', async () => {
    const appPayload = {
      applicant: {
        firstName: 'Tariqul',
        lastName: 'Islam',
        email: 'tariqul@example.com',
        phone: '01812345678',
        dateOfBirth: '2003-05-15',
        gender: 'male',
        bloodGroup: 'B+',
        fatherName: 'Rafiqul Islam',
        emergencyContact: {
          name: 'Rafiqul Islam',
          phone: '01899999999',
          relation: 'Father'
        },
        presentAddress: {
          division: 'Dhaka',
          district: 'Gazipur'
        }
      },
      academic: {
        department: 'Computer Science & ICT',
        session: '2025-2026',
        rollNumber: 'CS-2025-042',
        regNumber: 'REG-987654',
        program: 'Diploma in ICT'
      },
      preferences: {
        preferredRoomType: 'double',
        preferredHostel: hostelId.toString()
      }
    };

    const res = await request(app)
      .post('/api/admissions')
      .send(appPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('applicationNumber');
    expect(res.body.data.status).toBe(APPLICATION_STATUS.PENDING);
  });

  it('should allocate bed and confirm admission, updating room occupancy and bed status', async () => {
    // 1. Submit application
    const appPayload = {
      applicant: {
        firstName: 'Shakil',
        lastName: 'Ahmed',
        email: 'shakil@example.com',
        phone: '01700000010',
        dateOfBirth: '2004-01-10',
        gender: 'male'
      },
      academic: {
        department: 'Electrical Engineering',
        session: '2025-2026',
        rollNumber: 'EE-2025-010'
      },
      preferences: {
        preferredRoomType: 'double',
        preferredHostel: hostelId.toString()
      }
    };

    const applyRes = await request(app)
      .post('/api/admissions')
      .send(appPayload);
    const applicationId = applyRes.body.data.id;

    // 2. Admin allocates bed1 to applicant
    const allocRes = await request(app)
      .put(`/api/admissions/${applicationId}/allocate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roomId: roomId.toString(),
        bedId: bed1Id.toString()
      });

    expect(allocRes.status).toBe(200);
    expect(allocRes.body.success).toBe(true);

    // Bed is reserved
    const reservedBed = await Bed.findById(bed1Id);
    expect(reservedBed.status).toBe('reserved');

    // 3. Admin confirms admission
    const confirmRes = await request(app)
      .put(`/api/admissions/${applicationId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);

    // 4. Verify Room and Bed states in database
    const updatedRoom = await Room.findById(roomId);
    expect(updatedRoom.currentOccupancy).toBe(1);

    const updatedBed = await Bed.findById(bed1Id);
    expect(updatedBed.status).toBe(BED_STATUS.OCCUPIED);

    // 5. Verify Student and User accounts were created
    const createdStudent = await Student.findOne({ studentId: confirmRes.body.data.studentId }).populate('user');
    expect(createdStudent).not.toBeNull();
    expect(createdStudent.user.email).toBe('shakil@example.com');
    expect(createdStudent.user.role).toBe(ROLES.STUDENT);
  });

  it('should prevent allocating an already occupied bed', async () => {
    // Mark bed1 as occupied directly
    await Bed.findByIdAndUpdate(bed1Id, { status: BED_STATUS.OCCUPIED });

    // Submit application
    const applyRes = await request(app)
      .post('/api/admissions')
      .send({
        applicant: {
          firstName: 'Farhan',
          lastName: 'Kabir',
          email: 'farhan@example.com',
          phone: '01700000020'
        },
        academic: {
          department: 'ICT',
          session: '2025-2026'
        }
      });
    const applicationId = applyRes.body.data.id;

    // Attempt allocation to occupied bed
    const allocRes = await request(app)
      .put(`/api/admissions/${applicationId}/allocate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roomId: roomId.toString(),
        bedId: bed1Id.toString()
      });

    expect(allocRes.status).toBe(400);
    expect(allocRes.body.success).toBe(false);
  });

  it('should prevent room overcapacity allocation', async () => {
    // Set room occupancy to 2 (max capacity)
    await Room.findByIdAndUpdate(roomId, { currentOccupancy: 2 });

    const applyRes = await request(app)
      .post('/api/admissions')
      .send({
        applicant: {
          firstName: 'Hasan',
          lastName: 'Mahmud',
          email: 'hasan@example.com',
          phone: '01700000030'
        },
        academic: {
          department: 'ICT',
          session: '2025-2026'
        }
      });
    const applicationId = applyRes.body.data.id;

    // Attempt allocation
    const allocRes = await request(app)
      .put(`/api/admissions/${applicationId}/allocate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roomId: roomId.toString(),
        bedId: bed2Id.toString()
      });

    expect(allocRes.status).toBe(400);
    expect(allocRes.body.success).toBe(false);
    expect(allocRes.body.message).toMatch(/capacity/i);
  });
});
