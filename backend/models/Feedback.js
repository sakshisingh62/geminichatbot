const mongoose = require('mongoose');

// Define Feedback Mongoose Schema
const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['courses', 'quiz', 'ai', 'ui', 'other']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: [true, 'Comments are required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export Mongoose Model
module.exports = mongoose.model('Feedback', feedbackSchema);
