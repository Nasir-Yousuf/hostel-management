/**
 * NIYD Hostel Management System - Student Controller
 */
const Student = require('../models/Student');
const User = require('../models/User');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const RoomAllocation = require('../models/RoomAllocation');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const RoomChangeRequest = require('../models/RoomChangeRequest');
const Announcement = require('../models/Announcement');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

// @desc    Get all students (searchable, filterable, paginated)
// @route   GET /api/students
// @access  Private (Admin only)
const getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { department, status, session, search } = req.query;

    const filter = {};
    if (department && department !== 'all') filter.department = department;
    if (status && status !== 'all') filter.status = status;
    if (session && session !== 'all') filter.session = session;

    if (search) {
      // Find matching users first
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map((u) => u._id);

      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } },
        { nidNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email phone avatar isActive')
      .populate({
        path: 'allocation',
        populate: ['room', 'bed', 'building', 'hostel']
      });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          students,
          pagination: getPaginationMeta(total, page, limit)
        },
        'Students retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get student full details (with 6 tabs of data)
// @route   GET /api/students/:id
// @access  Private (Admin or Self)
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName firstNameBn lastNameBn email phone avatar')
      .populate({
        path: 'allocation',
        populate: ['room', 'bed', 'building', 'hostel']
      });

    if (!student) {
      return next(new ApiError(404, 'Student not found'));
    }

    // Role check: If not admin, verify ownership
    if (req.user.role === 'student' && student.user._id.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Forbidden: You cannot access other student profiles'));
    }

    // 1. Roommates (if allocated)
    let roommates = [];
    if (student.allocation && student.allocation.room) {
      const activeAllocations = await RoomAllocation.find({
        room: student.allocation.room._id,
        status: 'active',
        student: { $ne: student._id }
      })
        .populate('bed', 'bedNumber')
        .populate({
          path: 'student',
          select: 'studentId department session user',
          populate: { path: 'user', select: 'firstName lastName email phone avatar' }
        });

      roommates = activeAllocations;
    }

    // 2. Invoices & Payments
    const invoices = await Invoice.find({ student: student._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ student: student._id }).sort({ paymentDate: -1 });

    // 3. Attendance History
    const attendance = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(30);

    // 4. Maintenance Requests
    const maintenance = await MaintenanceRequest.find({ student: student._id })
      .sort({ createdAt: -1 })
      .populate('room', 'roomNumber');

    res.status(200).json(
      new ApiResponse(
        200,
        {
          student,
          roommates,
          invoices,
          payments,
          attendance,
          maintenance
        },
        'Student profile details retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Update student profile (Admin)
// @route   PUT /api/students/:id
// @access  Private (Admin only)
const updateStudent = async (req, res, next) => {
  try {
    const { department, session, year, status, permanentAddress, presentAddress, emergencyContact } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return next(new ApiError(404, 'Student not found'));
    }

    if (department) student.department = department;
    if (session) student.session = session;
    if (year) student.year = Number(year);
    if (status) student.status = status;
    if (permanentAddress) student.permanentAddress = permanentAddress;
    if (presentAddress) student.presentAddress = presentAddress;
    if (emergencyContact) student.emergencyContact = emergencyContact;

    await student.save();

    res.status(200).json(new ApiResponse(200, student, 'Student profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Get authenticated student's dashboard summary
// @route   GET /api/students/me/dashboard
// @access  Private (Student only)
const getMyDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate({
      path: 'allocation',
      populate: ['room', 'bed', 'building', 'hostel']
    });

    if (!student) {
      return next(new ApiError(404, 'Student residential profile not found'));
    }

    // 1. Pending Invoices & Total Due
    const unpaidInvoices = await Invoice.find({
      student: student._id,
      status: { $in: ['issued', 'partially_paid', 'overdue'] }
    }).sort({ dueDate: 1 });

    const totalDue = unpaidInvoices.reduce((acc, inv) => {
      return acc + Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    }, 0);

    const upcomingInvoice = unpaidInvoices[0] || null;

    // 2. Active Maintenance Requests
    const myMaintenance = await MaintenanceRequest.find({ student: student._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. Announcements targeted to all or student's hostel
    const hostelId = student.allocation?.hostel?._id;
    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { targetAudience: 'all' },
        ...(hostelId ? [{ targetAudience: 'specific_hostel', targetHostel: hostelId }] : [])
      ]
    })
      .sort({ publishedAt: -1 })
      .limit(4);

    // 4. Attendance Rate (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await Attendance.find({
      student: student._id,
      date: { $gte: thirtyDaysAgo }
    });

    const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
    const attendancePercentage =
      attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 100;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          student,
          allocation: student.allocation,
          financialSummary: {
            totalDue,
            upcomingInvoice
          },
          recentMaintenance: myMaintenance,
          announcements,
          attendanceStats: {
            totalMarked: attendanceRecords.length,
            presentCount,
            percentage: attendancePercentage
          }
        },
        'Student dashboard retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get authenticated student's room & roommates
// @route   GET /api/students/me/room
// @access  Private (Student only)
const getMyRoom = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate({
      path: 'allocation',
      populate: ['room', 'bed', 'building', 'hostel']
    });

    if (!student || !student.allocation) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { hasAllocation: false, message: 'You have not been allocated a hostel room yet.' },
          'No active allocation'
        )
      );
    }

    const { room, bed, building, hostel } = student.allocation;

    // Roommates list
    const roommateAllocations = await RoomAllocation.find({
      room: room._id,
      status: 'active',
      student: { $ne: student._id }
    })
      .populate('bed', 'bedNumber')
      .populate({
        path: 'student',
        select: 'studentId department session user',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      });

    // Check existing room change requests
    const pendingChangeRequest = await RoomChangeRequest.findOne({
      student: student._id,
      status: 'pending'
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          hasAllocation: true,
          room,
          bed,
          building,
          hostel,
          roommates: roommateAllocations,
          pendingChangeRequest
        },
        'Room details retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Room Change Request
// @route   POST /api/students/me/room-change
// @access  Private (Student only)
const requestRoomChange = async (req, res, next) => {
  try {
    const { preferredRoomId, reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return next(new ApiError(400, 'Please provide a clear reason (minimum 10 characters)'));
    }

    const student = await Student.findOne({ user: req.user._id }).populate('allocation');
    if (!student || !student.allocation) {
      return next(new ApiError(400, 'You must have an active room allocation to request a room change'));
    }

    const existingPending = await RoomChangeRequest.findOne({
      student: student._id,
      status: 'pending'
    });

    if (existingPending) {
      return next(new ApiError(400, 'You already have a pending room change request under warden review'));
    }

    const request = await RoomChangeRequest.create({
      student: student._id,
      currentRoom: student.allocation.room,
      currentBed: student.allocation.bed,
      preferredRoom: preferredRoomId || null,
      reason: reason.trim(),
      status: 'pending'
    });

    res.status(201).json(new ApiResponse(201, request, 'Room change request submitted for review'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  getMyDashboard,
  getMyRoom,
  requestRoomChange
};
