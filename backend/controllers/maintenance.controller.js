/**
 * NIYD Hostel Management System - Maintenance Controller
 */
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, getPaginationMeta } = require('../utils/pagination');
const { MAINTENANCE_STATUS, MAINTENANCE_CATEGORY, MAINTENANCE_PRIORITY, ROLES } = require('../utils/constants');

// @desc    Submit new maintenance request (Student)
// @route   POST /api/maintenance
// @access  Private (Student only)
const submitRequest = async (req, res, next) => {
  try {
    const { category, priority, title, description, images } = req.body;

    if (!category || !title || !description) {
      return next(new ApiError(400, 'Please provide category, title, and detailed description'));
    }

    // Crucial Security Rule: Look up student's actual active room allocation from DB
    const student = await Student.findOne({ user: req.user._id }).populate({
      path: 'allocation',
      populate: ['room', 'building']
    });

    if (!student || !student.allocation || !student.allocation.room) {
      return next(
        new ApiError(
          400,
          'You must be actively allocated to a hostel room to submit a maintenance complaint'
        )
      );
    }

    const { room, building } = student.allocation;

    const request = await MaintenanceRequest.create({
      student: student._id,
      room: room._id,
      building: building ? building._id : undefined,
      category,
      priority: priority || MAINTENANCE_PRIORITY.MEDIUM,
      title: title.trim(),
      description: description.trim(),
      images: images || [],
      status: MAINTENANCE_STATUS.SUBMITTED,
      statusHistory: [
        {
          status: MAINTENANCE_STATUS.SUBMITTED,
          changedBy: req.user._id,
          notes: 'Maintenance complaint submitted by student'
        }
      ]
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          requestNumber: request.requestNumber,
          category: request.category,
          status: request.status,
          roomNumber: room.roomNumber
        },
        'Maintenance request submitted successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Maintenance Requests (Admin / Staff)
// @route   GET /api/maintenance
// @access  Private
const getRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, category, priority, search } = req.query;

    const filter = {};

    // Role-based restrictions
    if (req.user.role === ROLES.STAFF) {
      // Find staff profile
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff) return next(new ApiError(404, 'Staff profile not found'));
      filter.assignedTo = staff._id;
    } else if (req.user.role === ROLES.STUDENT) {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return next(new ApiError(404, 'Student profile not found'));
      filter.student = student._id;
    }

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;

    if (search) {
      filter.$or = [
        { requestNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await MaintenanceRequest.countDocuments(filter);
    const requests = await MaintenanceRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'student',
        select: 'studentId user',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      })
      .populate('room', 'roomNumber floor')
      .populate('building', 'name code')
      .populate({
        path: 'assignedTo',
        select: 'staffId designation user',
        populate: { path: 'user', select: 'firstName lastName phone' }
      });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          requests,
          pagination: getPaginationMeta(total, page, limit)
        },
        'Maintenance requests retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Maintenance Request by ID
// @route   GET /api/maintenance/:id
// @access  Private
const getRequestById = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'studentId user department',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      })
      .populate('room', 'roomNumber floor type')
      .populate('building', 'name code')
      .populate({
        path: 'assignedTo',
        select: 'staffId designation specialization user',
        populate: { path: 'user', select: 'firstName lastName phone' }
      })
      .populate('adminNotes.addedBy', 'firstName lastName')
      .populate('staffNotes.addedBy', 'firstName lastName');

    if (!request) {
      return next(new ApiError(404, 'Maintenance request not found'));
    }

    // Role ownership check for students
    if (req.user.role === ROLES.STUDENT) {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || request.student._id.toString() !== student._id.toString()) {
        return next(new ApiError(403, 'Forbidden: You cannot view maintenance requests of other students'));
      }
    }

    res.status(200).json(new ApiResponse(200, request, 'Maintenance request retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Assign Staff Member to Request (Admin)
// @route   PUT /api/maintenance/:id/assign
// @access  Private (Admin only)
const assignStaff = async (req, res, next) => {
  try {
    const { staffId, priority, adminNote } = req.body;

    if (!staffId) {
      return next(new ApiError(400, 'Staff ID is required to assign task'));
    }

    const staff = await Staff.findById(staffId).populate('user', 'firstName lastName');
    if (!staff) {
      return next(new ApiError(404, 'Staff member not found'));
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return next(new ApiError(404, 'Maintenance request not found'));
    }

    request.assignedTo = staff._id;
    request.assignedAt = new Date();
    request.assignedBy = req.user._id;
    request.status = MAINTENANCE_STATUS.ASSIGNED;
    if (priority) request.priority = priority;

    if (adminNote) {
      request.adminNotes.push({
        note: adminNote,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    request.statusHistory.push({
      status: MAINTENANCE_STATUS.ASSIGNED,
      changedBy: req.user._id,
      notes: `Assigned to ${staff.user.firstName} ${staff.user.lastName} (${staff.designation})`
    });

    await request.save();

    res.status(200).json(new ApiResponse(200, request, 'Task assigned to maintenance staff successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Update Maintenance Request Status (Admin / Staff)
// @route   PUT /api/maintenance/:id/status
// @access  Private (Admin or Assigned Staff)
const updateStatus = async (req, res, next) => {
  try {
    const { status, note, rejectionReason } = req.body;

    if (!Object.values(MAINTENANCE_STATUS).includes(status)) {
      return next(new ApiError(400, 'Invalid maintenance status'));
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return next(new ApiError(404, 'Maintenance request not found'));
    }

    // If staff, verify this task is assigned to them
    if (req.user.role === ROLES.STAFF) {
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff || !request.assignedTo || request.assignedTo.toString() !== staff._id.toString()) {
        return next(new ApiError(403, 'Forbidden: You can only update tasks assigned to you'));
      }
    }

    request.status = status;
    if (status === MAINTENANCE_STATUS.COMPLETED) {
      request.completedAt = new Date();
    }
    if (status === MAINTENANCE_STATUS.REJECTED && rejectionReason) {
      request.rejectionReason = rejectionReason;
    }

    // Add note to staffNotes or adminNotes
    if (note) {
      if (req.user.role === ROLES.STAFF) {
        request.staffNotes.push({
          note,
          addedBy: req.user._id,
          addedAt: new Date()
        });
      } else {
        request.adminNotes.push({
          note,
          addedBy: req.user._id,
          addedAt: new Date()
        });
      }
    }

    request.statusHistory.push({
      status,
      changedBy: req.user._id,
      notes: note || `Status updated to ${status}`
    });

    await request.save();

    res.status(200).json(new ApiResponse(200, request, `Maintenance status updated to ${status}`));
  } catch (err) {
    next(err);
  }
};

// @desc    Get Authenticated Student's Complaints
// @route   GET /api/maintenance/my-requests
// @access  Private (Student only)
const getMyRequests = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ApiError(404, 'Student profile not found'));
    }

    const requests = await MaintenanceRequest.find({ student: student._id })
      .sort({ createdAt: -1 })
      .populate('room', 'roomNumber floor')
      .populate({
        path: 'assignedTo',
        select: 'designation user',
        populate: { path: 'user', select: 'firstName lastName phone' }
      });

    res.status(200).json(new ApiResponse(200, requests, 'Student maintenance requests retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  getRequests,
  getRequestById,
  assignStaff,
  updateStatus,
  getMyRequests
};
