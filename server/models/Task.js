const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  deadline_minutes: { type: Number, default: 120 }, // default 2 hours
  started_at: { type: Date, default: null },
  completed_at: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'overdue'],
    default: 'pending'
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  category: { type: String, required: true },
  urgency: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  required_skills: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  freelancer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  phases: { type: [phaseSchema], default: [] },
  current_phase_index: { type: Number, default: 0 },
  penalty_applied: { type: Number, default: 0 }, // in dollars
  commission_amount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

taskSchema.virtual('applications', {
  ref: 'TaskApplication',
  localField: '_id',
  foreignField: 'task_id',
});

// Virtual: freelancer net payout (budget minus 10% commission minus platform penalties)
taskSchema.virtual('net_payout').get(function () {
  return Math.max(0, this.budget - this.commission_amount - this.penalty_applied);
});

module.exports = mongoose.model('Task', taskSchema);
