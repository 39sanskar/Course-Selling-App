// index.js (Corrected)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');
const { connectDB } = require('./db');

const app = express();

// --- Connect to Database ---
connectDB();

// --- Security Middlewares ---
app.use(helmet());

// --- Enable CORS ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Body Parsing Middleware (CRITICAL FIX) ---
// This is required to parse JSON bodies from POST/PUT requests
app.use(express.json());

// --- Compress responses ---
app.use(compression());

// --- Logging Middleware ---
app.use(morgan('dev')); // 'dev' is better for development, 'combined' for production

// --- API Routes ---
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/user', userRouter);

// --- Health Check ---
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- 404 Not Found Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('An unexpected error occurred:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running securely on port ${PORT}`);
});