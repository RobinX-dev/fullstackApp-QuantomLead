const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: String, required: true },
  members: [{ type: String }],
  startDate: Date,
  deadline: Date,
  technologies: [{ type: String }],
  status: { type: String, default: 'active' },
  priority: { type: String },
  userEmail: { type: String, required: true } // <-- store logged-in user's email
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
