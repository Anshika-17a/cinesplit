const express = require('express');
const { cancelBooking, getUserBookings } = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/me', authenticate, getUserBookings);
router.delete('/:bookingId', authenticate, cancelBooking);

module.exports = router;
