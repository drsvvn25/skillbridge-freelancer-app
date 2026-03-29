const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

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
    const allowed = ['bio', 'skills', 'is_premium'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
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

module.exports = router;
