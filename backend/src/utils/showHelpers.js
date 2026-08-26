/**
 * Checks if a show is still bookable.
 * A show is bookable if its start_time is in the future.
 * 
 * @param {Object} show - The show object from the database containing start_time (Date or string)
 * @param {Date} [now=new Date()] - Optional current date for testing/injection
 * @returns {boolean}
 */
const isShowBookable = (show, now = new Date()) => {
  if (!show || !show.start_time) return false;
  const startTime = new Date(show.start_time);
  return startTime > now;
};

module.exports = {
  isShowBookable
};
