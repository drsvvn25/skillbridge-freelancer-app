const express = require('express');
const router = express.Router();
const TaskApplication = require('../models/TaskApplication');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Apply for a Task
router.post('/', auth, async (req, res) => {
  try {
    const { task_id, proposal_text, bid_amount } = req.body;

    // Prevent duplicate applications
    const existing = await TaskApplication.findOne({ task_id, freelancer_id: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already applied to this task' });

    const application = new TaskApplication({
      task_id,
      freelancer_id: req.user._id,
      proposal_text: proposal_text || '',
      bid_amount,
    });
    await application.save();
    await application.populate('freelancer_id', 'full_name email rating');
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Applications
router.get('/', auth, async (req, res) => {
  try {
    const { task_id, freelancer_id } = req.query;
    let filter = {};
    if (task_id) filter.task_id = task_id;
    if (freelancer_id) filter.freelancer_id = freelancer_id;

    const applications = await TaskApplication.find(filter)
      .sort({ created_at: -1 })
      .populate('freelancer_id', 'full_name email rating')
      .populate({ path: 'task_id', populate: { path: 'client_id', select: 'full_name email' } });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept Application — triggers phase start
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const application = await TaskApplication.findById(req.params.id).populate('freelancer_id');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const task = await Task.findById(application.task_id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can accept applications' });
    }

    // Update application status
    application.status = 'accepted';
    await application.save();

    // Assign freelancer and start phase 0
    task.freelancer_id = application.freelancer_id._id;
    task.status = 'in_progress';
    if (task.phases.length > 0) {
      task.phases[0].status = 'active';
      task.phases[0].started_at = new Date();
    }
    task.markModified('phases');
    await task.save();

    res.json({ application, task });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
