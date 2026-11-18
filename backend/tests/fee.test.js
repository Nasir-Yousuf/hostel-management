/**
 * Fee, Invoicing & Payment Test Suite
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_niyd_12345';
process.env.JWT_EXPIRE = '7d';

const request = require('supertest');
const { app } = require('../server');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');
const User = require('../models/User');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { ROLES, INVOICE_STATUS, PAYMENT_METHOD } = require('../utils/constants');

let adminToken;
let studentToken;
let otherStudentToken;
let studentDoc;
let otherStudentDoc;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Admin
  await User.create({
    firstName: 'Admin',
    lastName: 'Finance',
    email: 'finance@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.ADMIN,
    phone: '01711000000'
  });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'finance@niyd.gov.bd', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Student 1
  const studentUser1 = await User.create({
    firstName: 'Sajid',
    lastName: 'Iqbal',
    email: 'sajid@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STUDENT,
    phone: '01711000001'
  });
  studentDoc = await Student.create({
    user: studentUser1._id,
    studentId: 'NIYD-2026-0100',
    department: 'Electrical Engineering',
    status: 'active'
  });
  const studentLogin1 = await request(app).post('/api/auth/login').send({ email: 'sajid@niyd.gov.bd', password: 'Password123!' });
  studentToken = studentLogin1.body.data.accessToken;

  // Student 2
  const studentUser2 = await User.create({
    firstName: 'Mahin',
    lastName: 'Chowdhury',
    email: 'mahin@niyd.gov.bd',
    password: 'Password123!',
    role: ROLES.STUDENT,
    phone: '01711000002'
  });
  otherStudentDoc = await Student.create({
    user: studentUser2._id,
    studentId: 'NIYD-2026-0101',
    department: 'Computer Science',
    status: 'active'
  });
  const studentLogin2 = await request(app).post('/api/auth/login').send({ email: 'mahin@niyd.gov.bd', password: 'Password123!' });
  otherStudentToken = studentLogin2.body.data.accessToken;
});

describe('Fee & Invoicing Tests', () => {
  it('should create a fee structure and generate an invoice for a student', async () => {
    // 1. Admin creates Fee Structure
    const feeRes = await request(app)
      .post('/api/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Hostel Seat Rent',
        type: 'monthly_rent',
        amount: 2500,
        frequency: 'monthly',
        description: 'Monthly lodging rent'
      });

    expect(feeRes.status).toBe(201);
    expect(feeRes.body.success).toBe(true);

    // 2. Admin issues custom invoice to Student 1
    const invRes = await request(app)
      .post('/api/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: studentDoc._id.toString(),
        dueDate: '2026-12-15',
        notes: 'Hostel fee for November 2026',
        items: [
          { description: 'Hostel Seat Rent', amount: 2500 },
          { description: 'Utility and Internet', amount: 500 }
        ]
      });

    expect(invRes.status).toBe(201);
    expect(invRes.body.success).toBe(true);
    expect(invRes.body.data.totalAmount).toBe(3000);
    expect(invRes.body.data.status).toBe(INVOICE_STATUS.ISSUED);
  });

  it('should allow student to pay invoice via simulated gateway and mark it paid', async () => {
    // Create invoice directly
    const invoice = await Invoice.create({
      student: studentDoc._id,
      items: [{ description: 'Hostel Monthly Fee', amount: 2000 }],
      totalAmount: 2000,
      paidAmount: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: INVOICE_STATUS.ISSUED
    });

    // Student 1 simulates bKash payment
    const payRes = await request(app)
      .post('/api/fees/payments/simulate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        invoiceId: invoice._id.toString(),
        amount: 2000,
        method: PAYMENT_METHOD.BKASH,
        transactionId: 'SIM-BKASH-987654'
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.data.invoiceStatus).toBe(INVOICE_STATUS.PAID);
    expect(payRes.body.data).toHaveProperty('receiptNumber');

    // Verify invoice in DB
    const updatedInvoice = await Invoice.findById(invoice._id);
    expect(updatedInvoice.paidAmount).toBe(2000);
    expect(updatedInvoice.status).toBe(INVOICE_STATUS.PAID);

    // Verify Payment document
    const payment = await Payment.findOne({ invoice: invoice._id });
    expect(payment.isSimulated).toBe(true);
    expect(payment.amount).toBe(2000);
  });

  it('should prevent student from viewing or paying another student’s invoice', async () => {
    // Invoice belongs to Student 1
    const invoice = await Invoice.create({
      student: studentDoc._id,
      items: [{ description: 'Hostel Fee', amount: 2500 }],
      totalAmount: 2500,
      paidAmount: 0,
      dueDate: new Date(),
      status: INVOICE_STATUS.ISSUED
    });

    // Student 2 tries to access Student 1's invoice
    const forbiddenGet = await request(app)
      .get(`/api/fees/invoices/${invoice._id}`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(forbiddenGet.status).toBe(403);
    expect(forbiddenGet.body.success).toBe(false);

    // Student 2 tries to simulate payment for Student 1's invoice
    const forbiddenPay = await request(app)
      .post('/api/fees/payments/simulate')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        invoiceId: invoice._id.toString(),
        amount: 2500,
        method: PAYMENT_METHOD.NAGAD
      });

    expect(forbiddenPay.status).toBe(404); // Invoice not found for this student
    expect(forbiddenPay.body.success).toBe(false);
  });

  it('should allow admin to record and verify offline cash payment', async () => {
    const invoice = await Invoice.create({
      student: studentDoc._id,
      items: [{ description: 'Admission Security Deposit', amount: 5000 }],
      totalAmount: 5000,
      paidAmount: 0,
      dueDate: new Date(),
      status: INVOICE_STATUS.ISSUED
    });

    const offlineRes = await request(app)
      .post('/api/fees/payments/record')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        invoiceId: invoice._id.toString(),
        amount: 5000,
        method: PAYMENT_METHOD.CASH,
        transactionId: 'MR-2026-999',
        notes: 'Paid cash at Warden office counter'
      });

    expect(offlineRes.status).toBe(201);
    expect(offlineRes.body.success).toBe(true);
    expect(offlineRes.body.data.invoice.status).toBe(INVOICE_STATUS.PAID);
    expect(offlineRes.body.data.invoice.paidAmount).toBe(5000);
  });
});
