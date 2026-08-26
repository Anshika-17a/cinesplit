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
    // Redis unavailable — log but don't block booking.
    // Postgres row-level lock + status check still prevents double-booking.
    console.warn('Redis lock unavailable, falling back to DB-only protection:', err.message);
    return true;
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

/**
 * Gets all locked seat IDs for a given show from Redis.
 * 
 * @param {number} showId 
 * @param {number[]} seatIds 
 * @returns {Promise<Set<number>>} Set of locked show_seat_ids
 */
const getLockedSeatIds = async (showId, seatIds) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0) return new Set();
  try {
    const keys = seatIds.map(id => `lock:show:${showId}:seat:${id}`);
    const results = await redisClient.mget(keys);
    const lockedIds = new Set();
    results.forEach((val, idx) => {
      if (val !== null && val !== undefined) {
        lockedIds.add(seatIds[idx]);
      }
    });
    return lockedIds;
  } catch (err) {
    console.error('Error fetching locked seat IDs from Redis:', err.message);
    return new Set();
  }
};

module.exports = {
  acquireSeatLock,
  releaseSeatLock,
  getLockedSeatIds
};
