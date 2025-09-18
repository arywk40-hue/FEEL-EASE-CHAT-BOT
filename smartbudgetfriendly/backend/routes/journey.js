const express = require('express');
const auth = require('../middleware/auth');
const Journey = require('../models/Journey');
const { calculateRoutes } = require('../services/routeCalculator');

const router = express.Router();

// Get all journeys for a user
router.get('/', auth, async (req, res) => {
  try {
    const journeys = await Journey.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.json(journeys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific journey
router.get('/:id', auth, async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);
    
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    
    // Check if user owns this journey
    if (journey.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(journey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new journey and calculate routes
router.post('/', auth, async (req, res) => {
  try {
    const { origin, destination, travelDate, passengers } = req.body;
    
    // Create journey document
    const journey = new Journey({
      origin,
      destination,
      travelDate,
      passengers: passengers || 1,
      userId: req.user.id
    });
    
    // Calculate routes using external APIs
    const travelOptions = await calculateRoutes(origin, destination, travelDate, passengers);
    journey.options = travelOptions;
    
    await journey.save();
    
    res.status(201).json(journey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Select an option for a journey
router.put('/:id/select-option', auth, async (req, res) => {
  try {
    const { optionId } = req.body;
    
    const journey = await Journey.findById(req.params.id);
    
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    
    // Check if user owns this journey
    if (journey.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Check if option exists
    const optionExists = journey.options.some(option => option._id.toString() === optionId);
    if (!optionExists) {
      return res.status(400).json({ message: 'Invalid option' });
    }
    
    journey.selectedOption = optionId;
    await journey.save();
    
    res.json(journey);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;