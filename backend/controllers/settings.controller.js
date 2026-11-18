/**
 * NIYD Hostel Management System - Settings Controller
 */
const HostelSettings = require('../models/HostelSettings');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get All Settings
// @route   GET /api/settings
// @access  Private (Admin / Public fallback)
const getSettings = async (req, res, next) => {
  try {
    const settings = await HostelSettings.find();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json(new ApiResponse(200, settingsMap, 'Settings retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Update or Set Setting by Key
// @route   PUT /api/settings/:key
// @access  Private (Admin only)
const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, category, description } = req.body;

    const setting = await HostelSettings.findOneAndUpdate(
      { key },
      {
        key,
        value,
        category: category || 'general',
        description,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    res.status(200).json(new ApiResponse(200, setting, `Setting '${key}' updated`));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSetting
};
