const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || process.env.REDIS_URI;

let redisClient;
if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
} else {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis connection error', err.message));

module.exports = redisClient;
