const pgClient = require('../config/postgres');
const { acquireSeatLock, releaseSeatLock } = require('../services/lockService');
const { invalidateAvailableSeatCount } = require('../services/cacheService');
const { logBookingActivity } = require('../services/activityLogService');
const { isShowBookable } = require('../utils/showHelpers');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

const createOrder = async (req, res) => {
  const userId = req.user.userId;
  const showId = parseInt(req.params.showId, 10);
  const { seatIds, snacks } = req.body;

  if (isNaN(showId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid show ID' });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'seatIds must be a non-empty array' });
  }

  const acquiredLocks = [];

  try {
    const showResult = await pgClient.query('SELECT start_time, price_per_seat FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Show not found' });
    }
    const show = showResult.rows[0];

    if (!isShowBookable(show)) {
      logBookingActivity({ userId, showId, seatIds, action: 'attempt', reason: 'Show not bookable' });
      return res.status(400).json({ error: 'SHOW_NOT_BOOKABLE', message: 'Cannot book a show that has already started' });
    }

    // Acquire lock for 5 minutes (300 seconds)
    for (const seatId of seatIds) {
      const locked = await acquireSeatLock(showId, seatId, 300);
      if (locked) {
        acquiredLocks.push(seatId);
      } else {
        for (const acqSeatId of acquiredLocks) await releaseSeatLock(showId, acqSeatId);
        logBookingActivity({ userId, showId, seatIds, action: 'conflict', reason: `Failed to acquire Redis lock for seat ${seatId}` });
        return res.status(409).json({ error: 'SEATS_UNAVAILABLE', message: 'One or more seats are currently being booked by someone else', seats: [seatId] });
      }
    }

    // Check Postgres if seats are already booked (just in case they were booked before lock)
    const seatsResult = await pgClient.query(
      'SELECT id, status FROM show_seats WHERE id = ANY($1::int[])',
      [seatIds]
    );

    const unavailableSeats = seatsResult.rows.filter(row => row.status !== 'available').map(r => r.id);
    if (unavailableSeats.length > 0 || seatsResult.rows.length !== seatIds.length) {
      for (const seatId of acquiredLocks) await releaseSeatLock(showId, seatId);
      return res.status(409).json({ error: 'SEATS_UNAVAILABLE', message: 'One or more seats are no longer available', seats: unavailableSeats });
    }

    const snackTotal = Array.isArray(snacks) 
      ? snacks.reduce((sum, s) => sum + (parseFloat(s.price || 0) * parseInt(s.quantity || 0, 10)), 0) 
      : 0;

    const totalAmountFloat = (parseFloat(show.price_per_seat) * seatIds.length) + snackTotal;
    const amountInPaise = Math.round(totalAmountFloat * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      seatIds,
      snacks: snacks || [],
      totalAmountFloat
    });

  } catch (err) {
    console.error('Unexpected create-order error:', err);
    for (const seatId of acquiredLocks) await releaseSeatLock(showId, seatId).catch(e => console.error(e));
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred during order creation' });
  }
};

const verifyPayment = async (req, res) => {
  const userId = req.user.userId;
  const showId = parseInt(req.params.showId, 10);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, seatIds, snacks } = req.body;

  // Verify Signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    // Payment invalid. Release locks.
    if (Array.isArray(seatIds)) {
      for (const seatId of seatIds) await releaseSeatLock(showId, seatId).catch(e => console.error(e));
    }
    return res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Payment verification failed' });
  }

  let transactionOpen = false;

  try {
    const showResult = await pgClient.query('SELECT start_time, price_per_seat FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Show not found' });
    }
    const show = showResult.rows[0];

    await pgClient.query('BEGIN');
    transactionOpen = true;

    const seatsResult = await pgClient.query(
      'SELECT id, status FROM show_seats WHERE id = ANY($1::int[]) FOR UPDATE',
      [seatIds]
    );

    const unavailableSeats = seatsResult.rows.filter(row => row.status !== 'available').map(r => r.id);
    
    if (seatsResult.rows.length !== seatIds.length || unavailableSeats.length > 0) {
      await pgClient.query('ROLLBACK');
      transactionOpen = false;
      
      // Trigger Refund since payment succeeded but seats are gone
      console.warn(`Payment succeeded but seats unavailable. Triggering refund for payment ${razorpay_payment_id}`);
      try {
        await razorpay.payments.refund(razorpay_payment_id);
      } catch (refundErr) {
        console.error('Failed to trigger refund:', refundErr);
      }
      
      for (const seatId of seatIds) await releaseSeatLock(showId, seatId);
      return res.status(409).json({ error: 'SEATS_UNAVAILABLE', message: 'One or more seats are no longer available. A refund has been initiated.', seats: unavailableSeats });
    }

    const snackTotal = Array.isArray(snacks) 
      ? snacks.reduce((sum, s) => sum + (parseFloat(s.price || 0) * parseInt(s.quantity || 0, 10)), 0) 
      : 0;

    const totalAmount = (parseFloat(show.price_per_seat) * seatIds.length) + snackTotal;

    await pgClient.query('UPDATE show_seats SET status = $1 WHERE id = ANY($2::int[])', ['booked', seatIds]);

    const bookingResult = await pgClient.query(
      'INSERT INTO bookings (user_id, show_id, status, total_amount, snacks) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
      [userId, showId, 'confirmed', totalAmount, JSON.stringify(snacks || [])]
    );
    const booking = bookingResult.rows[0];

    const bookingSeatsValues = seatIds.map((seatId, idx) => `($1, $${idx + 2})`).join(', ');
    await pgClient.query(`INSERT INTO booking_seats (booking_id, show_seat_id) VALUES ${bookingSeatsValues}`, [booking.id, ...seatIds]);

    await pgClient.query('COMMIT');
    transactionOpen = false;

    for (const seatId of seatIds) await releaseSeatLock(showId, seatId);
    await invalidateAvailableSeatCount(showId);
    logBookingActivity({ userId, showId, seatIds, action: 'success' });

    return res.status(201).json({
      id: booking.id,
      showId,
      seats: seatIds,
      snacks: snacks || [],
      totalAmount,
      createdAt: booking.created_at
    });
  } catch (err) {
    console.error('Unexpected verify-payment error:', err);
    if (transactionOpen) await pgClient.query('ROLLBACK').catch(e => console.error(e));
    for (const seatId of seatIds) await releaseSeatLock(showId, seatId).catch(e => console.error(e));
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred during payment verification' });
  }
};

const releaseLocks = async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  const { seatIds } = req.body;

  if (!isNaN(showId) && Array.isArray(seatIds)) {
    for (const seatId of seatIds) {
      await releaseSeatLock(showId, seatId).catch(e => console.error(e));
    }
  }
  return res.status(200).json({ message: 'Locks released' });
};

// ... keep cancelBooking and getUserBookings identical ...
const cancelBooking = async (req, res) => {
  const userId = req.user.userId;
  const bookingId = parseInt(req.params.bookingId, 10);

  if (isNaN(bookingId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid booking ID' });
  }

  let transactionOpen = false;

  try {
    const bookingResult = await pgClient.query(
      'SELECT id, show_id, status FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Booking is already cancelled' });
    }

    await pgClient.query('BEGIN');
    transactionOpen = true;

    const seatsResult = await pgClient.query(
      'SELECT show_seat_id FROM booking_seats WHERE booking_id = $1',
      [booking.id]
    );
    const seatIds = seatsResult.rows.map(r => r.show_seat_id);

    await pgClient.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', booking.id]);
    
    if (seatIds.length > 0) {
      await pgClient.query(
        'UPDATE show_seats SET status = $1 WHERE id = ANY($2::int[])',
        ['available', seatIds]
      );
    }

    await pgClient.query('COMMIT');
    transactionOpen = false;

    await invalidateAvailableSeatCount(booking.show_id);
    logBookingActivity({ userId, showId: booking.show_id, seatIds, action: 'cancelled' });

    return res.status(200).json({ message: 'Booking successfully cancelled', bookingId: booking.id });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    if (transactionOpen) await pgClient.query('ROLLBACK').catch(console.error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred during cancellation' });
  }
};

const getUserBookings = async (req, res) => {
  const userId = req.user.userId;

  try {
    const query = `
      SELECT 
        b.id as booking_id,
        b.status as booking_status,
        b.total_amount,
        b.snacks,
        b.created_at,
        sh.id as show_id,
        sh.start_time,
        m.title as movie_title,
        m.poster_url,
        c.name as cinema_name,
        s.name as screen_name,
        json_agg(
          json_build_object(
            'id', ss.id,
            'seat_number', st.seat_number,
            'row_label', st.row_label
          )
        ) as seats
      FROM bookings b
      JOIN shows sh ON b.show_id = sh.id
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens s ON sh.screen_id = s.id
      JOIN cinemas c ON s.cinema_id = c.id
      JOIN booking_seats bs ON bs.booking_id = b.id
      JOIN show_seats ss ON bs.show_seat_id = ss.id
      JOIN seats st ON ss.seat_id = st.id
      WHERE b.user_id = $1
      GROUP BY b.id, sh.id, m.id, c.id, s.id
      ORDER BY sh.start_time DESC
    `;

    const result = await pgClient.query(query, [userId]);
    
    const now = new Date();
    
    const bookings = {
      upcoming: [],
      past: []
    };

    result.rows.forEach(row => {
      const isUpcoming = new Date(row.start_time) > now;
      if (isUpcoming) {
        bookings.upcoming.push(row);
      } else {
        bookings.past.push(row);
      }
    });

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch bookings' });
  }
};

const getTicketData = async (req, res) => {
  const userId = req.user.userId;
  const bookingId = parseInt(req.params.bookingId, 10);

  try {
    const result = await pgClient.query(`
      SELECT 
        b.id as booking_id, b.status, b.total_amount, b.snacks, b.created_at,
        sh.id as show_id, sh.start_time,
        m.title as movie_title, m.poster_url,
        c.name as cinema_name, s.name as screen_name,
        json_agg(json_build_object('seat_number', st.seat_number, 'row_label', st.row_label)) as seats
      FROM bookings b
      JOIN shows sh ON b.show_id = sh.id
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens s ON sh.screen_id = s.id
      JOIN cinemas c ON s.cinema_id = c.id
      JOIN booking_seats bs ON bs.booking_id = b.id
      JOIN show_seats ss ON bs.show_seat_id = ss.id
      JOIN seats st ON ss.seat_id = st.id
      WHERE b.id = $1 AND b.user_id = $2
      GROUP BY b.id, sh.id, m.id, c.id, s.id
    `, [bookingId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ message: 'Failed to fetch ticket data' });
  }
};

const getBookingQR = async (req, res) => {
  const userId = req.user.userId;
  const bookingId = parseInt(req.params.bookingId, 10);

  try {
    // Verify ownership
    const result = await pgClient.query(
      'SELECT id, show_id FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get seat IDs
    const seatsResult = await pgClient.query(
      'SELECT show_seat_id FROM booking_seats WHERE booking_id = $1',
      [bookingId]
    );
    const seatIds = seatsResult.rows.map(r => r.show_seat_id);

    // Sign a JWT token as the QR payload
    const qrPayload = jwt.sign(
      { bookingId, showId: result.rows[0].show_id, seatIds, userId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Generate QR as data URL
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 250,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({ qr: qrDataUrl });
  } catch (err) {
    console.error('Error generating QR:', err);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  releaseLocks,
  cancelBooking,
  getUserBookings,
  getTicketData,
  getBookingQR
};
