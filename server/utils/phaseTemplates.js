// Phase templates for auto-generation when client posts a task
// Each phase has: name, description, deadline_minutes (default 2hrs)

const PHASE_TEMPLATES = {
  'Website Building': [
    { name: 'Planning & Requirements', description: 'Gather requirements, create project scope and sitemap', deadline_minutes: 120 },
    { name: 'Wireframing', description: 'Create low-fidelity wireframes and page layouts', deadline_minutes: 180 },
    { name: 'UI Design', description: 'Design high-fidelity mockups with branding and color palette', deadline_minutes: 240 },
    { name: 'Frontend Development', description: 'Code HTML/CSS/JS based on approved designs', deadline_minutes: 360 },
    { name: 'Backend Development', description: 'Build APIs, database schema, and business logic', deadline_minutes: 360 },
    { name: 'Integration & Testing', description: 'Connect frontend-backend, perform functional/UAT testing', deadline_minutes: 180 },
    { name: 'Deployment', description: 'Deploy to server, configure domain and SSL', deadline_minutes: 120 },
  ],
  'Mobile App': [
    { name: 'Requirements Gathering', description: 'Define features, user stories, and technical stack', deadline_minutes: 120 },
    { name: 'UI/UX Design', description: 'Create app wireframes and interactive prototypes', deadline_minutes: 240 },
    { name: 'Frontend Development', description: 'Build screens and navigation flows', deadline_minutes: 480 },
    { name: 'Backend & API', description: 'Develop REST APIs and database models', deadline_minutes: 360 },
    { name: 'Integration', description: 'Connect app screens with backend APIs', deadline_minutes: 240 },
    { name: 'QA Testing', description: 'Test on multiple devices, fix bugs', deadline_minutes: 180 },
    { name: 'App Store Release', description: 'Package, sign, and submit to store', deadline_minutes: 120 },
  ],
  'Logo Design': [
    { name: 'Client Brief', description: 'Understand brand identity, style preferences, and references', deadline_minutes: 60 },
    { name: 'Concept Sketches', description: 'Create 3-5 initial concept directions', deadline_minutes: 120 },
    { name: 'Digital Drafts', description: 'Convert best concepts to digital vector format', deadline_minutes: 180 },
    { name: 'Color Palette & Typography', description: 'Apply brand colors and choose fonts', deadline_minutes: 120 },
    { name: 'Final Delivery', description: 'Export PNG, SVG, PDF in multiple sizes', deadline_minutes: 60 },
  ],
  'Content Writing': [
    { name: 'Research & Topic', description: 'Deep research on subject matter and audience', deadline_minutes: 90 },
    { name: 'Outline & Structure', description: 'Create article structure and key talking points', deadline_minutes: 60 },
    { name: 'First Draft', description: 'Write complete first draft', deadline_minutes: 180 },
    { name: 'Revisions', description: 'Edit for clarity, grammar, and style guide compliance', deadline_minutes: 90 },
    { name: 'Final Copy', description: 'Proofread and format for delivery', deadline_minutes: 60 },
  ],
  'SEO Optimization': [
    { name: 'Site Audit', description: 'Analyze current site health, speed, and technical issues', deadline_minutes: 120 },
    { name: 'Keyword Research', description: 'Identify target keywords with volume and competition data', deadline_minutes: 120 },
    { name: 'On-Page SEO', description: 'Optimize titles, meta descriptions, headings, and content', deadline_minutes: 180 },
    { name: 'Off-Page SEO', description: 'Build backlinks and citations', deadline_minutes: 120 },
    { name: 'Reporting', description: 'Deliver SEO audit report with rankings and next steps', deadline_minutes: 60 },
  ],
  'Video Editing': [
    { name: 'Raw File Import', description: 'Import and organize footage, assets, and audio', deadline_minutes: 60 },
    { name: 'Rough Cut', description: 'Assemble storyline and cut unnecessary footage', deadline_minutes: 180 },
    { name: 'Effects & Transitions', description: 'Add motion graphics, titles, and transitions', deadline_minutes: 120 },
    { name: 'Color Grading', description: 'Apply color correction and cinematic grade', deadline_minutes: 90 },
    { name: 'Audio Mix', description: 'Balance music, voiceover, and SFX levels', deadline_minutes: 60 },
    { name: 'Final Export', description: 'Export in required format (MP4, MOV, etc.)', deadline_minutes: 60 },
  ],
  'Graphic Design': [
    { name: 'Creative Brief', description: 'Understand design goals, dimensions, and brand guidelines', deadline_minutes: 60 },
    { name: 'Concept Development', description: 'Create initial design concepts', deadline_minutes: 120 },
    { name: 'Design Execution', description: 'Produce final design with proper assets', deadline_minutes: 180 },
    { name: 'Revisions', description: 'Incorporate client feedback', deadline_minutes: 90 },
    { name: 'File Delivery', description: 'Export print and web-ready files', deadline_minutes: 60 },
  ],
  'Data Entry': [
    { name: 'Data Collection', description: 'Gather all source files and understand the format', deadline_minutes: 60 },
    { name: 'Template Setup', description: 'Prepare target spreadsheet/database structure', deadline_minutes: 30 },
    { name: 'Data Entry', description: 'Input all records accurately', deadline_minutes: 240 },
    { name: 'Quality Check', description: 'Review entries for accuracy and completeness', deadline_minutes: 90 },
    { name: 'Delivery', description: 'Submit completed file in agreed format', deadline_minutes: 30 },
  ],
};

// Default phases if category not found
const DEFAULT_PHASES = [
  { name: 'Initial Planning', description: 'Understand the project scope and deliverables', deadline_minutes: 120 },
  { name: 'Execution', description: 'Complete the primary deliverable', deadline_minutes: 360 },
  { name: 'Review & Revisions', description: 'Incorporate feedback and polish', deadline_minutes: 120 },
  { name: 'Final Delivery', description: 'Submit all final files and documentation', deadline_minutes: 60 },
];

/**
 * Get phases for a category, with optional custom deadline_minutes override
 */
function getPhasesForCategory(category, customDeadlineMinutes = null) {
  const key = Object.keys(PHASE_TEMPLATES).find(
    k => k.toLowerCase() === (category || '').toLowerCase()
  );
  const template = key ? PHASE_TEMPLATES[key] : DEFAULT_PHASES;

  return template.map(phase => ({
    ...phase,
    deadline_minutes: customDeadlineMinutes || phase.deadline_minutes,
    status: 'pending',
    started_at: null,
    completed_at: null,
  }));
}

module.exports = { PHASE_TEMPLATES, DEFAULT_PHASES, getPhasesForCategory };
