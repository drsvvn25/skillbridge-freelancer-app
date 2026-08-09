const jwt = require('jsonwebtoken');
const VisitorLog = require('../models/VisitorLog');
const User = require('../models/User');
const { sendVisitorAlertEmail } = require('../utils/emailService');

// Memory cache to throttle email alerts (1 email per IP every 5 minutes)
const recentAlertCache = new Map();

async function visitorTracker(req, res, next) {
  // Always proceed with request
  next();

  // Process tracking asynchronously after response is sent
  res.on('finish', async () => {
    try {
      const path = req.originalUrl || req.path || '/';

      // Ignore static assets & heartbeat requests
      if (
        path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|map)$/i) ||
        path.startsWith('/uploads')
      ) {
        return;
      }

      // Extract real client IP (handling Render reverse proxy headers)
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
      const ip = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');

      // Extract User / Author name if logged in
      let userName = 'Divy / Guest';
      let userEmail = 'N/A';

      if (req.user) {
        userName = req.user.full_name || 'Divy';
        userEmail = req.user.email || 'N/A';
      } else {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
            const user = await User.findById(decoded.id).select('full_name email');
            if (user) {
              userName = user.full_name;
              userEmail = user.email;
            }
          } catch (e) {}
        }
      }

      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      // 1. Save visitor log entry into MongoDB database
      const logEntry = new VisitorLog({
        ip,
        user_name: userName,
        email: userEmail,
        page: path,
        user_agent: userAgent,
        timestamp: new Date()
      });
      await logEntry.save();

      // 2. Throttle email notification (max 1 email alert per IP per 5 minutes)
      const cacheKey = `${ip}_${userName}`;
      const now = Date.now();
      const lastAlert = recentAlertCache.get(cacheKey);

      if (!lastAlert || (now - lastAlert) > 5 * 60 * 1000) {
        recentAlertCache.set(cacheKey, now);
        
        console.log(`👁️ [Visitor Tracker] Access detected from IP: ${ip} | User: ${userName} | Page: ${path}`);
        
        // Send email notification to drsvvn25@gmail.com (non-blocking)
        sendVisitorAlertEmail({
          ip,
          user_name: userName,
          email: userEmail,
          page: path,
          user_agent: userAgent
        }).catch(err => {
          console.error('❌ Visitor alert email failed:', err.message);
        });
      }
    } catch (err) {
      console.error('❌ Visitor tracking error:', err.message);
    }
  });
}

module.exports = visitorTracker;
