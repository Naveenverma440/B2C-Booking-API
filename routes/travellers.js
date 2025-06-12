const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { validate, travellerSchema, travellerIdSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/travellers
 * @desc    Get all travellers for the authenticated user
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique travellers from user's bookings
    const bookingsWithTravellers = await Order.find({ userId })
      .select('travellers bookingReference destination')
      .lean();

    // Extract and deduplicate travellers
    const travellersMap = new Map();
    
    bookingsWithTravellers.forEach(booking => {
      booking.travellers.forEach(traveller => {
        const key = `${traveller.firstName}-${traveller.lastName}-${traveller.dateOfBirth}`;
        if (!travellersMap.has(key)) {
          travellersMap.set(key, {
            ...traveller,
            bookingReferences: [booking.bookingReference]
          });
        } else {
          const existing = travellersMap.get(key);
          if (!existing.bookingReferences.includes(booking.bookingReference)) {
            existing.bookingReferences.push(booking.bookingReference);
          }
        }
      });
    });

    const uniqueTravellers = Array.from(travellersMap.values());

    res.status(200).json({
      status: 'success',
      message: 'Travellers retrieved successfully',
      data: {
        travellers: uniqueTravellers,
        totalTravellers: uniqueTravellers.length
      }
    });

  } catch (error) {
    console.error('Get travellers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve travellers'
    });
  }
});

/**
 * @route   POST /api/travellers
 * @desc    Add a new traveller to a specific booking
 * @access  Private
 */
router.post('/', authenticateToken, validate(travellerSchema), async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookingId, ...travellerData } = req.body;

    // Validate booking ID if provided
    if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID format'
      });
    }

    // If bookingId is provided, add traveller to specific booking
    if (bookingId) {
      const booking = await Order.findOne({ _id: bookingId, userId });
      
      if (!booking) {
        return res.status(404).json({
          status: 'error',
          message: 'Booking not found'
        });
      }

      // Check if traveller already exists in this booking
      const existingTraveller = booking.travellers.find(t => 
        t.firstName.toLowerCase() === travellerData.firstName.toLowerCase() &&
        t.lastName.toLowerCase() === travellerData.lastName.toLowerCase() &&
        new Date(t.dateOfBirth).getTime() === new Date(travellerData.dateOfBirth).getTime()
      );

      if (existingTraveller) {
        return res.status(400).json({
          status: 'error',
          message: 'Traveller already exists in this booking'
        });
      }

      // Add traveller to booking
      booking.travellers.push(travellerData);
      await booking.save();

      const addedTraveller = booking.travellers[booking.travellers.length - 1];

      res.status(201).json({
        status: 'success',
        message: 'Traveller added to booking successfully',
        data: {
          traveller: addedTraveller,
          bookingReference: booking.bookingReference
        }
      });
    } else {
      // If no bookingId provided, return error as we need to know which booking to add to
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID is required to add a traveller'
      });
    }

  } catch (error) {
    console.error('Add traveller error:', error);
    
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
      message: 'Failed to add traveller'
    });
  }
});

/**
 * @route   PUT /api/travellers/:traveller_id
 * @desc    Update a traveller in a specific booking
 * @access  Private
 */
router.put('/:traveller_id', authenticateToken, validate(travellerIdSchema, 'params'), validate(travellerSchema), async (req, res) => {
  try {
    const userId = req.user._id;
    const travellerId = req.params.traveller_id;
    const { bookingId, ...updateData } = req.body;

    // Validate booking ID
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid booking ID is required'
      });
    }

    // Find the booking
    const booking = await Order.findOne({ _id: bookingId, userId });
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Find the traveller in the booking
    const travellerIndex = booking.travellers.findIndex(t => t._id.toString() === travellerId);
    
    if (travellerIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveller not found in this booking'
      });
    }

    // Check if updated traveller data conflicts with existing travellers (excluding current one)
    const conflictingTraveller = booking.travellers.find((t, index) => 
      index !== travellerIndex &&
      t.firstName.toLowerCase() === updateData.firstName.toLowerCase() &&
      t.lastName.toLowerCase() === updateData.lastName.toLowerCase() &&
      new Date(t.dateOfBirth).getTime() === new Date(updateData.dateOfBirth).getTime()
    );

    if (conflictingTraveller) {
      return res.status(400).json({
        status: 'error',
        message: 'A traveller with these details already exists in this booking'
      });
    }

    // Update the traveller
    Object.keys(updateData).forEach(key => {
      booking.travellers[travellerIndex][key] = updateData[key];
    });

    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Traveller updated successfully',
      data: {
        traveller: booking.travellers[travellerIndex],
        bookingReference: booking.bookingReference
      }
    });

  } catch (error) {
    console.error('Update traveller error:', error);
    
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
      message: 'Failed to update traveller'
    });
  }
});

/**
 * @route   DELETE /api/travellers/:traveller_id
 * @desc    Delete a traveller from a specific booking
 * @access  Private
 */
router.delete('/:traveller_id', authenticateToken, validate(travellerIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.user._id;
    const travellerId = req.params.traveller_id;
    const { bookingId } = req.body;

    // Validate booking ID
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid booking ID is required'
      });
    }

    // Find the booking
    const booking = await Order.findOne({ _id: bookingId, userId });
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if booking has only one traveller
    if (booking.travellers.length <= 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete the last traveller from a booking'
      });
    }

    // Find the traveller in the booking
    const travellerIndex = booking.travellers.findIndex(t => t._id.toString() === travellerId);
    
    if (travellerIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Traveller not found in this booking'
      });
    }

    // Store traveller data before deletion for response
    const deletedTraveller = booking.travellers[travellerIndex];

    // Remove the traveller
    booking.travellers.splice(travellerIndex, 1);
    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Traveller deleted successfully',
      data: {
        deletedTraveller: {
          _id: deletedTraveller._id,
          firstName: deletedTraveller.firstName,
          lastName: deletedTraveller.lastName
        },
        bookingReference: booking.bookingReference,
        remainingTravellers: booking.travellers.length
      }
    });

  } catch (error) {
    console.error('Delete traveller error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete traveller'
    });
  }
});

module.exports = router;