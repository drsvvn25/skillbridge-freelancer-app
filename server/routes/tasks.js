const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getPhasesForCategory } = require('../utils/phaseTemplates');

// ── GET /stats (dashboard summary) ───────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.user_type;
    const filter = userType === 'client' ? { client_id: userId } : { freelancer_id: userId };
    const tasks = await Task.find(filter);
    res.json({
      total: tasks.length,
      active: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      earned: tasks.filter(t => t.status === 'completed').reduce((s, t) => s + (t.budget - (t.penalty_applied||0)), 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /leaderboard ──────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const User = require('../models/User');
    const leaders = await User.find({ user_type: 'freelancer' })
      .sort({ total_tasks_completed: -1, rating: -1 })
      .limit(10)
      .select('full_name rating total_tasks_completed is_premium skills');
    // Compute total_earned from completed tasks
    const result = await Promise.all(leaders.map(async (u) => {
      const earned = await Task.aggregate([
        { $match: { freelancer_id: u._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$budget', '$penalty_applied'] } } } }
      ]);
      return { ...u.toObject(), total_earned: (earned[0] && earned[0].total) || 0 };
    }));
    result.sort((a,b) => b.total_earned - a.total_earned);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Task — auto-attaches phases
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, budget, category, custom_deadline_minutes, urgency, required_skills } = req.body;

    const budgetNum = parseFloat(budget);
    const commission = parseFloat((budgetNum * 0.10).toFixed(2));
    const phases = getPhasesForCategory(category, custom_deadline_minutes ? parseInt(custom_deadline_minutes) : null);

    const task = new Task({
      title,
      description,
      budget: budgetNum,
      commission_amount: commission,
      category,
      urgency: urgency || 'normal',
      required_skills: required_skills || [],
      client_id: req.user._id,
      phases,
      current_phase_index: 0,
      penalty_applied: 0,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Get Tasks with Query Filters (AJAX/JSON)
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, status, client_id, freelancer_id } = req.query;
    let filter = {
      $and: [
        {
          $or: [
            { status: 'open' },
            { client_id: req.user._id },
            { freelancer_id: req.user._id }
          ]
        }
      ]
    };

    if (category && category !== 'All') filter.category = category;
    if (status) filter.status = status;
    if (client_id) filter.client_id = client_id;
    if (freelancer_id) filter.freelancer_id = freelancer_id;

    if (search) {
      filter.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      });
    }

    const tasks = await Task.find(filter)
      .sort({ created_at: -1 })
      .populate('client_id', 'full_name email')
      .populate('freelancer_id', 'full_name email rating')
      .populate({
        path: 'applications',
        populate: { path: 'freelancer_id', select: 'full_name email rating is_premium' }
      });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('client_id', 'full_name email')
      .populate('freelancer_id', 'full_name email rating')
      .populate({ path: 'applications', populate: { path: 'freelancer_id', select: 'full_name email rating is_premium' } });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign freelancer to task (client action) — starts phase 0
router.patch('/:id/assign', auth, async (req, res) => {
  try {
    const { freelancer_id } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can assign a freelancer' });
    }

    task.freelancer_id = freelancer_id;
    task.status = 'in_progress';

    // Start the first phase
    if (task.phases.length > 0) {
      task.phases[0].status = 'active';
      task.phases[0].started_at = new Date();
    }

    task.markModified('phases');
    await task.save();
    await task.populate('freelancer_id', 'full_name email');
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Task (status, cancel, etc.)
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isClient = task.client_id.toString() === req.user._id.toString();
    const isFreelancer = task.freelancer_id && task.freelancer_id.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const allowedFields = ['status', 'completed_at'];
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });

    if (req.body.status === 'completed' && task.status !== 'completed' && task.freelancer_id) {
      task.completed_at = new Date();
      await User.findByIdAndUpdate(task.freelancer_id, { $inc: { total_tasks_completed: 1 } });
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update Individual Phase Status
router.patch('/:id/phases', auth, async (req, res) => {
  try {
    const { phaseIndex, status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isClient = task.client_id.toString() === req.user._id.toString();
    const isFreelancer = task.freelancer_id && task.freelancer_id.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const idx = parseInt(phaseIndex);
    if (idx >= 0 && idx < task.phases.length) {
      task.phases[idx].status = status;
      if (status === 'active' && !task.phases[idx].started_at) {
        task.phases[idx].started_at = new Date();
      }
      if (status === 'completed') {
        task.phases[idx].completed_at = new Date();
        // If completed, check if current_phase_index should advance
        if (idx === task.current_phase_index) {
          const nextIdx = idx + 1;
          if (nextIdx < task.phases.length) {
            task.current_phase_index = nextIdx;
            if (task.phases[nextIdx].status === 'pending') {
              task.phases[nextIdx].status = 'active';
              task.phases[nextIdx].started_at = new Date();
            }
          } else {
            task.status = 'completed';
            task.completed_at = new Date();
          }
        }
      }
    }

    task.markModified('phases');
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
