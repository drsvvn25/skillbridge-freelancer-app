const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const seedDatabase = require('./seed');
const { startPenaltyEngine } = require('./utils/penaltyEngine');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Database ─────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://drsvvn25_db_user:KxrLb2TgXtqdkJPV@cluster0.epiwhtv.mongodb.net/skillbridge_db?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('📦 Database is empty. Running seeder...');
      await seedDatabase();
    }
    // Start the penalty engine after DB is connected
    startPenaltyEngine();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/phases', require('./routes/phases'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/users', require('./routes/users'));

// ─── Angular Route Redirects ──────────────────────────────────
// When user types /home, /login etc directly in the browser bar,
// redirect them to the correct AngularJS hash URL at the root
const angularRoutes = ['home', 'login', 'register', 'marketplace', 'dashboard', 'post-task', 'leaderboard', 'profile'];
angularRoutes.forEach(function(route) {
  app.get('/' + route, function(req, res) {
    res.redirect('/#!/' + route);
  });
});

// ─── SPA Fallback (serve index.html for all non-API routes) ──
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
