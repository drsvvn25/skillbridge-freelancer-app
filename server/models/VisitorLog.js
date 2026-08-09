const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  user_name: { type: String, default: 'Guest Visitor' },
  email: { type: String, default: 'N/A' },
  page: { type: String, default: '/' },
  user_agent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
