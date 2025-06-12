const mongoose = require('mongoose');

const travellerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Traveller first name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Traveller last name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Traveller date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Traveller gender is required']
  },
  passportNumber: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    required: [true, 'Traveller nationality is required'],
    trim: true
  }
}, { _id: true });

const flightDetailsSchema = new mongoose.Schema({
  airline: {
    type: String,
    required: true,
    trim: true
  },
  flightNumber: {
    type: String,
    required: true,
    trim: true
  },
  departure: {
    airport: { type: String, required: true },
    city: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }
  },
  arrival: {
    airport: { type: String, required: true },
    city: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }
  },
  class: {
    type: String,
    enum: ['economy', 'premium-economy', 'business', 'first'],
    default: 'economy'
  }
}, { _id: false });

const hotelDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  roomType: {
    type: String,
    required: true,
    trim: true
  },
  numberOfRooms: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Booking details
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true,
    trim: true
  },
  
  // Travel information
  destination: {
    city: {
      type: String,
      required: [true, 'Destination city is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Destination country is required'],
      trim: true
    }
  },
  
  origin: {
    city: {
      type: String,
      required: [true, 'Origin city is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Origin country is required'],
      trim: true
    }
  },

  // Travel dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  lastTravelDate: {
    type: Date,
    required: [true, 'Last travel date is required']
  },

  // Booking type and status
  bookingType: {
    type: String,
    enum: ['flight', 'hotel', 'package', 'car-rental'],
    required: [true, 'Booking type is required']
  },
  
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'confirmed'
  },

  // Travellers
  travellers: [travellerSchema],

  // Service details
  flightDetails: flightDetailsSchema,
  hotelDetails: hotelDetailsSchema,

  // Pricing
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    trim: true
  },
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'paid'
  },
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'debit-card', 'paypal', 'bank-transfer'],
    required: [true, 'Payment method is required']
  },

  // Additional information
  specialRequests: {
    type: String,
    trim: true
  },
  
  // Booking metadata
  bookingSource: {
    type: String,
    enum: ['web', 'mobile', 'agent'],
    default: 'web'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for booking status based on last travel date
orderSchema.virtual('bookingStatus').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastTravelDate = new Date(this.lastTravelDate);
  lastTravelDate.setHours(0, 0, 0, 0);
  
  return lastTravelDate >= today ? 'upcoming' : 'completed';
});

// Virtual for duration in days
orderSchema.virtual('durationDays').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
orderSchema.index({ userId: 1 });
orderSchema.index({ lastTravelDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Compound index for user bookings by status
orderSchema.index({ userId: 1, lastTravelDate: -1 });

module.exports = mongoose.model('Order', orderSchema);