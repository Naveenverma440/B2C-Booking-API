const express = require('express');
const OpenAI = require('openai');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { validate, bookingQuerySchema, mongoIdSchema } = require('../middleware/validation');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings (upcoming or completed)
 * @access  Private
 * @query   status - 'upcoming' or 'completed'
 * @query   page - page number (default: 1)
 * @query   limit - items per page (default: 10, max: 100)
 */
router.get('/', authenticateToken, validate(bookingQuerySchema, 'query'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query based on status
    let query = { userId };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'upcoming') {
      query.lastTravelDate = { $gte: today };
    } else if (status === 'completed') {
      query.lastTravelDate = { $lt: today };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get bookings with pagination
    const bookings = await Order.find(query)
      .sort({ lastTravelDate: status === 'upcoming' ? 1 : -1 }) // Upcoming: earliest first, Completed: latest first
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const totalBookings = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);

    // Add virtual bookingStatus to each booking
    const bookingsWithStatus = bookings.map(booking => ({
      ...booking,
      bookingStatus: booking.lastTravelDate >= today ? 'upcoming' : 'completed',
      durationDays: Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))
    }));

    res.status(200).json({
      status: 'success',
      message: `${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'} bookings retrieved successfully`,
      data: {
        bookings: bookingsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve bookings'
    });
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a specific booking by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, validate(mongoIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.user._id;
    const bookingId = req.params.id;

    const booking = await Order.findOne({ _id: bookingId, userId })
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Add virtual fields
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingWithStatus = {
      ...booking,
      bookingStatus: booking.lastTravelDate >= today ? 'upcoming' : 'completed',
      durationDays: Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))
    };

    res.status(200).json({
      status: 'success',
      message: 'Booking retrieved successfully',
      data: {
        booking: bookingWithStatus
      }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve booking'
    });
  }
});

/**
 * @route   POST /api/bookings/:id/summary
 * @desc    Generate AI-powered booking summary using OpenAI
 * @access  Private
 */
router.post('/:id/summary', authenticateToken, validate(mongoIdSchema, 'params'), async (req, res) => {
  try {
    const userId = req.user._id;
    const bookingId = req.params.id;

    // Get the booking
    const booking = await Order.findOne({ _id: bookingId, userId })
      .populate('userId', 'firstName lastName')
      .lean();

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Prepare booking details for AI summary
    const bookingDetails = {
      destination: `${booking.destination.city}, ${booking.destination.country}`,
      origin: `${booking.origin.city}, ${booking.origin.country}`,
      startDate: new Date(booking.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      endDate: new Date(booking.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      duration: Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)),
      bookingType: booking.bookingType,
      travellersCount: booking.travellers.length,
      totalAmount: booking.totalAmount,
      currency: booking.currency
    };

    // Add specific service details
    let serviceDetails = '';
    if (booking.flightDetails) {
      serviceDetails += `Flight: ${booking.flightDetails.airline} ${booking.flightDetails.flightNumber}, ${booking.flightDetails.class} class. `;
    }
    if (booking.hotelDetails) {
      serviceDetails += `Hotel: ${booking.hotelDetails.name}, ${booking.hotelDetails.roomType}, ${booking.hotelDetails.numberOfRooms} room(s). `;
    }

    // Create prompt for OpenAI
    const prompt = `Generate a friendly and engaging booking summary for a travel booking with the following details:

Destination: ${bookingDetails.destination}
Origin: ${bookingDetails.origin}
Travel Dates: ${bookingDetails.startDate} to ${bookingDetails.endDate}
Duration: ${bookingDetails.duration} days
Booking Type: ${bookingDetails.bookingType}
Number of Travellers: ${bookingDetails.travellersCount}
Total Amount: ${bookingDetails.currency} ${bookingDetails.totalAmount}
${serviceDetails}

Please create a warm, personalized summary that highlights the key aspects of this trip. Keep it concise but engaging, similar to: "You're traveling to Dubai from Delhi on 15th June 2025. Your booking includes round-trip flights and hotel stay for 5 days."

Make it sound exciting and personal, focusing on the destination and key highlights.`;

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a friendly travel assistant that creates engaging and personalized booking summaries for travelers. Keep summaries concise, warm, and exciting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const aiSummary = completion.choices[0].message.content.trim();

      res.status(200).json({
        status: 'success',
        message: 'Booking summary generated successfully',
        data: {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          summary: aiSummary,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback summary if OpenAI fails
      const fallbackSummary = `You're traveling to ${bookingDetails.destination} from ${bookingDetails.origin} on ${bookingDetails.startDate}. Your ${bookingDetails.duration}-day ${bookingDetails.bookingType} booking for ${bookingDetails.travellersCount} traveller(s) includes all the essentials for a great trip!`;

      res.status(200).json({
        status: 'success',
        message: 'Booking summary generated successfully (fallback)',
        data: {
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          summary: fallbackSummary,
          generatedAt: new Date().toISOString(),
          note: 'AI service temporarily unavailable, fallback summary provided'
        }
      });
    }

  } catch (error) {
    console.error('Generate booking summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate booking summary'
    });
  }
});

module.exports = router;