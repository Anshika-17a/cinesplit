const BookingActivityLog = require('../models/BookingActivityLog');

/**
 * Fire-and-forget function to log booking activity.
 * Do not await this in request paths.
 */
const logBookingActivity = (entry) => {
  const log = new BookingActivityLog(entry);
  log.save().catch(err => {
    console.error('Failed to save booking activity log:', err.message);
  });
};

module.exports = {
  logBookingActivity
};
