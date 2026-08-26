const express = require('express');
const { cancelBooking, getUserBookings, getTicketData, getBookingQR } = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/me', authenticate, getUserBookings);
router.delete('/:bookingId', authenticate, cancelBooking);
router.get('/:bookingId/ticket', authenticate, getTicketData);
router.get('/:bookingId/qr', authenticate, getBookingQR);

module.exports = router;
