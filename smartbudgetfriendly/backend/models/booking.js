const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  passengers: [{
    name: String,
    age: Number,
    baggage: Number
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  bookingReference: String, // Provider's booking reference
  providerData: mongoose.Schema.Types.Mixed // Raw data from the provider
}, {
  timestamps: true
});

// Generate a unique booking reference
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = 'SB' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);