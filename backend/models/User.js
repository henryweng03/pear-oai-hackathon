// models/User.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  occupation: { type: String },
  relationshipStatus: { type: String },
  socioeconomicStatus: { type: String },
  primaryConcerns: [String],
  goals: {
    shortTerm: { type: String },
    longTerm: { type: String },
  },
  copingMechanisms: [{ description: String, effectiveness: String }],
  hobbies: [String],
  lifestyleFactors: String,
  coreBeliefs: [String],
  keyTraits: [String],
});

module.exports = mongoose.model('User', userSchema);
