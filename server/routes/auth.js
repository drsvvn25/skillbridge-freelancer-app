const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail, sendLoginNotificationEmail } = require('../utils/emailService');

// ─── Generate 6-digit OTP ─────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Register ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, user_type, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, full_name, user_type, bio: bio || '' });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: '7d' });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Login — Step 1: Validate credentials & send OTP ─────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate and save OTP (upsert to replace any existing OTP)
    const otp = generateOtp();
    await Otp.findOneAndUpdate(
      { email: user.email },
      { email: user.email, otp, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email (non-blocking)
    sendOtpEmail(user.email, user.full_name, otp).catch(() => {});

    // Return step indicator — no token yet
    res.json({
      step: 'otp',
      email: user.email,
      message: 'OTP sent to your email address. Please verify to continue.'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Login — Step 2: Verify OTP & issue JWT ──────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found. Please login again.' });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — delete it so it can't be reused
    await Otp.deleteOne({ email: email.toLowerCase() });

    // Find user and issue JWT
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', { expiresIn: '7d' });

    // Send login notification email (non-blocking)
    sendLoginNotificationEmail(user).catch(() => {});

    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Resend OTP ───────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const otp = generateOtp();
    await Otp.findOneAndUpdate(
      { email: user.email },
      { email: user.email, otp, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    sendOtpEmail(user.email, user.full_name, otp).catch(() => {});

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─── Get current user (Me) ───────────────────────────────
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
