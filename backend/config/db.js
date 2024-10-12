// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Use the MONGO_URI from .env
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit on failure
  }
};

module.exports = connectDB;
