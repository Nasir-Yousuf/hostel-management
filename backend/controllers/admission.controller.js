/**
 * NIYD Hostel Management System - Admission Controller
 */
const AdmissionApplication = require('../models/AdmissionApplication');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const User = require('../models/User');
const Student = require('../models/Student');
const RoomAllocation = require('../models/RoomAllocation');
const Invoice = require('../models/Invoice');
const FeeStructure = require('../models/FeeStructure');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, getPaginationMeta } = require('../utils/pagination');
const { APPLICATION_STATUS, ROLES } = require('../utils/constants');

// @desc    Submit public hostel admission application
// @route   POST /api/admissions
// @access  Public
const submitApplication = async (req, res, next) => {
  try {
    const { applicant, academic, preferences } = req.body;

    if (!applicant || !applicant.email || !applicant.firstName || !applicant.lastName) {
      return next(new ApiError(400, 'Please provide all required applicant information'));
    }

    if (!academic || !academic.department) {
      return next(new ApiError(400, 'Please provide academic department information'));
    }

    // Check if application with same email already pending
    const existing = await AdmissionApplication.findOne({
      'applicant.email': applicant.email.toLowerCase(),
      status: { $in: [APPLICATION_STATUS.PENDING, APPLICATION_STATUS.UNDER_REVIEW] }
    });

    if (existing) {
      return next(
        new ApiError(
          400,
          `An active application (#${existing.applicationNumber}) already exists for this email address.`
        )
      );
    }

    const application = await AdmissionApplication.create({
      applicant,
      academic,
      preferences,
      status: APPLICATION_STATUS.PENDING,
      statusHistory: [
        {
          status: APPLICATION_STATUS.PENDING,
          notes: 'Application submitted online'
        }
      ]
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          id: application._id,
          applicationNumber: application.applicationNumber,
          status: application.status,
          applicantName: `${application.applicant.firstName} ${application.applicant.lastName}`
        },
        'Application submitted successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get all admission applications with search & filter
// @route   GET /api/admissions
// @access  Private (Admin only)
const getApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, search, department } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (department && department !== 'all') {
      filter['academic.department'] = department;
    }
    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'applicant.firstName': { $regex: search, $options: 'i' } },
        { 'applicant.lastName': { $regex: search, $options: 'i' } },
        { 'applicant.email': { $regex: search, $options: 'i' } },
        { 'applicant.phone': { $regex: search, $options: 'i' } },
        { 'applicant.nidNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await AdmissionApplication.countDocuments(filter);
    const applications = await AdmissionApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('allocatedRoom', 'roomNumber floor type monthlyRent')
      .populate('allocatedBed', 'bedNumber status');

    res.status(200).json(
      new ApiResponse(
        200,
        {
          applications,
          pagination: getPaginationMeta(total, page, limit)
        },
        'Applications retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get application details
// @route   GET /api/admissions/:id
// @access  Private (Admin only)
const getApplicationById = async (req, res, next) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id)
      .populate('allocatedRoom')
      .populate('allocatedBed')
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }

    res.status(200).json(new ApiResponse(200, application, 'Application details retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Update application status (Review, Reject, Waitlist, Info Required)
// @route   PUT /api/admissions/:id/status
// @access  Private (Admin only)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return next(new ApiError(400, 'Invalid application status'));
    }

    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }

    application.status = status;
    application.reviewedBy = req.user._id;
    if (notes) application.reviewNotes = notes;

    application.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: notes || `Status changed to ${status}`
    });

    await application.save();

    res.status(200).json(new ApiResponse(200, application, `Application status updated to ${status}`));
  } catch (err) {
    next(err);
  }
};

// @desc    Allocate room and bed to application
// @route   PUT /api/admissions/:id/allocate
// @access  Private (Admin only)
const allocateRoom = async (req, res, next) => {
  try {
    const { roomId, bedId, notes } = req.body;

    if (!roomId || !bedId) {
      return next(new ApiError(400, 'Both roomId and bedId are required for room allocation'));
    }

    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }

    // 1. Verify Room exists and has capacity
    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ApiError(404, 'Selected room not found'));
    }

    if (room.currentOccupancy >= room.capacity) {
      return next(new ApiError(400, `Room ${room.roomNumber} is already at full capacity (${room.capacity}/${room.capacity})`));
    }

    // 2. Verify Bed exists in this room and is AVAILABLE
    const bed = await Bed.findOne({ _id: bedId, room: roomId });
    if (!bed) {
      return next(new ApiError(404, 'Bed not found in the specified room'));
    }

    if (bed.status !== 'available') {
      return next(new ApiError(400, `Bed ${bed.bedNumber} is not available (Current status: ${bed.status})`));
    }

    // 3. Update application allocation fields
    application.allocatedRoom = roomId;
    application.allocatedBed = bedId;
    application.status = APPLICATION_STATUS.APPROVED;
    application.reviewedBy = req.user._id;

    application.statusHistory.push({
      status: APPLICATION_STATUS.APPROVED,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: notes || `Allocated Room ${room.roomNumber}, Bed ${bed.bedNumber}`
    });

    await application.save();

    // Mark bed as reserved until confirmed
    bed.status = 'reserved';
    await bed.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          application,
          room: { roomNumber: room.roomNumber, floor: room.floor },
          bed: { bedNumber: bed.bedNumber }
        },
        'Room and bed allocated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm admission: Create User, Student, Allocation & Invoice
// @route   PUT /api/admissions/:id/confirm
// @access  Private (Admin only)
const confirmAdmission = async (req, res, next) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id)
      .populate('allocatedRoom')
      .populate('allocatedBed');

    if (!application) {
      return next(new ApiError(404, 'Application not found'));
    }

    if (!application.allocatedRoom || !application.allocatedBed) {
      return next(new ApiError(400, 'Cannot confirm admission before allocating a room and bed'));
    }

    const { applicant, academic, allocatedRoom, allocatedBed } = application;

    // 1. Check or Create User Account
    let user = await User.findOne({ email: applicant.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: applicant.email.toLowerCase(),
        password: 'Student@123', // Default initial password
        role: ROLES.STUDENT,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        firstNameBn: applicant.firstNameBn,
        lastNameBn: applicant.lastNameBn,
        phone: applicant.phone
      });
    }

    // 2. Generate unique Student ID: NIYD-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const studentId = `NIYD-${year}-${String(count + 1).padStart(4, '0')}`;

    // 3. Create Student Document
    let student = await Student.findOne({ user: user._id });
    if (!student) {
      student = await Student.create({
        user: user._id,
        studentId,
        gender: applicant.gender,
        bloodGroup: applicant.bloodGroup,
        nidNumber: applicant.nidNumber,
        department: academic.department,
        program: academic.program,
        session: academic.session,
        year: academic.year,
        fatherName: applicant.fatherName,
        motherName: applicant.motherName,
        permanentAddress: applicant.permanentAddress,
        presentAddress: applicant.presentAddress,
        emergencyContact: applicant.emergencyContact,
        status: 'active'
      });
    }

    // 4. Update Bed to Occupied
    const bed = await Bed.findById(allocatedBed._id);
    bed.status = 'occupied';
    bed.currentOccupant = student._id;
    await bed.save();

    // 5. Update Room Occupancy
    const room = await Room.findById(allocatedRoom._id);
    room.currentOccupancy += 1;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'full';
    }
    await room.save();

    // 6. Create RoomAllocation
    await RoomAllocation.create({
      student: student._id,
      room: room._id,
      bed: bed._id,
      hostel: room.building.hostel || (await Room.findById(room._id).populate('building')).building.hostel,
      building: room.building,
      allocatedBy: req.user._id,
      status: 'active'
    });

    // 7. Generate Initial Admission Invoice
    const feeStructures = await FeeStructure.find({ isActive: true });
    let totalFee = 0;
    const items = feeStructures.map((f) => {
      totalFee += f.amount;
      return {
        description: f.name,
        feeStructure: f._id,
        amount: f.amount
      };
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // 15 days to pay

    const invoice = await Invoice.create({
      student: student._id,
      items: items.length > 0 ? items : [{ description: 'Monthly Hostel & Utility Fee', amount: 2500 }],
      totalAmount: totalFee > 0 ? totalFee : 2500,
      dueDate,
      status: 'issued',
      issuedBy: req.user._id,
      notes: 'Initial admission & accommodation invoice'
    });

    // Mark application as confirmed
    application.status = APPLICATION_STATUS.APPROVED;
    application.statusHistory.push({
      status: APPLICATION_STATUS.APPROVED,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Admission confirmed. Student ID: ${studentId}, Invoice: ${invoice.invoiceNumber}`
    });
    await application.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          studentId: student.studentId,
          email: user.email,
          roomNumber: room.roomNumber,
          bedNumber: bed.bedNumber,
          invoiceNumber: invoice.invoiceNumber
        },
        'Admission confirmed successfully! Student account and room allocation created.'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  allocateRoom,
  confirmAdmission
};
