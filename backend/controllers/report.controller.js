/**
 * NIYD Hostel Management System - Reports & Analytics Controller
 */
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Student = require('../models/Student');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const AdmissionApplication = require('../models/AdmissionApplication');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get Detailed Hostel Occupancy Report
// @route   GET /api/reports/occupancy
// @access  Private (Admin only)
const getOccupancyReport = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('building', 'name code')
      .populate({
        path: 'beds',
        populate: {
          path: 'currentOccupant',
          select: 'studentId department user',
          populate: { path: 'user', select: 'firstName lastName email' }
        }
      })
      .sort({ floor: 1, roomNumber: 1 });

    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
    const totalOccupied = rooms.reduce((acc, r) => acc + r.currentOccupancy, 0);
    const availableBeds = Math.max(0, totalCapacity - totalOccupied);

    // Grouping by floor
    const floorBreakdown = {};
    rooms.forEach((r) => {
      const fl = `Floor ${r.floor}`;
      if (!floorBreakdown[fl]) {
        floorBreakdown[fl] = { rooms: 0, capacity: 0, occupied: 0, available: 0 };
      }
      floorBreakdown[fl].rooms += 1;
      floorBreakdown[fl].capacity += r.capacity;
      floorBreakdown[fl].occupied += r.currentOccupancy;
      floorBreakdown[fl].available += Math.max(0, r.capacity - r.currentOccupancy);
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          summary: {
            totalRooms,
            totalCapacity,
            totalOccupied,
            availableBeds,
            occupancyPercentage: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
          },
          floorBreakdown,
          rooms
        },
        'Occupancy report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Financial & Fee Collection Analytics Report
// @route   GET /api/reports/financial
// @access  Private (Admin only)
const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const invoices = await Invoice.find(filter);
    const payments = await Payment.find(filter);

    const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalCollected = payments
      .filter((p) => p.status === 'verified')
      .reduce((acc, p) => acc + p.amount, 0);
    const totalOutstanding = Math.max(0, totalBilled - totalCollected);

    // Group payments by method (bKash, Nagad, Cash, Bank)
    const methodBreakdown = {};
    payments
      .filter((p) => p.status === 'verified')
      .forEach((p) => {
        methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + p.amount;
      });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalBilled,
          totalCollected,
          totalOutstanding,
          collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
          methodBreakdown,
          invoiceCount: invoices.length,
          paymentCount: payments.length
        },
        'Financial report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get Maintenance Analytics Report
// @route   GET /api/reports/maintenance
// @access  Private (Admin only)
const getMaintenanceReport = async (req, res, next) => {
  try {
    const totalRequests = await MaintenanceRequest.countDocuments();
    const completedRequests = await MaintenanceRequest.countDocuments({ status: 'completed' });
    const inProgressRequests = await MaintenanceRequest.countDocuments({ status: 'in_progress' });
    const submittedRequests = await MaintenanceRequest.countDocuments({ status: 'submitted' });

    // Category breakdown
    const categoryStats = await MaintenanceRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Priority breakdown
    const priorityStats = await MaintenanceRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalRequests,
          completedRequests,
          inProgressRequests,
          submittedRequests,
          resolutionRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0,
          categoryStats,
          priorityStats
        },
        'Maintenance analytics generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOccupancyReport,
  getFinancialReport,
  getMaintenanceReport
};
