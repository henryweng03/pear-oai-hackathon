// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transcript: [{ user: String, therapist: String }], // User input and therapist response
  summary: { type: String }, // Final session summary
  completed: { type: Boolean, default: false }, // Marks if session is completed
  date: { type: Date, default: Date.now }, // Timestamp of session creation
});

module.exports = mongoose.model('Session', sessionSchema);
