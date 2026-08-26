const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { Client } = require('pg');

const run = async () => {
  const connectionString = process.env.POSTGRES_URI || process.env.DATABASE_URL;
  const isRemote = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

  const client = new Client({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // 1. Run Migration
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('Running migration...');
    // Drop tables if they exist to make the script rerunnable
    await client.query(`
      DROP TABLE IF EXISTS booking_seats CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS show_seats CASCADE;
      DROP TABLE IF EXISTS shows CASCADE;
      DROP TABLE IF EXISTS movies CASCADE;
      DROP TABLE IF EXISTS seats CASCADE;
      DROP TABLE IF EXISTS screens CASCADE;
      DROP TABLE IF EXISTS cinemas CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TYPE IF EXISTS seat_status CASCADE;
      DROP TYPE IF EXISTS booking_status CASCADE;
    `);
    
    await client.query(schemaSql);
    console.log('Migration completed successfully.');

    // 2. Run Seed
    console.log('Running seed...');

    // 2 cinemas
    const cinemasRes = await client.query(`
      INSERT INTO cinemas (name, city, address) VALUES 
      ('PVR IMAX', 'Mumbai', 'Phoenix Mall, Lower Parel'),
      ('Cinepolis', 'Bangalore', 'Orion Mall, Rajajinagar')
      RETURNING id, name;
    `);
    const cinemas = cinemasRes.rows;

    // 2 screens per cinema
    let screens = [];
    for (const cinema of cinemas) {
      const screenRes = await client.query(`
        INSERT INTO screens (cinema_id, name, total_seats) VALUES 
        ($1, 'Screen 1', 60),
        ($1, 'Screen 2', 40)
        RETURNING id, cinema_id, total_seats;
      `, [cinema.id]);
      screens.push(...screenRes.rows);
    }

    // Generate seats for screens
    for (const screen of screens) {
      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      const seatsPerRow = screen.total_seats / rows.length;
      let seatQueries = [];
      for (let i = 0; i < rows.length; i++) {
        for (let j = 1; j <= seatsPerRow; j++) {
          seatQueries.push(`(${screen.id}, ${j}, '${rows[i]}')`);
        }
      }
      if (seatQueries.length > 0) {
        await client.query(`
          INSERT INTO seats (screen_id, seat_number, row_label) VALUES 
          ${seatQueries.join(', ')};
        `);
      }
    }

    // 3 movies
    const moviesRes = await client.query(`
      INSERT INTO movies (title, description, duration_minutes) VALUES 
      ('Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen.', 166),
      ('Oppenheimer', 'The story of American scientist J. Robert Oppenheimer.', 180),
      ('Interstellar', 'A team of explorers travel through a wormhole in space.', 169)
      RETURNING id;
    `);
    const movies = moviesRes.rows;

    // A few shows
    let shows = [];
    for (const screen of screens) {
      // Add one show for the first movie on each screen
      const showRes = await client.query(`
        INSERT INTO shows (screen_id, movie_id, start_time, end_time, price_per_seat) VALUES 
        ($1, $2, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '166 minutes', 250.00)
        RETURNING id;
      `, [screen.id, movies[0].id]);
      shows.push(showRes.rows[0]);
    }

    // Auto-generate show_seats
    for (const show of shows) {
      await client.query(`
        INSERT INTO show_seats (show_id, seat_id, status)
        SELECT $1, id, 'available' FROM seats WHERE screen_id = (
          SELECT screen_id FROM shows WHERE id = $1
        );
      `, [show.id]);
    }

    console.log('Seed completed successfully.');

    // 3. Show resulting tables via a quick query
    console.log('\n--- Resulting Data Summary ---');
    const tableCounts = await client.query(`
      SELECT 'cinemas' as table, COUNT(*) as count FROM cinemas
      UNION ALL SELECT 'screens', COUNT(*) FROM screens
      UNION ALL SELECT 'seats', COUNT(*) FROM seats
      UNION ALL SELECT 'movies', COUNT(*) FROM movies
      UNION ALL SELECT 'shows', COUNT(*) FROM shows
      UNION ALL SELECT 'show_seats', COUNT(*) FROM show_seats;
    `);
    console.table(tableCounts.rows);

    const sampleShowSeats = await client.query(`
      SELECT sh.id as show_id, m.title as movie, c.name as cinema, scr.name as screen, COUNT(ss.id) as total_seats,
      SUM(CASE WHEN ss.status = 'available' THEN 1 ELSE 0 END) as available_seats
      FROM shows sh
      JOIN movies m ON sh.movie_id = m.id
      JOIN screens scr ON sh.screen_id = scr.id
      JOIN cinemas c ON scr.cinema_id = c.id
      JOIN show_seats ss ON ss.show_id = sh.id
      GROUP BY sh.id, m.title, c.name, scr.name;
    `);
    console.log('\n--- Show Seats Summary ---');
    console.table(sampleShowSeats.rows);

  } catch (err) {
    console.error('Error during migration/seed:', err);
  } finally {
    await client.end();
  }
};

run();
