/**
 * Authentication Test Suite
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_niyd_12345';
process.env.JWT_EXPIRE = '7d';

const request = require('supertest');
const { app } = require('../server');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Authentication & Authorization Tests', () => {
  it('should register a new user successfully (via direct creation) and allow login', async () => {
    // 1. Seed user directly with password
    const testUser = await User.create({
      firstName: 'Kamal',
      lastName: 'Hossain',
      email: 'kamal@niyd.gov.bd',
      password: 'Password123!',
      role: ROLES.ADMIN,
      phone: '01711000001'
    });

    expect(testUser.password).not.toBe('Password123!'); // Must be hashed by pre-save hook

    // 2. Login with correct password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'kamal@niyd.gov.bd',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe('kamal@niyd.gov.bd');
    expect(res.body.data.user.role).toBe(ROLES.ADMIN);
  });

  it('should reject login with wrong password', async () => {
    await User.create({
      firstName: 'Rahim',
      lastName: 'Uddin',
      email: 'rahim@niyd.gov.bd',
      password: 'CorrectPassword123!',
      role: ROLES.STUDENT,
      phone: '01711000002'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rahim@niyd.gov.bd',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject access to protected endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should access /api/auth/me when valid Bearer token is provided', async () => {
    const user = await User.create({
      firstName: 'Fatima',
      lastName: 'Khatun',
      email: 'fatima@niyd.gov.bd',
      password: 'Password123!',
      role: ROLES.ADMIN,
      phone: '01711000003'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'fatima@niyd.gov.bd',
        password: 'Password123!'
      });

    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('fatima@niyd.gov.bd');
  });

  it('should prevent student from accessing admin-only endpoint', async () => {
    const studentUser = await User.create({
      firstName: 'Student',
      lastName: 'One',
      email: 'student@niyd.gov.bd',
      password: 'Password123!',
      role: ROLES.STUDENT,
      phone: '01711000004'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@niyd.gov.bd',
        password: 'Password123!'
      });

    const token = loginRes.body.data.accessToken;

    // Student tries to access admin dashboard
    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
  });
});
