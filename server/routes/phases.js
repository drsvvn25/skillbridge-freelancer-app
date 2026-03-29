const express = require('express');
const router = express.Router();
const { PHASE_TEMPLATES, getPhasesForCategory } = require('../utils/phaseTemplates');

// GET /api/phases/categories — returns list of all available categories
router.get('/categories', (req, res) => {
  const categories = Object.keys(PHASE_TEMPLATES);
  res.json(categories);
});

// GET /api/phases?category=Website+Building — returns phases for a category
router.get('/', (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).json({ message: 'category query param required' });
  }
  const phases = getPhasesForCategory(category);
  res.json({ category, phases });
});

module.exports = router;
