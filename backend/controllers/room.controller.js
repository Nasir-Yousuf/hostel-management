/**
 * NIYD Hostel Management System - Room Controller
 */
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Building = require('../models/Building');
const Hostel = require('../models/Hostel');
const RoomAllocation = require('../models/RoomAllocation');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { ROOM_STATUS, ROOM_TYPE } = require('../utils/constants');

// @desc    Get all rooms with filter & search
// @route   GET /api/rooms
// @access  Private (Admin / Student / Staff)
const getRooms = async (req, res, next) => {
  try {
    const { buildingId, floor, status, type, search } = req.query;
    const filter = { isActive: true };

    if (buildingId) filter.building = buildingId;
    if (floor) filter.floor = Number(floor);
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (search) {
      filter.roomNumber = { $regex: search, $options: 'i' };
    }

    const rooms = await Room.find(filter)
      .populate('building', 'name code hostel floors')
      .populate({
        path: 'beds',
        populate: {
          path: 'currentOccupant',
          select: 'studentId user',
          populate: { path: 'user', select: 'firstName lastName email' }
        }
      })
      .sort({ floor: 1, roomNumber: 1 });

    res.status(200).json(new ApiResponse(200, rooms, 'Rooms retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('building')
      .populate({
        path: 'beds',
        populate: {
          path: 'currentOccupant',
          select: 'studentId user',
          populate: { path: 'user', select: 'firstName lastName email phone' }
        }
      });

    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    res.status(200).json(new ApiResponse(200, room, 'Room details retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Create new room & auto-generate beds
// @route   POST /api/rooms
// @access  Private (Admin only)
const createRoom = async (req, res, next) => {
  try {
    const { buildingId, roomNumber, floor, type, capacity, monthlyRent, amenities, description } = req.body;

    if (!buildingId || !roomNumber || !floor || !capacity) {
      return next(new ApiError(400, 'Please provide building, room number, floor, and capacity'));
    }

    // Verify building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return next(new ApiError(404, 'Building block not found'));
    }

    // Check duplicate room number in this building
    const existingRoom = await Room.findOne({ building: buildingId, roomNumber: roomNumber.trim() });
    if (existingRoom) {
      return next(new ApiError(400, `Room ${roomNumber} already exists in ${building.name}`));
    }

    const room = await Room.create({
      building: buildingId,
      roomNumber: roomNumber.trim(),
      floor: Number(floor),
      type: type || ROOM_TYPE.DOUBLE,
      capacity: Number(capacity),
      currentOccupancy: 0,
      monthlyRent: Number(monthlyRent) || 2500,
      amenities: amenities || ['wifi', 'study_table', 'wardrobe', 'fan'],
      status: ROOM_STATUS.AVAILABLE,
      description
    });

    // Auto-generate beds: A, B, C, D...
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const bedPromises = [];
    for (let i = 0; i < Number(capacity); i++) {
      const label = bedLabels[i] || `${i + 1}`;
      bedPromises.push(
        Bed.create({
          room: room._id,
          bedNumber: label,
          status: 'available'
        })
      );
    }
    await Promise.all(bedPromises);

    const populatedRoom = await Room.findById(room._id).populate('beds');

    res.status(201).json(
      new ApiResponse(201, populatedRoom, `Room ${room.roomNumber} created with ${capacity} beds`)
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Update room details (status, rent, amenities, description)
// @route   PUT /api/rooms/:id
// @access  Private (Admin only)
const updateRoom = async (req, res, next) => {
  try {
    const { status, monthlyRent, amenities, description } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    if (status) room.status = status;
    if (monthlyRent !== undefined) room.monthlyRent = Number(monthlyRent);
    if (amenities) room.amenities = amenities;
    if (description !== undefined) room.description = description;

    await room.save();
    res.status(200).json(new ApiResponse(200, room, 'Room updated successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Delete room (only if currentOccupancy === 0)
// @route   DELETE /api/rooms/:id
// @access  Private (Admin only)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return next(new ApiError(404, 'Room not found'));
    }

    if (room.currentOccupancy > 0) {
      return next(
        new ApiError(
          400,
          `Cannot delete room ${room.roomNumber} because it currently has ${room.currentOccupancy} occupant(s). Transfer or vacate students first.`
        )
      );
    }

    // Delete associated beds
    await Bed.deleteMany({ room: room._id });
    await Room.findByIdAndDelete(room._id);

    res.status(200).json(new ApiResponse(200, null, `Room ${room.roomNumber} and its beds deleted`));
  } catch (err) {
    next(err);
  }
};

// @desc    Get buildings & hostels list
// @route   GET /api/buildings
// @access  Private
const getBuildings = async (req, res, next) => {
  try {
    const buildings = await Building.find({ isActive: true }).populate('hostel');
    res.status(200).json(new ApiResponse(200, buildings, 'Buildings retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Get hostels list
// @route   GET /api/hostels
// @access  Private
const getHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isActive: true }).populate('warden', 'firstName lastName email');
    res.status(200).json(new ApiResponse(200, hostels, 'Hostels retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getBuildings,
  getHostels
};
