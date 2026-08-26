const path = require('path');
const fs = require('fs');
const pgClient = require('../config/postgres');

const initDbIfEmpty = async () => {
  try {
    // Check if movies table exists and has data
    const checkTable = await pgClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'movies'
      );
    `);

    let needSeed = false;
    if (!checkTable.rows[0].exists) {
      console.log('Database tables not found. Initializing schema...');
      needSeed = true;
    } else {
      const countRes = await pgClient.query('SELECT COUNT(*) FROM movies');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        console.log('Database empty. Running seed...');
        needSeed = true;
      }
    }

    if (needSeed) {
      // 1. Run Schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

      // Drop existing if half-created
      await pgClient.query(`
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

      await pgClient.query(schemaSql);
      console.log('Schema created successfully.');

      // 2. Run Extended Seed
      const seedScript = require('../../seed_extended');
      if (typeof seedScript === 'function') {
        await seedScript();
      }
      console.log('Database auto-initialization and seeding complete!');
    } else {
      console.log('Database already initialized and populated.');
    }
  } catch (err) {
    console.error('Database auto-init notice:', err.message);
  }
};

module.exports = initDbIfEmpty;
