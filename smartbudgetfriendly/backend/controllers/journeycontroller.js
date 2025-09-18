const Journey = require('../models/Journey');
const { calculateRoutes } = require('../services/routeCalculator');

// Get all journeys for a user
const getUserJourneys = async (req, res) => {
  try {
    const journeys = await Journey.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.json({
      success: true,
      count: journeys.length,
      journeys
    });
  } catch (error) {
    console.error('Get journeys error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching journeys' 
    });
  }
};

// Get a specific journey
const getJourney = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);
    
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
        message: 'Not authorized to access this journey'
      });
    }
    
    res.json({
      success: true,
      journey
    });
  } catch (error) {
    console.error('Get journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching journey'
    });
  }
};

// Create a new journey and calculate routes
const createJourney = async (req, res) => {
  try {
    const { origin, destination, travelDate, passengers } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !travelDate) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and travel date are required'
      });
    }
    
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
    
    res.status(201).json({
      success: true,
      message: 'Journey created successfully',
      journey
    });
  } catch (error) {
    console.error('Create journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating journey'
    });
  }
};

// Select an option for a journey
const selectJourneyOption = async (req, res) => {
  try {
    const { optionId } = req.body;
    
    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }
    
    const journey = await Journey.findById(req.params.id);
    
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
        message: 'Not authorized to modify this journey'
      });
    }
    
    // Check if option exists
    const optionExists = journey.options.some(option => option._id.toString() === optionId);
    if (!optionExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }
    
    journey.selectedOption = optionId;
    await journey.save();
    
    res.json({
      success: true,
      message: 'Journey option selected successfully',
      journey
    });
  } catch (error) {
    console.error('Select option error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error selecting journey option'
    });
  }
};

// Delete a journey
const deleteJourney = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);
    
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
        message: 'Not authorized to delete this journey'
      });
    }
    
    await Journey.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Journey deleted successfully'
    });
  } catch (error) {
    console.error('Delete journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting journey'
    });
  }
};

module.exports = {
  getUserJourneys,
  getJourney,
  createJourney,
  selectJourneyOption,
  deleteJourney
};