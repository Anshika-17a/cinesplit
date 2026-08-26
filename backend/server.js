require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_ORIGIN,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);
    
    if (
      allowed.length === 0 ||
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

require('./src/config/postgres');
const redisClient = require('./src/config/redis');

// MongoDB Connection (optional activity logging)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error', err.message));
}

const authRoutes = require('./src/routes/authRoutes');
const cinemaRoutes = require('./src/routes/cinemaRoutes');
const showRoutes = require('./src/routes/showRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const movieRoutes = require('./src/routes/movieRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');

// Basic Route & Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CineSplit Backend API', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/seed', async (req, res) => {
  try {
    const initDbIfEmpty = require('./src/db/init_db_if_empty');
    await initDbIfEmpty();
    const seedScript = require('./seed_extended');
    if (typeof seedScript === 'function') {
      await seedScript();
    }
    res.json({ status: 'success', message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/debug', async (req, res) => {
  const result = {
    razorpay_key_id: process.env.RAZORPAY_KEY_ID ? `set (${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...)` : 'MISSING',
    razorpay_secret: process.env.RAZORPAY_KEY_SECRET ? `set (${process.env.RAZORPAY_KEY_SECRET.length} chars)` : 'MISSING',
    gemini_api_key: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.length} chars)` : 'MISSING',
    jwt_secret: process.env.JWT_SECRET ? 'set' : 'MISSING',
    redis_url: process.env.REDIS_URL ? `set (${process.env.REDIS_URL.substring(0, 20)}...)` : 'MISSING',
    redis_status: 'unknown',
    razorpay_test: 'untested',
    gemini_test: 'untested',
  };
  // Test Redis
  try {
    await redisClient.ping();
    result.redis_status = 'connected';
  } catch (e) {
    result.redis_status = `ERROR: ${e.message}`;
  }
  // Test Razorpay
  try {
    const Razorpay = require('razorpay');
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rz.orders.create({ amount: 100, currency: 'INR', receipt: 'test' });
    result.razorpay_test = `OK - order created: ${order.id}`;
  } catch (e) {
    result.razorpay_test = `ERROR: ${e.message || JSON.stringify(e)}`;
  }
  // Test Gemini
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const resAi = await model.generateContent('Hi');
    result.gemini_test = `OK - response: ${resAi.response.text().trim()}`;
  } catch (e) {
    result.gemini_test = `ERROR: ${e.message}`;
  }
  res.json(result);
});

app.use('/api/auth', authRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' });
});

const initDbIfEmpty = require('./src/db/init_db_if_empty');

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initDbIfEmpty();
});
