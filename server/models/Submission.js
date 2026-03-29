const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  phase_index: {
    type: Number,
    required: true,
  },
  freelancer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_url: { type: String, required: true },
  file_type: {
    type: String,
    enum: ['image', 'video', 'document'],
    default: 'image',
  },
  original_name: { type: String, default: '' },
  note: { type: String, default: '' },
  is_approved: { type: Boolean, default: false },
  submitted_at: { type: Date, default: Date.now },
  approved_at: { type: Date, default: null },
});

module.exports = mongoose.model('Submission', submissionSchema);
