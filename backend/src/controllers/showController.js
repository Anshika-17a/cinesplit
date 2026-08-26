const pgClient = require('../config/postgres');
const { getAvailableSeatCount } = require('../services/cacheService');
const { getLockedSeatIds } = require('../services/lockService');

const getShowById = async (req, res) => {
  const showId = parseInt(req.params.showId, 10);
  
  if (isNaN(showId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid show ID' });
  }

  try {
    const query = `
      SELECT 
        sh.id as show_id, 
        sh.start_time, 
        sh.end_time, 
        sh.price_per_seat,
        m.id as movie_id,
        m.title,
        m.description,
        m.poster_url,
        m.trailer_url,
        m.duration_minutes,
        m.movie_cast,
        m.genre,
        m.age_rating,
        m.languages,
        s.id as screen_id,
        s.name as screen_name,
        c.id as cinema_id,
        c.name as cinema_name
      FROM shows sh
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens s ON sh.screen_id = s.id
      JOIN cinemas c ON s.cinema_id = c.id
      WHERE sh.id = $1
    `;

    const result = await pgClient.query(query, [showId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Show not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching show detail:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch show detail' });
  }
};

const getShowSeats = async (req, res) => {
  const showId = parseInt(req.params.showId, 10);

  if (isNaN(showId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid show ID' });
  }

  try {
    // 1. Fetch all seats for the show mapping from Postgres
    const query = `
      SELECT 
        ss.id as show_seat_id,
        ss.status,
        s.id as seat_id,
        s.seat_number,
        s.row_label
      FROM show_seats ss
      JOIN seats s ON ss.seat_id = s.id
      WHERE ss.show_id = $1
      ORDER BY s.row_label ASC, s.seat_number ASC
    `;
    
    const result = await pgClient.query(query, [showId]);
    const seatIds = result.rows.map(r => r.show_seat_id);

    // 2. Fetch all real-time Redis locks for this show
    const lockedSeatIds = await getLockedSeatIds(showId, seatIds);

    // 3. Merge Redis lock state into seats
    const seatsWithLocks = result.rows.map(row => {
      if (row.status === 'available' && lockedSeatIds.has(row.show_seat_id)) {
        return { ...row, status: 'locked' };
      }
      return row;
    });

    const availableCount = seatsWithLocks.filter(s => s.status === 'available').length;

    res.json({
      showId,
      availableCount,
      totalSeats: result.rows.length,
      seats: seatsWithLocks
    });
  } catch (err) {
    console.error('Error fetching show seats:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch show seats' });
  }
};

module.exports = {
  getShowById,
  getShowSeats
};
