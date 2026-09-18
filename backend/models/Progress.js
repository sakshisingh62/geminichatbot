const mongoose = require('mongoose');

// Student Progress Mongoose Schema
const progressSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  completionPercentage: { type: Number, required: true, min: 0, max: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);
