/**
 * NIYD Hostel Management System - Fee & Payment Controller
 */
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, getPaginationMeta } = require('../utils/pagination');
const { PAYMENT_METHOD, PAYMENT_STATUS, INVOICE_STATUS } = require('../utils/constants');

// @desc    Get all Fee Structures
// @route   GET /api/fees/structures
// @access  Private (Admin only)
const getFeeStructures = async (req, res, next) => {
  try {
    const structures = await FeeStructure.find().sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, structures, 'Fee structures retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Create Fee Structure
// @route   POST /api/fees/structures
// @access  Private (Admin only)
const createFeeStructure = async (req, res, next) => {
  try {
    const { name, type, amount, frequency, roomType, description } = req.body;

    if (!name || !amount) {
      return next(new ApiError(400, 'Fee structure title and amount are required'));
    }

    const structure = await FeeStructure.create({
      name,
      type: type || 'monthly_rent',
      amount: Number(amount),
      frequency: frequency || 'monthly',
      roomType: roomType || 'all',
      description
    });

    res.status(201).json(new ApiResponse(201, structure, 'Fee structure created successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Get Invoices (Filterable by status, student, search)
// @route   GET /api/fees/invoices
// @access  Private (Admin or Student)
const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, studentId, search } = req.query;

    const filter = {};

    // If logged in user is student, strictly enforce student's own invoices
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return next(new ApiError(404, 'Student profile not found'));
      filter.student = student._id;
    } else if (studentId) {
      filter.student = studentId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'student',
        select: 'studentId department user',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          invoices,
          pagination: getPaginationMeta(total, page, limit)
        },
        'Invoices retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Invoice by ID
// @route   GET /api/fees/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'student',
        populate: [{ path: 'user', select: 'firstName lastName email phone' }, { path: 'allocation', populate: ['room', 'bed'] }]
      })
      .populate('issuedBy', 'firstName lastName');

    if (!invoice) {
      return next(new ApiError(404, 'Invoice not found'));
    }

    // Role ownership check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || invoice.student._id.toString() !== student._id.toString()) {
        return next(new ApiError(403, 'Forbidden: You cannot access invoices of other students'));
      }
    }

    // Associated payments
    const payments = await Payment.find({ invoice: invoice._id }).sort({ paymentDate: -1 });

    res.status(200).json(
      new ApiResponse(
        200,
        { invoice, payments },
        'Invoice retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Create Single Custom Invoice
// @route   POST /api/fees/invoices
// @access  Private (Admin only)
const createInvoice = async (req, res, next) => {
  try {
    const { studentId, items, dueDate, notes } = req.body;

    if (!studentId || !items || !items.length || !dueDate) {
      return next(new ApiError(400, 'Student, billable items, and due date are required'));
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ApiError(404, 'Student not found'));
    }

    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    const invoice = await Invoice.create({
      student: student._id,
      items,
      totalAmount,
      dueDate: new Date(dueDate),
      status: INVOICE_STATUS.ISSUED,
      issuedBy: req.user._id,
      notes
    });

    res.status(201).json(new ApiResponse(201, invoice, 'Invoice created and issued successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Monthly Invoices in Bulk for All Active Residents
// @route   POST /api/fees/invoices/generate-monthly
// @access  Private (Admin only)
const generateMonthlyInvoices = async (req, res, next) => {
  try {
    const { month, year, dueDate } = req.body;

    const targetDate = new Date();
    const targetMonth = month !== undefined ? Number(month) : targetDate.getMonth() + 1;
    const targetYear = year !== undefined ? Number(year) : targetDate.getFullYear();

    // Find all active students with room allocations
    const activeStudents = await Student.find({ status: 'active' }).populate('allocation');

    if (!activeStudents.length) {
      return next(new ApiError(400, 'No active students found in the hostel system'));
    }

    const feeStructures = await FeeStructure.find({
      isActive: true,
      frequency: 'monthly'
    });

    const defaultAmount = feeStructures.reduce((acc, f) => acc + f.amount, 0) || 2500;
    const defaultItems = feeStructures.length
      ? feeStructures.map((f) => ({ description: f.name, feeStructure: f._id, amount: f.amount }))
      : [{ description: `Monthly Hostel & Utility Fee (${targetMonth}/${targetYear})`, amount: 2500 }];

    const calcDueDate = dueDate ? new Date(dueDate) : new Date(targetYear, targetMonth - 1, 20);

    let createdCount = 0;
    const invoicePromises = [];

    for (let student of activeStudents) {
      // Check if invoice already issued for this month
      const fromDate = new Date(targetYear, targetMonth - 1, 1);
      const toDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const existing = await Invoice.findOne({
        student: student._id,
        'billingPeriod.from': fromDate
      });

      if (!existing) {
        createdCount++;
        invoicePromises.push(
          Invoice.create({
            student: student._id,
            items: defaultItems,
            totalAmount: defaultAmount,
            dueDate: calcDueDate,
            status: INVOICE_STATUS.ISSUED,
            issuedBy: req.user._id,
            billingPeriod: { from: fromDate, to: toDate },
            notes: `Auto-generated monthly hostel fees for ${targetMonth}/${targetYear}`
          })
        );
      }
    }

    await Promise.all(invoicePromises);

    res.status(200).json(
      new ApiResponse(
        200,
        { generatedInvoices: createdCount },
        `Generated ${createdCount} monthly invoices successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Record Offline / Cash Payment (Admin)
// @route   POST /api/fees/payments/record
// @access  Private (Admin only)
const recordOfflinePayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, method, transactionId, notes } = req.body;

    if (!invoiceId || !amount || !method) {
      return next(new ApiError(400, 'Invoice ID, payment amount, and method are required'));
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return next(new ApiError(404, 'Invoice not found'));
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return next(new ApiError(400, 'Payment amount must be greater than zero'));
    }

    // 1. Create Verified Payment record
    const payment = await Payment.create({
      invoice: invoice._id,
      student: invoice.student,
      amount: paymentAmount,
      method: method || PAYMENT_METHOD.CASH,
      transactionId: transactionId || `OFFLINE-${Date.now()}`,
      status: PAYMENT_STATUS.VERIFIED,
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      notes: notes || 'Admin verified offline payment'
    });

    // 2. Update Invoice paidAmount and status
    invoice.paidAmount = (invoice.paidAmount || 0) + paymentAmount;
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = INVOICE_STATUS.PAID;
    } else {
      invoice.status = INVOICE_STATUS.PARTIALLY_PAID;
    }
    await invoice.save();

    res.status(201).json(
      new ApiResponse(
        201,
        {
          payment,
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            status: invoice.status
          }
        },
        'Payment recorded and verified successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Simulate Digital Payment (Student Dev Mode)
// @route   POST /api/fees/payments/simulate
// @access  Private (Student only)
const simulatePayment = async (req, res, next) => {
  try {
    const { invoiceId, method, amount, transactionId } = req.body;

    if (!invoiceId || !amount) {
      return next(new ApiError(400, 'Invoice ID and amount are required'));
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ApiError(404, 'Student profile not found'));
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, student: student._id });
    if (!invoice) {
      return next(new ApiError(404, 'Invoice not found for this student'));
    }

    const paymentAmount = Number(amount);

    // Create payment entry marked clearly as simulated
    const payment = await Payment.create({
      invoice: invoice._id,
      student: student._id,
      amount: paymentAmount,
      method: method || PAYMENT_METHOD.BKASH,
      transactionId: transactionId || `SIM-${method ? method.toUpperCase() : 'BKASH'}-${Date.now().toString().slice(-6)}`,
      status: PAYMENT_STATUS.VERIFIED, // In dev simulation, immediately verify
      verifiedAt: new Date(),
      isSimulated: true,
      notes: 'Development Payment Simulation (bKash/Nagad mock gateway)'
    });

    // Update invoice balance
    invoice.paidAmount = (invoice.paidAmount || 0) + paymentAmount;
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = INVOICE_STATUS.PAID;
    } else {
      invoice.status = INVOICE_STATUS.PARTIALLY_PAID;
    }
    await invoice.save();

    res.status(201).json(
      new ApiResponse(
        201,
        {
          payment,
          invoiceStatus: invoice.status,
          receiptNumber: payment.receiptNumber
        },
        'Payment simulated successfully! Receipt generated.'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Receipt Details for print/download
// @route   GET /api/fees/receipt/:id
// @access  Private
const getReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoice')
      .populate({
        path: 'student',
        populate: [
          { path: 'user', select: 'firstName lastName email phone' },
          { path: 'allocation', populate: ['room', 'bed', 'building', 'hostel'] }
        ]
      })
      .populate('verifiedBy', 'firstName lastName');

    if (!payment) {
      return next(new ApiError(404, 'Receipt not found'));
    }

    // Role check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || payment.student._id.toString() !== student._id.toString()) {
        return next(new ApiError(403, 'Forbidden: You cannot view receipts of other students'));
      }
    }

    res.status(200).json(new ApiResponse(200, payment, 'Receipt details retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getInvoices,
  getInvoiceById,
  createInvoice,
  generateMonthlyInvoices,
  recordOfflinePayment,
  simulatePayment,
  getReceipt
};
