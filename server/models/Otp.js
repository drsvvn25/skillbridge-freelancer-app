const mongoose = require('mongoose');

// OTP expires automatically after 10 minutes via TTL index
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600  // 10 minutes in seconds
  }
});

// Index to allow fast lookup by email and enforce one OTP per email
otpSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Otp', otpSchema);
