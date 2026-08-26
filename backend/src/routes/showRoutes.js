const express = require('express');
const { getShowById, getShowSeats } = require('../controllers/showController');
const { createOrder, verifyPayment, releaseLocks } = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');
const { bookingRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/:showId', getShowById);
router.get('/:showId/seats', getShowSeats);

router.post('/:showId/create-order', authenticate, bookingRateLimiter, createOrder);
router.post('/:showId/verify-payment', authenticate, verifyPayment);
router.post('/:showId/release-locks', authenticate, releaseLocks);

module.exports = router;
