const pool = require('../config/postgres');

exports.getMovies = async (req, res, next) => {
  try {
    const { city, language } = req.query;
    
    let query = `
      SELECT DISTINCT m.id, m.title, m.poster_url, m.languages, m.age_rating, m.duration_minutes
      FROM movies m
      JOIN shows s ON s.movie_id = m.id
      JOIN screens scr ON s.screen_id = scr.id
      JOIN cinemas c ON scr.cinema_id = c.id
      WHERE s.start_time > NOW()
    `;
    
    const params = [];
    
    if (city && city !== 'All Cities') {
      params.push(city);
      query += ` AND c.city = $${params.length}`;
    }
    
    if (language && language !== 'All') {
      params.push(language);
      query += ` AND $${params.length} = ANY(m.languages)`;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getMovieShows = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { city } = req.query;
    let query = `
      SELECT s.id as show_id, s.start_time, s.price_per_seat, 
             c.name as cinema_name, c.address as cinema_address, scr.name as screen_name, m.title as movie_title
      FROM shows s
      JOIN screens scr ON s.screen_id = scr.id
      JOIN cinemas c ON scr.cinema_id = c.id
      JOIN movies m ON s.movie_id = m.id
      WHERE s.movie_id = $1 AND s.start_time > NOW()
    `;
    const params = [id];

    if (city && city !== 'All Cities') {
      params.push(city);
      query += ` AND c.city = $${params.length}`;
    }

    query += ` ORDER BY s.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
