// =========================================================
// SkillBridge — SkillBot Chatbot Route (Gemini AI Powered)
// /api/chatbot/message  (POST, auth required)
// /api/chatbot/guest    (POST, no auth)
// =========================================================
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Task    = require('../models/Task');
const User    = require('../models/User');
const { GoogleGenAI } = require('@google/genai');

// ── Gemini AI setup (cached client for speed) ─────────────────────
let cachedClient = null;
function getGeminiClient() {
  if (cachedClient) return cachedClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes('your-gemini')) return null;
  cachedClient = new GoogleGenAI({ apiKey: key });
  return cachedClient;
}

// ── In-memory conversation history per user ─────────────────────
const sessions = new Map();

// ── Available categories ─────────────────────────────────────────
const CATEGORIES = [
  'Web Development', 'Mobile App', 'UI/UX Design',
  'Graphic Design', 'Content Writing', 'Data Science',
  'Video Editing', 'SEO & Marketing'
];

// ─────────────────────────────────────────────────────────────────
// GEMINI AI chat function (Optimized for low latency)
// ─────────────────────────────────────────────────────────────────
async function askGemini(systemPrompt, history, userMessage) {
  const client = getGeminiClient();
  if (!client) return null;

  // Direct fast model (gemini-2.5-flash) for instant response
  try {
    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: { 
        systemInstruction: systemPrompt,
        maxOutputTokens: 180,
        temperature: 0.6
      },
      history: history || []
    });

    const response = await chat.sendMessage({ message: userMessage });
    if (response && response.text) {
      return response.text;
    }
  } catch (err) {
    console.warn('[SkillBot Gemini 2.5 Flash error]', err.message);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Build system prompt (Parallelized DB queries for fast execution)
// ─────────────────────────────────────────────────────────────────
async function buildSystemPrompt(user) {
  const userType = user.user_type;
  let liveContext = '';

  try {
    const taskFilter = userType === 'client'
      ? { client_id: user._id }
      : { freelancer_id: user._id };

    // Parallel DB execution for speed
    const [myTasks, openCount, fullUser] = await Promise.all([
      Task.find(taskFilter).sort({ created_at: -1 }).limit(5).lean(),
      Task.countDocuments({ status: 'open' }),
      userType === 'freelancer' ? User.findById(user._id).select('skills').lean() : null
    ]);

    if (userType === 'freelancer') {
      const skills = (fullUser?.skills || []).join(', ') || 'none';
      liveContext = `Skills: ${skills} | Open tasks: ${openCount} | Active tasks: ${myTasks.length}`;
    } else {
      liveContext = `Open tasks in market: ${openCount} | Your posted tasks: ${myTasks.length}`;
    }
  } catch (e) {
    liveContext = '';
  }

  return `You are SkillBot, AI assistant for SkillBridge freelancer platform.
USER: ${user.full_name} (${userType}). ${liveContext}
INSTRUCTIONS:
- Be helpful, concise (2-4 sentences max), friendly, and format with **bold** & bullet points.
- SkillBridge is a freelance platform (10% fee, phase milestones, bids, penalties).
- For actual task posting tell clients to type "post a task".
- For task recommendations tell freelancers to type "recommend me tasks".
- Stay on topic about SkillBridge and freelancing.`;
}

// ─────────────────────────────────────────────────────────────────
// Rule-based intent detection (used when Gemini fallback needed
// or for structured actions that must always be intercepted)
// ─────────────────────────────────────────────────────────────────
function detectStructuredIntent(text) {
  const t = text.toLowerCase().trim();

  if (/\b(post|create|add|new|make)\s+(a\s+)?(task|job|project|gig)\b/.test(t) ||
      /\bi want to (post|hire|create)\b/.test(t))
    return 'create_task';

  if (/\b(my tasks?|show tasks?|task (list|status)|what tasks?|active tasks?)\b/.test(t))
    return 'my_tasks';

  if (/\b(recommend|suggest|best task|which task|find (me )?(a |some )?task|match|top task)\b/.test(t) ||
      /\bwhat should i (work on|apply)\b/.test(t) ||
      /\banalyze tasks?\b/.test(t))
    return 'recommend';

  if (/\b(go to|open|take me to|navigate to|visit)\b/.test(t) &&
      /\b(marketplace|dashboard|profile|leaderboard|post.?task|home)\b/.test(t))
    return 'navigate';

  if (/\b(stats?|earnings?|revenue|performance|how much (have i|did i) earn)\b/.test(t))
    return 'stats';

  if (/\b(cancel|stop|abort|quit|never mind|start over)\b/.test(t))
    return 'cancel';

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Navigation helper
// ─────────────────────────────────────────────────────────────────
function resolveNavLink(text) {
  const t = text.toLowerCase();
  if (/marketplace/.test(t)) return { name: 'Marketplace', url: '#!/marketplace' };
  if (/dashboard/.test(t))   return { name: 'Dashboard',   url: '#!/dashboard'   };
  if (/profile/.test(t))     return { name: 'Profile',     url: '#!/profile'     };
  if (/leaderboard/.test(t)) return { name: 'Leaderboard', url: '#!/leaderboard' };
  if (/post.?task/.test(t))  return { name: 'Post Task',   url: '#!/post-task'   };
  if (/home/.test(t))        return { name: 'Home',        url: '#!/home'        };
  return null;
}

// ─────────────────────────────────────────────────────────────────
// Skill-match scorer for freelancer recommendations
// ─────────────────────────────────────────────────────────────────
function computeMatchScore(task, userSkills) {
  if (!task.required_skills || task.required_skills.length === 0) return 45;
  const uSkills = userSkills.map(s => s.toLowerCase());
  const tSkills = task.required_skills.map(s => s.toLowerCase());
  const matches = tSkills.filter(s => uSkills.some(u => u.includes(s) || s.includes(u)));
  return Math.min(Math.round((matches.length / tSkills.length) * 100), 100);
}

// ─────────────────────────────────────────────────────────────────
// Quick action chips per role
// ─────────────────────────────────────────────────────────────────
function getQuickActions(userType) {
  return userType === 'client'
    ? ['📋 Post a Task', '📊 My Tasks', '📈 My Stats', '🛒 Marketplace']
    : ['🎯 Recommend Tasks', '📊 My Tasks', '📈 My Stats', '💡 How to Apply'];
}

// ─────────────────────────────────────────────────────────────────
// MAIN AUTHENTICATED CHATBOT ENDPOINT
// ─────────────────────────────────────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const userId   = req.user._id.toString();
    const userType = req.user.user_type;
    const userMsg  = (req.body.message || '').trim();

    if (!userMsg) {
      return res.json({ reply: 'Please type a message 😊', type: 'text' });
    }

    // ── Get/init session ───────────────────────────────────────
    let session = sessions.get(userId) || { taskFlow: null, history: [] };

    // ── Mid-flow: in task creation wizard ──────────────────────
    if (session.taskFlow && session.taskFlow.step !== 'idle') {
      const result = await handleTaskFlow(session, userMsg, req.user, userId);
      sessions.set(userId, result.session);
      return res.json(result.response);
    }

    // ── Check for structured platform actions first ────────────
    const structuredIntent = detectStructuredIntent(userMsg);

    if (structuredIntent) {
      const actionResult = await handleStructuredAction(
        structuredIntent, userMsg, req.user, userId, session
      );
      if (actionResult) {
        sessions.set(userId, session);
        return res.json(actionResult);
      }
    }

    // ── Gemini AI free-form conversation ───────────────────────
    const systemPrompt = await buildSystemPrompt(req.user);
    const aiReply = await askGemini(systemPrompt, session.history, userMsg);

    if (aiReply) {
      // Store conversation history (last 20 turns to avoid token overflow)
      session.history.push(
        { role: 'user',  parts: [{ text: userMsg  }] },
        { role: 'model', parts: [{ text: aiReply  }] }
      );
      if (session.history.length > 40) {
        session.history = session.history.slice(-40); // keep last 20 turns
      }
      sessions.set(userId, session);
      return res.json({
        reply: aiReply,
        type: 'text',
        source: 'gemini',
        quickActions: getQuickActions(userType)
      });
    }

    // ── Rule-based fallback ────────────────────────────────────
    sessions.set(userId, session);
    const suggestions = userType === 'client'
      ? `Try: *"post a task"*, *"my tasks"*, *"show my stats"*, or *"go to dashboard"*`
      : `Try: *"recommend me tasks"*, *"my tasks"*, *"how do I apply"*, or *"go to marketplace"*`;
    return res.json({
      reply: `I can help you with tasks, navigation, and SkillBridge questions! 🤖\n\n${suggestions}`,
      type: 'text',
      quickActions: getQuickActions(userType)
    });

  } catch (err) {
    console.error('[SkillBot Error]', err);
    res.status(500).json({ reply: 'Oops! Something went wrong. Please try again.', type: 'error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// Structured action handlers (platform-specific, always rule-based)
// ─────────────────────────────────────────────────────────────────
async function handleStructuredAction(intent, userMsg, user, userId, session) {
  const userType = user.user_type;
  const userName = user.full_name.split(' ')[0];

  switch (intent) {

    case 'create_task': {
      if (userType !== 'client') {
        return {
          reply: `Only **clients** can post tasks. As a freelancer, browse the marketplace and place bids!\n\n🛒 [Go to Marketplace](#!/marketplace)`,
          type: 'text',
          quickActions: getQuickActions(userType)
        };
      }
      session.taskFlow = { step: 'task_title', data: {} };
      return {
        reply: `Let's create your task! 🚀\n\nI'll guide you step by step.\n\n**Step 1/6** — What's the **title** of your task?\n*(e.g., "Build a Portfolio Website")*`,
        type: 'text',
        progress: { step: 1, total: 6 }
      };
    }

    case 'my_tasks': {
      const filter = userType === 'client'
        ? { client_id: user._id }
        : { freelancer_id: user._id };
      const tasks = await Task.find(filter).sort({ created_at: -1 }).limit(10);
      if (!tasks.length) {
        const msg = userType === 'client'
          ? `You haven't posted any tasks yet, ${userName}! Say **"post a task"** to get started.\n\n📋 [Post a Task](#!/post-task)`
          : `No tasks assigned yet. Head to the marketplace to find work!\n\n🛒 [Browse Marketplace](#!/marketplace)`;
        return { reply: msg, type: 'text', quickActions: getQuickActions(userType) };
      }
      const statusEmoji = { open: '🟢', in_progress: '🔵', completed: '✅', cancelled: '❌' };
      const lines = tasks.map((t, i) =>
        `${statusEmoji[t.status] || '⚪'} **${i+1}. ${t.title}**\n   ${t.status.replace('_', ' ')} · $${t.budget}`
      ).join('\n\n');
      return {
        reply: `📋 **Your Tasks** (${tasks.length} found):\n\n${lines}\n\n[View Dashboard](#!/dashboard)`,
        type: 'text',
        quickActions: getQuickActions(userType)
      };
    }

    case 'recommend': {
      if (userType !== 'freelancer') {
        return {
          reply: `Task recommendations are for **freelancers**. As a client, post tasks and review incoming bids!\n\n📋 [Post a Task](#!/post-task)`,
          type: 'text',
          quickActions: getQuickActions(userType)
        };
      }
      const fullUser  = await User.findById(user._id);
      const userSkills = fullUser.skills || [];
      const openTasks = await Task.find({ status: 'open' }).sort({ created_at: -1 }).limit(50);

      if (!openTasks.length) {
        return { reply: `No open tasks right now. Check back soon!\n\n🛒 [Browse Marketplace](#!/marketplace)`, type: 'text', quickActions: getQuickActions(userType) };
      }

      const scored = openTasks
        .map(t => ({ task: t, score: computeMatchScore(t, userSkills) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const skillsMsg = userSkills.length
        ? `Based on your skills: **${userSkills.slice(0, 4).join(', ')}**`
        : `*(Add skills to your profile for better matches!)*`;

      const taskLines = scored.map(({ task, score }, i) => {
        const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
        const skills = task.required_skills?.slice(0, 3).join(', ') || task.category;
        return `**${i+1}. ${task.title}**\n💰 $${task.budget} · 📂 ${task.category}\n🛠 ${skills}\n🎯 Match: ${score}% [${bar}]\n[Apply Now](#!/marketplace)`;
      }).join('\n\n---\n\n');

      return {
        reply: `🎯 **Top Task Recommendations**\n${skillsMsg}\n\n${taskLines}`,
        type: 'text',
        quickActions: getQuickActions(userType)
      };
    }

    case 'navigate': {
      const link = resolveNavLink(userMsg);
      if (link) {
        return {
          reply: `Taking you to **${link.name}** 🚀\n\n[👉 Go to ${link.name}](${link.url})`,
          type: 'navigate',
          url: link.url,
          quickActions: getQuickActions(userType)
        };
      }
      return null;
    }

    case 'stats': {
      const filter = userType === 'client'
        ? { client_id: user._id }
        : { freelancer_id: user._id };
      const tasks = await Task.find(filter);
      const total     = tasks.length;
      const active    = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const amount    = tasks.filter(t => t.status === 'completed')
                             .reduce((s, t) => s + (t.budget - (t.penalty_applied || 0)), 0);
      return {
        reply: `📊 **Your Stats**\n\n📁 Total Tasks: **${total}**\n🔵 Active: **${active}**\n✅ Completed: **${completed}**\n💰 ${userType === 'client' ? 'Spent' : 'Earned'}: **$${amount.toFixed(2)}**\n\n[View Dashboard](#!/dashboard)`,
        type: 'text',
        quickActions: getQuickActions(userType)
      };
    }

    case 'cancel': {
      session.taskFlow = null;
      return {
        reply: `No problem! What else can I help you with? 😊`,
        type: 'text',
        quickActions: getQuickActions(userType)
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Multi-step task creation wizard
// ─────────────────────────────────────────────────────────────────
async function handleTaskFlow(session, userMsg, user, userId) {
  const t = userMsg.trim();
  const userName = user.full_name.split(' ')[0];

  // Cancel at any point
  if (/^(cancel|stop|abort|quit|exit|never mind|start over)$/i.test(t)) {
    session.taskFlow = null;
    return {
      session,
      response: { reply: `Cancelled! What else can I help you with?`, type: 'text', quickActions: getQuickActions(user.user_type) }
    };
  }

  const { step, data } = session.taskFlow;

  switch (step) {

    case 'task_title': {
      if (t.length < 5) {
        return { session, response: { reply: `The title needs to be at least 5 characters. Try something more descriptive!`, type: 'text', progress: { step: 1, total: 6 } } };
      }
      data.title = t;
      session.taskFlow = { step: 'task_description', data };
      return {
        session,
        response: {
          reply: `✅ **Title:** "${t}"\n\n**Step 2/6** — Write a **description** of what you need.\n*(Explain deliverables, tech stack, style preferences, timeline...)*`,
          type: 'text', progress: { step: 2, total: 6 }
        }
      };
    }

    case 'task_description': {
      if (t.length < 20) {
        return { session, response: { reply: `Please write a more detailed description (at least 20 characters).`, type: 'text', progress: { step: 2, total: 6 } } };
      }
      data.description = t;
      session.taskFlow = { step: 'task_category', data };
      const catList = CATEGORIES.map((c, i) => `${i+1}. ${c}`).join('\n');
      return {
        session,
        response: {
          reply: `✅ **Description saved!**\n\n**Step 3/6** — Choose a **category** (type the number or name):\n\n${catList}`,
          type: 'text', progress: { step: 3, total: 6 }
        }
      };
    }

    case 'task_category': {
      let category = null;
      const num = parseInt(t);
      if (!isNaN(num) && num >= 1 && num <= CATEGORIES.length) {
        category = CATEGORIES[num - 1];
      } else {
        category = CATEGORIES.find(c => c.toLowerCase().includes(t.toLowerCase()));
      }
      if (!category) {
        const catList = CATEGORIES.map((c, i) => `${i+1}. ${c}`).join('\n');
        return { session, response: { reply: `Please choose a valid category:\n\n${catList}`, type: 'text', progress: { step: 3, total: 6 } } };
      }
      data.category = category;
      session.taskFlow = { step: 'task_budget', data };
      return {
        session,
        response: {
          reply: `✅ **Category:** ${category}\n\n**Step 4/6** — What's your **budget** in USD?\n*(e.g., 200 or $350)*`,
          type: 'text', progress: { step: 4, total: 6 }
        }
      };
    }

    case 'task_budget': {
      const budget = parseFloat(t.replace(/[$,]/g, ''));
      if (isNaN(budget) || budget < 5) {
        return { session, response: { reply: `Please enter a valid budget (minimum $5). Just type a number like **100**.`, type: 'text', progress: { step: 4, total: 6 } } };
      }
      data.budget = budget;
      session.taskFlow = { step: 'task_skills', data };
      return {
        session,
        response: {
          reply: `✅ **Budget:** $${budget} *(Freelancer earns: $${(budget * 0.9).toFixed(2)} after 10% fee)*\n\n**Step 5/6** — Any **required skills**?\n*(e.g., "React, Node.js, Figma" — or type "none")*`,
          type: 'text', progress: { step: 5, total: 6 }
        }
      };
    }

    case 'task_skills': {
      const skills = (t.toLowerCase() === 'none' || t.toLowerCase() === 'skip')
        ? [] : t.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      data.required_skills = skills;
      session.taskFlow = { step: 'task_urgency', data };
      return {
        session,
        response: {
          reply: `✅ **Skills:** ${skills.length ? skills.join(', ') : 'None'}\n\n**Step 6/6** — **Urgency level?**\n\n1. Normal *(standard visibility)*\n2. 🔥 Urgent *(higher visibility, attracts more bids)*`,
          type: 'text', progress: { step: 6, total: 6 }
        }
      };
    }

    case 'task_urgency': {
      const urgency = /2|urgent|🔥/.test(t.toLowerCase()) ? 'urgent' : 'normal';
      data.urgency = urgency;
      session.taskFlow = { step: 'task_confirm', data };
      const summary =
        `📋 **Task Summary — Please Confirm:**\n\n` +
        `**Title:** ${data.title}\n` +
        `**Description:** ${data.description.length > 80 ? data.description.substring(0, 80) + '…' : data.description}\n` +
        `**Category:** ${data.category}\n` +
        `**Budget:** $${data.budget}\n` +
        `**Skills:** ${data.required_skills.length ? data.required_skills.join(', ') : 'None'}\n` +
        `**Urgency:** ${urgency === 'urgent' ? '🔥 Urgent' : 'Normal'}\n\n` +
        `Type **"confirm"** to post this task, or **"cancel"** to discard.`;
      return { session, response: { reply: summary, type: 'text', progress: { step: 6, total: 6 } } };
    }

    case 'task_confirm': {
      if (!/confirm|yes|ok|post|submit|do it|proceed|go ahead|sure/i.test(t)) {
        return { session, response: { reply: `Type **"confirm"** to post, or **"cancel"** to discard.`, type: 'text' } };
      }
      try {
        const { getPhasesForCategory } = require('../utils/phaseTemplates');
        const d = data;
        const budgetNum  = parseFloat(d.budget);
        const commission = parseFloat((budgetNum * 0.10).toFixed(2));
        const phases     = getPhasesForCategory(d.category, null);

        const task = new Task({
          title: d.title, description: d.description,
          budget: budgetNum, commission_amount: commission,
          category: d.category, urgency: d.urgency || 'normal',
          required_skills: d.required_skills || [],
          client_id: user._id, phases,
          current_phase_index: 0, penalty_applied: 0,
        });
        await task.save();

        session.taskFlow = null;
        return {
          session,
          response: {
            reply: `🎉 **Task Posted Successfully!**\n\n**"${d.title}"** is now live in the marketplace! Freelancers will start sending proposals soon.\n\n📊 [View Dashboard](#!/dashboard)\n🛒 [View in Marketplace](#!/marketplace)`,
            type: 'success',
            quickActions: getQuickActions(user.user_type)
          }
        };
      } catch (err) {
        console.error('[SkillBot Task Create Error]', err);
        session.taskFlow = null;
        return {
          session,
          response: { reply: `❌ Failed to create the task: ${err.message}. Try the [Post Task page](#!/post-task) instead.`, type: 'error' }
        };
      }
    }

    default: {
      session.taskFlow = null;
      return { session, response: { reply: `Something went wrong. Let's start fresh!`, type: 'text', quickActions: getQuickActions(user.user_type) } };
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// GUEST ENDPOINT (no auth — Gemini for general questions)
// ─────────────────────────────────────────────────────────────────
router.post('/guest', async (req, res) => {
  const userMsg = (req.body.message || '').trim();
  if (!userMsg) return res.json({ reply: 'Hi! How can I help you?', type: 'text' });

  const guestPrompt = `You are SkillBot, the AI assistant for SkillBridge — a freelancer marketplace platform.
You are talking to a GUEST (not logged in). Be welcoming, brief, and helpful.

SkillBridge connects clients who need work done with skilled freelancers.
- Clients post tasks with budgets
- Freelancers browse and bid on tasks  
- Phase-based tracking ensures quality
- 10% platform fee (freelancers keep 90%)
- Features: OTP login, real-time messaging, leaderboard, fair penalty system

Key pages: Login (#!/login), Register (#!/register)
Format: Use **bold** for important terms, link format: [Text](url)
Keep responses concise (2-4 sentences).`;

  const aiReply = await askGemini(guestPrompt, [], userMsg);
  if (aiReply) {
    return res.json({ reply: aiReply, type: 'text', source: 'gemini' });
  }

  // Fallback for guests
  const t = userMsg.toLowerCase();
  let reply = '';
  if (/hi|hello|hey/.test(t)) {
    reply = `👋 Hi! I'm **SkillBot**, your SkillBridge assistant!\n\nSkillBridge is a freelancer marketplace where **clients** post tasks and **freelancers** earn money completing them.\n\n[🚀 Sign Up Free](#!/register) | [🔑 Log In](#!/login)`;
  } else if (/what is|about|explain/.test(t)) {
    reply = `**SkillBridge** is a mini freelancer marketplace — post tasks, receive bids, track progress through phases.\n\n✅ Phase tracking · 💬 Messaging · 🏆 Leaderboard · ⚡ Instant bids\n\n[Create an Account](#!/register)`;
  } else {
    reply = `👋 I'm **SkillBot**! Ask me about SkillBridge or try:\n• *"What is SkillBridge?"*\n• *"How does it work?"*\n\nOr [Log In](#!/login) / [Register](#!/register) to get full access!`;
  }
  res.json({ reply, type: 'text' });
});

module.exports = router;
