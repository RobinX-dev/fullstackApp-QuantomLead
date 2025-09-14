const express = require('express');
const auth = require('../middlewares/auth');
const Project = require('../models/Project');

const router = express.Router();

// Get projects for a specific user by email
router.get('/', auth, async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ message: 'User email is required' });
  }
  try {
    const projects = await Project.find({ userEmail }); // fetch only user’s projects
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  const { name, description, owner, members, startDate, deadline, technologies, email } = req.body;

  if (!name || !owner || !email) {
    return res.status(400).json({ message: 'Project name, owner and email are required.' });
  }

  try {
    const project = await Project.create({
      name,
      description,
      owner,
      members,
      startDate,
      deadline,
      technologies,
      userEmail: email // <-- save logged-in user's email
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a project by ID
router.get('/:id', async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Not found' });
  res.json(project);
});

// Update a project by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a project by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
