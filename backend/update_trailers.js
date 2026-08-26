require('dotenv').config();
const { Client } = require('pg');

const run = async () => {
  const client = new Client({
    connectionString: process.env.POSTGRES_URI,
  });

  try {
    await client.connect();
    
    // Dune: Part Two
    await client.query(`
      UPDATE movies 
      SET trailer_url = 'https://www.youtube.com/embed/Way9Dexny3w?autoplay=1&mute=1'
      WHERE title = 'Dune: Part Two'
    `);
    
    // Oppenheimer
    await client.query(`
      UPDATE movies 
      SET trailer_url = 'https://www.youtube.com/embed/uYPbbksJxIg?autoplay=1&mute=1'
      WHERE title = 'Oppenheimer'
    `);

    // Interstellar
    await client.query(`
      UPDATE movies 
      SET trailer_url = 'https://www.youtube.com/embed/zSWdZVtXT7E?autoplay=1&mute=1'
      WHERE title = 'Interstellar'
    `);

    console.log('Trailers updated successfully.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

run();
