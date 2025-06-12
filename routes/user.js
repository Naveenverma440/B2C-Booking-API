const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // User is already available from authenticateToken middleware
    const user = req.user;

    // Remove sensitive data and return user profile
    const userProfile = user.toObject();
    delete userProfile.password;
    delete userProfile.refreshToken;

    res.status(200).json({
      status: 'success',
      message: 'Profile retrieved successfully',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticateToken, validate(updateProfileSchema), async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Fields that are allowed to be updated
    const allowedUpdates = [
      'firstName',
      'lastName',
      'phone',
      'dateOfBirth',
      'gender',
      'address'
    ];

    // Filter out any fields that are not allowed to be updated
    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    // Check if there are any valid fields to update
    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields provided for update'
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredUpdateData,
      {
        new: true, // Return updated document
        runValidators: true // Run mongoose validators
      }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessage = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errorMessage
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   GET /api/user/stats
 * @desc    Get user statistics (bookings count, etc.)
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const Order = require('../models/Order');

    // Get booking statistics
    const totalBookings = await Order.countDocuments({ userId });
    
    const upcomingBookings = await Order.countDocuments({
      userId,
      lastTravelDate: { $gte: new Date() }
    });
    
    const completedBookings = await Order.countDocuments({
      userId,
      lastTravelDate: { $lt: new Date() }
    });

    // Get total amount spent
    const totalSpentResult = await Order.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].totalAmount : 0;

    // Get most recent booking
    const recentBooking = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('bookingReference destination createdAt');

    res.status(200).json({
      status: 'success',
      message: 'User statistics retrieved successfully',
      data: {
        stats: {
          totalBookings,
          upcomingBookings,
          completedBookings,
          totalSpent,
          recentBooking
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user statistics'
    });
  }
});

module.exports = router;