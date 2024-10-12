// app.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize the Express app
const app = express();
app.use(express.json());

// Basic route to ensure the API is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
