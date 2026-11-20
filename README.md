# ⚡ SkillBridge — Freelancer Mini Market Platform

<div align="center">

![SkillBridge](https://img.shields.io/badge/SkillBridge-Freelance%20Marketplace-1dbf73?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-AI%20Workflow%20Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![AngularJS](https://img.shields.io/badge/AngularJS-1.8-E23237?style=for-the-badge&logo=angularjs&logoColor=white)
![Render](https://img.shields.io/badge/Deploy-Render%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**A modern full-stack freelance marketplace platform powered by an intelligent, event-driven AI workflow engine.**  
Post tasks, receive competitive bids, track milestone phases, chat in real-time, and get AI assistance via **SkillBot** (integrated with **n8n Workflow Automation** & **Google Gemini AI**).

[🌐 View Live Deployment on Render](https://skillbridge-freelancer-app.onrender.com/)

</div>

---

## 📋 Table of Contents

- [🌟 Project Overview](#-project-overview)
- [🤖 SkillBot: n8n + Gemini AI Architecture](#-skillbot-n8n--gemini-ai-architecture)
- [✨ Core Features](#-core-features)
- [🛠 Tech Stack](#-tech-stack)
- [📐 System Architecture](#-system-architecture)
- [📁 Project Structure](#-project-structure)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [🔄 n8n AI Workflow Setup Guide](#-n8n-ai-workflow-setup-guide)
- [☁️ Cloud Deployment (Render & GitHub)](#️-cloud-deployment-render--github)
- [🛣 API Endpoints Reference](#-api-endpoints-reference)
- [🔒 Authentication & Email Notifications](#-authentication--email-notifications)
- [❓ Frequently Asked Questions & Troubleshooting](#-frequently-asked-questions--troubleshooting)

---

## 🌟 Project Overview

**SkillBridge** provides an end-to-end freelancing marketplace experience:
- **Clients**: Post customized tasks with structured milestone phases, review incoming bids, and manage project lifecycles.
- **Freelancers**: Discover open gigs, match required skills, submit bids, deliver milestone work, and compete on the platform leaderboard.
- **Milestone Phase Engine**: Automated milestone status tracking with real-time penalty calculations for overdue deliveries.
- **SkillBot AI Assistant**: An intelligent chatbot powered by **n8n workflow automation** and **Google Gemini 2.5 Flash**, offering natural human conversation, platform recommendations, and automated 6-hour quota management.

---

## 🤖 SkillBot: n8n + Gemini AI Architecture

SkillBridge features an enterprise-grade, **decoupled low-code AI pipeline**:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    User Message                        │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │       Chatbot API (/api/chatbot)        │
                                      │  • Checks 3-query limit (6-hour refill) │
                                      │  • Builds dynamic DB context prompt     │
                                      └────────────────────┬────────────────────┘
                                                           │
                                             Is N8N_WEBHOOK_URL Configured?
                                                           │
                             ┌─────────────────────────────┴─────────────────────────────┐
                             │ YES                                                       │ NO (or Webhook Timeout)
                             ▼                                                           ▼
              ┌─────────────────────────────┐                             ┌─────────────────────────────┐
              │    Primary: n8n Webhook     │                             │   Direct Cloud AI Fallback  │
              │  • Node 1: Catch Webhook    │                             │  • Native Google GenAI SDK  │
              │  • Node 2: Prepare Payload  │                             │  • Model: gemini-2.5-flash  │
              │  • Node 3: Gemini API Call  │                             │  • Resilient multi-model    │
              │  • Node 4: Extract & Return │                             │    fallback (24/7 uptime)   │
              └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                             │                                                           │
                             └─────────────────────────────┬─────────────────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │      Chatbot Displays AI Response       │
                                      │   *(📊 2 AI queries remaining · 6h)*    │
                                      └─────────────────────────────────────────┘
```

### Key AI Highlights:
1. **Low-Code Middleware (n8n)**:
   - Visual drag-and-drop workflow handling prompt preprocessing and AI API execution.
   - Non-technical team members can modify prompts or swap AI models without touching server code.
2. **High-Availability Circuit Breaker (Method 3)**:
   - If n8n is offline or unreachable from the cloud (e.g. deployed on Render), the server automatically and seamlessly routes queries to the **direct Google GenAI SDK**.
3. **Session Rate Limiting & 6-Hour Refill**:
   - Each user gets **3 AI queries** per window.
   - Automatically refills every **6 hours** with dynamic countdown calculation (`5h 30m remaining`).
   - Administrative override: Type `reset limit` in chat to refresh instantly for testing.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🤖 **SkillBot AI Assistant** | Low-code n8n & Google Gemini AI chatbot answering general & platform questions with dynamic user quota |
| 🔐 **OTP Authentication** | Two-factor passwordless authentication using multi-strategy delivery (SMTP + EmailJS REST API) |
| 🔑 **Demo Master Code** | Pre-configured `123456` bypass for quick testing without waiting on mailbox queues |
| 📋 **Task Marketplace** | Live task feed with real-time category filtering, urgency flags, budget sort, and skill badges |
| 📝 **Milestone Phase Creator** | Clients configure multi-step project phases with custom deadlines and deliverables |
| 🤝 **Proposal & Bidding** | Freelancers apply with custom proposals, projected completion dates, and pricing |
| 💬 **In-Task Messaging** | Real-time chat system connecting clients and freelancers directly inside active tasks |
| ⚡ **Automatic Penalty Engine** | Background scheduler monitoring overdue phases and calculating penalty deductions |
| 🏆 **Freelancer Leaderboard** | Public rankings based on completed project counts, earnings, and client ratings |
| 👤 **User Profiles & Skills** | Editable profiles featuring bios, skill tags, user types, and past work history |
| 🇮🇳 **Pre-Seeded Indian Demo Data** | 10 realistic seeded profiles (4 clients, 6 freelancers) with real projects and chat histories |

---

## 🛠 Tech Stack

### Backend
- **Node.js** (v20+ / v22 LTS) & **Express 5**
- **MongoDB Atlas** with **Mongoose ODM**
- **Google GenAI SDK** (`@google/genai`) — Gemini 2.5 Flash
- **n8n Workflow Automation** (Self-hosted / Cloud Webhooks)
- **JSON Web Tokens (JWT)** & **Bcrypt.js**
- **Nodemailer** & **EmailJS REST API**

### Frontend
- **AngularJS (1.8)** SPA Architecture
- **HTML5**, **CSS3 (Custom Glassmorphism Design)**, **Bootstrap Icons**
- Responsive Mobile-First Design
- In-memory conversation and session state managers

---

## 📁 Project Structure

```text
Freelancer_Mini_Market_Platform/
├── package.json                 # Root dependencies & project config
├── README.md                    # Project documentation
├── server/
│   ├── .env                     # Environment variables (Mongo, Gemini, n8n, Email)
│   ├── package.json             # Backend dependencies
│   ├── server.js                # Express app entry point & static file server
│   ├── seed.js                  # Database seeder (10 Indian users + tasks + chats)
│   ├── config/                  # Configuration files
│   ├── controllers/             # API request handlers
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── visitorTracker.js    # IP & visitor tracking middleware
│   ├── models/
│   │   ├── User.js              # User model (Clients & Freelancers)
│   │   ├── Task.js              # Task model with nested milestone phases
│   │   ├── TaskApplication.js   # Bids and proposals
│   │   ├── Message.js           # Real-time task chat logs
│   │   └── Otp.js               # One-time login tokens
│   ├── routes/
│   │   ├── auth.js              # Signup, OTP send, OTP verify, login
│   │   ├── tasks.js             # Task CRUD and assignment
│   │   ├── chatbot.js           # SkillBot route with 6-hour quota engine
│   │   └── messages.js          # In-task communication
│   ├── utils/
│   │   ├── zapierAI.js          # Unified AI caller: n8n webhook + Gemini fallback
│   │   ├── penaltyEngine.js     # Background SLA and penalty calculator
│   │   └── phaseTemplates.js    # Default milestone templates by category
│   └── public/                  # AngularJS Single Page Application
│       ├── index.html           # Main HTML shell
│       ├── views/               # Route views (marketplace, dashboard, post-task, etc.)
│       └── controllers/         # AngularJS controllers (dashboardCtrl, taskCtrl, etc.)
```

---

## ⚙️ Environment Variables

Create or update `server/.env`:

```env
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillbridge_db?retryWrites=true&w=majority

# Security
JWT_SECRET=your_super_secret_jwt_key_here

# AI & Automation
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# n8n AI Webhook (Local or Tunnel)
# Leave blank or omit on Render for 24/7 direct Gemini cloud mode
N8N_WEBHOOK_URL=http://localhost:5678/webhook/skillbridge-chatbot

# Email Notifications (Gmail SMTP or EmailJS REST API)
EMAILJS_SERVICE_ID=service_xxxx
EMAILJS_TEMPLATE_ID=template_xxxx
EMAILJS_PUBLIC_KEY=xxxx
EMAILJS_PRIVATE_KEY=xxxx
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

---

## 🚀 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/drsvvn25/skillbridge-freelancer-app.git
cd skillbridge-freelancer-app
```

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-restart)
npm run dev
```

The application will be accessible at: **`http://localhost:5000`**

*(If the database is empty, seed data runs automatically on initial startup!)*

---

## 🔄 n8n AI Workflow Setup Guide

To run your own visual automation pipeline locally:

1. **Install and run n8n**:
   ```bash
   npm install -g n8n
   n8n start
   ```
2. Open **`http://localhost:5678`** and create a workflow:
   - **Node 1 (Webhook)**: Method `POST`, Path `skillbridge-chatbot`, Response Mode `Using 'Respond to Webhook' Node`.
   - **Node 2 (Code)**: Transform incoming message into Gemini payload format.
   - **Node 3 (HTTP Request)**: POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY`.
   - **Node 4 (Code)**: Extract generated text from `candidates[0].content.parts[0].text`.
   - **Node 5 (Respond to Webhook)**: Respond with JSON `{ "reply": "={{ $json.reply }}" }`.
3. Set your workflow to **Active (Green)**.
4. Set `N8N_WEBHOOK_URL=http://localhost:5678/webhook/skillbridge-chatbot` in `server/.env`.

---

## ☁️ Cloud Deployment (Render & GitHub)

The live project is deployed on **Render**:
👉 **[https://skillbridge-freelancer-app.onrender.com/](https://skillbridge-freelancer-app.onrender.com/)**

### Deploying Your Own Fork:
1. Push code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Deploy SkillBridge"
   git push origin main
   ```
2. In [Render Dashboard](https://dashboard.render.com), create a **New Web Service** pointing to your repo.
3. Configure settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Root Directory**: `server`
4. Add your Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
5. **Leave `N8N_WEBHOOK_URL` unset on Render** — the backend automatically activates the 24/7 direct Gemini API with zero cloud latency!

---

## 🛣 API Endpoints Reference

### 🤖 Chatbot & AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chatbot/message` | Required | Authenticated chat query (tracks 3-query limit & 6h refill) |
| `POST` | `/api/chatbot/guest` | None | Guest landing page AI assistant queries |

### 🔐 Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Create a new client or freelancer account |
| `POST` | `/api/auth/send-otp` | None | Generate & dispatch login verification code |
| `POST` | `/api/auth/verify-otp` | None | Validate OTP (or master code `123456`) & return JWT |

### 📋 Tasks & Marketplace
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Optional | Browse open tasks with filters (category, urgency, search) |
| `POST` | `/api/tasks` | Client | Post a new project task with phase milestones |
| `GET` | `/api/tasks/:id` | Required | Retrieve task details, deliverables, and submissions |
| `POST` | `/api/tasks/:id/apply` | Freelancer | Submit a proposal/bid on an open task |
| `POST` | `/api/tasks/:id/assign` | Client | Accept proposal and assign freelancer to project |

---

## 🔒 Authentication & Email Notifications

1. **Passwordless Email OTP**: Users log in by entering their registered email. A 6-digit OTP is securely dispatched.
2. **Multi-Channel Fallback**: If SMTP outbound ports (465/587) are restricted by hosting firewalls, delivery fails over instantly to the HTTPS REST API (Port 443).
3. **Demo Master Key**: For instant testing or demonstration without checking real inboxes, use **`123456`**.

---

## ❓ Frequently Asked Questions & Troubleshooting

#### 1. Why does Render use direct Gemini instead of local n8n?
Render runs in a cloud data center and cannot reach your private laptop's `localhost:5678`. Our **Enterprise Circuit Breaker** detects this and runs the direct Google GenAI SDK, providing 24/7 uptime without requiring your laptop to remain running.

#### 2. How do I test the 6-hour quota refill immediately?
Simply send **`reset limit`** in the SkillBot chat window. The server will clear your session counter back to `0/3`.

#### 3. How do I restart the server if Port 5000 is occupied?
```powershell
# Windows PowerShell
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

---

<div align="center">

Built with ❤️ by **Divy** & Team  
⚡ **SkillBridge** — Empowering Freelancers & Connecting Global Talent

</div>
