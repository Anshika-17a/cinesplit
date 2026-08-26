const pgClient = require('../config/postgres');

const getCinemas = async (req, res) => {
  const { city } = req.query;

  try {
    let query = 'SELECT id, name, city, address, created_at FROM cinemas';
    let params = [];

    if (city) {
      query += ' WHERE city = $1';
      params.push(city);
    }

    query += ' ORDER BY name ASC';

    const result = await pgClient.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cinemas:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch cinemas' });
  }
};

const getCinemaShows = async (req, res) => {
  const cinemaId = parseInt(req.params.id, 10);

  if (isNaN(cinemaId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid cinema ID' });
  }

  try {
    const query = `
      SELECT 
        sh.id as show_id, 
        sh.start_time, 
        sh.end_time, 
        sh.price_per_seat, 
        m.id as movie_id,
        m.title as movie_title, 
        m.poster_url, 
        s.id as screen_id,
        s.name as screen_name
      FROM shows sh
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens s ON sh.screen_id = s.id
      WHERE s.cinema_id = $1 AND sh.start_time > NOW()
      ORDER BY sh.start_time ASC, m.title ASC
    `;

    const result = await pgClient.query(query, [cinemaId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cinema shows:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch shows for cinema' });
  }
};

module.exports = {
  getCinemas,
  getCinemaShows
};
