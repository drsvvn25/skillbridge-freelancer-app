// =========================================================
// SkillBridge — Email Service (Nodemailer)
// =========================================================

const nodemailer = require('nodemailer');

// ─── Transporter Setup ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─── Base HTML Template ──────────────────────────────────
function baseTemplate(content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>SkillBridge Notification</title>
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1dbf73,#0ea5e9);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                  <div style="font-size:2rem;margin-bottom:8px;">⚡</div>
                  <h1 style="margin:0;font-size:1.8rem;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">SkillBridge</h1>
                  <p style="margin:4px 0 0;font-size:0.85rem;color:rgba(255,255,255,0.8);letter-spacing:1px;text-transform:uppercase;">Connecting Talent with Opportunity</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="background:#1e293b;padding:36px 40px;border-radius:0 0 16px 16px;">
                  ${content}
                  <!-- Footer -->
                  <hr style="border:none;border-top:1px solid #334155;margin:32px 0;" />
                  <p style="margin:0;font-size:0.78rem;color:#64748b;text-align:center;">
                    © 2025 SkillBridge &nbsp;·&nbsp; Built for the future of work<br/>
                    <a href="https://skillbridge-freelancer-app.onrender.com" style="color:#1dbf73;text-decoration:none;">Visit Platform</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── Send Helper ─────────────────────────────────────────
async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"SkillBridge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to} — ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
  }
}

// ─── 1. Welcome Email (on Register) ─────────────────────
async function sendWelcomeEmail(user) {
  const roleIcon = user.user_type === 'client' ? '💼' : '🚀';
  const roleLabel = user.user_type === 'client' ? 'Client' : 'Freelancer';
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:1.4rem;font-weight:700;color:#f1f5f9;">Welcome to SkillBridge! 🎉</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
      Hi <strong style="color:#e2e8f0;">${user.full_name}</strong>, your account has been created successfully. You're now part of the SkillBridge community!
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Account Type</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;font-weight:600;">${roleIcon} ${roleLabel}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Email Address</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Member Since</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
        </tr>
      </table>
    </div>
    <a href="https://skillbridge-freelancer-app.onrender.com/#!/marketplace" style="display:block;text-align:center;background:linear-gradient(135deg,#1dbf73,#0ea5e9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;letter-spacing:0.3px;">
      Explore Marketplace →
    </a>
  `);
  await sendMail(user.email, '🎉 Welcome to SkillBridge!', html);
}

// ─── 2. OTP Email (on Login attempt) ─────────────────────
async function sendOtpEmail(email, fullName, otp) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:1.4rem;font-weight:700;color:#f1f5f9;">Login Verification 🔐</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
      Hi <strong style="color:#e2e8f0;">${fullName}</strong>, use the OTP below to complete your login. It expires in <strong style="color:#f59e0b;">10 minutes</strong>.
    </p>
    <div style="text-align:center;background:#0f172a;border-radius:16px;padding:32px;margin-bottom:24px;border:2px solid #1dbf73;">
      <p style="margin:0 0 8px;font-size:0.8rem;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Your One-Time Password</p>
      <div style="font-size:2.8rem;font-weight:900;letter-spacing:12px;color:#1dbf73;font-family:'Courier New',monospace;">${otp}</div>
      <p style="margin:12px 0 0;font-size:0.78rem;color:#64748b;">Valid for 10 minutes only</p>
    </div>
    <div style="background:#422006;border:1px solid #92400e;border-radius:10px;padding:14px 18px;margin-bottom:8px;">
      <p style="margin:0;font-size:0.83rem;color:#fbbf24;">
        ⚠️ <strong>Never share this OTP with anyone.</strong> SkillBridge will never ask for your OTP.
      </p>
    </div>
    <p style="margin:12px 0 0;font-size:0.8rem;color:#475569;text-align:center;">
      If you didn't request this, please ignore this email.
    </p>
  `);
  await sendMail(email, '🔐 Your SkillBridge Login OTP', html);
}

// ─── 3. Login Success Notification ──────────────────────
async function sendLoginNotificationEmail(user) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:1.4rem;font-weight:700;color:#f1f5f9;">New Login Detected ✅</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
      Hi <strong style="color:#e2e8f0;">${user.full_name}</strong>, a successful login was just recorded on your SkillBridge account.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Account</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Login Time</td>
          <td style="padding:6px 0;color:#1dbf73;font-size:0.88rem;text-align:right;font-weight:600;">${timeStr}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;font-size:0.83rem;color:#94a3b8;text-align:center;">
      If this wasn't you, please change your password immediately.
    </p>
  `);
  await sendMail(user.email, '✅ SkillBridge Login Alert', html);
}

// ─── 4. Profile Update Notification ─────────────────────
async function sendProfileUpdateEmail(user) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:1.4rem;font-weight:700;color:#f1f5f9;">Profile Updated 👤</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
      Hi <strong style="color:#e2e8f0;">${user.full_name}</strong>, your SkillBridge profile has been updated successfully.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #334155;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Name</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.full_name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Email</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Updated At</td>
          <td style="padding:6px 0;color:#1dbf73;font-size:0.88rem;text-align:right;font-weight:600;">${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
        </tr>
        ${user.bio ? `<tr><td style="padding:6px 0;color:#64748b;font-size:0.88rem;vertical-align:top;">Bio</td><td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.bio.substring(0, 80)}${user.bio.length > 80 ? '...' : ''}</td></tr>` : ''}
        ${user.skills && user.skills.length ? `<tr><td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Skills</td><td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${user.skills.join(', ')}</td></tr>` : ''}
      </table>
    </div>
    <p style="margin:0;font-size:0.83rem;color:#94a3b8;text-align:center;">
      If you didn't make this change, please contact support immediately.
    </p>
  `);
  await sendMail(user.email, '👤 Your SkillBridge Profile Was Updated', html);
}

// ─── 5. New Task Posted Notification ────────────────────
async function sendNewTaskEmail(user, task) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:1.4rem;font-weight:700;color:#f1f5f9;">New Task Posted! 🚀</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:0.95rem;line-height:1.6;">
      Hi <strong style="color:#e2e8f0;">${user.full_name}</strong>, your task has been posted to the marketplace and is now visible to freelancers.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #334155;">
      <p style="margin:0 0 4px;font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Task Title</p>
      <p style="margin:0 0 20px;font-size:1.05rem;font-weight:700;color:#f1f5f9;">${task.title}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Category</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">📂 ${task.category}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Budget</td>
          <td style="padding:6px 0;color:#1dbf73;font-size:0.88rem;text-align:right;font-weight:700;">₹${task.budget.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Urgency</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${task.urgency === 'urgent' ? '🔴 Urgent' : task.urgency === 'high' ? '🟠 High' : '🟢 Normal'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:0.88rem;">Posted At</td>
          <td style="padding:6px 0;color:#e2e8f0;font-size:0.88rem;text-align:right;">${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
        </tr>
      </table>
    </div>
    <a href="https://skillbridge-freelancer-app.onrender.com/#!/marketplace" style="display:block;text-align:center;background:linear-gradient(135deg,#1dbf73,#0ea5e9);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;letter-spacing:0.3px;">
      View in Marketplace →
    </a>
  `);
  await sendMail(user.email, `🚀 Task Posted: "${task.title}"`, html);
}

module.exports = {
  sendWelcomeEmail,
  sendOtpEmail,
  sendLoginNotificationEmail,
  sendProfileUpdateEmail,
  sendNewTaskEmail
};
