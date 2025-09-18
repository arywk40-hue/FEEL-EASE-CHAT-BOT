const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  origin: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  destination: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  travelDate: Date,
  passengers: Number,
  options: [{
    mode: String, // 'train', 'bus', 'flight', 'taxi', 'multi-modal'
    provider: String, // 'IRCTC', 'RedBus', 'Uber', etc.
    departureTime: Date,
    arrivalTime: Date,
    duration: Number, // in minutes
    price: Number,
    transfers: [{
      mode: String,
      details: String,
      duration: Number
    }],
    valueScore: Number, // 0-100 rating
    comfortScore: Number, // 0-10 rating
    details: mongoose.Schema.Types.Mixed // Flexible structure for provider-specific data
  }],
  selectedOption: mongoose.Schema.Types.ObjectId, // Reference to the chosen option
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Journey', journeySchema);