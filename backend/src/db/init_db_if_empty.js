const path = require('path');
const fs = require('fs');
const pgClient = require('../config/postgres');

const initDbIfEmpty = async () => {
  try {
    // 1. Ensure schema exists with all tables & columns
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await pgClient.query(schemaSql);

    // 2. Add any missing columns to existing tables safely
    await pgClient.query(`
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{"English"}';
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS age_rating VARCHAR(50) DEFAULT 'UA';
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS genre VARCHAR(100) DEFAULT 'Drama';
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS movie_cast JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS snacks JSONB DEFAULT '[]'::jsonb;
    `);

    // 3. Check if movies table has full regional data (12 movies)
    const countRes = await pgClient.query('SELECT COUNT(*) FROM movies');
    const movieCount = parseInt(countRes.rows[0].count, 10);

    if (movieCount < 10) {
      console.log(`Database has only ${movieCount} movies. Populating full regional catalog...`);
      const seedScript = require('../../seed_extended');
      if (typeof seedScript === 'function') {
        await seedScript();
      }
      console.log('Database seeded successfully with 12 blockbuster movies, regional cinemas, and shows!');
    } else {
      console.log(`Database is active with ${movieCount} movies loaded.`);
    }
  } catch (err) {
    console.error('Database auto-init error:', err);
  }
};

module.exports = initDbIfEmpty;
