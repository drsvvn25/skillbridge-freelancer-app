const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { sendProfileUpdateEmail } = require('../utils/emailService');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /api/users/me — update profile
router.patch('/me', auth, async (req, res) => {
  try {
    const allowed = ['bio', 'skills', 'is_premium', 'professional_title', 'hourly_rate', 'portfolio'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');

    // Send profile update notification (non-blocking)
    sendProfileUpdateEmail(user).catch(() => {});

    res.json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});


// POST /api/users/portfolio — Add a portfolio project
router.post('/portfolio', auth, async (req, res) => {
  try {
    const { title, description, project_url, image_url } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.portfolio = user.portfolio || [];
    user.portfolio.unshift({
      title: title.trim(),
      description: (description || '').trim(),
      project_url: (project_url || '').trim(),
      image_url: (image_url || '').trim(),
      created_at: new Date()
    });

    await user.save();
    res.status(201).json(user.portfolio);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/users/portfolio/:itemId — Remove a portfolio project
router.delete('/portfolio/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.portfolio = (user.portfolio || []).filter(item => item._id.toString() !== req.params.itemId);
    await user.save();
    res.json(user.portfolio);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const freelancers = await User.find({ user_type: 'freelancer' })
      .sort({ total_tasks_completed: -1, rating: -1 })
      .limit(10)
      .select('full_name rating total_tasks_completed is_premium skills');

    const result = await Promise.all(freelancers.map(async (u) => {
      const earned = await Task.aggregate([
        { $match: { freelancer_id: u._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$budget', { $ifNull: ['$penalty_applied', 0] }] } } } }
      ]);
      return { ...u.toObject(), total_earned: (earned[0] && earned[0].total) || 0 };
    }));

    result.sort((a, b) => b.total_earned - a.total_earned);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// GET /api/users/reviews — Get verified reviews received by the current user
router.get('/reviews', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const isFreelancer = req.user.user_type === 'freelancer';

    let filter = {};
    let populateField = '';

    if (isFreelancer) {
      filter = {
        freelancer_id: userId,
        status: 'completed',
        'review_by_client.rating': { $exists: true, $ne: null }
      };
      populateField = 'client_id';
    } else {
      filter = {
        client_id: userId,
        status: 'completed',
        'review_by_freelancer.rating': { $exists: true, $ne: null }
      };
      populateField = 'freelancer_id';
    }

    const tasksWithReviews = await Task.find(filter)
      .select('title category budget completed_at review_by_client review_by_freelancer client_id freelancer_id')
      .populate(populateField, 'full_name email rating is_premium')
      .sort({ completed_at: -1 });

    const reviews = tasksWithReviews.map(t => {
      const rev = isFreelancer ? t.review_by_client : t.review_by_freelancer;
      const reviewer = isFreelancer ? t.client_id : t.freelancer_id;
      return {
        task_id: t._id,
        task_title: t.title,
        category: t.category,
        budget: t.budget,
        completed_at: t.completed_at,
        rating: rev.rating,
        comment: rev.comment,
        reviewed_at: rev.created_at,
        reviewer: reviewer ? {
          name: reviewer.full_name,
          email: reviewer.email,
          rating: reviewer.rating,
          is_premium: reviewer.is_premium
        } : { name: 'Anonymous' }
      };
    });

    res.json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/users/visitor-logs — Retrieve visitor IP tracking history
const VisitorLog = require('../models/VisitorLog');
router.get('/visitor-logs', async (req, res) => {
  try {
    const logs = await VisitorLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
