const rateLimit = require('express-rate-limit');

const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each user to 5 booking attempts per windowMs
  keyGenerator: (req) => req.user.userId, // Key by userId instead of IP
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many booking attempts. Please try again after a minute.'
    });
  }
});

module.exports = {
  bookingRateLimiter
};
