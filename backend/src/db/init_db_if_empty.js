const path = require('path');
const fs = require('fs');
const pgClient = require('../config/postgres');

const initDbIfEmpty = async () => {
  try {
    // 1. Ensure schema exists with all tables & columns
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await pgClient.query(schemaSql);
    console.log('Database schema verified.');

    // 2. Check if movies table has rows
    const countRes = await pgClient.query('SELECT COUNT(*) FROM movies');
    const movieCount = parseInt(countRes.rows[0].count, 10);

    if (movieCount === 0) {
      console.log('Database has 0 movies. Running regional seed...');
      const seedScript = require('../../seed_extended');
      if (typeof seedScript === 'function') {
        await seedScript();
      }
      console.log('Database seeded successfully with movies, cinemas, and shows!');
    } else {
      console.log(`Database is active with ${movieCount} movies loaded.`);
    }
  } catch (err) {
    console.error('Database auto-init error:', err);
  }
};

module.exports = initDbIfEmpty;
