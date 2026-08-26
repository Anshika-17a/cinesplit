const redisClient = require('../config/redis');

/**
 * Tries to acquire a lock for a specific seat in a show.
 * Uses Redis SET NX PX pattern.
 * 
 * @param {number} showId 
 * @param {number} seatId 
 * @param {number} ttlSeconds 
 * @returns {Promise<boolean>} true if lock acquired, false otherwise
 */
const acquireSeatLock = async (showId, seatId, ttlSeconds = 10) => {
  const key = `lock:show:${showId}:seat:${seatId}`;
  try {
    // 'NX' - only set if not exists
    // 'PX' - expiration in milliseconds
    const result = await redisClient.set(key, 'locked', 'NX', 'PX', ttlSeconds * 1000);
    return result === 'OK';
  } catch (err) {
    console.error('Error acquiring seat lock:', err.message);
    return false;
  }
};

/**
 * Releases a lock for a specific seat in a show.
 * 
 * @param {number} showId 
 * @param {number} seatId 
 * @returns {Promise<void>}
 */
const releaseSeatLock = async (showId, seatId) => {
  const key = `lock:show:${showId}:seat:${seatId}`;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Error releasing seat lock:', err.message);
  }
};

module.exports = {
  acquireSeatLock,
  releaseSeatLock
};
