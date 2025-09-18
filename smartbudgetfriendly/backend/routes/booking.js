const express = require('express');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Journey = require('../models/Journey');
const { createBookingWithProvider } = require('../services/bookingService');

const router = express.Router();

// Get all bookings for a user
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('journeyId')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { journeyId, passengers } = req.body;
    
    // Get the journey
    const journey = await Journey.findById(journeyId);
    
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    
    // Check if user owns this journey
    if (journey.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if an option is selected
    if (!journey.selectedOption) {
      return res.status(400).json({ message: 'No travel option selected' });
    }
    
    // Get the selected option
    const selectedOption = journey.options.id(journey.selectedOption);
    
    if (!selectedOption) {
      return res.status(400).json({ message: 'Invalid selected option' });
    }
    
    // Create booking with the provider (IRCTC, RedBus, etc.)
    const providerBooking = await createBookingWithProvider(selectedOption, passengers, req.user);
    
    // Create booking in our database
    const booking = new Booking({
      journeyId,
      userId: req.user.id,
      optionId: journey.selectedOption,
      passengers,
      totalPrice: selectedOption.price * passengers.length,
      providerData: providerBooking
    });
    
    await booking.save();
    
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if booking can be cancelled
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }
    
    // TODO: Implement cancellation with provider API
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;