const Redis = require('ioredis');
require('dotenv').config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  // Retry strategy to avoid crashing when docker isn't running
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis connection error', err.message));

module.exports = redisClient;
