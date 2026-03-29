const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Send Message
router.post('/', auth, async (req, res) => {
  try {
    const message = new Message({
      ...req.body,
      sender_id: req.user._id,
    });
    await message.save();
    await message.populate('sender_id');
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Messages for a Task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ task_id: req.params.taskId })
      .sort({ created_at: 1 })
      .populate('sender_id');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read for a task
router.patch('/read/:taskId', auth, async (req, res) => {
  try {
    const result = await Message.updateMany(
      { task_id: req.params.taskId, receiver_id: req.user._id, is_read: false },
      { is_read: true }
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get Unread Message Count (for notification bell)
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver_id: req.user._id, is_read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Recent Notifications (unread messages)
router.get('/notifications', auth, async (req, res) => {
  try {
    const unreadMessages = await Message.find({ receiver_id: req.user._id, is_read: false })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('sender_id', 'full_name');
    
    const notifications = unreadMessages.map(msg => ({
      icon: '💬',
      message: `New message from ${msg.sender_id ? msg.sender_id.full_name : 'User'}`,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    }));
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Message History for a Task
router.delete('/task/:taskId', auth, async (req, res) => {
  try {
    await Message.deleteMany({ task_id: req.params.taskId });
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
