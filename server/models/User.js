const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  project_url: { type: String, default: '' },
  image_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, { _id: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  user_type: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },
  professional_title: {
    type: String,
    default: ''
  },
  hourly_rate: {
    type: Number,
    default: 0
  },
  is_premium: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  portfolio: {
    type: [portfolioItemSchema],
    default: []
  },
  rating: {
    type: Number,
    default: 0
  },
  total_tasks_completed: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
