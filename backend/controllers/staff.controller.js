/**
 * NIYD Hostel Management System - Staff Controller
 */
const Staff = require('../models/Staff');
const User = require('../models/User');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { ROLES, MAINTENANCE_STATUS } = require('../utils/constants');

// @desc    Get All Staff Members (Admin)
// @route   GET /api/staff
// @access  Private (Admin only)
const getAllStaff = async (req, res, next) => {
  try {
    const staffMembers = await Staff.find()
      .populate('user', 'firstName lastName email phone isActive')
      .populate('assignedHostel', 'name code');

    res.status(200).json(new ApiResponse(200, staffMembers, 'Staff directory retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Create New Staff Member (Admin)
// @route   POST /api/staff
// @access  Private (Admin only)
const createStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, designation, department, specialization } = req.body;

    if (!firstName || !lastName || !email || !designation) {
      return next(new ApiError(400, 'Please provide first name, last name, email, and designation'));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new ApiError(400, 'An account with this email already exists'));
    }

    // 1. Create User
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: 'Staff@123', // Default staff password
      role: ROLES.STAFF
    });

    // 2. Generate Staff ID
    const count = await Staff.countDocuments();
    const staffId = `STAFF-${String(count + 1).padStart(3, '0')}`;

    // 3. Create Staff profile
    const staff = await Staff.create({
      user: user._id,
      staffId,
      designation,
      department: department || 'Hostel Maintenance & Facility Management',
      specialization: specialization || ['general_maintenance']
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          staffId: staff.staffId,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          designation: staff.designation
        },
        'Staff member created successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Authenticated Staff Dashboard
// @route   GET /api/staff/me/dashboard
// @access  Private (Staff only)
const getMyStaffDashboard = async (req, res, next) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id }).populate('user');
    if (!staff) {
      return next(new ApiError(404, 'Staff record not found'));
    }

    // Task counts
    const assignedCount = await MaintenanceRequest.countDocuments({
      assignedTo: staff._id,
      status: { $in: [MAINTENANCE_STATUS.ASSIGNED, MAINTENANCE_STATUS.IN_PROGRESS] }
    });

    const urgentCount = await MaintenanceRequest.countDocuments({
      assignedTo: staff._id,
      priority: 'urgent',
      status: { $ne: MAINTENANCE_STATUS.COMPLETED }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedToday = await MaintenanceRequest.countDocuments({
      assignedTo: staff._id,
      status: MAINTENANCE_STATUS.COMPLETED,
      completedAt: { $gte: startOfToday }
    });

    // Recent active tasks
    const activeTasks = await MaintenanceRequest.find({
      assignedTo: staff._id,
      status: { $in: [MAINTENANCE_STATUS.ASSIGNED, MAINTENANCE_STATUS.IN_PROGRESS] }
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(6)
      .populate('room', 'roomNumber floor')
      .populate('building', 'name code')
      .populate({
        path: 'student',
        select: 'studentId user',
        populate: { path: 'user', select: 'firstName lastName phone' }
      });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          staff,
          stats: {
            activeTasks: assignedCount,
            urgentTasks: urgentCount,
            completedToday
          },
          recentTasks: activeTasks
        },
        'Staff dashboard data retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStaff,
  createStaff,
  getMyStaffDashboard
};
