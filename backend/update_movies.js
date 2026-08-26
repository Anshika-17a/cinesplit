require('dotenv').config();
const { Client } = require('pg');

const run = async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URI });
  try {
    await client.connect();
    
    await client.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English'`);
    await client.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS age_rating VARCHAR(10) DEFAULT 'UA16+'`);
    
    await client.query(`
      UPDATE movies SET 
        poster_url = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/1pdfLvkbY9ohJlCjQH2JGjjcNsV.jpg',
        language = 'English',
        age_rating = 'UA16+'
      WHERE title = 'Dune: Part Two';
    `);

    await client.query(`
      UPDATE movies SET 
        poster_url = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        language = 'English',
        age_rating = 'A'
      WHERE title = 'Oppenheimer';
    `);

    await client.query(`
      UPDATE movies SET 
        poster_url = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        language = 'Hindi',
        age_rating = 'U'
      WHERE title = 'Interstellar';
    `);

    // Let's also add shows for Oppenheimer and Interstellar so they actually have shows to click on!
    // Get screens
    const screens = await client.query('SELECT id, cinema_id FROM screens');
    const opp = await client.query("SELECT id FROM movies WHERE title = 'Oppenheimer'");
    const int = await client.query("SELECT id FROM movies WHERE title = 'Interstellar'");
    
    // Add shows
    if (screens.rows.length > 0 && opp.rows.length > 0 && int.rows.length > 0) {
      // Oppenheimer shows
      const oppShow = await client.query(`
        INSERT INTO shows (screen_id, movie_id, start_time, end_time, price_per_seat) 
        VALUES ($1, $2, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '180 minutes', 350.00)
        RETURNING id
      `, [screens.rows[0].id, opp.rows[0].id]);
      
      await client.query(`
        INSERT INTO show_seats (show_id, seat_id, status)
        SELECT $1, id, 'available' FROM seats WHERE screen_id = $2
      `, [oppShow.rows[0].id, screens.rows[0].id]);

      // Interstellar shows
      const intShow = await client.query(`
        INSERT INTO shows (screen_id, movie_id, start_time, end_time, price_per_seat) 
        VALUES ($1, $2, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '169 minutes', 200.00)
        RETURNING id
      `, [screens.rows[1].id, int.rows[0].id]);

      await client.query(`
        INSERT INTO show_seats (show_id, seat_id, status)
        SELECT $1, id, 'available' FROM seats WHERE screen_id = $2
      `, [intShow.rows[0].id, screens.rows[1].id]);
    }

    console.log('Database updated successfully with posters, languages, and new shows.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};
run();
