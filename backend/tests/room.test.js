/**
 * Room Management Test Suite
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
const { ROLES, ROOM_TYPE, ROOM_STATUS } = require('../utils/constants');

let adminToken;
let buildingId;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create Admin User
  await User.create({
    firstName: 'Chief',
    lastName: 'Warden',
    email: 'warden@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.ADMIN,
    phone: '01711000000'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'warden@niyd.gov.bd',
      password: 'Password123!'
    });
  adminToken = loginRes.body.data.accessToken;

  // Create Hostel & Building
  const hostel = await Hostel.create({
    name: 'Begum Rokeya Hall',
    code: 'BRH-F',
    campus: 'Main Campus',
    type: 'female'
  });

  const building = await Building.create({
    hostel: hostel._id,
    name: 'Block B',
    code: 'B',
    floors: 5,
    totalRooms: 20
  });
  buildingId = building._id;
});

describe('Room Inventory & Management Tests', () => {
  it('should create a room and auto-generate the correct number of beds', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        buildingId: buildingId.toString(),
        roomNumber: '201',
        floor: 2,
        type: ROOM_TYPE.TRIPLE,
        capacity: 3,
        monthlyRent: 2200,
        amenities: ['wifi', 'fan', 'study_table', 'attached_bath']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roomNumber).toBe('201');
    expect(res.body.data.capacity).toBe(3);

    // Verify 3 beds were created in the database
    const createdBeds = await Bed.find({ room: res.body.data._id });
    expect(createdBeds.length).toBe(3);
    const bedLabels = createdBeds.map((b) => b.bedNumber);
    expect(bedLabels).toEqual(expect.arrayContaining(['A', 'B', 'C']));
  });

  it('should prevent creating a duplicate room number in the same building', async () => {
    // Create room 205
    await Room.create({
      building: buildingId,
      roomNumber: '205',
      floor: 2,
      capacity: 2,
      monthlyRent: 2500
    });

    // Attempt to create room 205 again in the same building
    const duplicateRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        buildingId: buildingId.toString(),
        roomNumber: '205',
        floor: 2,
        capacity: 2,
        monthlyRent: 2500
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toMatch(/already exists/i);
  });

  it('should filter rooms by building and status', async () => {
    // Create 2 rooms: one available, one under maintenance
    await Room.create({
      building: buildingId,
      roomNumber: '301',
      floor: 3,
      capacity: 2,
      status: ROOM_STATUS.AVAILABLE,
      monthlyRent: 2500
    });

    await Room.create({
      building: buildingId,
      roomNumber: '302',
      floor: 3,
      capacity: 2,
      status: ROOM_STATUS.MAINTENANCE,
      monthlyRent: 2500
    });

    const filterRes = await request(app)
      .get(`/api/rooms?buildingId=${buildingId}&status=${ROOM_STATUS.AVAILABLE}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.length).toBe(1);
    expect(filterRes.body.data[0].roomNumber).toBe('301');
  });

  it('should update room amenities and status', async () => {
    const room = await Room.create({
      building: buildingId,
      roomNumber: '401',
      floor: 4,
      capacity: 1,
      status: ROOM_STATUS.AVAILABLE,
      monthlyRent: 3500
    });

    const updateRes = await request(app)
      .put(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: ROOM_STATUS.MAINTENANCE,
        amenities: ['wifi', 'ac', 'attached_bath'],
        monthlyRent: 4000
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe(ROOM_STATUS.MAINTENANCE);
    expect(updateRes.body.data.monthlyRent).toBe(4000);
    expect(updateRes.body.data.amenities).toContain('ac');
  });
});
