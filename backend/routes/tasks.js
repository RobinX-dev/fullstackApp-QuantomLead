const express = require('express');
const auth = require('../middlewares/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();
router.use(auth);

function emit(event, payload, app) {
  const io = app.get('io');
  if (io) io.emit(event, payload);
}

// Get tasks by project
router.get('/project/:projectId', async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId }).populate('assigneeId', 'name email');
  res.json(tasks);
});

// Create
router.post('/', async (req, res) => {
  const { title, description, status, assigneeId, dueDate, projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) return res.status(400).json({ message: 'Invalid project' });

  const task = await Task.create({ title, description, status, dueDate, projectId, assigneeId });
  const created = await Task.findById(task._id).populate('assigneeId', 'name email');

  emit('task:created', created, req.app);
  res.status(201).json(created);
});

// Update
router.put('/:id', async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assigneeId', 'name email');
  if (!task) return res.status(404).json({ message: 'Not found' });

  emit('task:updated', task, req.app);
  res.json(task);
});

// Delete
router.delete('/:id', async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });

  emit('task:deleted', { id: req.params.id }, req.app);
  res.json({ message: 'Deleted' });
});

module.exports = router;
