const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const TaskApplication = require('./models/TaskApplication');
const Message = require('./models/Message');
const Submission = require('./models/Submission');
const { getPhasesForCategory } = require('./utils/phaseTemplates');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://drsvvn25_db_user:KxrLb2TgXtqdkJPV@cluster0.epiwhtv.mongodb.net/skillbridge_db?retryWrites=true&w=majority';

async function seedDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB for seeding...');
    }

    // Clear existing data completely
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      TaskApplication.deleteMany({}),
      Message.deleteMany({}),
      Submission.deleteMany({})
    ]);
    console.log('Cleared existing database collections.');

    // ─────────────────────────────────────────────────────────
    // 1. CREATE 10 INDIAN USERS (4 Clients, 6 Freelancers)
    // ─────────────────────────────────────────────────────────
    // Clients
    const rajesh = await User.create({
      email: 'rajesh.sharma@example.com',
      password: 'password123',
      full_name: 'Rajesh Sharma',
      user_type: 'client',
      bio: 'CEO & Founder at TechSolutions India (Mumbai). Hiring top talent for enterprise SaaS products.',
    });

    const sunita = await User.create({
      email: 'sunita.kapoor@example.com',
      password: 'password123',
      full_name: 'Sunita Kapoor',
      user_type: 'client',
      bio: 'Managing Director at CraftVeda Organics (Jaipur). Scaling eco-friendly brands globally.',
    });

    const vikram = await User.create({
      email: 'vikram.verma@example.com',
      password: 'password123',
      full_name: 'Vikramaditya Verma',
      user_type: 'client',
      bio: 'Founder of Apex Retail Solutions (Bengaluru). Tech enthusiast & investor.',
    });

    const anita = await User.create({
      email: 'anita.deshmukh@example.com',
      password: 'password123',
      full_name: 'Anita Deshmukh',
      user_type: 'client',
      bio: 'Product Head at GreenEarth Innovations (Pune). Building sustainable technology.',
    });

    // Freelancers
    const aarav = await User.create({
      email: 'aarav.patel@example.com',
      password: 'password123',
      full_name: 'Aarav Patel',
      user_type: 'freelancer',
      is_premium: true,
      rating: 4.9,
      total_tasks_completed: 18,
      skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
      bio: 'Senior Full-Stack Architect with 7+ years of experience in MERN & Cloud Systems (Mumbai).',
    });

    const priya = await User.create({
      email: 'priya.iyer@example.com',
      password: 'password123',
      full_name: 'Priya Iyer',
      user_type: 'freelancer',
      is_premium: true,
      rating: 4.8,
      total_tasks_completed: 15,
      skills: ['Figma', 'UI/UX', 'Logo Design', 'Branding', 'Illustrator'],
      bio: 'Award-winning UI/UX & Brand Identity Specialist based in Chennai.',
    });

    const rohan = await User.create({
      email: 'rohan.mehta@example.com',
      password: 'password123',
      full_name: 'Rohan Mehta',
      user_type: 'freelancer',
      is_premium: false,
      rating: 4.7,
      total_tasks_completed: 9,
      skills: ['Python', 'Django', 'Machine Learning', 'Data Analysis', 'Scikit-Learn'],
      bio: 'Data Scientist & Python AI Engineer specializing in predictive analytics (Hyderabad).',
    });

    const ananya = await User.create({
      email: 'ananya.singh@example.com',
      password: 'password123',
      full_name: 'Ananya Singh',
      user_type: 'freelancer',
      is_premium: false,
      rating: 4.6,
      total_tasks_completed: 11,
      skills: ['SEO', 'Content Writing', 'Copywriting', 'Digital Marketing'],
      bio: 'SEO Content Strategist helping brands rank #1 on Google (Delhi NCR).',
    });

    const devansh = await User.create({
      email: 'devansh.joshi@example.com',
      password: 'password123',
      full_name: 'Devansh Joshi',
      user_type: 'freelancer',
      is_premium: false,
      rating: 4.5,
      total_tasks_completed: 7,
      skills: ['Flutter', 'React Native', 'Mobile Apps', 'Firebase'],
      bio: 'Cross-platform Mobile App Specialist crafting seamless iOS & Android apps (Ahmedabad).',
    });

    const ishita = await User.create({
      email: 'ishita.nair@example.com',
      password: 'password123',
      full_name: 'Ishita Nair',
      user_type: 'freelancer',
      is_premium: false,
      rating: 4.8,
      total_tasks_completed: 14,
      skills: ['Video Editing', 'After Effects', 'Premiere Pro', 'Motion Graphics'],
      bio: 'Creative Motion Graphic Designer & Video Editor for social media & marketing campaigns (Kochi).',
    });

    console.log('✅ Created 10 Indian user accounts (Password for all: password123).');

    // ─────────────────────────────────────────────────────────
    // 2. CREATE TASKS ACROSS VARIOUS CATEGORIES & STATES
    // ─────────────────────────────────────────────────────────
    const tasks = await Task.insertMany([
      // Task 1: Open Task (Mobile App)
      {
        client_id: anita._id,
        title: 'Cross-Platform Food Delivery Mobile App (Flutter & Firebase)',
        description: 'Need a fast, responsive food delivery app for iOS and Android with live GPS order tracking, payment integration, and admin portal.',
        budget: 650,
        commission_amount: 65,
        category: 'Mobile Apps',
        urgency: 'urgent',
        required_skills: ['Flutter', 'Firebase', 'Mobile Apps', 'UI/UX'],
        status: 'open',
        phases: getPhasesForCategory('Mobile Apps'),
        current_phase_index: 0
      },
      // Task 2: In-Progress Task (Website Building)
      {
        client_id: rajesh._id,
        freelancer_id: aarav._id,
        title: 'Full-Stack Enterprise SaaS Platform Migration (MERN)',
        description: 'Migrating legacy monolith application to modern microservices architecture using React, Node.js, Express, and MongoDB Atlas.',
        budget: 1200,
        commission_amount: 120,
        category: 'Website Building',
        urgency: 'normal',
        required_skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        status: 'in_progress',
        phases: getPhasesForCategory('Website Building'),
        current_phase_index: 1
      },
      // Task 3: Open Task (Logo & Branding)
      {
        client_id: sunita._id,
        title: 'Brand Logo & Style Guide for CraftVeda Organics',
        description: 'Looking for a premium, minimalist organic brand logo. Deliverables: Vector source files, brand color palette, typography, and social media kit.',
        budget: 250,
        commission_amount: 25,
        category: 'Logo Design',
        urgency: 'normal',
        required_skills: ['Logo Design', 'Figma', 'Branding'],
        status: 'open',
        phases: getPhasesForCategory('Logo Design'),
        current_phase_index: 0
      },
      // Task 4: Completed Task (Content Writing)
      {
        client_id: vikram._id,
        freelancer_id: ananya._id,
        title: '15 High-Ranking Tech & Artificial Intelligence SEO Articles',
        description: 'Write 15 engaging, 1500-word SEO articles on AI, Machine Learning trends, and Cloud Computing with keyword optimization.',
        budget: 450,
        commission_amount: 45,
        category: 'Content Writing',
        urgency: 'normal',
        required_skills: ['SEO', 'Content Writing', 'Copywriting'],
        status: 'completed',
        phases: getPhasesForCategory('Content Writing').map(p => ({ ...p, status: 'completed', completed_at: new Date() })),
        current_phase_index: 5,
        completed_at: new Date()
      },
      // Task 5: Open Task (Data Science)
      {
        client_id: rajesh._id,
        title: 'Customer Churn AI Prediction Model (Python & Scikit-Learn)',
        description: 'Build and train a machine learning model to predict customer churn based on historical transactional data. Must achieve >88% accuracy.',
        budget: 500,
        commission_amount: 50,
        category: 'Data Science',
        urgency: 'urgent',
        required_skills: ['Python', 'Machine Learning', 'Data Analysis'],
        status: 'open',
        phases: getPhasesForCategory('Data Science'),
        current_phase_index: 0
      },
      // Task 6: In-Progress Task (Video Editing)
      {
        client_id: sunita._id,
        freelancer_id: ishita._id,
        title: '30-Second Motion Graphics Product Launch Reel',
        description: 'Produce a vibrant 4K product promo reel for Instagram & YouTube Shorts featuring 3D product renders and energetic background music.',
        budget: 350,
        commission_amount: 35,
        category: 'Video Editing',
        urgency: 'urgent',
        required_skills: ['Video Editing', 'After Effects', 'Motion Graphics'],
        status: 'in_progress',
        phases: getPhasesForCategory('Video Editing'),
        current_phase_index: 0
      },
      // Task 7: Completed Task (Logo Design)
      {
        client_id: vikram._id,
        freelancer_id: priya._id,
        title: 'Luxury Real Estate Logo & Brand Identity Package',
        description: 'Design an elegant luxury brand identity for Apex Luxury Heights Bengaluru.',
        budget: 300,
        commission_amount: 30,
        category: 'Logo Design',
        urgency: 'normal',
        required_skills: ['Logo Design', 'Figma', 'Branding'],
        status: 'completed',
        phases: getPhasesForCategory('Logo Design').map(p => ({ ...p, status: 'completed', completed_at: new Date() })),
        current_phase_index: 3,
        completed_at: new Date()
      }
    ]);

    console.log('✅ Created 7 sample tasks across various categories and lifecycle stages.');

    // Update phase statuses for active Task 2 (MERN Migration)
    const task2 = await Task.findById(tasks[1]._id);
    task2.phases[0].status = 'completed';
    task2.phases[0].completed_at = new Date(Date.now() - 36 * 60 * 60 * 1000);
    task2.phases[1].status = 'active';
    task2.phases[1].started_at = new Date(Date.now() - 12 * 60 * 60 * 1000);
    await task2.save();

    // Update phase statuses for active Task 6 (Video Editing)
    const task6 = await Task.findById(tasks[5]._id);
    task6.phases[0].status = 'active';
    task6.phases[0].started_at = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await task6.save();

    // ─────────────────────────────────────────────────────────
    // 3. CREATE TASK APPLICATIONS (PROPOSALS & BIDS)
    // ─────────────────────────────────────────────────────────
    await TaskApplication.create([
      // Proposals for Task 1 (Mobile App)
      {
        task_id: tasks[0]._id,
        freelancer_id: devansh._id,
        proposal_text: 'I have built over 12 Flutter mobile apps with Firebase backend. I can deliver the complete iOS and Android build in 14 days with clean code.',
        bid_amount: 600,
        status: 'pending'
      },
      {
        task_id: tasks[0]._id,
        freelancer_id: aarav._id,
        proposal_text: 'Senior architect here. Will build with scalable architecture and offline sync support.',
        bid_amount: 650,
        status: 'pending'
      },
      // Proposals for Task 3 (Logo Design)
      {
        task_id: tasks[2]._id,
        freelancer_id: priya._id,
        proposal_text: 'Hi Sunita! I specialize in organic & eco-friendly brand design. I will provide 5 unique concepts with unlimited revisions.',
        bid_amount: 240,
        status: 'pending'
      },
      // Proposals for Task 5 (Data Science)
      {
        task_id: tasks[4]._id,
        freelancer_id: rohan._id,
        proposal_text: 'I hold an M.Tech in Data Science and have deployed production churn models. I will provide a Jupyter notebook & REST API endpoint.',
        bid_amount: 480,
        status: 'pending'
      }
    ]);

    console.log('✅ Created proposal applications for open tasks.');

    // ─────────────────────────────────────────────────────────
    // 4. CREATE CHAT MESSAGES
    // ─────────────────────────────────────────────────────────
    await Message.create([
      {
        task_id: task2._id,
        sender_id: rajesh._id,
        receiver_id: aarav._id,
        content: 'Hi Aarav, welcome to the SaaS migration project! The database schema has been shared in your email.',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        task_id: task2._id,
        sender_id: aarav._id,
        receiver_id: rajesh._id,
        content: 'Thank you Rajesh! Phase 1 (Architecture Planning) is complete. Currently setting up the Express API routes.',
        is_read: true,
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000)
      },
      {
        task_id: task2._id,
        sender_id: rajesh._id,
        receiver_id: aarav._id,
        content: 'Awesome progress! Let me know if you need any API key for the payment gateway integration.',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      // Messages for Task 6
      {
        task_id: task6._id,
        sender_id: sunita._id,
        receiver_id: ishita._id,
        content: 'Hi Ishita! Please check the brand color guidelines for CraftVeda before rendering the 3D assets.',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        task_id: task6._id,
        sender_id: ishita._id,
        receiver_id: sunita._id,
        content: 'Got it Sunita! Following the exact HEX palette (#1DBF73 & #0EA5E9). First draft storyboard coming right up!',
        is_read: true,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]);

    console.log('✅ Created real-time sample chat messages.');

    // ─────────────────────────────────────────────────────────
    // 5. CREATE SUBMISSIONS
    // ─────────────────────────────────────────────────────────
    await Submission.create([
      {
        task_id: task2._id,
        phase_index: 0,
        freelancer_id: aarav._id,
        file_url: '/uploads/sample_architecture_doc.pdf',
        file_type: 'document',
        original_name: 'SaaS_Microservices_Architecture_v1.pdf',
        note: 'Phase 1 Complete: Full system architecture diagram and MongoDB collection schemas.',
        is_approved: true,
        submitted_at: new Date(Date.now() - 36 * 60 * 60 * 1000),
        approved_at: new Date(Date.now() - 30 * 60 * 60 * 1000)
      }
    ]);

    console.log('✅ Created phase submission data.');
    console.log('🎉 Database seeding complete! All features populated with Indian demo data.');

    if (require.main === module) {
      await mongoose.connection.close();
    }
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
