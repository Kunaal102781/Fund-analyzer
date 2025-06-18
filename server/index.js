// server/index.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./db/connect');
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const errorHandler = require('./middleware/error');

// Connect to Database
connectDB();

// Initialize Express
const app = express();

// Middleware
// सिर्फ एक बार cors setup करो और multiple origins अगर चाहिए तो ऐसा करो:
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin (like Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);

// Error Handler (should be last middleware)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});
