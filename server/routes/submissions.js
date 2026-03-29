const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return 'video';
  return 'document';
}

// POST /api/submissions — upload file for a phase
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { task_id, phase_index, note } = req.body;

    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.freelancer_id || task.freelancer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only assigned freelancer can submit' });
    }

    const submission = new Submission({
      task_id,
      phase_index: parseInt(phase_index),
      freelancer_id: req.user._id,
      file_url: `/uploads/${req.file.filename}`,
      file_type: getFileType(req.file.originalname),
      original_name: req.file.originalname,
      note: note || '',
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/submissions/task/:taskId — list submissions for a task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ task_id: req.params.taskId })
      .sort({ submitted_at: -1 })
      .populate('freelancer_id', 'full_name email');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/submissions/:id/approve — client approves submission, advance phase
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const task = await Task.findById(submission.task_id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the task client can approve' });
    }

    // Approve the submission
    submission.is_approved = true;
    submission.approved_at = new Date();
    await submission.save();

    // Mark current phase as completed
    const phaseIdx = task.current_phase_index;
    if (phaseIdx < task.phases.length) {
      task.phases[phaseIdx].status = 'completed';
      task.phases[phaseIdx].completed_at = new Date();
    }

    // Advance to next phase or complete task
    const nextIdx = phaseIdx + 1;
    if (nextIdx < task.phases.length) {
      task.current_phase_index = nextIdx;
      task.phases[nextIdx].status = 'active';
      task.phases[nextIdx].started_at = new Date();
    } else {
      task.status = 'completed';
      task.completed_at = new Date();
    }

    task.markModified('phases');
    await task.save();

    res.json({ submission, task });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
