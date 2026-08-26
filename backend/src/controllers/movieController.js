const pool = require('../config/postgres');

exports.getMovies = async (req, res, next) => {
  try {
    let { city, language } = req.query;
    // Sanitize: treat 'undefined'/'null'/empty as absent
    if (!city || city === 'undefined' || city === 'null' || city === 'All Cities') city = null;
    if (!language || language === 'undefined' || language === 'null' || language === 'All') language = null;
    
    let query = `
      SELECT DISTINCT m.id, m.title, m.poster_url, m.languages, m.age_rating, m.duration_minutes
      FROM movies m
      JOIN shows s ON s.movie_id = m.id
      JOIN screens scr ON s.screen_id = scr.id
      JOIN cinemas c ON scr.cinema_id = c.id
      WHERE s.start_time > NOW()
    `;
    
    const params = [];
    
    if (city) {
      params.push(city);
      query += ` AND c.city = $${params.length}`;
    }
    
    if (language) {
      params.push(language);
      query += ` AND $${params.length} = ANY(m.languages)`;
    }
    
    let result = await pool.query(query, params);

    // If no results, fallback: return all catalog movies with upcoming shows
    if (result.rows.length === 0 && !city && !language) {
      const allMovies = await pool.query(`
        SELECT DISTINCT m.id, m.title, m.poster_url, m.languages, m.age_rating, m.duration_minutes
        FROM movies m
        JOIN shows s ON s.movie_id = m.id
        WHERE s.start_time > NOW()
      `);
      result = allMovies.rows.length > 0 ? allMovies : await pool.query(
        'SELECT id, title, poster_url, languages, age_rating, duration_minutes FROM movies'
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('getMovies error:', error);
    next(error);
  }
};

exports.getMovieShows = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { city, date } = req.query; // Add date filter
    const { getAvailableSeatCount } = require('../services/cacheService');

    let query = `
      SELECT s.id as show_id, s.start_time, s.price_per_seat, 
             c.name as cinema_name, c.address as cinema_address, scr.name as screen_name, scr.total_seats,
             m.title as movie_title, m.languages, m.age_rating, m.duration_minutes, m.genre
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

    if (date) {
      // Date is expected to be YYYY-MM-DD
      params.push(date);
      query += ` AND DATE(s.start_time) = $${params.length}`;
    }

    query += ` ORDER BY s.start_time ASC`;

    const result = await pool.query(query, params);
    
    // Append available seats from Redis cache
    const showsWithAvailability = await Promise.all(result.rows.map(async (row) => {
      const available_seats = await getAvailableSeatCount(row.show_id);
      return { ...row, available_seats };
    }));
    
    res.json(showsWithAvailability);
  } catch (error) {
    next(error);
  }
};

exports.recommendMovies = async (req, res, next) => {
  try {
    const { who, vibe, language } = req.query;
    
    const getMatches = async (relaxVibe, relaxLang) => {
      let query = `
        SELECT DISTINCT m.id, m.title, m.poster_url, m.languages, m.age_rating, m.genre
        FROM movies m
        JOIN shows s ON s.movie_id = m.id
        WHERE s.start_time > NOW()
      `;
      const params = [];
      
      if (who === 'Family') {
        query += ` AND m.age_rating NOT IN ('A', 'UA16+')`;
      }
      
      if (vibe && vibe !== "Doesn't matter" && !relaxVibe) {
        if (vibe === 'Something Light') {
          query += ` AND (m.genre ILIKE '%Comedy%' OR m.genre ILIKE '%Animation%')`;
        } else if (vibe === 'Intense') {
          query += ` AND (m.genre ILIKE '%Action%' OR m.genre ILIKE '%Thriller%' OR m.genre ILIKE '%Sci-Fi%')`;
        } else if (vibe === 'Emotional') {
          query += ` AND (m.genre ILIKE '%Drama%' OR m.genre ILIKE '%Biography%')`;
        }
      }
      
      if (language && language !== 'Any' && !relaxLang) {
        params.push(language);
        query += ` AND $${params.length} = ANY(m.languages)`;
      }
      
      query += ` LIMIT 3`;
      const result = await pool.query(query, params);
      return result.rows;
    };

    let matches = await getMatches(false, false);
    if (matches.length < 3) matches = await getMatches(true, false);
    if (matches.length < 3) matches = await getMatches(true, true);

    // Final fallback: just get any 3 movies if still zero
    if (matches.length === 0) {
      const anyMovies = await pool.query(`
        SELECT DISTINCT m.id, m.title, m.poster_url, m.languages, m.age_rating, m.genre
        FROM movies m
        JOIN shows s ON s.movie_id = m.id
        WHERE s.start_time > NOW()
        LIMIT 3
      `);
      matches = anyMovies.rows;
    }

    res.json({ movies: matches });
  } catch (error) {
    next(error);
  }
};
