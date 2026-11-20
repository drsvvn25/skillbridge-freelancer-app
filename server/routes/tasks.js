const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getPhasesForCategory } = require('../utils/phaseTemplates');
const { sendNewTaskEmail } = require('../utils/emailService');

// ── GET /stats (role-tailored dashboard summary) ─────────
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.user_type;
    const TaskApplication = require('../models/TaskApplication');

    if (userType === 'client') {
      const clientTasks = await Task.find({ client_id: userId });
      const totalSpent = clientTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.budget || 0), 0);
      const activeProjects = clientTasks.filter(t => t.status === 'in_progress').length;
      const hiredFreelancersSet = new Set();
      clientTasks.forEach(t => {
        if (t.freelancer_id && (t.status === 'in_progress' || t.status === 'completed')) {
          hiredFreelancersSet.add(t.freelancer_id.toString());
        }
      });
      const openJobs = clientTasks.filter(t => t.status === 'open').length;
      return res.json({
        user_type: 'client',
        total_spent: totalSpent,
        active_projects: activeProjects,
        hired_freelancers: hiredFreelancersSet.size,
        open_jobs: openJobs,
        total: clientTasks.length,
        completed: clientTasks.filter(t => t.status === 'completed').length
      });
    } else {
      const freelancerTasks = await Task.find({ freelancer_id: userId });
      const totalEarned = freelancerTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Math.max(0, (t.budget || 0) - (t.commission_amount || 0) - (t.penalty_applied || 0)), 0);
      const activeTasks = freelancerTasks.filter(t => t.status === 'in_progress').length;
      const completedTasks = freelancerTasks.filter(t => t.status === 'completed').length;
      const totalPenalty = freelancerTasks.reduce((sum, t) => sum + (t.penalty_applied || 0), 0);
      const pendingProposalsCount = await TaskApplication.countDocuments({
        freelancer_id: userId,
        status: 'pending'
      });
      return res.json({
        user_type: 'freelancer',
        total_earned: totalEarned,
        active_tasks: activeTasks,
        pending_proposals: pendingProposalsCount,
        completed: completedTasks,
        total_penalty: totalPenalty,
        total: freelancerTasks.length
      });
    }
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

    // Send new task notification email (non-blocking)
    sendNewTaskEmail(req.user, task).catch(() => {});

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

    if (req.user.user_type === 'freelancer') {
      filter.$and.push({ deleted_by_freelancer: { $ne: true } });
    }
    if (req.user.user_type === 'client') {
      filter.$and.push({ deleted_by_client: { $ne: true } });
    }

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

// Delete / Remove Task (Both Client & Freelancer side — completed, cancelled, or open tasks)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userIdStr = req.user._id.toString();
    const isClient = task.client_id && task.client_id.toString() === userIdStr;
    const isFreelancer = task.freelancer_id && task.freelancer_id.toString() === userIdStr;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'You are not authorized to remove this task' });
    }

    if (task.status === 'in_progress') {
      return res.status(400).json({ message: 'Active in-progress contracts cannot be removed. Please complete or cancel the task first.' });
    }

    if (isClient) {
      task.deleted_by_client = true;
    }
    if (isFreelancer) {
      task.deleted_by_freelancer = true;
    }

    await task.save();
    res.json({ message: 'Task removed successfully from your dashboard' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// POST /:id/review — Submit review (client rates freelancer OR freelancer rates client)
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Reviews can only be submitted for completed tasks' });
    }

    const userIdStr = req.user._id.toString();
    const isClient = task.client_id && task.client_id.toString() === userIdStr;
    const isFreelancer = task.freelancer_id && task.freelancer_id.toString() === userIdStr;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'You are not a participant in this task' });
    }

    let targetUserId = null;
    if (isClient) {
      if (task.review_by_client && task.review_by_client.rating) {
        return res.status(400).json({ message: 'You have already reviewed this task' });
      }
      task.review_by_client = {
        rating: Math.round(numRating),
        comment: (comment || '').trim(),
        created_at: new Date()
      };
      targetUserId = task.freelancer_id;
    } else {
      if (task.review_by_freelancer && task.review_by_freelancer.rating) {
        return res.status(400).json({ message: 'You have already reviewed this task' });
      }
      task.review_by_freelancer = {
        rating: Math.round(numRating),
        comment: (comment || '').trim(),
        created_at: new Date()
      };
      targetUserId = task.client_id;
    }

    await task.save();

    // Recalculate recipient user's dynamic rating based on all reviews
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        if (targetUser.user_type === 'freelancer') {
          const tasksReviewed = await Task.find({
            freelancer_id: targetUserId,
            'review_by_client.rating': { $exists: true, $ne: null }
          }).select('review_by_client');

          if (tasksReviewed.length > 0) {
            const sum = tasksReviewed.reduce((acc, t) => acc + (t.review_by_client ? t.review_by_client.rating : 0), 0);
            targetUser.rating = Math.round((sum / tasksReviewed.length) * 10) / 10;
          }
        } else {
          const tasksReviewed = await Task.find({
            client_id: targetUserId,
            'review_by_freelancer.rating': { $exists: true, $ne: null }
          }).select('review_by_freelancer');

          if (tasksReviewed.length > 0) {
            const sum = tasksReviewed.reduce((acc, t) => acc + (t.review_by_freelancer ? t.review_by_freelancer.rating : 0), 0);
            targetUser.rating = Math.round((sum / tasksReviewed.length) * 10) / 10;
          }
        }
        await targetUser.save();
      }
    }

    res.json({
      message: 'Review submitted successfully',
      task,
      review: isClient ? task.review_by_client : task.review_by_freelancer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

