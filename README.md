# ⚡ SkillBridge — Freelancer Mini Market Platform

<div align="center">

![SkillBridge](https://img.shields.io/badge/SkillBridge-Freelance%20Marketplace-1dbf73?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AngularJS](https://img.shields.io/badge/AngularJS-1.8-E23237?style=for-the-badge&logo=angularjs&logoColor=white)

**A full-stack freelance marketplace platform connecting clients with skilled freelancers.**
Post tasks, receive proposals, track project phases, and communicate — all in one place.

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Application Pages & Routes](#-application-pages--routes)
- [API Endpoints](#-api-endpoints)
- [Authentication Flow](#-authentication-flow)
- [Email Notifications](#-email-notifications)
- [User Roles](#-user-roles)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 About the Project

**SkillBridge** is a mini Fiverr-like freelance marketplace where:
- **Clients** post tasks/projects with budgets
- **Freelancers** browse and apply with proposals
- Tasks are tracked through **milestone phases**
- Real-time **messaging** between client and freelancer
- Secure **OTP-based login** via email for every session
- **Leaderboard** showing top-performing freelancers

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **OTP Login** | Two-factor authentication — email OTP required on every login |
| 🏠 **Landing Page** | Public home page with categories, features, and CTAs |
| 📋 **Task Marketplace** | Browse all open tasks with filters by category, budget, status |
| 📝 **Post a Task** | Clients post tasks with title, description, budget, deadline |
| 🤝 **Proposals** | Freelancers apply with custom proposals and bid amounts |
| 📊 **Phase Tracking** | Tasks broken into milestone phases with status tracking |
| 💬 **Messaging** | In-task chat between client and freelancer |
| 🏆 **Leaderboard** | Top freelancers ranked by tasks completed and ratings |
| 👤 **Profile** | User profile with skills, bio, rating, and task history |
| 📧 **Email Notifications** | Welcome email, OTP email, login alert, task notifications |
| ⚡ **Penalty Engine** | Auto-penalizes overdue tasks in the background |
| 📱 **Responsive** | Fully responsive on mobile, tablet, and desktop |

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v18+ | Runtime environment |
| **Express.js** | v5.x | Web framework |
| **MongoDB** | Atlas / Local | Database |
| **Mongoose** | v9.x | MongoDB ODM |
| **JWT** | v9.x | Authentication tokens |
| **bcryptjs** | v3.x | Password hashing |
| **Nodemailer** | v9.x | Email sending (OTP, notifications) |
| **Multer** | v2.x | File uploads |
| **dotenv** | v17.x | Environment variables |
| **nodemon** | v3.x | Dev auto-restart |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **AngularJS** | 1.8.3 | SPA framework (loaded via CDN) |
| **ngRoute** | 1.8.3 | Client-side routing |
| **ngAnimate** | 1.8.3 | Page animations |
| **Vanilla CSS** | — | Styling (no CSS frameworks) |
| **Google Fonts** | — | Inter + Plus Jakarta Sans typography |

---

## 📁 Project Structure

```
Freelancer_Mini_Market_Platform/
│
├── server/                           # All backend + frontend code
│   ├── server.js                     # Express app entry point
│   ├── seed.js                       # Database seeder (auto-runs if DB empty)
│   ├── .env                          # Environment variables (create this yourself)
│   ├── package.json                  # Dependencies and npm scripts
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication middleware
│   │
│   ├── models/                       # Mongoose database schemas
│   │   ├── User.js                   # User schema (client / freelancer)
│   │   ├── Otp.js                    # OTP schema (auto-expires in 10 mins via TTL)
│   │   ├── Task.js                   # Task/project schema
│   │   ├── TaskApplication.js        # Freelancer proposals
│   │   ├── Message.js                # In-task chat messages
│   │   └── Submission.js             # Phase deliverable submissions
│   │
│   ├── routes/                       # REST API route handlers
│   │   ├── auth.js                   # Register, Login (OTP), Verify OTP
│   │   ├── tasks.js                  # Task CRUD, stats, leaderboard
│   │   ├── applications.js           # Proposals, accept application
│   │   ├── messages.js               # In-task messaging
│   │   ├── phases.js                 # Phase templates by category
│   │   ├── submissions.js            # Phase submissions and approvals
│   │   └── users.js                  # User profile management
│   │
│   ├── utils/
│   │   ├── emailService.js           # HTML email templates via Nodemailer
│   │   ├── penaltyEngine.js          # Background engine for overdue tasks
│   │   └── phaseTemplates.js         # Milestone phase templates per category
│   │
│   ├── uploads/                      # Uploaded files (auto-created on startup)
│   │
│   └── public/                       # Frontend — AngularJS SPA
│       ├── index.html                # Main HTML shell (loads all scripts)
│       ├── app.js                    # Angular module, routes, all services
│       │
│       ├── css/
│       │   └── style.css             # Complete stylesheet (premium white theme)
│       │
│       ├── views/                    # Angular HTML page templates
│       │   ├── home.html             # Public landing page
│       │   ├── login.html            # Login form + OTP verification step
│       │   ├── register.html         # User registration form
│       │   ├── marketplace.html      # Task listing with filters
│       │   ├── dashboard.html        # User dashboard with stats
│       │   ├── post-task.html        # Post a new task (clients)
│       │   ├── messages.html         # Task-specific messaging
│       │   ├── leaderboard.html      # Top freelancers ranking
│       │   └── profile.html          # User profile edit page
│       │
│       └── controllers/              # Angular page controllers
│           ├── homeCtrl.js           # Landing page controller
│           ├── authCtrl.js           # Login, Register, OTP controller
│           ├── marketplaceCtrl.js    # Task browsing + apply
│           ├── dashboardCtrl.js      # Dashboard stats + task management
│           ├── postTaskCtrl.js       # Post task form
│           ├── messagesCtrl.js       # Real-time messaging
│           ├── leaderboardCtrl.js    # Leaderboard display
│           ├── profileCtrl.js        # Profile view and edit
│           └── rootCtrl.js           # Global: navbar, notifications, menus
│
└── README.md
```

---

## ✅ Prerequisites

Make sure the following are installed before running the project:

| Tool | Minimum Version | Download Link |
|---|---|---|
| **Node.js** | v18.0.0 | https://nodejs.org |
| **npm** | v9.0.0 | Included with Node.js |
| **Git** | Any | https://git-scm.com |
| **MongoDB Atlas account** | — | https://mongodb.com/atlas |

Verify your installations:
```bash
node --version    # should print v18.x.x or higher
npm --version     # should print v9.x.x or higher
```

---

## ⚙️ Installation & Setup

Follow these steps exactly in order.

---

### Step 1 — Get the Project Files

**Option A — Clone from Git:**
```bash
git clone https://github.com/your-username/skillbridge.git
cd skillbridge
```

**Option B — Already have the folder:**
Open a terminal/PowerShell window inside the project root folder.

---

### Step 2 — Go to the Server Folder

```bash
cd server
```

> All backend and frontend files are inside `server/`. This is where you run all commands.

---

### Step 3 — Install All Dependencies

```bash
npm install
```

This will install all required packages from `package.json`. Wait for it to complete — it may take 1-2 minutes.

---

### Step 4 — Set Up MongoDB Atlas (Cloud Database)

1. Go to **https://mongodb.com/atlas** and create a free account
2. Click **Create a Deployment** → choose **M0 Free Tier** → select a region
3. Create a **Database User**:
   - Username: `skillbridge_user` (or any name)
   - Password: create a strong password — **save it**
4. Under **Network Access** → click **Add IP Address** → choose **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Go to your Cluster → click **Connect** → **Drivers**
6. Select **Node.js** → copy the connection string, it looks like:
   ```
   mongodb+srv://skillbridge_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual DB user password
8. Save this connection string — you'll need it in the next step

---

### Step 5 — Set Up Gmail App Password (for OTP Emails)

> The app sends OTP emails via Gmail. You MUST use a Gmail **App Password**, not your regular password.

1. Log in to your Google Account at **https://myaccount.google.com**
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification** → Enable it
4. Go back to **Security** → search for **App passwords** at the bottom
5. Click **App passwords** → Select app: **Mail** → Select device: **Windows Computer**
6. Click **Generate** → Copy the **16-character password** shown (e.g. `abcd efgh ijkl mnop`)
7. Save this password — it will only be shown once

---

### Step 6 — Create the `.env` File

Inside the `server/` folder, create a file named `.env` (no extension):

```bash
# Windows PowerShell
New-Item .env -ItemType File

# Or just create it manually in VS Code / Notepad
```

Paste the following content and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.xxxxx.mongodb.net/skillbridge?retryWrites=true&w=majority
JWT_SECRET=MySkillBridgeSecretKey2025ChangeMeInProduction
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_character_app_password
```

> ⚠️ **Important:** Never share your `.env` file. Never commit it to GitHub.

---

## 🔑 Environment Variables — Full Reference

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | ✅ | `5000` | Port the Express server listens on |
| `MONGODB_URI` | ✅ | `mongodb+srv://...` | Full MongoDB connection string |
| `JWT_SECRET` | ✅ | `MySecretKey123` | Secret for signing JWT tokens. Use a long random string in production |
| `EMAIL_USER` | ✅ | `you@gmail.com` | Gmail address used to send OTP and notification emails |
| `EMAIL_PASS` | ✅ | `abcd efgh ijkl mnop` | Gmail App Password (16 characters) — NOT your Gmail login password |

---

## 🚀 Running the Application

### Development Mode (Recommended)

```bash
cd server
npm run dev
```

- Uses **nodemon** — server automatically restarts when you edit and save any file
- You will see in the terminal:
  ```
  🚀 Server running at http://localhost:5000
  ✅ Connected to MongoDB
  ```

### Production Mode

```bash
cd server
npm start
```

### Seed the Database Manually

```bash
cd server
npm run seed
```

> 💡 The database is **seeded automatically** on first startup if it's empty. You do not need to run this manually unless you want to reset the data.

---

### Open the App in Browser

After the server starts, open:

```
http://localhost:5000
```

You will land on the **SkillBridge Home Page** automatically.

> **Important:** Always use `http://localhost:5000` as the entry URL — not `/home`, `/login`, or any sub-path directly.

---

## 📄 Application Pages & Routes

### Public Pages (Accessible without login)

| URL | Page | Description |
|---|---|---|
| `http://localhost:5000` | 🏠 Home | Landing page — hero, features, categories, CTA |
| `http://localhost:5000/#!/login` | 🔐 Login | Email + Password → OTP step |
| `http://localhost:5000/#!/register` | 📝 Register | Create a new Client or Freelancer account |

### Protected Pages (Login required)

| URL | Page | Who Can Access |
|---|---|---|
| `http://localhost:5000/#!/marketplace` | 🛒 Marketplace | All logged-in users |
| `http://localhost:5000/#!/dashboard` | 📊 Dashboard | All logged-in users |
| `http://localhost:5000/#!/post-task` | ➕ Post Task | Clients only |
| `http://localhost:5000/#!/messages/:taskId` | 💬 Messages | Task participants |
| `http://localhost:5000/#!/leaderboard` | 🏆 Leaderboard | All logged-in users |
| `http://localhost:5000/#!/profile` | 👤 Profile | All logged-in users |

---

## 🔌 API Endpoints — Complete Reference

All API routes are prefixed with `/api`. All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth Required | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | `{ email, password, full_name, user_type }` | Register new user |
| `POST` | `/api/auth/login` | ❌ | `{ email, password }` | Step 1: Validate & send OTP |
| `POST` | `/api/auth/verify-otp` | ❌ | `{ email, otp }` | Step 2: Verify OTP, get JWT |
| `POST` | `/api/auth/resend-otp` | ❌ | `{ email }` | Resend OTP to email |
| `GET` | `/api/auth/me` | ✅ | — | Get current user profile |

---

### 📋 Tasks — `/api/tasks`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | Get all tasks (supports query filters) |
| `POST` | `/api/tasks` | ✅ | Create a new task (client only) |
| `GET` | `/api/tasks/stats` | ✅ | Get dashboard statistics |
| `GET` | `/api/tasks/leaderboard` | ✅ | Get top freelancer leaderboard |
| `GET` | `/api/tasks/:id` | ✅ | Get a single task by ID |
| `PATCH` | `/api/tasks/:id` | ✅ | Update task details |
| `PATCH` | `/api/tasks/:id/assign` | ✅ | Assign freelancer to task |
| `PATCH` | `/api/tasks/:id/phases` | ✅ | Update a task phase status |

**Query Filters for GET `/api/tasks`:**
```
?category=design
?status=open
?minBudget=100&maxBudget=500
?search=keyword
```

---

### 🤝 Applications — `/api/applications`

| Method | Endpoint | Auth Required | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/applications` | ✅ | `{ task_id, proposal_text, bid_amount }` | Apply to a task |
| `PATCH` | `/api/applications/:id/accept` | ✅ | — | Accept a freelancer application |

---

### 💬 Messages — `/api/messages`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/messages/task/:taskId` | ✅ | Get all messages for a task |
| `POST` | `/api/messages` | ✅ | Send a message |
| `PATCH` | `/api/messages/read/:taskId` | ✅ | Mark task messages as read |
| `DELETE` | `/api/messages/task/:taskId` | ✅ | Delete all messages for a task |
| `GET` | `/api/messages/unread-count` | ✅ | Get total unread message count |
| `GET` | `/api/messages/notifications` | ✅ | Get message notifications list |

---

### 👤 Users — `/api/users`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | Get own full profile |
| `PATCH` | `/api/users/me` | ✅ | Update own profile (bio, skills) |
| `GET` | `/api/users/leaderboard` | ✅ | Get user-based leaderboard |

---

### 📊 Phases — `/api/phases`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/phases` | ✅ | Get phase templates for a category |
| `GET` | `/api/phases/categories` | ✅ | Get all available task categories |

---

### 📎 Submissions — `/api/submissions`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/submissions/task/:taskId` | ✅ | Get all submissions for a task |
| `PATCH` | `/api/submissions/:id/approve` | ✅ | Approve a phase submission |

---

## 🔒 Authentication Flow

SkillBridge uses **Two-Step OTP Authentication** for security on every login:

```
┌─────────────────────────────────────────────────────┐
│  STEP 1 — Credentials                               │
│                                                     │
│  User enters Email + Password                       │
│            ↓                                        │
│  Server validates credentials against DB            │
│            ↓                                        │
│  6-digit OTP generated (e.g. 483921)                │
│            ↓                                        │
│  OTP saved to DB with 10-minute TTL expiry          │
│            ↓                                        │
│  OTP emailed to user via Gmail (Nodemailer)         │
│            ↓                                        │
│  Response: { step: 'otp', email: '...' }            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  STEP 2 — OTP Verification                          │
│                                                     │
│  User enters 6-digit OTP from email                 │
│            ↓                                        │
│  Server finds OTP record by email                   │
│            ↓                                        │
│  Compares entered OTP with stored OTP               │
│            ↓                                        │
│  OTP deleted from DB (one-time use only)            │
│            ↓                                        │
│  JWT token issued (expires in 7 days)               │
│            ↓                                        │
│  User is logged in ✅ Redirected to Marketplace    │
└─────────────────────────────────────────────────────┘
```

### Security Details
- Passwords are hashed using **bcrypt** (12 salt rounds)
- OTP expires automatically via MongoDB **TTL index** (10 minutes)
- OTP is deleted immediately after use (cannot be reused)
- JWT tokens expire in **7 days**
- Every API request validates the JWT via middleware

---

## 📧 Email Notifications

The following emails are sent automatically:

| When | Email | Content |
|---|---|---|
| User registers | 🎉 **Welcome Email** | Welcome to SkillBridge, account details |
| User logs in (Step 1) | 🔐 **OTP Email** | 6-digit code, valid for 10 minutes |
| User successfully logs in | 🔔 **Login Alert** | Security notification with date & time |

> 📌 **Local Development Tip:** OTP is always printed in the server console even if email fails:
> ```
> 🔑 [Local Development] Generated OTP for user@email.com: 483921
> ```

> ⚡ Emails are sent **non-blocking** — if email fails, the app continues to work normally.

---

## 👥 User Roles

### 🧑‍💼 Client
- Register as **Client**
- Post tasks with title, description, category, budget, deadline
- Review proposals received from freelancers
- Accept one freelancer per task
- Track task progress through phases
- Approve or reject phase submissions
- Chat with the assigned freelancer

### 💻 Freelancer
- Register as **Freelancer**
- Browse all open tasks in the marketplace
- Apply to tasks with a proposal message and bid amount
- Update phase status when work is in progress
- Submit phase deliverables for client review
- Chat with the client
- Earn rating after task completion
- Appear on public leaderboard

---

## 🔧 Troubleshooting

### ❌ Cannot connect to MongoDB

**Error:** `MongoDB connection error: ...`

**Solutions:**
1. Double-check your `MONGODB_URI` in `.env`
2. Verify your **DB user password** is correct (no special chars without encoding)
3. In Atlas → Network Access → make sure `0.0.0.0/0` is added
4. Make sure your cluster is not paused (free clusters pause after inactivity)
5. Try connecting with MongoDB Compass to verify credentials

---

### ❌ OTP Email Not Received

**Solutions:**
1. Check `EMAIL_USER` and `EMAIL_PASS` are correctly set in `.env`
2. Make sure `EMAIL_PASS` is a **Gmail App Password** (16 chars), NOT your Gmail login password
3. Ensure 2-Step Verification is enabled on the Gmail account
4. Check the **Spam/Junk** folder in your email
5. Check the **server terminal** — OTP is always printed there:
   ```
   🔑 [Local Development] Generated OTP for you@email.com: 482910
   ```

---

### ❌ Home Page Redirecting to Login

**Solutions:**
1. Press `Ctrl + Shift + R` in your browser (hard refresh — clears cache)
2. Make sure the server was **restarted** after any changes to `server.js`

---

### ❌ Port 5000 Already in Use

**Error:** `EADDRINUSE :::5000`

**Solution (Windows PowerShell):**
```powershell
netstat -ano | findstr :5000
taskkill /PID <pid_number> /F
```

Then restart the server.

---

### ❌ `npm install` Fails

**Solutions:**
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

### ❌ Page Shows Blank / White Screen

**Solutions:**
1. Open browser **DevTools** → `F12` → check **Console** for errors
2. Hard refresh: `Ctrl + Shift + R`
3. Make sure you're visiting `http://localhost:5000` (not a sub-path)

---

## 📦 npm Scripts Reference

Run all commands from inside the `server/` directory:

| Command | What It Does |
|---|---|
| `npm start` | Start server with `node server.js` (production) |
| `npm run dev` | Start server with `nodemon` — auto-restarts on file change |
| `npm run seed` | Manually run the database seeder |

---

## 🌐 Browser Compatibility

| Browser | Supported |
|---|---|
| Chrome 90+ | ✅ Yes |
| Firefox 88+ | ✅ Yes |
| Microsoft Edge 90+ | ✅ Yes |
| Safari 14+ | ✅ Yes |

---

## 📝 Important Notes

- The frontend is served from the **same Express server** as the API — no separate frontend server needed
- Always open the app from `http://localhost:5000` (the root URL)
- The `uploads/` directory is **created automatically** on first server startup
- If the database is empty on startup, **seed data is inserted automatically**
- The app uses **AngularJS hash-based routing** (`#!/`) — bookmark URLs look like `http://localhost:5000/#!/marketplace`

---

<div align="center">

Built with ❤️ using **Node.js · Express · MongoDB · AngularJS**

⚡ **SkillBridge** — Connecting Talent with Opportunity

</div>
