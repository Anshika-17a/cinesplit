const redisClient = require('../config/redis');
const pgClient = require('../config/postgres');

/**
 * Gets available seat count for a show from cache.
 * Falls back to Postgres on cache miss.
 * 
 * @param {number} showId 
 * @returns {Promise<number>}
 */
const getAvailableSeatCount = async (showId) => {
  const key = `show:${showId}:available_count`;
  
  try {
    // 1. Try to get from Redis
    const cachedCount = await redisClient.get(key);
    if (cachedCount !== null) {
      return parseInt(cachedCount, 10);
    }

    // 2. Cache miss, calculate from Postgres
    const result = await pgClient.query(`
      SELECT COUNT(*) as count 
      FROM show_seats 
      WHERE show_id = $1 AND status = 'available'
    `, [showId]);
    
    const count = parseInt(result.rows[0].count, 10);

    // 3. Populate cache (set TTL to e.g. 1 hour to prevent stale data forever)
    await redisClient.set(key, count, 'EX', 3600);

    return count;
  } catch (err) {
    console.error('Error in getAvailableSeatCount:', err.message);
    // On error, fallback to 0 or re-throw based on business needs
    return 0;
  }
};

/**
 * Invalidates the available seat count cache for a show.
 * Should be called after successful booking/cancellation.
 * 
 * @param {number} showId 
 * @returns {Promise<void>}
 */
const invalidateAvailableSeatCount = async (showId) => {
  const key = `show:${showId}:available_count`;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error('Error invalidating seat count cache:', err.message);
  }
};

/**
 * Gets a lightweight snapshot of the catalog for Gemini Context
 */
const getCatalogSnapshot = async () => {
  const key = 'catalog_snapshot';
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);

    const res = await pgClient.query(`
      SELECT m.id, m.title, m.languages, m.genre, m.age_rating, m.description, 
             ARRAY_AGG(DISTINCT c.city) as cities
      FROM movies m
      LEFT JOIN shows s ON s.movie_id = m.id
      LEFT JOIN screens scr ON s.screen_id = scr.id
      LEFT JOIN cinemas c ON scr.cinema_id = c.id
      GROUP BY m.id
    `);
    
    const snapshot = res.rows;
    await redisClient.set(key, JSON.stringify(snapshot), 'EX', 300); // 5 mins
    return snapshot;
  } catch (err) {
    console.error('Error fetching catalog snapshot:', err);
    return [];
  }
};

/**
 * Basic Redis rate limiter by IP or session
 */
const rateLimitIp = async (ip, limit = 10, windowSecs = 60) => {
  const key = `ratelimit:${ip}`;
  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSecs);
    }
    if (current > limit) return false; // Rate limited
    return true; // Allowed
  } catch (err) {
    console.error('Redis rate limit error:', err);
    return true; // Fail open
  }
};

module.exports = {
  getAvailableSeatCount,
  invalidateAvailableSeatCount,
  getCatalogSnapshot,
  rateLimitIp
};
