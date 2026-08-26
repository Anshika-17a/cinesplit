require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

require('./src/config/postgres');
const redisClient = require('./src/config/redis');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error', err.message));

const authRoutes = require('./src/routes/authRoutes');
const cinemaRoutes = require('./src/routes/cinemaRoutes');
const showRoutes = require('./src/routes/showRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const movieRoutes = require('./src/routes/movieRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello World from Cinesplit Backend!');
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
