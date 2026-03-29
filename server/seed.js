const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const TaskApplication = require('./models/TaskApplication');
const Message = require('./models/Message');
const Submission = require('./models/Submission');
const { getPhasesForCategory } = require('./utils/phaseTemplates');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freelancer_market';

async function seedDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB for seeding...');
    }

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await TaskApplication.deleteMany({});
    await Message.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Users
    const client = await User.create({
      email: 'client@example.com',
      password: 'password123',
      full_name: 'Tech Innovators Inc.',
      user_type: 'client',
      bio: 'We build the future of software.',
    });

    const premiumFreelancer = await User.create({
      email: 'pro@example.com',
      password: 'password123',
      full_name: 'Alex Pro Developer',
      user_type: 'freelancer',
      is_premium: true,
      rating: 4.9,
      total_tasks_completed: 12,
      bio: 'Expert Full-Stack Developer with a proven track record.',
    });

    const standardFreelancer = await User.create({
      email: 'dev@example.com',
      password: 'password123',
      full_name: 'Sam Standard',
      user_type: 'freelancer',
      is_premium: false,
      rating: 4.2,
      total_tasks_completed: 3,
      bio: 'Up and coming designer and developer.',
    });

    console.log('Sample users created (password: password123).');

    // 2. Create Tasks
    const websitePhases = getPhasesForCategory('Website Building');
    const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000); // 2.5 hours ago

    const tasks = await Task.insertMany([
      // Task 1: Open task with proposals
      {
        client_id: client._id,
        title: 'Logo Design for New Startup',
        description: 'Need a stunning logo. 5 concepts required. Brand colors are blue and gold.',
        budget: 200,
        commission_amount: 20,
        category: 'Logo Design',
        status: 'open',
        phases: getPhasesForCategory('Logo Design'),
        current_phase_index: 0
      },
      // Task 2: In-progress task for chatting and phase testing
      {
        client_id: client._id,
        freelancer_id: premiumFreelancer._id,
        title: 'Full-Stack Web App Migration',
        description: 'Migrating from Vue to React. Need complete setup.',
        budget: 800,
        commission_amount: 80,
        category: 'Website Building',
        status: 'in_progress',
        phases: getPhasesForCategory('Website Building'),
        current_phase_index: 1
      },
      // Task 3: Completed task
      {
        client_id: client._id,
        freelancer_id: standardFreelancer._id,
        title: 'Write 5 SEO Articles',
        description: 'Looking for high quality content for our tech blog.',
        budget: 300,
        commission_amount: 30,
        category: 'Content Writing',
        status: 'completed',
        phases: getPhasesForCategory('Content Writing').map(p => ({ ...p, status: 'completed' })),
        current_phase_index: 5,
        completed_at: new Date()
      }
    ]);

    // Activate phases for Task 2
    const activeTask = await Task.findById(tasks[1]._id);
    activeTask.phases[0].status = 'completed';
    activeTask.phases[1].status = 'active';
    activeTask.phases[1].started_at = new Date();
    await activeTask.save();

    // 2.5 Add Messages for the active task
    await Message.create({
      task_id: activeTask._id,
      sender_id: client._id,
      receiver_id: premiumFreelancer._id,
      content: 'Hey Alex, excited to start this migration project! Let me know if you need anything.',
      is_read: true,
    });

    await Message.create({
      task_id: activeTask._id,
      sender_id: premiumFreelancer._id,
      receiver_id: client._id,
      content: 'Thanks! I have already set up the React skeleton. I will update you soon!',
      is_read: false,
    });

    // 3. Create Applications
    await TaskApplication.create({
      task_id: tasks[0]._id, // Open task
      freelancer_id: premiumFreelancer._id,
      proposal_text: 'I have 10 years of experience in logo design and can deliver perfection.',
      bid_amount: 180,
      status: 'pending',
    });

    await TaskApplication.create({
      task_id: tasks[0]._id, // Open task
      freelancer_id: standardFreelancer._id,
      proposal_text: 'I am excited to work on this! Here are some of my past works...',
      bid_amount: 150,
      status: 'pending',
    });


    console.log('Database seeded successfully! 🌱 Created fully functioning demo state.');

    if (require.main === module) {
      await mongoose.connection.close();
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
