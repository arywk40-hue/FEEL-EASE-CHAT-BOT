const Booking = require('../models/Booking');
const Journey = require('../models/Journey');
const { createBookingWithProvider } = require('../services/bookingService');

// Get all bookings for a user
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('journeyId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
};

// Get a specific booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('journeyId')
      .populate('userId', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking'
    });
  }
};

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { journeyId, passengers } = req.body;
    
    if (!journeyId || !passengers || !Array.isArray(passengers)) {
      return res.status(400).json({
        success: false,
        message: 'Journey ID and passengers array are required'
      });
    }
    
    // Get the journey
    const journey = await Journey.findById(journeyId);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Journey not found'
      });
    }
    
    // Check if user owns this journey
    if (journey.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to book this journey'
      });
    }
    
    // Check if an option is selected
    if (!journey.selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'No travel option selected for this journey'
      });
    }
    
    // Get the selected option
    const selectedOption = journey.options.id(journey.selectedOption);
    
    if (!selectedOption) {
      return res.status(400).json({
        success: false,
        message: 'Invalid selected option'
      });
    }
    
    // Create booking with the provider
    const providerBooking = await createBookingWithProvider(
      selectedOption, 
      passengers, 
      req.user
    );
    
    // Create booking in our database
    const booking = new Booking({
      journeyId,
      userId: req.user.id,
      optionId: journey.selectedOption,
      passengers,
      totalPrice: selectedOption.price * passengers.length,
      providerData: providerBooking,
      status: 'confirmed',
      paymentStatus: 'paid'
    });
    
    await booking.save();
    
    // Populate the booking with journey details
    await booking.populate('journeyId');
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating booking'
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be cancelled'
      });
    }
    
    // TODO: Implement cancellation with provider API
    // For now, we'll just update the status in our database
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling booking'
    });
  }
};

// Get booking by reference
const getBookingByReference = async (req, res) => {
  try {
    const { reference } = req.params;
    
    const booking = await Booking.findOne({ bookingReference: reference })
      .populate('journeyId')
      .populate('userId', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking by reference error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking'
    });
  }
};

module.exports = {
  getUserBookings,
  getBooking,
  createBooking,
  cancelBooking,
  getBookingByReference
};