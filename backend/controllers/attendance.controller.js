/**
 * NIYD Hostel Management System - Attendance Controller
 */
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { ATTENDANCE_STATUS } = require('../utils/constants');

// Helper to normalize calendar date to start of day (midnight UTC / local)
const normalizeDate = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc    Get Daily Attendance Sheet for Date (Admin)
// @route   GET /api/attendance
// @access  Private (Admin only)
const getDailyAttendance = async (req, res, next) => {
  try {
    const { date, buildingId, status, search } = req.query;
    const targetDate = normalizeDate(date);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get all active residential students
    const studentQuery = { status: 'active' };
    const allStudents = await Student.find(studentQuery)
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'allocation',
        populate: ['room', 'bed', 'building']
      });

    // Find attendance records for target date
    const attendanceRecords = await Attendance.find({
      date: { $gte: targetDate, $lt: nextDate }
    });

    const recordMap = new Map();
    attendanceRecords.forEach((record) => {
      recordMap.set(record.student.toString(), record);
    });

    // Merge students with attendance status
    let rows = allStudents.map((student) => {
      const record = recordMap.get(student._id.toString());
      return {
        studentId: student._id,
        studentCode: student.studentId,
        studentName: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
        department: student.department,
        roomNumber: student.allocation?.room?.roomNumber || 'N/A',
        bedNumber: student.allocation?.bed?.bedNumber || 'N/A',
        buildingName: student.allocation?.building?.name || 'N/A',
        buildingId: student.allocation?.building?._id?.toString() || null,
        attendanceId: record ? record._id : null,
        status: record ? record.status : 'not_marked',
        checkIn: record ? record.checkIn : null,
        checkOut: record ? record.checkOut : null,
        notes: record ? record.notes : ''
      };
    });

    // Filter by building if requested
    if (buildingId) {
      rows = rows.filter((r) => r.buildingId === buildingId);
    }

    // Filter by status if requested
    if (status && status !== 'all') {
      rows = rows.filter((r) => r.status === status);
    }

    // Filter by search keyword
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.studentCode.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.roomNumber.toLowerCase().includes(q)
      );
    }

    // Calculate daily summary stats
    const totalCount = allStudents.length;
    const presentCount = attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
    const absentCount = attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.ABSENT).length;
    const checkedOutCount = attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.CHECKED_OUT).length;
    const lateCount = attendanceRecords.filter((a) => a.status === ATTENDANCE_STATUS.LATE_RETURN).length;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          date: targetDate,
          stats: {
            total: totalCount,
            present: presentCount,
            absent: absentCount,
            checkedOut: checkedOutCount,
            late: lateCount,
            unmarked: Math.max(0, totalCount - attendanceRecords.length)
          },
          students: rows
        },
        'Daily attendance retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Mark or Update Individual Attendance Record
// @route   POST /api/attendance/mark
// @access  Private (Admin only)
const markAttendance = async (req, res, next) => {
  try {
    const { studentId, date, status, notes } = req.body;

    if (!studentId || !status) {
      return next(new ApiError(400, 'Student ID and attendance status are required'));
    }

    const targetDate = normalizeDate(date);
    const now = new Date();

    const record = await Attendance.findOneAndUpdate(
      { student: studentId, date: targetDate },
      {
        student: studentId,
        date: targetDate,
        status,
        checkIn: status === 'present' ? now : undefined,
        markedBy: req.user._id,
        notes: notes || undefined
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(new ApiResponse(200, record, `Attendance marked as ${status}`));
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk Mark Present for all residents (or unmarked)
// @route   POST /api/attendance/bulk-mark
// @access  Private (Admin only)
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { date, status = ATTENDANCE_STATUS.PRESENT } = req.body;
    const targetDate = normalizeDate(date);

    const activeStudents = await Student.find({ status: 'active' }).select('_id');
    const now = new Date();

    const operations = activeStudents.map((s) => ({
      updateOne: {
        filter: { student: s._id, date: targetDate },
        update: {
          $set: {
            status,
            checkIn: status === 'present' ? now : undefined,
            markedBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    if (operations.length) {
      await Attendance.bulkWrite(operations);
    }

    res.status(200).json(
      new ApiResponse(
        200,
        { updatedCount: operations.length },
        `Bulk attendance recorded for ${operations.length} students`
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Student Check-out record (late departure / weekend leave)
// @route   PUT /api/attendance/:id/checkout
// @access  Private (Admin only)
const recordCheckOut = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return next(new ApiError(404, 'Attendance record not found'));
    }

    record.checkOut = new Date();
    record.status = ATTENDANCE_STATUS.CHECKED_OUT;
    await record.save();

    res.status(200).json(new ApiResponse(200, record, 'Student check-out recorded'));
  } catch (err) {
    next(err);
  }
};

// @desc    Get Student's Own Attendance History
// @route   GET /api/attendance/my-history
// @access  Private (Student only)
const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ApiError(404, 'Student profile not found'));
    }

    const records = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(60);

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          records,
          summary: {
            total: records.length,
            present: presentCount,
            absent: absentCount,
            percentage: records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100
          }
        },
        'Attendance history retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyAttendance,
  markAttendance,
  bulkMarkAttendance,
  recordCheckOut,
  getMyAttendanceHistory
};
