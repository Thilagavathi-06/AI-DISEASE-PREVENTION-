require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

const { seedDefaultAdmin } = require('./controllers/authController');

const app = express();

// Set global fallback database indicator (initially false, updated in connectDB)
global.dbFallback = false;

// Connect to Database (will trigger JSON fallback if MongoDB connection fails)
connectDB().then(() => {
  seedDefaultAdmin();
});

// Essential security headers using Helmet
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows cross-origin image/media if needed
}));

// CORS setup to allow request from React Frontend
app.use(cors({
  origin: '*', // In development, allow all origins. Can be restricted to specific localhost ports.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in parser for json requests
app.use(express.json());

// General Request Rate Limiter (200 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Elevated for seamless developer testing and multi-tab use
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter);

// Mount API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('AuraHealth AI Disease Prediction API is running...');
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n========================================================================`);
  console.log(`AuraHealth AI Backend Server running in development on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`========================================================================\n`);
});
