require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy (for rate-limiter behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://shubhamcomputers.in'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per IP
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// OTP rate limiting (stricter)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP requests per 10 minutes
  message: { error: 'Too many OTP requests. Please wait before trying again.' }
});
app.use('/api/auth/send-otp', otpLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/print-services', require('./routes/printServices'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/inquiry', require('./routes/inquiry'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shubham Computers API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🖨️  Shubham Computers Backend running on port ${PORT}`);
  console.log(`📍 Serving Jhajjar within ${process.env.SERVICE_RADIUS_KM || 3}km radius`);
  console.log(`⚡ Delivery target: Under ${process.env.DELIVERY_TIME_MINS || 30} mins`);
});
