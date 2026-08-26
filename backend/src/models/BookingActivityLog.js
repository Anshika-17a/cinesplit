const mongoose = require('mongoose');

const bookingActivityLogSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  showId: { type: Number, required: true },
  seatIds: { type: [Number], required: true },
  action: { 
    type: String, 
    enum: ['attempt', 'success', 'conflict', 'cancelled'], 
    required: true 
  },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookingActivityLog', bookingActivityLogSchema);
